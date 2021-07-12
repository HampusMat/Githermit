import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";
import { Tree } from "server/src/git/tree";
import { Branch } from "server/src/git/branch";
import { Tag } from "server/src/git/tag";
import { EnvironmentVariables, expectCommitProperties } from "../util";

const env = process.env as EnvironmentVariables;

function expectRepositoryProperties(repository: Repository) {
	expect(repository).toHaveProperty("base_dir");
	expect(repository).toHaveProperty("description");
	expect(repository).toHaveProperty("name");
	expect(repository).toHaveProperty("name.full");
	expect(repository).toHaveProperty("name.short");
	expect(repository).toHaveProperty("owner");
}

describe("Repository", () => {
	it("Opens a repository successfully", async () => {
		expect.assertions(8);

		const repository = await Repository.open(process.env.BASE_DIR, env.AVAIL_REPO);

		expect(repository).toBeDefined();
		expect(repository).toBeInstanceOf(Repository);

		expectRepositoryProperties(repository);
	});

	it("Fails to open a nonexistant repository", async () => {
		expect.assertions(1);

		await expect(Repository.open(process.env.BASE_DIR, env.UNAVAIL_REPO)).rejects.toThrow();
	});

	it("Opens all repositories", async () => {
		expect.hasAssertions();

		const all_repositories = await Repository.openAll(env.BASE_DIR);

		expect(all_repositories).toBeDefined();

		for(const repository of all_repositories) {
			expect(repository).toBeDefined();
			expect(repository).toBeInstanceOf(Repository)

			expectRepositoryProperties(repository);
		}
	});

	describe("Methods", () => {
		let repository: Repository;

		beforeAll(async () => {
			repository = await Repository.open(process.env.BASE_DIR, env.AVAIL_REPO);
		});

		it("Looks up if an object that exists exist", async () => {
			expect.assertions(1);

			await expect(repository.lookupExists(env.AVAIL_OBJECT)).resolves.toBeTruthy();
		});

		it("Looks up if an nonexistant object exists", async () => {
			expect.assertions(1);

			await expect(repository.lookupExists(env.UNAVAIL_OBJECT)).resolves.toBeFalsy();
		});

		it("Gets the latest commit", async () => {
			expect.assertions(8);

			const latest_commit = await repository.latestCommit();

			expect(latest_commit).toBeDefined();
			expect(latest_commit).toBeInstanceOf(Commit);

			expectCommitProperties(latest_commit);
		});

		it("Gets the commits", async () => {
			expect.hasAssertions();

			const commits = await repository.commits();

			expect(commits).toBeDefined();

			for(const commit of commits) {
				expect(commit).toBeDefined();
				expect(commit).toBeInstanceOf(Commit);

				expectCommitProperties(commit);
			}
		});

		it("Gets the tree", async () => {
			expect.assertions(2);

			const tree = await repository.tree();

			expect(tree).toBeDefined();
			expect(tree).toBeInstanceOf(Tree);
		});

		it("Gets the branches", async () => {
			expect.hasAssertions();

			const branches = await repository.branches();

			expect(branches).toBeDefined();

			for(const branch of branches) {
				expect(branch).toBeDefined();
				expect(branch).toBeInstanceOf(Branch);

				expect(branch).toHaveProperty("id");
				expect(branch).toHaveProperty("name");
			}
		});

		it("Gets the tags", async () => {
			expect.hasAssertions();

			const tags = await repository.tags();

			expect(tags).toBeDefined();

			for(const tag of tags) {
				expect(tag).toBeDefined();
				expect(tag).toBeInstanceOf(Tag);

				expect(tag).toHaveProperty("id");
				expect(tag).toHaveProperty("name");
			}
		});
	});
});