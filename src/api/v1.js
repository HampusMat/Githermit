const git = require("./git");
const util = require("./util");

module.exports = function (fastify, opts, done)
{
	fastify.route({
		method: "GET",
		path: "/info",
		handler: (req, reply) =>
		{
			reply.send({ data: opts.config.settings });
		}
	});
	fastify.route({
		method: "GET",
		path: "/repos",
		handler: async (req, reply) =>
		{
			let repos = await git.getRepos(opts.config.settings.base_dir);

			if(repos["error"]) {
				reply.code(500).send({ error: "Internal server error!" });
				return;
			}

			reply.send({ data: repos });
		}
	});

	fastify.route({
		method: "GET",
		path: "/repos/:repo",
		handler: async (req, reply) =>
		{
			const repo_verification = await util.verifyRepoName(req.params.repo, opts.config.settings.base_dir);
			if(repo_verification !== true) {
				if(repo_verification === "ERR_REPO_REGEX") {
					reply.code(400).send({ error: "Unacceptable git repository name!" });
				}
				else if(repo_verification === "ERR_REPO_NOT_FOUND") {
					reply.code(404).send({ error: "Git repository not found!" });
				}
			}

			const repo = `${req.params.repo}.git`;
			const desc = await git.getRepoFile(opts.config.settings.base_dir, repo, "description");

			reply.send({ data: { name: req.params.repo, description: desc } });
		}
	});

	fastify.register((fastify_repo, opts_repo, done_repo) =>
	{
		fastify_repo.addHook("onRequest", async (req, reply) =>
		{
			const repo_verification = await util.verifyRepoName(req.params.repo, opts.config.settings.base_dir);
			if(repo_verification !== true) {
				if(repo_verification === "ERR_REPO_REGEX") {
					reply.code(400).send({ error: "Unacceptable git repository name!" });
				}
				else if(repo_verification === "ERR_REPO_NOT_FOUND") {
					reply.code(404).send({ error: "Git repository not found!" });
				}
			}
		});

		fastify_repo.route({
			method: "GET",
			path: "/log",
			handler: async (req, reply) =>
			{
				const log = await git.getLog(opts.config.settings.base_dir, req.params.repo + ".git");
	
				if(log["error"]) {
					if(typeof log["error"] === "string") {
						reply.code(500).send({ error: log["error"] });
					}
	
					switch(log["error"]) {
					case 404:
						reply.code(404).send({ error: "Git repository not found!" });
					}
	
					return;
				}
				reply.send({ data: log });
			}
		});

		fastify_repo.route({
			method: "GET",
			path: "/log/:commit",
			handler: async (req, reply) =>
			{
				const commit_verification = await util.verifyCommitID(opts.config.settings.base_dir, req.params.repo + ".git", req.params.commit);
				if(!commit_verification !== true) {
					if(commit_verification === "ERR_COMMIT_REGEX") {
						reply.code(400).send({ error: "Unacceptable commit id!" });
					}
					else if(commit_verification === "ERR_COMMIT_NOT_FOUND") {
						reply.code(404).send({ error: "Commit not found!" });
					}
				}
			
				const commit = await git.getCommit(opts.config.settings.base_dir, req.params.repo, req.params.commit);
			
				reply.send({ data: commit });
			}
		});

		done_repo();
	}, { prefix: "/repos/:repo" });

	done();
}