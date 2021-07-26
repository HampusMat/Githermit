import { Tree as NodeGitTree } from "nodegit";
import { Repository } from "./repository";
import { BaseTreeEntry, createTreeEntry, TreeEntry } from "./tree_entry";
import { createError, TreeError } from "./error";

export class Tree {
	protected _owner: Repository;
	protected _ng_tree: NodeGitTree;

	public path: string;

	constructor(owner: Repository, tree: NodeGitTree) {
		this._owner = owner;
		this._ng_tree = tree;
		this.path = tree.path();
	}

	public entries(): TreeEntry[] {
		return this._ng_tree.entries().map(entry => new TreeEntry(this._owner, entry));
	}

	public async find(path: string): Promise<BaseTreeEntry> {
		const entry = await this._ng_tree.getEntry(path).catch(err => {
			if(err.errno === -3) {
				throw(createError(TreeError, 404, "Path not found"));
			}
			throw(createError(TreeError, 500, "Failed to get tree path"));
		});

		return createTreeEntry(this._owner, entry);
	}

	public findExists(path: string): Promise<boolean> {
		return this._ng_tree.getEntry(path)
			.then(() => true)
			.catch(() => false);
	}

	public static async ofRepository(owner: Repository): Promise<Tree> {
		const master_commit = await owner.masterCommit();
		return master_commit.tree();
	}
}