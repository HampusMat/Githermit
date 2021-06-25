import { Object as NodeGitObject, Oid as NodeGitOid, Repository as NodeGitRepository, Revwalk as NodeGitRevwalk } from "nodegit";
import { Request, connect } from "./http";
import { basename, dirname } from "path";
import { getDirectory, getFile } from "./misc";
import { Branch } from "./branch";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Tag } from "./tag";
import { Tree } from "./tree";

function getFullRepositoryName(repo_name: string) {
	return repo_name.endsWith(".git") ? repo_name : `${repo_name}.git`;
}

type RepositoryName = {
	short: string,
	full: string,
}

type RepositoryConstructorData = {
	description: string | null,
	owner: string | null
}

export class Repository {
	private _ng_repository: NodeGitRepository;

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
	}

	public async commits(): Promise<Commit[]> {
		const walker = NodeGitRevwalk.create(this._ng_repository);
		walker.pushHead();

		return Promise.all((await walker.getCommitsUntil(() => true)).map(commit => new Commit(this, commit)));
	}

	public async tree(): Promise<Tree> {
		const master_commit = await this._ng_repository.getMasterCommit();
		const tree = await master_commit.getTree();
		return new Tree(this, tree);
	}

	public lookupExists(id: string): Promise<boolean> {
		return NodeGitObject.lookup(this._ng_repository, NodeGitOid.fromString(id), NodeGitObject.TYPE.ANY)
			.then(() => true)
			.catch(() => false);
	}

	public async branches(): Promise<Branch[]> {
		const references = await this._ng_repository.getReferences();
		return references.filter(ref => ref.isBranch()).map(branch => new Branch(this, branch));
	}

	public async tags(): Promise<Tag[]> {
		const references = await this._ng_repository.getReferences();
		return references.filter(ref => ref.isTag()).map(tag => new Tag(this, tag));
	}

	public async latestCommit(): Promise<Commit> {
		return new Commit(this, await this._ng_repository.getMasterCommit());
	}

	public HTTPconnect(req: Request, reply: FastifyReply): void {
		connect(this, req, reply);
	}

	public get nodegitRepository(): NodeGitRepository {
		return this._ng_repository;
	}

	public static async open(base_dir: string, repository: string): Promise<Repository> {
		const ng_repository = await NodeGitRepository.openBare(`${base_dir}/${getFullRepositoryName(repository)}`);

		return new Repository(ng_repository, {
			description: await getFile(base_dir, getFullRepositoryName(repository), "description"),
			owner: await getFile(base_dir, getFullRepositoryName(repository), "owner")
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