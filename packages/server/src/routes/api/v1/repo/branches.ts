import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Branch } from "../../../../git/branch";
import { Route } from "../../../../types/fastify";
import { BranchSummary as APIBranchSummary, Branch as APIBranch } from "api";

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	fastify.route<Route>({
		method: "GET",
		url: "/branches",
		handler: async(req, reply) => {
			const branches = await req.repository.branches();

			reply.send({
				data: branches.map(branch => {
					return <APIBranchSummary>{
						id: branch.id,
						name: branch.name
					};
				})
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/branches/:branch",
		handler: async(req, reply) => {
			const branch = await Branch.lookup(req.repository, req.params.branch);

			if(!branch) {
				reply.code(404).send({ error: "Branch not found!" });
				return;
			}

			const data: APIBranch = {
				id: branch.id,
				name: branch.name,
				latest_commit: await branch.latestCommit()
			};

			reply.send({
				data: data
			});
		}
	});

	done();
}