import {
	LogCommit,
	Patch as APIPatch,
	Commit as APICommit, Tag as APITag,
	RepositorySummary as APIRepositorySummary,
	Repository as APIRepository,
	BranchSummary,
	Branch as APIBranch
} from "api";
import { Branch, Commit, Patch, Repository, Tag } from "git";

export async function getLogCommits(commits: Commit[]): Promise<LogCommit[]> {
	return Promise.all(commits.map(async(commit: Commit) => {
		const stats = await commit.stats();

		const is_signed = await commit.isSigned();

		return <LogCommit>{
			id: commit.id,
			author: {
				name: commit.author().name,
				email: commit.author().email,
				fingerprint: await commit.author().fingerprint().catch(() => null)
			},
			isSigned: is_signed,
			signatureVerified: is_signed ? await commit.verifySignature().catch(() => false) : null,
			message: commit.message,
			date: commit.date,
			insertions: stats.insertions,
			deletions: stats.deletions,
			files_changed: stats.files_changed
		};
	}));
}

export async function getCommit(commit: Commit): Promise<APICommit> {
	const stats = await commit.stats();

	const is_signed = await commit.isSigned();

	const patches = await (await commit.diff()).patches().catch(() => null);

	return {
		message: commit.message,
		author: {
			name: commit.author().name,
			email: commit.author().email,
			fingerprint: await commit.author().fingerprint().catch(() => null)
		},
		isSigned: is_signed,
		signatureVerified: is_signed ? await commit.verifySignature().catch(() => false) : null,
		date: commit.date,
		insertions: stats.insertions,
		deletions: stats.deletions,
		files_changed: stats.files_changed,
		too_large: Boolean(!patches),
		diff: patches
			? await Promise.all(patches.map(async(patch: Patch) => {
				return <APIPatch>{
					additions: patch.additions,
					deletions: patch.deletions,
					from: patch.from,
					to: patch.to,
					too_large: await patch.isTooLarge(),
					hunks: await patch.getHunks().catch(() => null)
				};
			}))
			: null
	};
}

export function getTags(tags: Tag[]): Promise<APITag[]> {
	return Promise.all(tags.map(async(tag: Tag) => {
		const author = await tag.author();
		return <APITag>{
			name: tag.name,
			author: {
				name: author.name,
				email: author.email
			},
			date: await tag.date()
		};
	}));
}

export function getRepositories(repositories: Repository[]): Promise<APIRepositorySummary[]> {
	return Promise.all(repositories.map(async repository => {
		return <APIRepositorySummary>{
			name: repository.name.short,
			description: await repository.description(),
			last_updated: (await repository.head()).date
		};
	}));
}

export async function getRepository(repository: Repository): Promise<APIRepository> {
	return <APIRepository>{
		name: repository.name.short,
		description: await repository.description(),
		has_readme: await (await repository.tree()).findExists("README.md")
	};
}

export function getBranches(branches: Branch[]): BranchSummary[] {
	return branches.map(branch => {
		return <BranchSummary>{
			id: branch.id,
			name: branch.name
		};
	});
}

export async function getBranch(branch: Branch): Promise<APIBranch> {
	return {
		id: branch.id,
		name: branch.name,
		latest_commit: await branch.latestCommit()
	};
}