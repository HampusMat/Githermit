import { Object as NodeGitObject, Oid as NodeGitOid, Repository as NodeGitRepository, Revwalk as NodeGitRevwalk } from "nodegit";
import { Request, connect } from "./http";
import { basename, dirname } from "path";
import { getDirectory, getFile } from "./misc";
import { Branch } from "./branch";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Tag } from "./tag";
import { Tree } from "./tree";
import { BaseError, BranchError, createError, RepositoryError } from "./error";
import { isNodeGitReferenceBranch, isNodeGitReferenceTag, Reference } from "./reference";

function getFullRepositoryName(repo_name: string) {
	return repo_name.endsWith(".git") ? repo_name : `${repo_name}.git`;
}

type RepositoryName = {
	short: string,
	full: string,
}

type RepositoryConstructorData = {
	description: string | null,
	owner: string | null,
	branch: string
}

// This fucking shit isn't in the Nodegit documentation.
interface WeirdNodeGitError extends Error {
	errno: number;
	errorFunction: string;
}

export class Repository {
	private _ng_repository: NodeGitRepository;

	private _branch: string;

	public name: RepositoryName;
	public base_dir: string;
	public description: string | null;
	public owner: string | null;

	constructor(repository: NodeGitRepository, data: RepositoryConstructorData) {
		this._ng_repository = repository;
		this.name = {
			short: basename(repository.path()).slice(0, -4),
			full: basename(repository.path())
		};
		this.base_dir = dirname(repository.path());
		this.description = data.description;
		this.owner = data.owner;

		this._branch = data.branch;
	}

	public branch(): Promise<Branch> {
		return Branch.lookup(this, this._branch);
	}

	public async commits(): Promise<Commit[]> {
		const walker = NodeGitRevwalk.create(this._ng_repository);
		walker.pushHead();

		return Promise.all((await walker.getCommitsUntil(() => true)).map(commit => new Commit(this, commit)));
	}

	public async tree(): Promise<Tree> {
		return Tree.ofRepository(this);
	}

	public lookupExists(id: string): Promise<boolean> {
		return NodeGitObject.lookup(this._ng_repository, NodeGitOid.fromString(id), NodeGitObject.TYPE.ANY)
			.then(() => true)
			.catch(() => false);
	}

	public branches(): Promise<Branch[]> {
		return Reference.all(this, Branch, isNodeGitReferenceBranch);
	}

	public async tags(): Promise<Tag[]> {
		return Reference.all(this, Tag, isNodeGitReferenceTag);
	}

	public async masterCommit(): Promise<Commit> {
		return Commit.masterCommit(this);
	}

	public HTTPconnect(req: Request, reply: FastifyReply): void {
		connect(this, req, reply);
	}

	public get nodegitRepository(): NodeGitRepository {
		return this._ng_repository;
	}

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

		const owner = await getFile(base_dir, getFullRepositoryName(repository), "owner").catch(err => err);

		return new Repository(ng_repository, {
			description: await getFile(base_dir, getFullRepositoryName(repository), "description"),
			owner: owner instanceof BaseError ? null : owner,
			branch: branch || "master"
		});
	}

	public static async openAll(base_dir: string): Promise<Repository[] | null> {
		const dir_content = await getDirectory(base_dir);

		if(dir_content.length === 0) {
			return null;
		}

		const repositories = dir_content.filter(dir_entry => dir_entry.endsWith(".git"));

		return Promise.all(repositories.map(repository => this.open(base_dir, repository)));
	}
}