import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { verifyRepoName } from "../util";
import { GitAPI } from "../git";
import repo from "./repo";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) {
	const git = new GitAPI(opts.config.settings.base_dir);

	fastify.setErrorHandler((err, req, reply) => {
		console.log(err);
		reply.code(500).send({ error: "Internal server error!" });
	});
	fastify.setNotFoundHandler((req, reply) => {
		reply.code(404).send({ error: "Endpoint not found!" });
	})

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

	fastify.route({
		method: "GET",
		url: "/repos/:repo",
		handler: async(req, reply) => {
			const params: any = req.params;
			const repo_verification = await verifyRepoName(opts.config.settings.base_dir, params.repo);
			if(repo_verification.success === false && repo_verification.code) {
				reply.code(repo_verification.code).send({ error: repo_verification.message });
			}

			const desc = await git.getRepositoryFile(params.repo, "description");

			reply.send({ data: { name: params.repo, description: desc, has_readme: await git.doesReadmeExist(params.repo) } });
		}
	});

	fastify.register(repo, { prefix: "/repos/:repo", config: { git: git, settings: opts.config.settings } });

	done();
};