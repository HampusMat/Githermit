const fastify = require("fastify")();
const api = require("./api/v1");
const yaml = require('js-yaml');
const fs = require('fs');
const { exit } = require("process");
const git = require("./api/git");
const path = require("path");

const settings = yaml.load(fs.readFileSync(__dirname + "/../../../settings.yml", 'utf8'));
const settings_keys = Object.keys(settings);

const mandatory_settings = [ "host", "port", "dev_port", "title", "about", "base_dir", "production" ];

// Make sure that all the required settings are present
const settings_not_included = mandatory_settings.filter(x => !settings_keys.includes(x));
if(settings_not_included.length !== 0) {
	console.log(`Error: settings.yml is missing ${(settings_not_included.length > 1) ? "keys" : "key"}:`);
	console.log(settings_not_included.join(", "));
	exit(1);
}

// Make sure that there's not an excessive amount of settings
const mandatory_not_included = settings_keys.filter(x => !mandatory_settings.includes(x));
if(mandatory_not_included.length !== 0) {
	console.log(`Error: settings.yml includes ${(mandatory_not_included.length > 1) ? "pointless keys" : "a pointless key"}:`);
	console.log(mandatory_not_included.join(", "));
	exit(1);
}

// Make sure that the base directory specified in the settings actually exists
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

if(settings.production) {
	fastify.register(require('fastify-static'), { root: path.join(__dirname, '/../../../dist') });

	fastify.route({
		method: "GET",
		path: "/",
		handler: (req, reply) => reply.sendFile("index.html")
	});
}

fastify.addContentTypeParser("application/x-git-upload-pack-request", (req, payload, done) => done(null, payload));
  
fastify.register(api, { prefix: "/api/v1", config: { settings: settings } });

fastify.route({
	method: "GET",
	path: "/:repo([a-zA-Z0-9\\.\\-_]+)/info/refs",
	handler: (req, reply) =>
	{
		if(!req.query.service) {
			reply.code(403).send("Missing service query parameter\n");
			return;
		}
		else if(req.query.service !== "git-upload-pack") {
			reply.code(403).send("Access denied!\n");
			return;
		}
		else if(Object.keys(req.query).length !== 1) {
			reply.header("Content-Type", "application/x-git-upload-pack-advertisement");
			reply.code(403).send("Too many query parameters!\n");
			return;
		}

		git.connectToGitHTTPBackend(settings["base_dir"], req, reply);
	}
});

fastify.route({
	method: "POST",
	path: "/:repo([a-zA-Z0-9\\.\\-_]+)/git-upload-pack",
	handler: (req, reply) => git.connectToGitHTTPBackend(settings["base_dir"], req, reply)
});

fastify.listen(settings.port, settings.host, (err, addr) =>
{
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`App is running on ${addr}`);
});