import { Blob } from "./blob";
import { Commit } from "./commit";
import { TreeEntry as NodeGitTreeEntry } from "nodegit";
import { Repository } from "./repository";
import { Tree } from "./tree";
import { dirname } from "path";
import { findAsync } from "./misc";

export class TreeEntry {
	private _ng_tree_entry: NodeGitTreeEntry;
	private _owner: Repository;

	public path: string;
	public type: "blob" | "tree";

	constructor(owner: Repository, entry: NodeGitTreeEntry) {
		this._ng_tree_entry = entry;
		this._owner = owner;

		this.path = entry.path();
		this.type = entry.isBlob() ? "blob" : "tree";
	}

	public async latestCommit(): Promise<Commit> {
		const commits = await this._owner.commits();

		return findAsync(commits, async commit => {
			const diff = await commit.diff();
			const patches = await diff.patches();

			return Boolean(this.type === "blob"
				? patches.find(patch => patch.to === this.path)
				: patches.find(patch => dirname(patch.to).startsWith(this.path)));
		});
	}

	public async peel(): Promise<Blob | Tree> {
		return this.type === "blob" ? new Blob(this._ng_tree_entry) : new Tree(this._owner, await this._ng_tree_entry.getTree());
	}
}