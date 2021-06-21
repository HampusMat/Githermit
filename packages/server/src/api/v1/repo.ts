import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { verifySHA, verifyRepoName } from "../util";

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: any) {
	const git = opts.config.git;

	fastify.addHook("onRequest", async(req, reply) => {
		const params: any = req.params;
		const repo_verification = await verifyRepoName(opts.config.settings.base_dir, params.repo);
		if(repo_verification.success === false && repo_verification.code) {
			reply.code(repo_verification.code).send({ error: repo_verification.message });
		}
	});

	fastify.route({
		method: "GET",
		url: "/log",
		handler: async(req, reply) => {
			const log = await git.getLog((<any>req.params).repo);

			if(log.length === 0) {
				reply.code(500).send({ error: "Internal server error!" });
				return;
			}

			reply.send({ data: log });
		}
	});

	fastify.route({
		method: "GET",
		url: "/log/:commit",
		handler: async(req, reply) => {
			const params: any = req.params;
			const commit_verification = await verifySHA(git, params.repo, params.commit);
			if(commit_verification.success === false && commit_verification.code) {
				reply.code(commit_verification.code).send({ error: commit_verification.message });
			}

			const commit = await git.getCommit(params.repo, params.commit);

			reply.send({ data: commit });
		}
	});

	fastify.route({
		method: "GET",
		url: "/tree",
		handler: async(req, reply) => {
			const params: any = req.params;
			const query: any = req.query;

			const tree_path = (query.length !== 0 && query.path) ? query.path : null;

			const tree = await git.getTree(params.repo, tree_path);

			if(!tree) {
				reply.code(404).send({ error: "Path not found" });
			}

			reply.send({ data: tree });
		}
	});

	fastify.route({
		method: "GET",
		url: "/branches",
		handler: async(req, reply) => {
			const params: any = req.params;
			const branches = await git.getBranches(params.repo);

			reply.send({ data: branches });
		}
	});

	fastify.route({
		method: "GET",
		url: "/branches/:branch",
		handler: async(req, reply) => {
			const params: any = req.params;
			const branch_verification = await verifySHA(git, params.repo, params.branch);
			if(branch_verification.success === false && branch_verification.code) {
				reply.code(branch_verification.code).send({ error: branch_verification.message });
			}

			const branch = await git.getBranch(params.repo, params.branch);

			if(!branch) {
				reply.code(404).send({ error: "Branch not found!" });
				return;
			}

			reply.send({ data: branch });
		}
	});

	fastify.route({
		method: "GET",
		url: "/tags",
		handler: async(req, reply) => {
			const params: any = req.params;
			const refs = await git.getTags(params.repo);
			reply.send({ data: refs });
		}
	});

	done();
}