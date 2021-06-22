import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { GitAPI } from "../../git";
import { Route } from "../../../fastify_types";
import { verifySHA } from "../../util";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	const git: GitAPI = opts.config.git;

	fastify.route<Route>({
		method: "GET",
		url: "/branches",
		handler: async(req, reply) => {
			const branches = await git.getBranches(req.params.repo);

			reply.send({ data: branches });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/branches/:branch",
		handler: async(req, reply) => {
			const branch_verification = await verifySHA(git, req.params.repo, req.params.branch);
			if(branch_verification.success === false && branch_verification.code) {
				reply.code(branch_verification.code).send({ error: branch_verification.message });
			}

			const branch = await git.getBranch(req.params.repo, req.params.branch);

			if(!branch) {
				reply.code(404).send({ error: "Branch not found!" });
				return;
			}

			reply.send({ data: branch });
		}
	});

	done();
}