import { Commit } from "./commit";
import { TreeEntry as NodeGitTreeEntry } from "nodegit";
import { Repository } from "./repository";
import { dirname } from "path";
import { findAsync } from "./misc";
import { Tree } from "./tree";

/**
 * The core structure of a tree entry
 */
export abstract class BaseTreeEntry {
	protected _ng_tree_entry: NodeGitTreeEntry;
	protected _owner: Repository;

	public path: string;

	/**
	 * @param owner - The repository which the tree entry is in
	 * @param entry - An instance of a Nodegit tree entry
	 */
	constructor(owner: Repository, entry: NodeGitTreeEntry) {
		this._ng_tree_entry = entry;
		this._owner = owner;

		this.path = entry.path();
	}

	/**
	 * Returns the tree entry's latest commit
	 *
	 * @returns An instance of a commit
	 */
	public async latestCommit(): Promise<Commit> {
		const commits = await this._owner.commits();

		return findAsync(commits, async commit => {
			const diff = await commit.diff();
			const patches = await diff.patches();

			return Boolean(this instanceof TreeEntry
				? patches.find(patch => patch.to === this.path)
				: patches.find(patch => dirname(patch.to).startsWith(this.path)));
		});
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
		return new Tree(this._owner, await this._ng_tree_entry.getTree());
	}
}

/**
 * A representation of a tree entry that's a blob
 */
export class BlobTreeEntry extends BaseTreeEntry {
	/**
	 * Returns the blob's content
	 */
	public async content(): Promise<string> {
		return (await this._ng_tree_entry.getBlob()).toString();
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