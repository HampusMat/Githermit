import { GitAPI } from "./git";
import { RequestInfo } from "./git_types";
import { readdir } from "fs";

type VerificationResultType = "SUCCESS" | "NOT_FOUND" | "INVALID" | "ACCESS_DENIED";

export class VerificationResult {
	constructor(result: VerificationResultType, subject?: string) {
		this.success = result === "SUCCESS";

		if(result !== "SUCCESS") {
			const verification_error_types = {
				NOT_FOUND: { code: 404, message: `${String(subject?.substr(0, 1).toUpperCase()) + subject?.substr(1)} not found!` },
				INVALID: { code: 403, message: `Invalid ${subject}` },
				ACCESS_DENIED: { code: 403, message: "Access denied!" }
			};

			this.message = verification_error_types[result].message;
			this.code = verification_error_types[result].code;
		}
	}

	success: boolean;
	code: number | null = null;
	message: string | null = null;
}

export function verifyRepoName(base_dir: string, repo_name: string): Promise<VerificationResult> {
	return new Promise<VerificationResult>(resolve => {
		console.log(repo_name);
		const is_valid_repo_name = (/^[a-zA-Z0-9.\-_]+$/u).test(repo_name);
		if(!is_valid_repo_name) {
			resolve(new VerificationResult("INVALID", "repository"));
			return;
		}

		readdir(base_dir, (err, dir_content) => {
			if(err) {
				resolve(new VerificationResult("NOT_FOUND", "repository"));
				return;
			}

			const dir_content_repos = dir_content.filter(repo => repo.endsWith(".git"));
			if(!dir_content_repos.includes(repo_name + ".git")) {
				resolve(new VerificationResult("NOT_FOUND", "repository"));
				return;
			}

			resolve(new VerificationResult("SUCCESS"));
		});
	});
}

export async function verifySHA(git: GitAPI, repo_name: string, sha: string): Promise<VerificationResult> {
	if(!(/^[a-fA-F0-9]+$/u).test(sha)) {
		return new VerificationResult("INVALID", "sha");
	}

	const object_exists = await git.doesObjectExist(repo_name, sha);

	if(!object_exists) {
		return new VerificationResult("NOT_FOUND", "object");
	}

	return new VerificationResult("SUCCESS");
}

export function verifyGitRequest(request_info: RequestInfo): VerificationResult {
	if((/\.\/|\.\./u).test(request_info.parsed_url.pathname)) {
		return new VerificationResult("INVALID", "path");
	}

	if(request_info.service !== "git-upload-pack") {
		return new VerificationResult("ACCESS_DENIED");
	}

	return new VerificationResult("SUCCESS");
}