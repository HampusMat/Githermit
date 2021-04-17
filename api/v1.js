const express = require("express");
const git = require("./git");
const sanitization = require("./sanitization");
const fs = require('fs');

const router = express.Router();
const base_dir="/home/hampus/Projects/"

router.get("/repos", async function(req, res)
{
	fs.readdir(base_dir, async (err, repo_dirs) =>
	{
		if(err) {
			throw err;
		}
		repo_dirs = repo_dirs.filter(repo => repo.endsWith(".git"));

		console.log("Repo dirs: " + repo_dirs);

		const repos = await git.getBasicRepoInfo(base_dir, repo_dirs);

		console.log("I v1.js\n" + JSON.stringify(repos) + "\n");

		res.json({ "data": repos });
	});
});

router.get("/repos/:repo/log", async function(req, res)
{
	if(sanitization.sanitizeRepoName(req.params.repo)) {
		const repo = `${req.params.repo}.git`;
		const log = await git.getLog(`${base_dir}/${repo}`);

		if(log["error"]) {
			if(typeof log["error"] === "string") {
				res.status(500).json({ "error": log["error"] });
				return;
			}
			switch(log["error"]) {
				case 404:
					res.status(404).json({ "error": "Git repository doesn't exist!" });
					return;
			}
			return;
		}
		res.json(log);
		return;
	}
	res.status(400).json({ "error": "Unacceptable git repository name!" });
});

module.exports = router;