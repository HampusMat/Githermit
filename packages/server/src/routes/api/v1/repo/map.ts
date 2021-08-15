import { Commit } from "../../../../git/commit";
import { LogCommit } from "api";

export async function commitMap(commit: Commit): Promise<LogCommit> {
	const stats = await commit.stats();

	const is_signed = await commit.isSigned();

	return <LogCommit>{
		id: commit.id,
		author: {
			name: commit.author().name,
			email: commit.author().email,
			fingerprint: await commit.author().fingerprint().catch(() => null)
		},
		isSigned: is_signed,
		signatureVerified: is_signed ? await commit.verifySignature().catch(() => false) : null,
		message: commit.message,
		date: commit.date,
		insertions: stats.insertions,
		deletions: stats.deletions,
		files_changed: stats.files_changed
	};
}