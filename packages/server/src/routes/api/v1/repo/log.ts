import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Commit } from "../../../../git/commit";
import { Patch } from "../../../../git/patch";
import { Route } from "../../../../types/fastify";
import { verifySHA } from "../../util";
import { LogCommit as APILogCommit, Patch as APIPatch, Commit as APICommit } from "shared_types";

async function commitMap(commit: Commit) {
	const stats = await commit.stats();
	return <APILogCommit>{
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
	return <APIPatch>{
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
			const commits = await req.repository.commits();

			reply.send({
				data: await Promise.all(commits.map(commitMap))
			});
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/log/:commit",
		handler: async(req, reply) => {
			const commit_verification = await verifySHA(req.repository, req.params.commit);
			if(commit_verification.success === false && commit_verification.code) {
				reply.code(commit_verification.code).send({ error: commit_verification.message });
			}

			const commit = await Commit.lookup(req.repository, req.params.commit);

			const stats = await commit.stats();

			const data: APICommit = {
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
			};

			reply.send({
				data: data
			});
		}
	});

	done();
}