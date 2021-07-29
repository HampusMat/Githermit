import { BlobError, createError } from "./error";
import { Tree } from "./tree";
import { BlobTreeEntry } from "./tree_entry";

/**
 * A representation of a blob
 */
export class Blob {
	private _tree_entry: BlobTreeEntry;

	public path;

	/**
	 * @param entry - A tree entry that's a blob
	 */
	constructor(entry: BlobTreeEntry) {
		this._tree_entry = entry;

		this.path = entry.path;
	}

	/**
	 * Returns the blob's content
	 */
	public async content(): Promise<string> {
		return (await this._tree_entry.ng_tree_entry.getBlob()).content().toString();
	}

	/**
	 * Returns a blob from a path in a tree
	 *
	 * @param tree - The tree to look in
	 * @param path - A path to a blob
	 * @returns An instance of a blob
	 */
	public static async fromPath(tree: Tree, path: string): Promise<Blob> {
		const entry = await tree.find(path);

		if(!(entry instanceof BlobTreeEntry)) {
			throw(createError(BlobError, 500, "Not a blob"));
		}

		return new Blob(entry);
	}
}