import { FastifyPluginCallback } from "fastify";
import { Repository } from "../../../git/repository";
import { FastifyPluginOptions, Route } from "../../../types/fastify";
import repo from "./repo";
import { verifyRepoName } from "../util";
import { Info as APIInfo } from "api";
import { ServerError } from "../../../git/error";
import { getRepositories, getRepository } from "./data";
import { sources } from "../../../cache";

const reposEndpoints: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done) => {
	fastify.route({
		method: "GET",
		url: "/repos",
		handler: async(req, reply) => {
			const repositories = await Repository.openAll(opts.config.settings.git_dir);

			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.RepositoriesSource, repositories)
					: getRepositories(repositories))
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/repos/:repo",
		schema: {
			params: {
				repo: { type: "string" }
			}
		},
		handler: async(req, reply) => {
			if(!verifyRepoName(req.params.repo)) {
				reply.code(400).send({ error: "Bad request" });
				return;
			}

			const repository = await Repository.open(opts.config.settings.git_dir, req.params.repo).catch((err: ServerError) => err);

			if(repository instanceof ServerError) {
				reply.code(repository.code).send({ error: repository.message });
				return;
			}

			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.RepositorySource, repository)
					: getRepository(repository))
			});
		}
	});
	done();
};

const api: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done) => {
	fastify.setErrorHandler((err, req, reply) => {
		if(err.validation) {
			reply.code(400).send({ error: `${err.validation[0].dataPath} ${err.validation[0].message}` });
			return;
		}

		console.log(err);

		reply.code(500).send({ error: "Internal server error!" });
	});
	fastify.setNotFoundHandler((req, reply) => {
		reply.code(404).send({ error: "Endpoint not found!" });
	});

	fastify.route({
		method: "GET",
		url: "/info",
		handler: (req, reply) => {
			const data: APIInfo = {
				title: opts.config.settings.title,
				about: opts.config.settings.about
			};

			reply.send({ data: data });
		}
	});

	fastify.register(reposEndpoints, { config: opts.config });
	fastify.register(repo, { prefix: "/repos/:repo", config: opts.config });

	done();
};

export default api;