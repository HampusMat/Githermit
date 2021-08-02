import { LatestCommit } from "./commit";

export interface BranchSummary {
	id: string,
	name: string
}

export interface Branch extends BranchSummary {
	latest_commit: LatestCommit
}