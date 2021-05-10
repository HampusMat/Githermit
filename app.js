const express = require("express");
const api = require("./api/v1");
const git = require("./api/git");
const yaml = require('js-yaml');
const fs = require('fs');
const { exit } = require("process");

let settings;

try {
	settings = yaml.load(fs.readFileSync("./settings.yml", 'utf8'));
} catch(e) {
	throw(e);
}

const mandatory_settings = ["host", "port", "title", "about", "base_dir"];
const missing_settings_key = mandatory_settings.find(key => settings.hasOwnProperty(key) === false);
if(missing_settings_key) {
	console.error(`Error: missing key in settings.yml: ${missing_settings_key}`);
	exit(1);
}

const app = express();

app.get(/.*\.(css|js|ico)$/, (req, res, next) =>
{
	fs.access(`dist${req.path}`, err =>
	{
		if(err) {
			next();
			return;
		}
		res.sendFile(`dist${req.path}`, { root: __dirname });
	});
});

app.use("/api/v1", (req, res, next) =>
{
	req.settings = settings;
	next();
}, api);

app.use("/:repo", async (req, res, next) =>
{
	let repo_dirs = await git.getRepos(settings["base_dir"]);

	if(repo_dirs["error"]) {
		res.status(500).send("Internal server error!");
		return;
	}

	if(!repo_dirs["data"].includes(req.params.repo)) {
		res.status(404).send("404: Page not found");
		return;
	}
	next();
})

app.get("/:repo", (req, res) =>
{
	res.redirect(`/${req.params.repo}/log`);
});

app.get("/:repo/:page", (req, res, next) =>
{
	const pages = ["log", "refs", "tree"];
	if(!pages.includes(req.params.page)) {
		next();
		return;
	}
	
	res.sendFile("dist/app.html", { root: __dirname });
});

app.get("/:repo/log/:hash", (req, res, next) =>
{
	const valid_hash = /^[0-9a-f]+$/;
	if(!valid_hash.test(req.params.hash)) {
		next();
		return;
	}
	res.sendFile("dist/app.html", { root: __dirname });
});


app.get("/", (req, res) =>
{
	res.sendFile("dist/app.html", { root: __dirname });
});

app.use((req, res) =>
{
	res.status(404).send("404: Page not found");
});

app.listen(settings["port"], settings["host"], () => console.log(`App is running on ${settings["host"]}:${settings["port"]}`));