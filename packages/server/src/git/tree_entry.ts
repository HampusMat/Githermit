import { Commit } from "./commit";
import { Revwalk as NodeGitRevwalk, TreeEntry as NodeGitTreeEntry } from "nodegit";
import { Repository } from "./repository";
import { dirname } from "path";
import { findAsync } from "./misc";
import { Tree } from "./tree";
import { Blob } from "./blob";
import { createError, TreeError } from "./error";

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
		rev_walk.pushRef(`refs/heads/${(await this._owner.branch()).name}`);

		const commits = await rev_walk.getCommitsUntil(() => true);

		const latest_commit = await findAsync(commits, async commit => {
			const diff = await commit.getDiff();
			const patches = await diff[0].patches();

			return Boolean(this instanceof TreeEntry
				? patches.find(patch => dirname(patch.newFile().path()).startsWith(this.path))
				: patches.find(patch => patch.newFile().path() === this.path));
		});

		if(!latest_commit) {
			throw(createError(TreeError, 500, `Failed to get the latest commit of tree entry '${this.path}'!`));
		}

		return new Commit(this._owner, latest_commit);
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