import { Commit } from "../git/commit";
import { Repository } from "../git/repository";

type VerificationResultType = "SUCCESS" | "NOT_FOUND" | "INVALID";

export class VerificationResult {
	constructor(result: VerificationResultType, subject?: string) {
		this.success = result === "SUCCESS";

		if(result !== "SUCCESS") {
			const verification_error_types = {
				NOT_FOUND: { code: 404, message: `${String(subject?.substr(0, 1).toUpperCase()) + subject?.substr(1)} not found!` },
				INVALID: { code: 403, message: `Invalid ${subject}` }
			};

			this.message = verification_error_types[result].message;
			this.code = verification_error_types[result].code;
		}
	}

	success: boolean;
	code: number | null = null;
	message: string | null = null;
}

export function verifyRepoName(repo_name: string): boolean {
	return /^[a-zA-Z0-9.\-_]+$/u.test(repo_name);
}

export async function verifySHA(repository: Repository, sha: string): Promise<VerificationResult> {
	if(!(/^[a-fA-F0-9]+$/u).test(sha)) {
		return new VerificationResult("INVALID", "sha");
	}

	const object_exists = await Commit.lookupExists(repository, sha);

	if(!object_exists) {
		return new VerificationResult("NOT_FOUND", "object");
	}

	return new VerificationResult("SUCCESS");
}