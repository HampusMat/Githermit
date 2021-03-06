import { CoolFastifyRequest, Route, FastifyPluginOptions } from "types/fastify";
import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { Repository } from "git/repository";
import { BaseTreeEntry, BlobTreeEntry, TreeEntry } from "git/tree_entry";
import { basename } from "path";
import branches from "./branches";
import log from "./log";
import { verifyRepoName } from "../../util";
import { Tree as APITree, TreeEntry as APITreeEntry } from "api";
import { ServerError } from "git/error";
import { getLogCommits, getTags } from "../data";
import { sources } from "cache";

declare module "fastify" {
	interface FastifyRequest {
		repository: Repository,
	}
}

function addHooks(fastify: FastifyInstance, opts: FastifyPluginOptions): void {
	fastify.addHook("preHandler", async(req: CoolFastifyRequest, reply) => {
		const repository = await Repository.open(opts.config.settings.git_dir, req.params.repo, req.query.branch).catch((err: ServerError) => err);

		if(repository instanceof ServerError) {
			reply.code(repository.code).send({ error: repository.message });
			return;
		}

		req.repository = repository;
	});

	fastify.addHook("onRequest", async(req: CoolFastifyRequest, reply) => {
		if(!verifyRepoName(req.params.repo)) {
			reply.code(400).send({ error: "Bad request" });
		}
	});
}
async function treeEntryMap(entry: BaseTreeEntry) {
	const latest_commit = await entry.latestCommit();
	return <APITreeEntry>{
		name: basename(entry.path),
		type: entry instanceof TreeEntry ? "tree" : "blob",
		latest_commit: {
			id: latest_commit.id,
			message: latest_commit.message,
			date: latest_commit.date
		}
	};
}

const repo: FastifyPluginCallback<FastifyPluginOptions> = (fastify, opts, done) => {
	addHooks(fastify, opts);

	fastify.register(log, { config: opts.config });
	fastify.register(branches, { config: opts.config });

	fastify.route<Route>({
		method: "GET",
		url: "/tree",
		handler: async(req, reply) => {
			const tree = await req.repository.tree().catch((err: ServerError) => err);

			if(tree instanceof ServerError) {
				reply.code(tree.code).send({ error: tree.message });
				return;
			}

			const tree_path = (Object.keys(req.query).length !== 0 && req.query.path)
				? req.query.path
				: null;

			let data: APITree;

			if(tree_path) {
				const tree_path_entry = await tree.find(tree_path).catch((err: ServerError) => err);

				if(tree_path_entry instanceof ServerError) {
					reply.code(tree_path_entry.code).send({ error: tree_path_entry.message });
					return;
				}

				data = tree_path_entry instanceof BlobTreeEntry
					? { type: "blob", content: await (await tree_path_entry.blob()).content() }
					: { type: "tree", content: await Promise.all((await (tree_path_entry as TreeEntry).tree()).entries().map(treeEntryMap)) };
			}
			else {
				data = { type: "tree", content: await Promise.all(tree.entries().map(treeEntryMap)) };
			}

			reply.send({ data: data });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/tree/history",
		schema: {
			querystring: {
				path: { type: "string" }
			}
		},
		handler: async(req, reply) => {
			const tree = await req.repository.tree().catch((err: ServerError) => err);

			if(tree instanceof ServerError) {
				reply.code(tree.code).send({ error: tree.message });
				return;
			}

			const tree_path = req.query.path;

			const tree_entry = await tree.find(tree_path).catch((err: ServerError) => err);

			if(tree_entry instanceof ServerError) {
				reply.code(tree_entry.code).send({ error: tree_entry.message });
				return;
			}

			const history = await tree_entry.history(Number(req.query.count));

			reply.send({ data: await getLogCommits(history) });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/tags",
		handler: async(req, reply) => {
			const tags = await req.repository.tags();
			reply.send({
				data: await (opts.config.cache
					? opts.config.cache.receive(sources.TagsSource, req.repository, tags)
					: getTags(tags))
			});
		}
	});

	done();
};

export default repo;