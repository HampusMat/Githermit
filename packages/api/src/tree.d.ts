import { LatestCommit } from "./commit";

export type TreeEntry = {
	name: string,
	type: "tree" | "blob",
	latest_commit: LatestCommit
};

export type Tree = {
	type: "tree" | "blob",
	content: string | TreeEntry[]
};