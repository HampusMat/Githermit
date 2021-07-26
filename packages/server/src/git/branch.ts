import { CommitSummary } from "./commit";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { Repository as NodeGitRepository } from "nodegit";
import { BranchError, createError } from "./error";

/**
 * A representation of a branch
 *
 * @extends Reference
 */
export class Branch extends Reference {
	/**
	 * Returns the branch's latest commit
	 *
	 * @returns A commit summary instance
	 */
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

	/**
	 * Lookup a branch
	 *
	 * @param owner - The repository which the branch is in
	 * @param branch - The SHA of a branch
	 * @returns An instance of a branch
	 */
	public static async lookup(owner: Repository, branch: string): Promise<Branch> {
		const reference = await owner.nodegitRepository.getBranch(branch).catch(err => {
			if(err.errno === -3) {
				throw(createError(BranchError, 404, "Branch not found!"));
			}
			throw(createError(BranchError, 500, "Something went wrong."));
		});
		return new Branch(owner, reference);
	}

	/**
	 * Returns if a branch exists or not
	 *
	 * @param owner - The repository which the branch is in
	 * @param branch - The SHA of a branch
	 * @returns Whether or not the branch exists
	 */
	public static async lookupExists(owner: NodeGitRepository, branch: string): Promise<boolean> {
		return owner.getBranch(branch)
			.then(() => true)
			.catch(() => false);
	}
}