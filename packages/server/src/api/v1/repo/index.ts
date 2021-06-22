import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { GitAPI } from "../../git";
import { Route } from "../../../fastify_types";
import branches from "./branches";
import log from "./log";
import { verifyRepoName } from "../../util";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	const git: GitAPI = opts.config.git;

	fastify.addHook("onRequest", async(req: FastifyRequest<Route>, reply) => {
		const repo_verification = await verifyRepoName(opts.config.settings.base_dir, req.params.repo);
		if(repo_verification.success === false && repo_verification.code) {
			reply.code(repo_verification.code).send({ error: repo_verification.message });
		}
	});

	fastify.register(log, { config: { git: git } });
	fastify.register(branches, { config: { git: git } });

	fastify.route<Route>({
		method: "GET",
		url: "/tree",
		handler: async(req, reply) => {
			const tree_path = (Object.keys(req.query).length !== 0 && req.query.path) ? req.query.path : null;

			const tree = await git.getTree(req.params.repo, tree_path);

			if(!tree) {
				reply.code(404).send({ error: "Path not found" });
				return;
			}

			reply.send({ data: tree });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/tags",
		handler: async(req, reply) => {
			const refs = await git.getTags(req.params.repo);
			reply.send({ data: refs });
		}
	});

	done();
}