import { FastifyPluginCallback } from "fastify";
import { sources } from "../../../../cache";
import { Commit } from "../../../../git/commit";
import { Route, FastifyPluginOptions } from "../../../../types/fastify";
import { verifySHA } from "../../util";
import { getCommit, getLogCommits } from "../data";

const log: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done) => {
	fastify.route<Route>({
		method: "GET",
		url: "/log",
		schema: {
			querystring: {
				count: { type: "number", minimum: 1 }
			}
		},
		handler: async(req, reply) => {
			const commits = await req.repository.commits(Number(req.query.count) || undefined);

			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.LogCommitsSource, req.repository, Number(req.query.count) || undefined)
					: getLogCommits(commits))
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/log/:commit",
		schema: {
			params: {
				commit: { type: "string" }
			}
		},
		handler: async(req, reply) => {
			const commit_verification = await verifySHA(req.repository, req.params.commit);
			if(commit_verification.success === false && commit_verification.code) {
				reply.code(commit_verification.code).send({ error: commit_verification.message });
			}

			const commit = await Commit.lookup(req.repository, req.params.commit);

			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.CommitSource, req.repository, commit)
					: getCommit(commit))
			});
		}
	});

	done();
};

export default log;