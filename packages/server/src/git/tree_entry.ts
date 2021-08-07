import { Commit } from "./commit";
import { Revwalk as NodeGitRevwalk, TreeEntry as NodeGitTreeEntry } from "nodegit";
import { Repository } from "./repository";
import { Tree } from "./tree";
import { Blob } from "./blob";

/**
 * The core structure of a tree entry
 */
export abstract class BaseTreeEntry {
	protected _owner: Repository;

	public ng_tree_entry: NodeGitTreeEntry;
	public path: string;

	/**
	 * @param owner - The repository which the tree entry is in
	 * @param entry - An instance of a Nodegit tree entry
	 */
	constructor(owner: Repository, entry: NodeGitTreeEntry) {
		this.ng_tree_entry = entry;
		this._owner = owner;

		this.path = entry.path();
	}

	/**
	 * Returns the tree entry's latest commit
	 *
	 * @returns An instance of a commit
	 */
	public async latestCommit(): Promise<Commit> {
		const rev_walk = NodeGitRevwalk.create(this._owner.ng_repository);
		rev_walk.pushRef(`refs/heads/${this._owner.branch_name}`);

		const commit_cnt = (await rev_walk.getCommitsUntil(() => true)).length;

		rev_walk.pushRef(`refs/heads/${this._owner.branch_name}`);
		const file_hist = await rev_walk.fileHistoryWalk(this.path, commit_cnt);

		return new Commit(this._owner, file_hist[0].commit);
	}

	/**
	 * Returns the tree entry's commit history
	 *
	 * @returns An array of commit instances
	 */
	public async history(count?: number): Promise<Commit[]> {
		const rev_walk = NodeGitRevwalk.create(this._owner.ng_repository);
		rev_walk.pushRef(`refs/heads/${this._owner.branch_name}`);

		const commit_cnt = (await rev_walk.getCommitsUntil(() => true)).length;

		rev_walk.pushRef(`refs/heads/${this._owner.branch_name}`);
		const file_hist = await rev_walk.fileHistoryWalk(this.path, commit_cnt);

		const commit_history = file_hist.map(hist_entry => new Commit(this._owner, hist_entry.commit));

		return count
			? commit_history.slice(0, count)
			: commit_history;
	}
}

/**
 * A representation of a tree entry that's a tree
 */
export class TreeEntry extends BaseTreeEntry {
	/**
	 * Returns the tree of the tree entry
	 *
	 * @returns An instance of a tree
	 */
	public async tree(): Promise<Tree> {
		return new Tree(this._owner, await this.ng_tree_entry.getTree());
	}
}

/**
 * A representation of a tree entry that's a blob
 */
export class BlobTreeEntry extends BaseTreeEntry {
	/**
	 * Returns the blob of the blob tree entry
	 *
	 * @returns An instance of a blob
	 */
	public async blob(): Promise<Blob> {
		return new Blob(this);
	}
}

/**
 * A factory which creates a tree entry
 *
 * @param owner - The repository that the tree entry is in
 * @param entry - An instance of a Nodegit tree entry
 * @returns An instance of a tree entry
 */
export function createTreeEntry(owner: Repository, entry: NodeGitTreeEntry): BaseTreeEntry {
	return entry.isBlob()
		? new BlobTreeEntry(owner, entry)
		: new TreeEntry(owner, entry);
}
