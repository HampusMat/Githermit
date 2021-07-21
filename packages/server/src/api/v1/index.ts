import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Repository } from "../../git/repository";
import { Route } from "../../fastify_types";
import repo from "./repo";
import { verifyRepoName } from "../util";
import { Info as APIInfo, RepositorySummary as APIRepositorySummary, Repository as APIRepository } from "shared_types";
import { BaseError } from "../../git/error";

function setHandlers(fastify: FastifyInstance): void {
	fastify.setErrorHandler((err, req, reply) => {
		console.log(err);
		reply.code(500).send({ error: "Internal server error!" });
	});
	fastify.setNotFoundHandler((req, reply) => {
		reply.code(404).send({ error: "Endpoint not found!" });
	});
}

function reposEndpoints(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	fastify.route({
		method: "GET",
		url: "/repos",
		handler: async(req, reply) => {
			const repos = await Repository.openAll(opts.config.settings.base_dir);

			if(!repos) {
				reply.send({ data: [] });
				return;
			}

			reply.send({
				data: await Promise.all(repos.map(async repository => {
					return <APIRepositorySummary>{
						name: repository.name.short,
						description: repository.description,
						last_updated: (await repository.masterCommit()).date
					};
				}))
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/repos/:repo",
		handler: async(req, reply) => {
			if(!verifyRepoName(req.params.repo)) {
				reply.code(400).send({ error: "Bad request" });
				return;
			}

			const repository = await Repository.open(opts.config.settings.base_dir, req.params.repo).catch(err => err);

			if(repository instanceof BaseError) {
				reply.code(repository.code).send({ error: repository.message });
				return;
			}

			const data: APIRepository = {
				name: repository.name.short,
				description: repository.description,
				has_readme: await (await repository.tree()).findExists("README.md")
			};

			reply.send({ data: data });
		}
	});
	done();
}

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	setHandlers(fastify);

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

	fastify.register(reposEndpoints, { config: { settings: opts.config.settings } });
	fastify.register(repo, { prefix: "/repos/:repo", config: { settings: opts.config.settings } });

	done();
}