import { Tree as NodeGitTree } from "nodegit";
import { Repository } from "./repository";
import { BaseTreeEntry, createTreeEntry, TreeEntry } from "./tree_entry";
import { createError, TreeError } from "./error";

/**
 * A representation of a git tree
 */
export class Tree {
	protected _owner: Repository;
	protected _ng_tree: NodeGitTree;

	public path: string;

	/**
	 * @param owner The repository which the tree is in
	 * @param tree An instance of a Nodegit tree
	 */
	constructor(owner: Repository, tree: NodeGitTree) {
		this._owner = owner;
		this._ng_tree = tree;
		this.path = tree.path();
	}

	/**
	 * The tree's entries
	 *
	 * @returns An array of tree entry instances
	 */
	public entries(): TreeEntry[] {
		return this._ng_tree.entries().map(entry => new TreeEntry(this._owner, entry));
	}

	/**
	 * Returns the entry of a path
	 *
	 * @param path - The path of a blob or tree
	 * @returns An instance of an tree entry
	 */
	public async find(path: string): Promise<BaseTreeEntry> {
		const entry = await this._ng_tree.getEntry(path).catch(err => {
			if(err.errno === -3) {
				throw(createError(TreeError, 404, "Path not found"));
			}
			throw(createError(TreeError, 500, "Failed to get tree path"));
		});

		return createTreeEntry(this._owner, entry);
	}

	/**
	 * Returns if a path exists or not
	 *
	 * @param path - The path to look for
	 * @returns Whether or not there exists an entry for the path
	 */
	public findExists(path: string): Promise<boolean> {
		return this._ng_tree.getEntry(path)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Returns the tree of a repository
	 *
	 * @remarks
	 *
	 * Assumes that you want to use the master branch.
	 * This will be fixed in the future.
	 *
	 * @param owner The repository which the tree is in
	 * @returns An instance of a tree
	 */
	public static async ofRepository(owner: Repository): Promise<Tree> {
		const master_commit = await owner.masterCommit();
		return master_commit.tree();
	}
}