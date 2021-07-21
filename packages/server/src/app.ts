import { readFileSync, readdirSync } from "fs";
import { Repository } from "./git/repository";
import { Route } from "./fastify_types";
import { Tag } from "./git/tag";
import api from "./api/v1";
import { exit } from "process";
import { fastify as fastifyFactory } from "fastify";
import fastifyStatic from "fastify-static";
import { join } from "path";
import { load } from "js-yaml";
import { verifyRepoName } from "./api/util";
import { BaseError } from "./git/error";

type Settings = {
	host: string,
	port: number,
	dev_port: number,
	title: string,
	about: string,
	base_dir: string,
	production: boolean
}

const settings = <Settings>load(readFileSync(join(__dirname, "/../../../settings.yml"), "utf8"));
const settings_keys = Object.keys(settings);

const mandatory_settings = [ "host", "port", "dev_port", "title", "about", "base_dir", "production" ];

// Make sure that all the required settings are present
const settings_not_included = mandatory_settings.filter(x => !settings_keys.includes(x));
if(settings_not_included.length !== 0) {
	console.log(`Error: settings.yml is missing ${(settings_not_included.length > 1) ? "keys" : "key"}:`);
	console.log(settings_not_included.join(", "));
	exit(1);
}

// Make sure that there's not an excessive amount of settings
const mandatory_not_included = settings_keys.filter(x => !mandatory_settings.includes(x));
if(mandatory_not_included.length !== 0) {
	console.log(`Error: settings.yml includes ${(mandatory_not_included.length > 1) ? "pointless keys" : "a pointless key"}:`);
	console.log(mandatory_not_included.join(", "));
	exit(1);
}

// Make sure that the base directory specified in the settings actually exists
try {
	readdirSync(settings.base_dir);
}
catch {
	console.error(`Error: Tried opening the base directory. No such directory: ${settings.base_dir}`);
	exit(1);
}

const dist_dir = join(__dirname, "/../../client/dist");

if(settings.production) {
	try {
		readdirSync(dist_dir);
	}
	catch {
		console.error("Error: Tried opening the dist directory but it doesn't exist.\nDid you accidentally turn on the production setting?");
		exit(1);
	}
}

const fastify = fastifyFactory();

fastify.setErrorHandler((err, req, reply) => {
	console.log(err);
	reply.code(500).send("Internal server error!");
});

fastify.setNotFoundHandler({}, function(req, reply) {
	reply.code(404).send("Page not found!");
});

if(settings.production) {
	fastify.register(fastifyStatic, { root: dist_dir });

	fastify.route({
		method: "GET",
		url: "/",
		handler: (req, reply) => {
			reply.sendFile("index.html");
		}
	});
}

fastify.addContentTypeParser("application/x-git-upload-pack-request", (req, payload, done) => done(null, payload));

fastify.register(api, { prefix: "/api/v1", config: { settings: settings } });

fastify.route<Route>({
	method: "GET",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/info/refs",
	handler: async(req, reply) => {
		reply.header("Content-Type", "application/x-git-upload-pack-advertisement");

		if(!verifyRepoName(req.params.repo)) {
			reply.code(400).send({ error: "Bad request" });
			return;
		}

		if(!req.query.service) {
			reply.header("Content-Type", "text/plain");
			reply.code(403).send("Missing service query parameter\n");
			return;
		}

		if(req.query.service !== "git-upload-pack") {
			reply.header("Content-Type", "text/plain");
			reply.code(403).send("Access denied!\n");
			return;
		}

		if(Object.keys(req.query).length !== 1) {
			reply.code(403).send("Too many query parameters!\n");
			return;
		}

		const repository = await Repository.open(settings.base_dir, req.params.repo);
		repository.HTTPconnect(req, reply);
	}
});

fastify.route<Route>({
	method: "POST",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/git-upload-pack",
	handler: async(req, reply) => {
		if(!verifyRepoName(req.params.repo)) {
			reply.code(400).send({ error: "Bad request" });
			return;
		}

		const repository = await Repository.open(settings.base_dir, req.params.repo);
		repository.HTTPconnect(req, reply);
	}
});

fastify.route({
	method: "POST",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/git-receive-pack",
	handler: (req, reply) => {
		reply.header("Content-Type", "application/x-git-receive-pack-result");
		reply.code(403).send("Access denied!");
	}
});

fastify.route<Route>({
	method: "GET",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/refs/tags/:tag",
	handler: async(req, reply) => {
		if(!verifyRepoName(req.params.repo)) {
			reply.code(400).send({ error: "Bad request" });
			return;
		}

		const repository: Repository | BaseError = await Repository.open(settings.base_dir, req.params.repo).catch(err => err);

		if(repository instanceof BaseError) {
			reply.code(repository.code).send(repository.message);
			return;
		}

		const tag = await Tag.lookup(repository, req.params.tag).catch(err => err);

		if(tag instanceof BaseError) {
			reply.code(tag.code).send(tag.message);
			return;
		}

		tag.downloadTarball(reply);
	}
});

fastify.listen(settings.port, settings.host, (err: Error, addr: string) => {
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`App is running on ${addr}`);
});