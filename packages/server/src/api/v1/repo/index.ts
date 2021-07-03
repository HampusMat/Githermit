import { CoolFastifyRequest, Route } from "../../../fastify_types";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Blob } from "../../../git/blob";
import { Repository } from "../../../git/repository";
import { Tag } from "../../../git/tag";
import { TreeEntry } from "../../../git/tree_entry";
import { basename } from "path";
import branches from "./branches";
import log from "./log";
import { verifyRepoName } from "../../util";

declare module "fastify" {
	interface FastifyRequest {
		repository: Promise<Repository>,
	}
}

function addHooks(fastify: FastifyInstance, opts: FastifyPluginOptions): void {
	fastify.addHook("preHandler", (req: CoolFastifyRequest, reply, hookDone) => {
		req.repository = Repository.open(opts.config.settings.base_dir, req.params.repo);

		hookDone();
	});

	fastify.addHook("onRequest", async(req: CoolFastifyRequest, reply) => {
		const repo_verification = await verifyRepoName(opts.config.settings.base_dir, req.params.repo);
		if(repo_verification.success === false && repo_verification.code) {
			reply.code(repo_verification.code).send({ error: repo_verification.message });
		}

	});
}
async function treeEntryMap(entry: TreeEntry) {
	const latest_commit = await entry.latestCommit();
	return {
		name: basename(entry.path),
		type: entry.type,
		latest_commit: {
			id: latest_commit.id,
			message: latest_commit.message,
			date: latest_commit.date
		}
	};
}

async function tagMap(tag: Tag) {
	const author = await tag.author();
	return {
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
			const tree = await (await req.repository).tree();

			const tree_path = (Object.keys(req.query).length !== 0 && req.query.path) ? req.query.path : null;
			if(tree_path) {
				const tree_found = await tree.find(tree_path);

				if(!tree_found) {
					reply.code(404).send({ error: "Tree path not found!" });
					return;
				}

				reply.send({
					data: tree_found instanceof Blob
						? { type: "blob", content: await tree_found.content() }
						: { type: "tree", content: await Promise.all(tree_found.entries().map(treeEntryMap)) }
				});

				return;
			}

			reply.send({ data: { type: "tree", content: await Promise.all(tree.entries().map(treeEntryMap)) } });
		}
	});

	fastify.route<Route>({
		method: "GET",
		url: "/tags",
		handler: async(req, reply) => {
			const tags = await (await req.repository).tags();
			reply.send({
				data: await Promise.all(tags.map(tagMap))
			});
		}
	});

	done();
}