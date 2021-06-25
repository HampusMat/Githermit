import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Commit } from "../../../git/commit";
import { Patch } from "../../../git/patch";
import { Route } from "../../../fastify_types";
import { verifySHA } from "../../util";

async function commitMap(commit: Commit) {
	const stats = await commit.stats();
	return {
		id: commit.id,
		author: {
			name: commit.author.name,
			email: commit.author.email
		},
		message: commit.message,
		date: commit.date,
		insertions: stats.insertions,
		deletions: stats.deletions,
		files_changed: stats.files_changed
	};
}

async function patchMap(patch: Patch, index: number) {
	return {
		additions: patch.additions,
		deletions: patch.deletions,
		from: patch.from,
		to: patch.to,
		too_large: await patch.isTooLarge(index),
		hunks: await patch.getHunks(index)
	};
}

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	fastify.route<Route>({
		method: "GET",
		url: "/log",
		handler: async(req, reply) => {
			const commits = (await (await req.repository).commits());

			reply.send({
				data: await Promise.all(commits.map(commitMap))
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/log/:commit",
		handler: async(req, reply) => {
			const commit_verification = await verifySHA(await req.repository, req.params.commit);
			if(commit_verification.success === false && commit_verification.code) {
				reply.code(commit_verification.code).send({ error: commit_verification.message });
			}

			const commit = await Commit.lookup(await req.repository, req.params.commit);

			const stats = await commit.stats();

			reply.send({
				data: {
					message: commit.message,
					author: {
						name: commit.author.name,
						email: commit.author.email
					},
					date: commit.date,
					insertions: stats.insertions,
					deletions: stats.deletions,
					files_changed: stats.files_changed,
					diff: await Promise.all((await (await commit.diff()).patches()).map(patchMap))
				}
			});
		}
	});

	done();
}