import { readFileSync, readdirSync } from "fs";
import { GitAPI } from "./api/git";
import { Route } from "./fastify_types";
import api from "./api/v1";
import { exit } from "process";
import { fastify as fastifyFactory } from "fastify";
import fastifyStatic from "fastify-static";
import { join } from "path";
import { load } from "js-yaml";
import { verifyRepoName } from "./api/util";

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
const git = new GitAPI(settings.base_dir);

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

		const repo_verification = await verifyRepoName(settings.base_dir, req.params.repo);
		if(repo_verification.success === false && repo_verification.code) {
			reply.code(repo_verification.code).send(repo_verification.message);
		}

		if(!req.query.service) {
			reply.code(403).send("Missing service query parameter\n");
			return;
		}
		else if(req.query.service !== "git-upload-pack") {
			reply.code(403).send("Access denied!\n");
			return;
		}
		else if(Object.keys(req.query).length !== 1) {
			reply.code(403).send("Too many query parameters!\n");
			return;
		}

		git.connectToGitHTTPBackend(req, reply);
	}
});

fastify.route<Route>({
	method: "POST",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/git-upload-pack",
	handler: async(req, reply) => {
		const repo_verification = await verifyRepoName(settings.base_dir, req.params.repo);

		if(repo_verification.success === false && repo_verification.code) {
			reply.header("Content-Type", "application/x-git-upload-pack-result");
			reply.code(repo_verification.code).send(repo_verification.message);
		}

		git.connectToGitHTTPBackend(req, reply);
	}
});

fastify.route<Route>({
	method: "GET",
	url: "/:repo([a-zA-Z0-9\\.\\-_]+)/refs/tags/:tag",
	handler: (req, reply) => {
		git.downloadTagArchive(req.params.repo, req.params.tag, reply);
	}
});

fastify.listen(settings.port, settings.host, (err: Error, addr: string) => {
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`App is running on ${addr}`);
});