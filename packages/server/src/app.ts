import api from "./routes/api/v1";
import { fastify as fastifyFactory, FastifyInstance } from "fastify";
import fastifyStatic from "fastify-static";
import { Settings } from "./types";
import repo from "./routes/repo";
import { join } from "path";
import { readdir } from "fs/promises";
import { exit } from "process";
import { ServerCache } from "./cache";

export default async function buildApp(settings: Settings, cache: ServerCache | null): Promise<FastifyInstance> {
	const fastify = fastifyFactory();

	fastify.setErrorHandler((err, req, reply) => {
		if(err.validation) {
			reply.code(400).send(`${err.validation[0].dataPath} ${err.validation[0].message}`);
			return;
		}

		console.log(err);
		reply.code(500).send("Internal server error!");
	});

	fastify.setNotFoundHandler({}, (req, reply) => {
		reply.code(404).send("Page not found!");
	});

	if(!settings.dev) {
		const dist_dir = join(__dirname, "/../../client/dist");

		await readdir(dist_dir).catch(() => {
			console.error("Error: Client dist directory doesn't exist!");
			exit(1);
		});

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

	fastify.register(api, { prefix: "/api/v1", config: { settings: settings, cache: cache } });
	fastify.register(repo, { prefix: "/:repo([a-zA-Z0-9\\.\\-_]+)", config: { settings: settings, cache: cache } });

	return fastify;
}