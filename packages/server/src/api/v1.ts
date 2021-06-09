import { verifyCommitID, verifyRepoName } from "./util";
import { FastifyInstance } from "fastify";
import { Git } from "./git";
/* eslint-disable max-lines-per-function */

export default function(fastify: FastifyInstance, opts, done) {
	const git = new Git(opts.config.settings.base_dir);

	fastify.route({
		method: "GET",
		url: "/info",
		handler: (req, reply) => {
			reply.send({ data: opts.config.settings });
		}
	});
	fastify.route({
		method: "GET",
		url: "/repos",
		handler: async(req, reply) => {
			let repos = await git.getRepos();

			if(repos["error"]) {
				reply.code(500).send({ error: "Internal server error!" });
				return;
			}

			reply.send({ data: repos });
		}
	});

	fastify.route({
		method: "GET",
		url: "/repos/:repo",
		handler: async(req, reply) => {
			const params: any = req.params;
			const repo_verification = await verifyRepoName(opts.config.settings.base_dir, params.repo);
			if(repo_verification.success === false) {
				reply.code(repo_verification.code).send(repo_verification.message);
			}

			const desc = await git.getRepoFile(params.repo, "description");

			reply.send({ data: { name: params.repo, description: desc, has_readme: await git.doesReadmeExist(params.repo) } });
		}
	});

	fastify.register((fastify_repo, opts_repo, done_repo) => {
		fastify_repo.addHook("onRequest", async(req, reply) => {
			const params: any = req.params;
			const repo_verification = await verifyRepoName(opts.config.settings.base_dir, params.repo);
			if(repo_verification.success === false) {
				reply.code(repo_verification.code).send({ error: repo_verification.message });
			}
		});

		fastify_repo.route({
			method: "GET",
			url: "/log",
			handler: async(req, reply) => {
				const log = await git.getLog((<any>req.params).repo);

				if(log["error"]) {
					if(typeof log["error"] === "string") {
						reply.code(500).send({ error: log["error"] });
					}

					switch(log["error"]) {
					case 404:
						reply.code(404).send({ error: "Git repository not found!" });
						return;
					default:
						reply.code(500).send({ error: "Internal server error!" });
						return;
					}
				}
				reply.send({ data: log });
			}
		});

		fastify_repo.route({
			method: "GET",
			url: "/log/:commit",
			handler: async(req, reply) => {
				const params: any = req.params;
				const commit_verification = await verifyCommitID(git, params.repo, params.commit);
				if(commit_verification.success === false) {
					reply.code(commit_verification.code).send(commit_verification.message);
				}

				const commit = await git.getCommit(params.repo, params.commit);

				reply.send({ data: commit });
			}
		});

		fastify_repo.route({
			method: "GET",
			url: "/tree",
			handler: async(req, reply) => {
				const params: any = req.params;
				const query: any = req.query;

				const tree_path = (query.length !== 0 && query.path) ? query.path : null;

				const tree = await git.getTree(params.repo, tree_path);

				if(tree.error) {
					if(tree.error === 404) {
						reply.code(404).send({ error: "Path not found" });
					}
					else {
						reply.code(500).send({ error: "Internal server error" });
					}
				}
				reply.send({ data: tree });
			}
		});

		done_repo();
	}, { prefix: "/repos/:repo" });

	done();
};