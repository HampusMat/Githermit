import { CoolFastifyRequest, Route } from "../../../../types/fastify";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Blob } from "../../../../git/blob";
import { Repository } from "../../../../git/repository";
import { Tag } from "../../../../git/tag";
import { BaseTreeEntry, TreeEntry } from "../../../../git/tree_entry";
import { basename } from "path";
import branches from "./branches";
import log from "./log";
import { verifyRepoName } from "../../util";
import { Tree as APITree, Tag as APITag, TreeEntry as APITreeEntry } from "api";
import { BaseError } from "../../../../git/error";
import { Tree } from "../../../../git/tree";

declare module "fastify" {
	interface FastifyRequest {
		repository: Repository,
	}
}

function addHooks(fastify: FastifyInstance, opts: FastifyPluginOptions): void {
	fastify.addHook("preHandler", async(req: CoolFastifyRequest, reply) => {
		const repository = await Repository.open(opts.config.settings.base_dir, req.params.repo, req.query.branch).catch((err: BaseError) => err);

		if(repository instanceof BaseError) {
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

async function tagMap(tag: Tag) {
	const author = await tag.author();
	return <APITag>{
		name: tag.name,
		author: { name: author.name, email: author.email },
		date: await tag.date()
	};
}

export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: (err?: Error) => void): void {
	addHooks(fastify, opts);

	fastify.register(log);
	fastify.register(branches);

	fastify.route<Route>({
		method: "GET",
		url: "/tree",
		handler: async(req, reply) => {
			const tree: Tree | BaseError = await req.repository.tree().catch(err => err);

			if(tree instanceof BaseError) {
				reply.code(tree.code).send({ error: tree.message });
				return;
			}

			const tree_path = (Object.keys(req.query).length !== 0 && req.query.path) ? req.query.path : null;

			let data: APITree;

			if(tree_path) {
				const tree_path_entry: Tree | Blob | BaseError = await tree.find(tree_path).catch(err => err);

				if(tree_path_entry instanceof BaseError) {
					reply.code(tree_path_entry.code).send({ error: tree_path_entry.message });
					return;
				}

				data = tree_path_entry instanceof Blob
					? { type: "blob", content: await tree_path_entry.content() }
					: { type: "tree", content: await Promise.all(tree_path_entry.entries().map(treeEntryMap)) };
			}
			else {
				data = { type: "tree", content: await Promise.all(tree.entries().map(treeEntryMap)) };
			}

			reply.send({ data: data });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/tags",
		handler: async(req, reply) => {
			const tags = await req.repository.tags();
			reply.send({
				data: await Promise.all(tags.map(tagMap))
			});
		}
	});

	done();
}