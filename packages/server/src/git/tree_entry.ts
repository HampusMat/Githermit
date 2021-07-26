import { Commit } from "./commit";
import { TreeEntry as NodeGitTreeEntry } from "nodegit";
import { Repository } from "./repository";
import { dirname } from "path";
import { findAsync } from "./misc";
import { Tree } from "./tree";

export abstract class BaseTreeEntry {
	protected _ng_tree_entry: NodeGitTreeEntry;
	protected _owner: Repository;

	public path: string;

	constructor(owner: Repository, entry: NodeGitTreeEntry) {
		this._ng_tree_entry = entry;
		this._owner = owner;

		this.path = entry.path();
	}

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

export class TreeEntry extends BaseTreeEntry {
	public async tree(): Promise<Tree> {
		return new Tree(this._owner, await this._ng_tree_entry.getTree());
	}
}

export class BlobTreeEntry extends BaseTreeEntry {
	public async content(): Promise<string> {
		return (await this._ng_tree_entry.getBlob()).toString();
	}
}

export function createTreeEntry(owner: Repository, entry: NodeGitTreeEntry): BaseTreeEntry {
	return entry.isBlob()
		? new BlobTreeEntry(owner, entry)
		: new TreeEntry(owner, entry);
}