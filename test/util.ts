import { Commit, CommitAuthor } from "server/src/git/commit";

export type EnvironmentVariables = {
	BASE_DIR: string,
	AVAIL_REPO: string,
	AVAIL_REPO_URL: string,
	UNAVAIL_REPO: string,
	AVAIL_OBJECT: string,
	UNAVAIL_OBJECT: string,
	AVAIL_COMMIT: string,
	UNAVAIL_COMMIT: string
}

export function expectCommitProperties(commit: Commit): void {
	expect(commit).toHaveProperty("id");
	expect(commit).toHaveProperty("author");

	const author = commit.author();
	expect(author).toBeInstanceOf(CommitAuthor);

	expect(commit).toHaveProperty("date");
	expect(commit).toHaveProperty("message");
	expect(commit).toHaveProperty("isSigned");
}