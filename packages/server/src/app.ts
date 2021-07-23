import { Repository } from "./git/repository";
import { Route } from "./types/fastify";
import { Tag } from "./git/tag";
import api from "./api/v1";
import { fastify as fastifyFactory, FastifyInstance } from "fastify";
import fastifyStatic from "fastify-static";
import { verifyRepoName } from "./api/util";
import { BaseError } from "./git/error";
import { Settings } from "./types";

export default function buildApp(settings: Settings, dist_dir: string): FastifyInstance {
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
	fastify.addContentTypeParser("application/x-git-receive-pack-request", (req, payload, done) => done(null, payload));

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

	return fastify;
}