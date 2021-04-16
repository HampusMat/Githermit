const express = require("express");
const git = require("./git");
const sanitization = require("./sanitization");
const fs = require('fs');

const router = express.Router();
const base_dir="/home/hampus/Projects/"

router.get("/repos", async function(req, res)
{
	fs.readdir(base_dir, (err, files) =>
	{
		if(err) {
			throw err;
		}

		var repos = {};

		files = files.filter(repo => repo.endsWith(".git"));

		let getRepoInfo = new Promise((resolve) =>
		{
			files.forEach((repo, index, arr) =>
			{
				fs.readFile(`${base_dir}/${repo}/description`, (err, content) =>
				{
					let desc = "";
					
					if(!err) {
						desc = content.toString();
					}

					repos[repo.slice(0, -4)] = { "description": desc };

					if(index === arr.length -1) resolve();
				})
			});	
		});

		getRepoInfo.then(() =>
		{
			console.log(`Sist: ${JSON.stringify(repos)}`);
			res.json({ "data": repos });
		})
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