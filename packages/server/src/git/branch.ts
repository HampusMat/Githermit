import { CommitSummary } from "./commit";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { Repository as NodeGitRepository } from "nodegit";
import { createError, ErrorWhere, FailedError, NotFoundError, UnknownError } from "./error";

/**
 * A representation of a branch
 *
 * @extends Reference
 */
export class Branch extends Reference {
	public async repository(): Promise<Repository> {
		return this._owner.withBranch(this.name);
	}

	/**
	 * Returns the branch's latest commit
	 *
	 * @returns A commit summary instance
	 */
	public async latestCommit(): Promise<CommitSummary> {
		const latest_commit = this._owner.ng_repository.getBranchCommit(this._ng_reference).catch(() => {
			throw(createError(ErrorWhere.Branch, FailedError, "get the latest commit"));
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
	 * @param branch - The name of a branch
	 * @returns An instance of a branch
	 */
	public static async lookup(owner: Repository, branch: string): Promise<Branch> {
		const reference = await owner.ng_repository.getBranch(branch).catch(err => {
			if(err.errno === -3) {
				throw(createError(ErrorWhere.Branch, NotFoundError, "branch"));
			}
			throw(createError(ErrorWhere.Branch, UnknownError));
		});

		return new Branch(owner, reference);
	}

	/**
	 * Returns if a branch exists or not
	 *
	 * @param owner - The repository which the branch is in
	 * @param branch - The name of a branch
	 * @returns Whether or not the branch exists
	 */
	public static async lookupExists(owner: NodeGitRepository, branch: string): Promise<boolean> {
		return owner.getBranch(branch)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Returns all of a repository's branches
	 *
	 * @param owner - An instance of a repository
	 * @returns An array of branch instances
	 */
	public static async getAll(owner: Repository): Promise<Branch[]> {
		const references = await owner.ng_repository.getReferences();

		return references.filter(ref => ref.isBranch()).map(ref => new Branch(owner, ref));
	}
}