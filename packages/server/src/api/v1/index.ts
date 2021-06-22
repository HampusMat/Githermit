import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { GitAPI } from "../git";
import { Route } from "../../fastify_types";
import repo from "./repo";
import { verifyRepoName } from "../util";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	const git = new GitAPI(opts.config.settings.base_dir);

	fastify.setErrorHandler((err, req, reply) => {
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
			reply.send({ data: { title: opts.config.settings.title, about: opts.config.settings.about } });
		}
	});
	fastify.route({
		method: "GET",
		url: "/repos",
		handler: async(req, reply) => {
			const repos = await git.getRepositories();

			reply.send({ data: repos });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/repos/:repo",
		handler: async(req, reply) => {
			const repo_verification = await verifyRepoName(opts.config.settings.base_dir, req.params.repo);
			if(repo_verification.success === false && repo_verification.code) {
				reply.code(repo_verification.code).send({ error: repo_verification.message });
			}

			const desc = await git.getRepositoryFile(req.params.repo, "description");

			reply.send({ data: { name: req.params.repo, description: desc, has_readme: await git.doesReadmeExist(req.params.repo) } });
		}
	});

	fastify.register(repo, { prefix: "/repos/:repo", config: { git: git, settings: opts.config.settings } });

	done();
}