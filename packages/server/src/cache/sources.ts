import {
	LogCommit,
	Commit as APICommit,
	Tag as APITag,
	RepositorySummary,
	Repository as APIRepository,
	BranchSummary,
	Branch as APIBranch
} from "api";
import { getBranch, getBranches, getCommit, getLogCommits, getRepositories, getRepository, getTags } from "../routes/api/v1/data";
import { Branch, Commit, Repository, Tag } from "../git";
import { ServerCache } from ".";

/**
 * Holds information about a cache key
 *
 * @abstract
 */
export abstract class CacheSource {
	private _key?: string;

	/**
	 * @param [key] - The name of the cache key
	 */
	constructor(key?: string) {
		this._key = key;
	}

	/**
	 * Returns the full cache key name
	 */
	public key(): string {
		return `repositories${this._key || ""}`;
	}

	/**
	 * Returns fresh data
	 */
	public abstract func(): Promise<unknown> | unknown;

	/**
	 * Returns the input but modified
	 * @param [input] - Variable to modify
	 */
	public abstract post?(input: unknown): unknown;
}

/**
 * Cache source for log commits
 *
 * @extends CacheSource
 */
export class LogCommitsSource extends CacheSource {
	private _count: number;
	private _repository: Repository;

	/**
	 * @param repository - An instance of a repository
	 * @param [count] - The number of commits to return
	 */
	constructor(repository: Repository, count = 20) {
		super(`_${repository.name.short}_${repository.branch}_commits`);

		this._repository = repository;
		this._count = count;
	}

	/**
	 * @returns An array of log commits
	 */
	public readonly func = async(): Promise<LogCommit[]> => getLogCommits(await this._repository.commits(true));

	/**
	 * @param commits - An array of log commits
	 * @returns A modified array of log commits
	 */
	public readonly post = (commits: LogCommit[]): LogCommit[] => commits.slice(0, this._count);
}

/**
 * Cache source for a commit
 *
 * @extends CacheSource
 */
export class CommitSource extends CacheSource {
	private _commit: Commit;

	/**
	 * @param repository - An instance of a repository
	 * @param commit - An instance of a commit
	 */
	constructor(repository: Repository, commit: Commit) {
		super(`_${repository.name.short}_${repository.branch}_commits_${commit.id}`);

		this._commit = commit;
	}

	/**
	 * @returns An array of API commits
	 */
	public readonly func = (): Promise<APICommit> => getCommit(this._commit);

	public readonly post = undefined;
}

/**
 * Cache source for tags
 *
 * @extends CacheSource
 */
export class TagsSource extends CacheSource {
	private _tags: Tag[];

	/**
	 * @param repository - An instance of a repository
	 * @param tags - An array of tag instances
	 */
	constructor(repository: Repository, tags: Tag[]) {
		super(`_${repository.name.short}_tags`);

		this._tags = tags;
	}

	/**
	 * @returns An array of API tags
	 */
	public readonly func = (): Promise<APITag[]> => getTags(this._tags);

	public readonly post = undefined;
}

/**
 * Cache source for repositories
 *
 * @extends CacheSource
 */
export class RepositoriesSource extends CacheSource {
	private _repositories: Repository[];

	/**
	 * @param repositories An array of repository instances
	 */
	constructor(repositories: Repository[]) {
		super();

		this._repositories = repositories;
	}

	/**
	 * @returns An array of repository summaries
	 */
	public readonly func = (): Promise<RepositorySummary[]> => getRepositories(this._repositories);

	public readonly post = undefined;
}

/**
 * Cache source for a repository
 *
 * @extends CacheSource
 */
export class RepositorySource extends CacheSource {
	private _repository: Repository;

	/**
	 * @param repository - An instance of a repository
	 */
	constructor(repository: Repository) {
		super(`_${repository.name.short}`);

		this._repository = repository;
	}

	/**
	 * @returns A API repository
	 */
	public readonly func = (): Promise<APIRepository> => getRepository(this._repository);

	public readonly post = undefined;
}

/**
 * Cache source for branches
 *
 * @extends CacheSource
 */
export class BranchesSource extends CacheSource {
	private _branches: Branch[];

	/**
	 * @param repository - An instance of a repository
	 * @param branches - An array of branch instances
	 */
	constructor(repository: Repository, branches: Branch[]) {
		super(`_${repository.name.short}_branches`);

		this._branches = branches;
	}

	/**
	 * @returns An array of branch summaries
	 */
	public readonly func = (): BranchSummary[] => getBranches(this._branches);

	public readonly post = undefined;
}

/**
 * Cache source for a branch
 *
 * @extends CacheSource
 */
export class BranchSource extends CacheSource {
	private _branch: Branch;

	/**
	 * @param repository - An instance of a repository
	 * @param branch - An instance of a branch
	 */
	constructor(repository: Repository, branch: Branch) {
		super(`_${repository.name.short}_branches_${branch.name}`);

		this._branch = branch;
	}

	/**
	 * @returns A API branch
	 */
	public readonly func = (): Promise<APIBranch> => getBranch(this._branch);

	public readonly post = undefined;
}

/**
 * Caches all of the available cache sources
 *
 * @param cache - A server cache instance
 * @param git_dir - A git directory
 */
export async function cacheAllSources(cache: ServerCache, git_dir: string): Promise<void> {
	console.log("Initializing cache... this may take a while\n");

	const repositories = await Repository.openAll(git_dir);

	process.stdout.write("Caching repositories... ");

	await cache.receive(RepositoriesSource, repositories);

	process.stdout.write("done\n\n");

	for(const repository of repositories) {
		console.log(repository.name.short);

		process.stdout.write("-> Caching repository... ");

		await cache.receive(RepositorySource, repository);

		process.stdout.write("done\n");

		process.stdout.write("-> Caching tags... ");

		const tags = await repository.tags();

		await cache.receive(TagsSource, repository, tags);

		process.stdout.write("done\n");

		process.stdout.write("-> Caching branches... ");

		const branches = await repository.branches();

		await cache.receive(BranchesSource, repository, branches);

		process.stdout.write("done\n");

		for(const branch of branches) {
			const branch_repository = await branch.repository();

			console.log(`\n-> ${branch.name}`);

			process.stdout.write("  -> Caching branch... ");

			await cache.receive(BranchSource, branch_repository, branch);

			process.stdout.write("done\n");

			process.stdout.write("  -> Caching log commits... ");

			await cache.receive(LogCommitsSource, branch_repository, 0);

			process.stdout.write("done\n");

			const message = "  -> Caching commits... ";
			process.stdout.write(message);

			const commits = await branch_repository.commits(true);

			const commits_cnt = commits.length;
			for(const commit of commits) {
				process.stdout.clearLine(1);
				process.stdout.cursorTo(message.length);
				process.stdout.write(`${Math.round(commits.indexOf(commit) / commits_cnt * 100)}%`);

				await cache.receive(CommitSource, branch_repository, commit);
			}

			process.stdout.clearLine(1);
			process.stdout.cursorTo(message.length);
			process.stdout.write("done\n");
		}

		console.log("");
	}
}