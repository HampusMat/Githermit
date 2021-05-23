const express = require("express");
const api = require("./api/v1");
const yaml = require('js-yaml');
const fs = require('fs');
const { exit } = require("process");

const settings = yaml.load(fs.readFileSync("./settings.yml", 'utf8'));
const settings_keys = Object.keys(settings);

const mandatory_settings = [ "host", "port", "title", "about", "base_dir" ];

const mandatory_not_included = settings_keys.filter(x => !mandatory_settings.includes(x));
const settings_not_included = mandatory_settings.filter(x => !settings_keys.includes(x));

if(settings_not_included.length !== 0) {
	console.log(`Error: settings.yml is missing ${(mandatory_not_included.length > 1) ? "keys" : "key"}:`);
	console.log(settings_not_included.join(", "));
	exit(1);
}
if(mandatory_not_included.length !== 0) {
	console.log(`Error: settings.yml includes ${(mandatory_not_included.length > 1) ? "pointless keys" : "a pointless key"}:`);
	console.log(mandatory_not_included.join(", "));
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

app.get("/", (req, res) =>
{
	res.sendFile("dist/app.html", { root: __dirname });
});

const repo_router = express.Router();

app.use("/:repo([a-zA-Z0-9-_]+)", (req, res, next) =>
{
	console.log("AAAA");
	fs.readdir(settings["base_dir"], (err, dir_content) =>
	{
		if(err) {
			res.status(404).send("404: Not found");
			return;
		}
		
		dir_content = dir_content.filter(repo => repo.endsWith(".git"));
		if(!dir_content.includes(req.params.repo + ".git")) {
			res.status(404).send("404: Not found");
			return;
		}
		else {
			next();
		}
	});
}, repo_router);

repo_router.get(/$|log$|refs$|tree$/, (req, res) =>
{
	res.sendFile("dist/app.html", { root: __dirname });
});

repo_router.get(/\/log\/[a-fA-F0-9]{40}$/, (req, res) =>
{
	res.sendFile("dist/app.html", { root: __dirname });
})

repo_router.use((req, res) =>
{
	res.status(404).send("404: Not found eeee");
});

app.use((req, res) =>
{
	res.status(404).send("404: Not found");
})

app.listen(settings["port"], settings["host"], () => console.log(`App is running on ${settings["host"]}:${settings["port"]}`));