import { Commit as NodeGitCommit, Oid as NodeGitOid } from "nodegit";
import { Author } from "api";
import { Diff } from "./diff";
import { Repository } from "./repository";
import { Tree } from "./tree";
import { createMessage, readKey, readSignature, verify } from "openpgp";
import { promisify } from "util";
import { exec } from "child_process";
import { findAsync } from "./misc";
import { ErrorWhere, createError, CommitNotSignedError, FailedError } from "./error";

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
	private _ng_commit: NodeGitCommit;

	constructor(ng_commit: NodeGitCommit) {
		this._ng_commit = ng_commit;
	}

	public get name(): string {
		return this._ng_commit.author().name();
	}

	public get email(): string {
		return this._ng_commit.author().email();
	}

	/**
	 * Returns the public key fingerprint of the commit's signer.
	 */
	public async fingerprint(): Promise<string> {
		const basic_signature = await this._ng_commit.getSignature().catch(() => {
			throw(createError(ErrorWhere.Commit, CommitNotSignedError));
		});

		const message = await createMessage({ text: basic_signature.signedData });

		const pub_keys_list = await pExec("gpg --list-public-keys");

		if(pub_keys_list.stderr) {
			throw(createError(ErrorWhere.Commit, FailedError, "get public keys from gpg!"));
		}

		const pub_keys = pub_keys_list.stdout
			.split("\n")
			.slice(2, -1)
			.join("\n")
			.split(/^\n/gm);

		// Find a public key that matches the signature
		const pub_key = await findAsync(pub_keys, async key => {
			// Make sure the UID is the same as the commit author
			const uid = key
				.split("\n")[2]
				.replace(/^uid\s*\[.*\]\s/, "");

			if(uid !== `${this.name} <${this.email}>`) {
				return false;
			}

			// Get the public key as an armored key
			const fingerprint = key.split("\n")[1].replace(/^\s*/, "");
			const key_export = await pExec(`gpg --armor --export ${fingerprint}`);

			if(key_export.stderr) {
				throw(createError(ErrorWhere.Commit, FailedError, "export a public key from gpg!"));
			}

			const signature = await readSignature({ armoredSignature: basic_signature.signature });

			const verification = await verify({
				message: message,
				verificationKeys: await readKey({ armoredKey: key_export.stdout }),
				expectSigned: true,
				signature: signature
			})
				.then(result => result.signatures[0].verified)
				.catch(() => Promise.resolve(false));

			return verification;
		});

		if(!pub_key) {
			throw(createError(ErrorWhere.Commit, FailedError, "find a public key matching the commit signature!"));
		}

		return pub_key
			.split("\n")[1]
			.replace(/^\s*/, "");
	}
}

/**
 * A representation of a commit
 */
export class Commit {
	private _ng_commit: NodeGitCommit;
	private _owner: Repository;

	public id: string;
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
		this.date = commit.time();
		this.message = commit.message();
	}

	/**
	 * Returns the commit's author
	 *
	 * @returns An instance of a commit author
	 */
	public author(): CommitAuthor {
		return new CommitAuthor(this._ng_commit);
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
	 * Returns whether or not the commit is signed
	 */
	public isSigned(): Promise<boolean> {
		return this._ng_commit.getSignature()
			.then(() => true)
			.catch(() => false);
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