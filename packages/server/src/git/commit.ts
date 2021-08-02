import { Commit as NodeGitCommit, Oid as NodeGitOid } from "nodegit";
import { Author } from "api";
import { Diff } from "./diff";
import { Repository } from "./repository";
import { Tree } from "./tree";

export type CommitSummary = {
	id: string,
	message: string,
	date: number
}

type DiffStats = {
	insertions: number,
	deletions: number,
	files_changed: number
}

/**
 * A representation of a commit
 */
export class Commit {
	private _ng_commit: NodeGitCommit;
	private _owner: Repository;

	public id: string;
	public author: Author;
	public date: number;
	public message: string;

	/**
	 * @param owner - The repository which the commit is in
	 * @param commit - An instance of a Nodegit commit
	 */
	constructor(owner: Repository, commit: NodeGitCommit) {
		this._ng_commit = commit;
		this._owner = owner;

		this.id = commit.sha();
		this.author = {
			name: commit.author().name(),
			email: commit.author().email()
		};
		this.date = commit.time();
		this.message = commit.message();
	}

	/**
	 * Returns the commit's diff
	 *
	 * @returns An instance of a diff
	 */
	public async diff(): Promise<Diff> {
		return new Diff((await this._ng_commit.getDiff())[0]);
	}

	/**
	 * Returns the commit's stats
	 *
	 * @returns A diff stats instance
	 */
	public async stats(): Promise<DiffStats> {
		const stats = await (await this._ng_commit.getDiff())[0].getStats();

		return {
			insertions: <number>stats.insertions(),
			deletions: <number>stats.deletions(),
			files_changed: <number>stats.filesChanged()
		};
	}

	/**
	 * Returns the commit's tree
	 *
	 * @returns An instance of a tree
	 */
	public async tree(): Promise<Tree> {
		return new Tree(this._owner, await this._ng_commit.getTree());
	}

	/**
	 * Lookup a commit
	 *
	 * @param repository - The repository which the commit is in
	 * @param id - The SHA of a commit
	 * @returns An instance of a commit
	 */
	public static async lookup(repository: Repository, id: string | NodeGitOid): Promise<Commit> {
		const commit = await NodeGitCommit.lookup(repository.ng_repository, id instanceof NodeGitOid ? id : NodeGitOid.fromString(id));
		return new Commit(repository, commit);
	}

	/**
	 * Returns if an commit exists or not
	 *
	 * @param repository - The repository which the commit is in
	 * @param id - The sha of a commit
	 * @returns Whether or not the commit exists
	 */
	public static lookupExists(repository: Repository, id: string): Promise<boolean> {
		return NodeGitCommit.lookup(repository.ng_repository, NodeGitOid.fromString(id))
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Returns the master commit of a repository
	 *
	 * @param owner - A repository
	 * @returns An instance of a commit
	 */
	public static async masterCommit(owner: Repository): Promise<Commit> {
		return new Commit(owner, await owner.ng_repository.getMasterCommit());
	}
}