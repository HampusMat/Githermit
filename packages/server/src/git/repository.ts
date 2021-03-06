import { Object as NodeGitObject, Oid as NodeGitOid, Repository as NodeGitRepository } from "nodegit";
import { Request, connect } from "./http";
import { basename, dirname } from "path";
import { getDirectory, getFile } from "./misc";
import { Branch } from "./branch";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Tag } from "./tag";
import { Tree } from "./tree";
import { createError, ErrorWhere, NotFoundError, UnknownError } from "./error";

/**
 * Returns the full name of a git repository
 *
 * @param repo_name - The name of a repository
 * @returns The repository name ending with .git
 */
function getFullRepositoryName(repo_name: string) {
	return repo_name.endsWith(".git") ? repo_name : `${repo_name}.git`;
}

type RepositoryName = {
	short: string,
	full: string,
}

// I have no idea what this sort of error is from
interface WeirdError extends Error {
	errno: number;
	errorFunction: string;
}

/**
 * A representation of an bare git repository
 */
export class Repository {
	public ng_repository: NodeGitRepository;

	public name: RepositoryName;
	public git_dir: string;
	private _branch: string;

	/**
	 * @param repository - An instance of a Nodegit repository
	 * @param branch - The branch to use
	 */
	constructor(repository: NodeGitRepository, branch: string) {
		this.ng_repository = repository;
		this.name = {
			short: basename(repository.path()).slice(0, -4),
			full: basename(repository.path())
		};
		this.git_dir = dirname(repository.path());

		this._branch = branch;
	}

	/**
	 * Returns the repository's description
	 */
	public description(): Promise<string> {
		return getFile(this.git_dir, this.name.full, "description");
	}

	/**
	 * Returns the repository's owner
	 */
	public owner(): Promise<string> {
		return getFile(this.git_dir, this.name.full, "owner");
	}

	get branch(): string {
		return this._branch;
	}

	set branch(branch: string) {
		this._branch = branch;
	}

	/**
	 * Returns the repository's branch
	 *
	 * @returns An instance of a branch
	 */
	public getBranch(): Promise<Branch> {
		return Branch.lookup(this, this._branch);
	}

	/**
	 * Returns the repository's commits
	 *
	 * @param [amount=20] - The number of commits to get or whether or not to get all commits
	 * @returns An array of commit instances
	 */
	public async commits(amount?: number | boolean): Promise<Commit[]> {
		return Commit.getMultiple(this, amount);
	}

	/**
	 * Returns the repository's head commit
	 *
	 * @returns An instance of a commit
	 */
	public async head(): Promise<Commit> {
		return Commit.branchCommit(this);
	}

	/**
	 * Returns the repository's tree
	 *
	 * @returns An instance of a tree
	 */
	public async tree(): Promise<Tree> {
		return Tree.ofRepository(this);
	}

	/**
	 * Returns if an git object exists or not
	 *
	 * @param id - The SHA of a git object
	 * @returns Whether or not it exists
	 */
	public lookupExists(id: string): Promise<boolean> {
		return NodeGitObject.lookup(this.ng_repository, NodeGitOid.fromString(id), NodeGitObject.TYPE.ANY)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Returns this repository instance with a different branch
	 *
	 * @param branch - The branch to switch to
	 * @returns An instance of a repository
	 */
	public async withBranch(branch: string): Promise<Repository> {
		if(!await Branch.lookupExists(this.ng_repository, branch)) {
			throw(createError(ErrorWhere.Repository, NotFoundError, "branch"));
		}

		return new Repository(this.ng_repository, branch);
	}

	/**
	 * Returns the repository's branches
	 *
	 * @returns An array of branch instances
	 */
	public async branches(): Promise<Branch[]> {
		return Branch.getAll(this);
	}

	/**
	 * Returns the repository's tags
	 *
	 * @returns An array of tag instances
	 */
	public async tags(): Promise<Tag[]> {
		return Tag.getAll(this);
	}

	/**
	 * Connect to the Git HTTP backend
	 *
	 * @param req - A Fastify request
	 * @param reply - A Fastify reply
	 */
	public HTTPconnect(req: Request, reply: FastifyReply): void {
		connect(this, req, reply);
	}

	/**
	 * Opens a bare git repository
	 *
	 * @param git_dir - The directory that contains the repository
	 * @param repository - The directory of a bare repository
	 * @param branch - A branch to use
	 * @returns An instance of a git repository
	 */
	public static async open(git_dir: string, repository: string, branch?: string): Promise<Repository> {
		let ng_repository = await NodeGitRepository.openBare(`${git_dir}/${getFullRepositoryName(repository)}`).catch((err: WeirdError) => {
			if(err.errno === -3) {
				throw(createError(ErrorWhere.Repository, NotFoundError, "repository"));
			}

			throw(createError(ErrorWhere.Repository, UnknownError));
		});

		if(branch) {
			if(!await Branch.lookupExists(ng_repository, branch)) {
				throw(createError(ErrorWhere.Repository, NotFoundError, "branch"));
			}
		}

		return new Repository(ng_repository, branch || "master");
	}

	/**
	 * Opens all of the git repositories inside a directory
	 *
	 * @param git_dir - The directory that contains the repositories
	 * @returns An array of repository instances
	 */
	public static async openAll(git_dir: string): Promise<Repository[]> {
		const dir_content = await getDirectory(git_dir);

		if(dir_content.length === 0) {
			return [];
		}

		const repositories = dir_content.filter(dir_entry => dir_entry.endsWith(".git"));

		return Promise.all(repositories.map(repository => this.open(git_dir, repository)));
	}
}