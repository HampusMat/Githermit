import { Commit as NodeGitCommit, Oid as NodeGitOid } from "nodegit";
import { Author } from "./misc";
import { Diff } from "./diff";
import { Repository } from "./repository";
import { Tree } from "./tree";

export type CommitSummary = {
	id: string | null,
	message: string | null,
	date: number | null
}

type DiffStats = {
	insertions: number,
	deletions: number,
	files_changed: number
}

export class Commit {
	private _ng_commit: NodeGitCommit;
	private _owner: Repository;

	public id: string;
	public author: Author;
	public date: number;
	public message: string;

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

	async diff(): Promise<Diff> {
		return Diff.get((await this._ng_commit.getDiff())[0]);
	}

	async stats(): Promise<DiffStats> {
		const stats = await (await this._ng_commit.getDiff())[0].getStats();

		return {
			insertions: <number>stats.insertions(),
			deletions: <number>stats.deletions(),
			files_changed: <number>stats.filesChanged()
		};
	}

	async tree(): Promise<Tree> {
		return new Tree(this._owner, await this._ng_commit.getTree());
	}

	static async lookup(repository: Repository, id: string | NodeGitOid): Promise<Commit> {
		const commit = await NodeGitCommit.lookup(repository.nodegitRepository, id instanceof NodeGitOid ? id : NodeGitOid.fromString(id));
		return new Commit(repository, commit);
	}

	static lookupExists(repository: Repository, id: string): Promise<boolean> {
		return NodeGitCommit.lookup(repository.nodegitRepository, NodeGitOid.fromString(id))
			.then(() => true)
			.catch(() => false);
	}
}