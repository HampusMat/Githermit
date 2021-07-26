import { Object as NodeGitObject, Oid as NodeGitOid, Repository as NodeGitRepository, Revwalk as NodeGitRevwalk } from "nodegit";
import { Request, connect } from "./http";
import { basename, dirname } from "path";
import { getDirectory, getFile } from "./misc";
import { Branch } from "./branch";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Tag } from "./tag";
import { Tree } from "./tree";
import { BranchError, createError, RepositoryError } from "./error";
import { isNodeGitReferenceBranch, isNodeGitReferenceTag, Reference } from "./reference";

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

// This fucking shit isn't in the Nodegit documentation.
interface WeirdNodeGitError extends Error {
	errno: number;
	errorFunction: string;
}

/**
 * A representation of an bare git repository
 */
export class Repository {
	private _ng_repository: NodeGitRepository;

	private _branch: string;

	public name: RepositoryName;
	public base_dir: string;

	/**
	 * @param repository - An instance of a Nodegit repository
	 * @param branch - The branch to use
	 */
	constructor(repository: NodeGitRepository, branch: string) {
		this._ng_repository = repository;
		this.name = {
			short: basename(repository.path()).slice(0, -4),
			full: basename(repository.path())
		};
		this.base_dir = dirname(repository.path());

		this._branch = branch;
	}

	/**
	 * Returns the repository's description
	 */
	public description(): Promise<string> {
		return getFile(this.base_dir, this.name.full, "description");
	}

	/**
	 * Returns the repository's owner
	 */
	public owner(): Promise<string> {
		return getFile(this.base_dir, this.name.full, "owner");
	}

	/**
	 * Returns the repository's branch
	 *
	 * @returns An instance of a branch
	 */
	public branch(): Promise<Branch> {
		return Branch.lookup(this, this._branch);
	}

	/**
	 * Returns the repository's commits
	 *
	 * @returns An array of commit instances
	 */
	public async commits(): Promise<Commit[]> {
		const walker = NodeGitRevwalk.create(this._ng_repository);
		walker.pushHead();

		return Promise.all((await walker.getCommitsUntil(() => true)).map(commit => new Commit(this, commit)));
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
		return NodeGitObject.lookup(this._ng_repository, NodeGitOid.fromString(id), NodeGitObject.TYPE.ANY)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Returns the repository's branches
	 *
	 * @returns An array of branch instances
	 */
	public branches(): Promise<Branch[]> {
		return Reference.all(this, Branch, isNodeGitReferenceBranch);
	}

	/**
	 * Returns the repository's tags
	 *
	 * @returns An array of tag instances
	 */
	public async tags(): Promise<Tag[]> {
		return Reference.all(this, Tag, isNodeGitReferenceTag);
	}

	/**
	 * Returns the repository's master commit
	 *
	 * @returns An instance of a commit
	 */
	public async masterCommit(): Promise<Commit> {
		return Commit.masterCommit(this);
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

	public get nodegitRepository(): NodeGitRepository {
		return this._ng_repository;
	}

	/**
	 * Opens a bare git repository
	 *
	 * @param base_dir - The directory that contains the repository
	 * @param repository - The directory of a bare repository
	 * @param branch - A branch to use
	 * @returns An instance of a git repository
	 */
	public static async open(base_dir: string, repository: string, branch?: string): Promise<Repository> {
		let ng_repository = await NodeGitRepository.openBare(`${base_dir}/${getFullRepositoryName(repository)}`).catch((err: WeirdNodeGitError) => {
			if(err.errno === -3) {
				throw(createError(RepositoryError, 404, "Repository not found"));
			}

			throw(createError(RepositoryError, 500, "Unknown error"));
		});

		if(branch) {
			if(!await Branch.lookupExists(ng_repository, branch)) {
				throw(createError(BranchError, 404, "Branch not found!"));
			}
		}

		return new Repository(ng_repository, branch || "master");
	}

	/**
	 * Opens all of the git repositories inside a directory
	 *
	 * @param base_dir - The directory that contains the repositories
	 * @returns An array of repository instances
	 */
	public static async openAll(base_dir: string): Promise<Repository[] | null> {
		const dir_content = await getDirectory(base_dir);

		if(dir_content.length === 0) {
			return null;
		}

		const repositories = dir_content.filter(dir_entry => dir_entry.endsWith(".git"));

		return Promise.all(repositories.map(repository => this.open(base_dir, repository)));
	}
}