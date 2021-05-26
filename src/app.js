const fastify = require("fastify")();
const fastify_static = require('fastify-static');
const api = require("./api/v1");
const yaml = require('js-yaml');
const fs = require('fs');
const { exit } = require("process");
const path = require("path");
const util = require("./api/util");

const settings = yaml.load(fs.readFileSync(__dirname + "/../settings.yml", 'utf8'));
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

const dist_dir = path.join(__dirname, "/../dist");

try {
	fs.readdirSync(settings["base_dir"]);
}
catch {
	console.error(`Error: Tried opening the base directory. No such directory: ${settings["base_dir"]}`);
	exit(1);
}

fastify.setNotFoundHandler({
	preValidation: (req, reply, done) => done(),
	preHandler: (req, reply, done) => done()
}, function (req, reply)
{
	reply.send("404: Not found");
});

fastify.route({
	method: "GET",
	path: "/app.html",
	handler: (req, reply) => reply.redirect("/")
});

fastify.register(fastify_static, { root: dist_dir })
fastify.register(api, { prefix: "/api/v1", config: { settings: settings } });

fastify.route({
	method: "GET",
	path: "/",
	handler: (req, reply) =>
	{
		console.log("AAAA faan");
		console.log(dist_dir)
		reply.sendFile("app.html");
	}
});

fastify.register((fastify_repo, opts, done) =>
{
	fastify_repo.setNotFoundHandler({
		preValidation: (req, reply, done) => done(),
		preHandler: (req, reply, done) => done()
	}, function (req, reply)
	{
		reply.send("404: Not found");
	});

	fastify_repo.addHook("onRequest", async (req, reply) =>
	{
		const repo_verification = await util.verifyRepoName(req.params.repo, settings.base_dir);
		if(repo_verification !== true) {
			if(repo_verification === "ERR_REPO_REGEX") {
				reply.code(400).send("Error: Unacceptable git repository name!");
			}
			else if(repo_verification === "ERR_REPO_NOT_FOUND") {
				reply.code(404).send("Error: Git repository not found!");
			}
		}
	});

	fastify_repo.route({
		method: "GET",
		path: "/:page",
		handler: (req, reply) =>
		{
			if([ "log", "refs", "tree" ].includes(req.params.page)) {
				reply.sendFile("app.html");
			}
		}
	});
	
	fastify_repo.route({
		method: "GET",
		path: "/log/:subpage",
		handler: async (req, reply) =>
		{
			const commit_verification = await util.verifyCommitID(settings.base_dir, req.params.repo + ".git", req.params.subpage);
			console.log(commit_verification);
			if(commit_verification !== true) {
				reply.callNotFound();
			}

			reply.sendFile("app.html");
		}
	});

	done();
}, { prefix: "/:repo" });

fastify.listen(settings["port"],(err, addr) =>
{
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`App is running on ${addr}`);
});