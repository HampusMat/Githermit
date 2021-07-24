import { FastifyReply, FastifyRequest } from "fastify";
import { Repository } from "./repository";
import { Route } from "../types/fastify";
import { join } from "path";
import { spawn } from "child_process";
import { verifyGitRequest } from "../api/util";

export interface Request extends FastifyRequest {
	params: Route["Params"],
}

function writeRefDiscoveryFirstLine(service: string, reply: FastifyReply) {
	const s = "# service=" + service + "\n";
	const n = (4 + s.length).toString(16);
	reply.raw.write(Buffer.from((Array(4 - n.length + 1).join("0") + n + s) + "0000"));
}

export function connect(repository: Repository, req: Request, reply: FastifyReply): void {
	const parsed_url = new URL(`${req.protocol}://${req.hostname}${req.url.replace(req.params.repo, repository.name.short)}`);

	const is_discovery = (/\/info\/refs$/u).test(parsed_url.pathname);

	const url_path_parts = parsed_url.pathname.split("/");

	const service = is_discovery
		? parsed_url.searchParams.get("service") || ""
		: url_path_parts[url_path_parts.length - 1];

	const content_type = `application/x-${service}-${is_discovery ? "advertisement" : "result"}`;

	const valid_request = verifyGitRequest(parsed_url.pathname, service);
	if(valid_request.success === false && valid_request.code) {
		reply.header("Content-Type", content_type);
		reply.code(valid_request.code).send(valid_request.message);
		return;
	}

	reply.raw.writeHead(200, { "Content-Type": content_type });

	const spawn_args = [ "--stateless-rpc", join(repository.base_dir, repository.name.full) ];
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

	git_service.stdout.pipe(reply.raw);
}