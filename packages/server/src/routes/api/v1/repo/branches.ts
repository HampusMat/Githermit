import { FastifyPluginCallback } from "fastify";
import { sources } from "cache";
import { Branch } from "git/branch";
import { FastifyPluginOptions, Route } from "types/fastify";
import { getBranch, getBranches } from "../data";

const branches: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done) => {
	fastify.route<Route>({
		method: "GET",
		url: "/branches",
		handler: async(req, reply) => {
			const branches = await req.repository.branches();

			reply.send({
				data: opts.config.cache
					? await opts.config.cache.receive(sources.BranchesSource, req.repository, branches)
					: getBranches(branches)
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/branches/:branch",
		schema: {
			params: {
				branch: { type: "string" }
			}
		},
		handler: async(req, reply) => {
			const branch = await Branch.lookup(req.repository, req.params.branch);

			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.BranchSource, req.repository, branch)
					: getBranch(branch))
			});
		}
	});

	done();
};

export default branches;