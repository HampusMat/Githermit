import { Git, GitAPI } from "./git";
import { readdir } from "fs";

type VerificationResultErrorType = "REPO_NOT_FOUND" | "REPO_INVALID" | "COMMIT_NOT_FOUND" | "COMMIT_INVALID" | "ACCESS_DENIED";

const verification_error_types = {
	REPO_NOT_FOUND: { code: 404, message: "Repository not found!" },
	REPO_INVALID: { code: 403, message: "Invalid repository!" },
	COMMIT_NOT_FOUND: { code: 404, message: "Commit not found!" },
	COMMIT_INVALID: { code: 403, message: "Invalid commit!" },
	ACCESS_DENIED: { code: 403, message: "Access denied!" }
};

export class VerificationResult {
	constructor(success: boolean, error_type?: VerificationResultErrorType) {
		this.success = success;

		if(error_type) {
			this.message = verification_error_types[error_type].message;
			this.code = verification_error_types[error_type].code;
		}
	}

	success: boolean;
	code: number = 0;
	message: string | null = null;
}

export function verifyRepoName(base_dir: string, repo_name: string) {
	return new Promise<VerificationResult>(resolve => {
		console.log(repo_name);
		const is_valid_repo_name = (/^[a-zA-Z0-9.\-_]+$/u).test(repo_name);
		if(!is_valid_repo_name) {
			resolve(new VerificationResult(false, "REPO_INVALID"));
			return;
		}

		readdir(base_dir, (err, dir_content) => {
			if(err) {
				resolve(new VerificationResult(false, "REPO_NOT_FOUND"));
				return;
			}

			const dir_content_repos = dir_content.filter(repo => repo.endsWith(".git"));
			if(!dir_content_repos.includes(repo_name + ".git")) {
				resolve(new VerificationResult(false, "REPO_NOT_FOUND"));
				return;
			}

			resolve(new VerificationResult(true));
		});
	});
}

export async function verifyCommitID(git: GitAPI, repo: string, commit_id: string) {
	if(!(/^[a-fA-F0-9]+$/u).test(commit_id)) {
		return new VerificationResult(false, "COMMIT_INVALID");
	}

	const commit_exists = await git.doesCommitExist(repo, commit_id);

	if(!commit_exists) {
		return new VerificationResult(false, "COMMIT_NOT_FOUND");
	}

	return new VerificationResult(true);
}

export function verifyGitRequest(request_info: Git.RequestInfo): VerificationResult {
	if((/\.\/|\.\./u).test(request_info.parsed_url.pathname)) {
		return new VerificationResult(false, "REPO_NOT_FOUND");
	}

	if(request_info.service !== "git-upload-pack") {
		return new VerificationResult(false, "ACCESS_DENIED");
	}

	return new VerificationResult(true);
}