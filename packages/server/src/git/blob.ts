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
	 * @param path - A path
	 */
	constructor(entry: BlobTreeEntry, path: string) {
		this._tree_entry = entry;

		this.path = path;
	}

	/**
	 * Returns the blob's content
	 */
	public async content(): Promise<string> {
		return this._tree_entry.content();
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

		return new Blob(entry, path);
	}
}