import { BlobError, createError } from "./error";
import { Tree } from "./tree";
import { BlobTreeEntry } from "./tree_entry";

export class Blob {
	private _tree_entry: BlobTreeEntry;

	public path;

	constructor(entry: BlobTreeEntry, path: string) {
		this._tree_entry = entry;

		this.path = path;
	}

	public async content(): Promise<string> {
		return this._tree_entry.content();
	}

	public static async fromPath(tree: Tree, path: string): Promise<Blob> {
		const entry = await tree.find(path);

		if(!(entry instanceof BlobTreeEntry)) {
			throw(createError(BlobError, 500, "Not a blob"));
		}

		return new Blob(entry, path);
	}
}