import { Commit } from "server/src/git/commit";

export type EnvironmentVariables = {
	BASE_DIR: string,
	AVAIL_REPO: string,
	UNAVAIL_REPO: string,
	AVAIL_OBJECT: string,
	UNAVAIL_OBJECT: string,
	AVAIL_COMMIT: string,
	UNAVAIL_COMMIT: string
}

export function expectCommitProperties(commit: Commit) {
	expect(commit).toHaveProperty("id");
	expect(commit).toHaveProperty("author");
	expect(commit).toHaveProperty("author.name");
	expect(commit).toHaveProperty("author.email");
	expect(commit).toHaveProperty("date");
	expect(commit).toHaveProperty("message");
}