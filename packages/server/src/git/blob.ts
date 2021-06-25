import { TreeEntry as NodeGitTreeEntry } from "nodegit";

export class Blob {
	private _ng_tree_entry: NodeGitTreeEntry;

	constructor(entry: NodeGitTreeEntry) {
		this._ng_tree_entry = entry;
	}

	public async content(): Promise<string> {
		return this._ng_tree_entry.isBlob() ? (await this._ng_tree_entry.getBlob()).toString() : "";
	}
}