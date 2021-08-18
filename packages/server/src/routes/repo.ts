import { Repository } from "../git/repository";
import { CoolFastifyRequest, Route, FastifyPluginOptions } from "../types/fastify";
import { Tag } from "../git/tag";
import { FastifyPluginCallback } from "fastify";
import { verifyRepoName } from "../routes/api/util";
import { ServerError } from "../git/error";

const repo: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done): void => {
	fastify.addHook("onRequest", async(req: CoolFastifyRequest, reply) => {
		if(!verifyRepoName(req.params.repo)) {
			reply.code(400).send("Bad request");
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/info/refs",
		handler: async(req, reply) => {
			reply.header("Content-Type", "application/x-git-upload-pack-advertisement");

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

			const repository = await Repository.open(opts.config.settings.git_dir, req.params.repo);
			repository.HTTPconnect(req, reply);
		}
	});

	fastify.route<Route>({
		method: "POST",
		url: "/git-upload-pack",
		handler: async(req, reply) => {
			const repository = await Repository.open(opts.config.settings.git_dir, req.params.repo);
			repository.HTTPconnect(req, reply);
		}
	});

	fastify.route({
		method: "POST",
		url: "/git-receive-pack",
		handler: (req, reply) => {
			reply.header("Content-Type", "application/x-git-receive-pack-result");
			reply.code(403).send("Access denied!");
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/refs/tags/:tag",
		schema: {
			params: {
				tag: { type: "string" }
			}
		},
		handler: async(req, reply) => {
			const repository = await Repository.open(opts.config.settings.git_dir, req.params.repo).catch((err: ServerError) => err);

			if(repository instanceof ServerError) {
				reply.code(repository.code).send(repository.message);
				return;
			}

			const tag = await Tag.lookup(repository, req.params.tag).catch((err: ServerError) => err);

			if(tag instanceof ServerError) {
				reply.code(tag.code).send(tag.message);
				return;
			}

			tag.downloadTarball(reply);
		}
	});

	done();
};

export default repo;