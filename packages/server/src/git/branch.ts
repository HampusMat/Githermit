import { CommitSummary } from "./commit";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { Repository as NodeGitRepository } from "nodegit";
import { BranchError, createError } from "./error";

export class Branch extends Reference {
	public async latestCommit(): Promise<CommitSummary> {
		const latest_commit = this._owner.nodegitRepository.getBranchCommit(this._ng_reference).catch(() => {
			throw(createError(BranchError, 500, "Failed to get the latest commit"));
		});

		return {
			id: (await latest_commit).sha(),
			message: (await latest_commit).message(),
			date: (await latest_commit).time()
		};
	}

	public static async lookup(owner: Repository, branch: string): Promise<Branch> {
		const reference = await owner.nodegitRepository.getBranch(branch).catch(err => {
			if(err.errno === -3) {
				throw(createError(BranchError, 404, "Branch not found!"));
			}
			throw(createError(BranchError, 500, "Something went wrong."));
		});
		return new Branch(owner, reference);
	}

	public static async lookupExists(ng_repository: NodeGitRepository, branch: string): Promise<boolean> {
		return ng_repository.getBranch(branch)
			.then(() => true)
			.catch(() => false);
	}
}