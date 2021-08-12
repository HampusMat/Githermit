import api from "./routes/api/v1";
import { fastify as fastifyFactory, FastifyInstance } from "fastify";
import fastifyStatic from "fastify-static";
import { Settings } from "./types";
import repo from "./routes/repo";
import { join } from "path";
import { readdirSync } from "fs";
import { exit } from "process";

export default function buildApp(settings: Settings): FastifyInstance {
	const fastify = fastifyFactory();

	fastify.setErrorHandler((err, req, reply) => {
		console.log(err);
		reply.code(500).send("Internal server error!");
	});

	fastify.setNotFoundHandler({}, function(req, reply) {
		reply.code(404).send("Page not found!");
	});

	if(!settings.dev) {
		const dist_dir = join(__dirname, "/../../client/dist");

		try {
			readdirSync(dist_dir);
		}
		catch {
			console.error("Error: Client dist directory doesn't exist!");
			exit(1);
		}

		fastify.register(fastifyStatic, { root: dist_dir });

		fastify.route({
			method: "GET",
			url: "/",
			handler: (req, reply) => {
				reply.sendFile("index.html");
			}
		});
	}

	fastify.addContentTypeParser("application/x-git-upload-pack-request", (req, payload, done) => done(null, payload));
	fastify.addContentTypeParser("application/x-git-receive-pack-request", (req, payload, done) => done(null, payload));

	fastify.register(api, { prefix: "/api/v1", config: { settings: settings } });
	fastify.register(repo, { prefix: "/:repo([a-zA-Z0-9\\.\\-_]+)", config: { settings: settings } });

	return fastify;
}