import { Tree as NodeGitTree } from "nodegit";
import { Repository } from "./repository";
import { BaseTreeEntry, BlobTreeEntry, createTreeEntry, TreeEntry } from "./tree_entry";
import { createError, TreeError } from "./error";
import { pack, Pack } from "tar-stream";

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
	public entries(): BaseTreeEntry[] {
		return this._ng_tree.entries().map(entry => createTreeEntry(this._owner, entry));
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
				throw(createError(TreeError, 404, `Path '${path}' not found`));
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
	 * Returns an archive made from the tree
	 *
	 * @returns An instance of a tar pack
	 */
	async createArchive(): Promise<Pack> {
		const archive = pack();
		const repository = this._owner.name.short;

		async function addEntries(tree: Tree) {
			for(const tree_entry of tree.entries()) {
				if(tree_entry instanceof BlobTreeEntry) {
					archive.entry({ name: `${repository}/${tree_entry.path}` }, (await (await tree_entry.blob()).content()));
				}
				else if(tree_entry instanceof TreeEntry) {
					await addEntries(await tree_entry.tree());
				}
			}
		}

		await addEntries(this);

		archive.finalize();

		return archive;
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