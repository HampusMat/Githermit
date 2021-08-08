import { Commit } from "../../../../git/commit";
import { LogCommit } from "api";

export async function commitMap(commit: Commit): Promise<LogCommit> {
	const stats = await commit.stats();
	return <LogCommit>{
		id: commit.id,
		author: {
			name: commit.author.name,
			email: commit.author.email
		},
		message: commit.message,
		date: commit.date,
		insertions: stats.insertions,
		deletions: stats.deletions,
		files_changed: stats.files_changed
	};
}
