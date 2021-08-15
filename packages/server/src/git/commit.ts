import { Commit as NodeGitCommit, Oid as NodeGitOid } from "nodegit";
import { Author } from "api";
import { Diff } from "./diff";
import { Repository } from "./repository";
import { Tree } from "./tree";
import { promisify } from "util";
import { exec, ExecException } from "child_process";
import { ErrorWhere, createError, CommitNotSignedError, FailedError, NotInKeyringError } from "./error";
import { createMessage, readKey, readSignature, verify } from "openpgp";

const pExec = promisify(exec);

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
 * A author of a commit
 */
export class CommitAuthor implements Author {
	private _commit;

	constructor(commit: Commit) {
		this._commit = commit;
	}

	public get name(): string {
		return this._commit.ng_commit.author().name();
	}

	public get email(): string {
		return this._commit.ng_commit.author().email();
	}

	/**
	 * Returns the public key fingerprint of the commit's signer.
	 */
	public async fingerprint(): Promise<string> {
		if(!await this._commit.isSigned()) {
			throw(createError(ErrorWhere.Commit, CommitNotSignedError));
		}

		const key = await pExec(`gpg --list-public-keys ${this.email}`).catch((err: ExecException) => {
			return {
				stdout: null,
				stderr: err.message.split("\n")[1]
			};
		});

		if(key.stderr || !key.stdout) {
			if(/^gpg: error reading key: No public key\n?/.test(key.stderr)) {
				throw(createError(ErrorWhere.Commit, NotInKeyringError, this.email));
			}

			throw(createError(ErrorWhere.Commit, FailedError, `receive pgp key for '${this.email}'`));
		}

		return key.stdout
			.split("\n")[1]
			.replace(/^\s*/, "");
	}
}

/**
 * A representation of a commit
 */
export class Commit {
	private _owner: Repository;

	public ng_commit: NodeGitCommit;

	public id: string;
	public date: number;
	public message: string;

	/**
	 * @param owner - The repository which the commit is in
	 * @param commit - An instance of a Nodegit commit
	 */
	constructor(owner: Repository, commit: NodeGitCommit) {
		this.ng_commit = commit;
		this._owner = owner;
		this.id = commit.sha();
		this.date = commit.time();
		this.message = commit.message();
	}

	/**
	 * Returns the commit's author
	 *
	 * @returns An instance of a commit author
	 */
	public author(): CommitAuthor {
		return new CommitAuthor(this);
	}

	/**
	 * Returns the commit's diff
	 *
	 * @returns An instance of a diff
	 */
	public async diff(): Promise<Diff> {
		return new Diff((await this.ng_commit.getDiff())[0]);
	}

	/**
	 * Returns the commit's stats
	 *
	 * @returns A diff stats instance
	 */
	public async stats(): Promise<DiffStats> {
		const stats = await (await this.ng_commit.getDiff())[0].getStats();

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
		return new Tree(this._owner, await this.ng_commit.getTree());
	}

	/**
	 * Returns whether or not the commit is signed
	 */
	public isSigned(): Promise<boolean> {
		return this.ng_commit.getSignature()
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Verify the commit's pgp signature
	 *
	 * @returns Whether or not the signature is valid
	 */
	public async verifySignature(): Promise<boolean> {
		const fingerprint = await this.author().fingerprint();

		const pub_key = await pExec(`gpg --armor --export ${fingerprint}`).catch((err: ExecException) => {
			return {
				stdout: null,
				stderr: err.message
			};
		});

		if(pub_key.stderr || !pub_key.stdout) {
			throw(createError(ErrorWhere.Commit, FailedError, "export a public key from gpg!"));
		}

		const pgp_signature = await this.ng_commit.getSignature();

		return await verify({
			message: await createMessage({ text: pgp_signature.signedData }),
			verificationKeys: await readKey({ armoredKey: pub_key.stdout }),
			expectSigned: true,
			signature: await readSignature({ armoredSignature: pgp_signature.signature })
		})
			.then(result => result.signatures[0].verified)
			.catch(() => Promise.resolve(false));
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
	 * Returns the most recent commit of the repository's branch
	 *
	 * @param owner - A repository
	 * @returns An instance of a commit
	 */
	public static async branchCommit(owner: Repository): Promise<Commit> {
		return new Commit(owner, await owner.ng_repository.getBranchCommit(owner.branch_name));
	}
}