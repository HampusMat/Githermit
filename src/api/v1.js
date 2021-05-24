const express = require("express");
const git = require("./git");
const sanitization = require("./sanitization");

const router = express.Router();

router.get("/info", function(req, res)
{
	res.json({ "data": req.settings });
	return;
});

router.get("/repos", async function(req, res)
{
	let repos = await git.getRepos(req.settings["base_dir"]);

	if(repos["error"]) {
		res.status(500).send("Internal server error!");
		return;
	}

	res.json({ "data": repos });
});

router.use("/repos/:repo", async function(req, res, next)
{
	if(!sanitization.sanitizeRepoName(req.params.repo)) {
		res.status(400).json({ "error": "Unacceptable git repository name!" });
		return;
	}
	next();
});

router.get("/repos/:repo", async function(req, res)
{
	const repo = `${req.params.repo}.git`;
	const desc = await git.getRepoFile(req.settings["base_dir"], repo, "description");

	res.json({ "data": { "name": req.params.repo, "description": desc } });
});

router.get("/repos/:repo/log", async function(req, res)
{
	const repo = `${req.params.repo}.git`;
	const log = await git.getLog(req.settings["base_dir"], repo);

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
	res.json({ data: log });
});

router.get("/repos/:repo/log/:commit", async function(req, res)
{
	if(!sanitization.sanitizeCommitID(req.params.commit)) {
		res.status(400).json({ "error": "Unacceptable commit id!" });
		return;
	}

	const commit = await git.getCommit(req.settings["base_dir"], req.params.repo, req.params.commit);

	res.json({ data: commit });
});

module.exports = router;