import { FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage } from "http";
import { Repository } from "./repository";
import { Route } from "../fastify_types";
import { join } from "path";
import { spawn } from "child_process";
import { verifyGitRequest } from "../api/util";

export type RequestInfo = {
	repo: string,
	url_path: string,
	parsed_url: URL,
	url_path_parts: string[],
	is_discovery: boolean,
	service: string | null,
	content_type: string
}

export interface Request extends FastifyRequest {
	params: Route["Params"],
}

function getRequestInfo(req: Request): RequestInfo {
	const repo = req.params.repo + ".git";
	const url_path = req.url.replace(req.params.repo, repo);

	const parsed_url = new URL(`${req.protocol}://${req.hostname}${url_path}`);
	const url_path_parts = parsed_url.pathname.split("/");

	const is_discovery = (/\/info\/refs$/u).test(parsed_url.pathname);

	const service = is_discovery ? parsed_url.searchParams.get("service") : url_path_parts[url_path_parts.length - 1];

	const content_type = `application/x-${service}-${is_discovery ? "advertisement" : "result"}`;

	return {
		repo,
		url_path,
		parsed_url,
		is_discovery,
		url_path_parts,
		service,
		content_type
	};
}

export function connect(repository: Repository, req: Request, reply: FastifyReply): void {
	const request_info = getRequestInfo(req);

	const valid_request = verifyGitRequest(request_info);
	if(valid_request.success === false && valid_request.code) {
		reply.header("Content-Type", request_info.content_type);
		reply.code(valid_request.code).send(valid_request.message);
		return;
	}

	reply.raw.writeHead(200, { "Content-Type": request_info.content_type });

	const spawn_args = [ "--stateless-rpc", join(repository.base_dir, request_info.repo) ];
	if(request_info.is_discovery) {
		spawn_args.push("--advertise-refs");
	}

	const git_pack = spawn(<string>request_info.service, spawn_args);

	if(request_info.is_discovery) {
		const s = "# service=" + request_info.service + "\n";
		const n = (4 + s.length).toString(16);
		reply.raw.write(Buffer.from((Array(4 - n.length + 1).join("0") + n + s) + "0000"));
	}
	else {
		const request_body: IncomingMessage = req.raw;

		request_body.on("data", data => git_pack.stdin.write(data));
		request_body.on("close", () => git_pack.stdin.end());
	}

	git_pack.on("error", err => console.log(err));

	git_pack.stderr.on("data", (stderr: Buffer) => console.log(stderr.toString()));
	git_pack.stdout.on("data", data => reply.raw.write(data));

	git_pack.on("close", () => reply.raw.end());
}