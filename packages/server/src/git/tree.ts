import { Blob } from "./blob";
import { Tree as NodeGitTree } from "nodegit";
import { Repository } from "./repository";
import { TreeEntry } from "./tree_entry";

export class Tree {
	private _ng_tree: NodeGitTree;
	private _owner: Repository;

	constructor(owner: Repository, tree: NodeGitTree) {
		this._ng_tree = tree;
		this._owner = owner;
	}

	public entries(): TreeEntry[] {
		return this._ng_tree.entries().map(entry => new TreeEntry(this._owner, entry));
	}

	public async find(path: string): Promise<Blob | Tree | null> {
		const entry = await this._ng_tree.getEntry(path).catch(err => {
			if(err.errno === -3) {
				return null;
			}
			throw(err);
		});

		if(!entry) {
			return null;
		}

		return entry.isBlob() ? new Blob(entry) : new Tree(this._owner, await entry.getTree());
	}

	public findExists(path: string): Promise<boolean> {
		return this._ng_tree.getEntry(path)
			.then(() => true)
			.catch(() => false);
	}
}