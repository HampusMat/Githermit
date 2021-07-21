import { TreeEntry as NodeGitTreeEntry } from "nodegit";
import { BlobError, createError } from "./error";

export class Blob {
	private _ng_tree_entry: NodeGitTreeEntry;

	constructor(entry: NodeGitTreeEntry) {
		this._ng_tree_entry = entry;
	}

	public async content(): Promise<string> {
		if(!this._ng_tree_entry.isBlob()) {
			throw(createError(BlobError, 500, "Not a blob"));
		}
		return this._ng_tree_entry.isBlob() ? (await this._ng_tree_entry.getBlob()).toString() : "";
	}
}