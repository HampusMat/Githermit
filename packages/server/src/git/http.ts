import { FastifyReply, FastifyRequest } from "fastify";
import { Repository } from "./repository";
import { Route } from "../types/fastify";
import { join } from "path";
import { spawn } from "child_process";
import { URL } from "url";

export interface Request extends FastifyRequest {
	params: Route["Params"],
}

/**
 * Write the first part of a reference discovery reply
 *
 * @param service - The git service to write as
 * @param reply - A Fastify reply
 */
function writeRefDiscoveryFirstLine(service: string, reply: FastifyReply) {
	const s = "# service=" + service + "\n";
	const n = (4 + s.length).toString(16);
	reply.raw.write(Buffer.from((Array(4 - n.length + 1).join("0") + n + s) + "0000"));
}

/**
 * Connect to the Git HTTP backend
 *
 * @param repository - The repository to use
 * @param req - A Fastify request
 * @param reply - A Fastify reply
 */
export function connect(repository: Repository, req: Request, reply: FastifyReply): void {
	const parsed_url = new URL(`${req.protocol}://${req.hostname}${req.url.replace(req.params.repo, repository.name.short)}`);

	const is_discovery = (/\/info\/refs$/u).test(parsed_url.pathname);

	const url_path_parts = parsed_url.pathname.split("/");

	const service = is_discovery
		? parsed_url.searchParams.get("service") || ""
		: url_path_parts[url_path_parts.length - 1];

	const content_type = `application/x-${service}-${is_discovery ? "advertisement" : "result"}`;

	// Deny any malicious requests
	if(/\.\/|\.\./u.test(parsed_url.pathname) || service !== "git-upload-pack") {
		reply.header("Content-Type", content_type);
		reply.code(403).send("Access denied!");
		return;
	}

	reply.raw.writeHead(200, { "Content-Type": content_type });

	const spawn_args = [ "--stateless-rpc", join(repository.git_dir, repository.name.full) ];

	if(is_discovery) {
		spawn_args.push("--advertise-refs");
	}

	const git_service = spawn(service, spawn_args);

	if(is_discovery) {
		writeRefDiscoveryFirstLine(service, reply);
	}
	else {
		req.raw.pipe(git_service.stdin);

		// Request error
		req.raw.on("error", err => {
			console.log(err);
			git_service.stdin.end();
			reply.raw.end();
		});
	}

	git_service.stdout.pipe(reply.raw);

	// Spawn error
	git_service.on("error", err => {
		console.log(err);
		reply.raw.end();
	});

	// Git service error
	git_service.stderr.on("data", (stderr: Buffer) => {
		console.log(stderr.toString());
		reply.raw.end();
	});
}