import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { GitAPI } from "../../git";
import { Route } from "../../../fastify_types";
import { verifySHA } from "../../util";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	const git: GitAPI = opts.config.git;

	fastify.route<Route>({
		method: "GET",
		url: "/log",
		handler: async(req, reply) => {
			const log = await git.getLog(req.params.repo);

			if(log.length === 0) {
				reply.code(500).send({ error: "Internal server error!" });
				return;
			}

			reply.send({ data: log });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/log/:commit",
		handler: async(req, reply) => {
			const commit_verification = await verifySHA(git, req.params.repo, req.params.commit);
			if(commit_verification.success === false && commit_verification.code) {
				reply.code(commit_verification.code).send({ error: commit_verification.message });
			}

			const commit = await git.getCommit(req.params.repo, req.params.commit);

			reply.send({ data: commit });
		}
	});

	done();
}