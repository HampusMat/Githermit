import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";
import { Tree } from "server/src/git/tree";
import { Branch } from "server/src/git/branch";
import { Tag } from "server/src/git/tag";
import { EnvironmentVariables } from "../util";
import { ServerError } from "server/src/git/error";

const env = process.env as EnvironmentVariables;

function expectRepositoryProperties(repository: Repository) {
	expect(repository).toHaveProperty("git_dir");
	expect(repository).toHaveProperty("description");
	expect(repository).toHaveProperty("name");
	expect(repository).toHaveProperty("name.full");
	expect(repository).toHaveProperty("name.short");
	expect(repository).toHaveProperty("owner");
}

describe("Repository", () => {
	describe("Class methods", () => {
		it("Should open a repository", async() => {
			expect.assertions(8);

			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);

			expect(repository).toBeDefined();
			expect(repository).toBeInstanceOf(Repository);

			expectRepositoryProperties(repository);
		});

		it("Should fail to open a nonexistant repository", async() => {
			expect.assertions(1);

			await expect(Repository.open(env.GIT_DIR, env.UNAVAIL_REPO)).rejects.toBeInstanceOf(ServerError);
		});

		it("Should fail to open a repository with a nonexistant branch", async() => {
			expect.assertions(1);

			await expect(Repository.open(env.GIT_DIR, env.AVAIL_REPO, "wubbalubbadubdub")).rejects.toBeInstanceOf(ServerError);
		});

		it("Should open all repositories", async() => {
			expect.hasAssertions();

			const all_repositories = await Repository.openAll(env.GIT_DIR);

			expect(all_repositories).toBeDefined();

			for(const repository of all_repositories) {
				expect(repository).toBeDefined();
				expect(repository).toBeInstanceOf(Repository);

				expectRepositoryProperties(repository);
			}
		});
	});

	describe("Instance methods", () => {
		let repository: Repository;

		beforeAll(async() => {
			repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);
		});

		it("Should get the description", async() => {
			expect.assertions(2);

			const description = await repository.description();

			expect(description).toBeDefined();
			expect(description.length).toBeGreaterThan(1);
		});

		it("Should get the owner", async() => {
			expect.assertions(2);

			const owner = await repository.owner();

			expect(owner).toBeDefined();
			expect(owner).toEqual("Bob");
		});

		it("Should get the branch", async() => {
			expect.assertions(2);

			const branch = await repository.branch();

			expect(branch).toBeDefined();
			expect(branch).toBeInstanceOf(Branch);
		});

		it("Should look up if an existent object exists and respond true", async() => {
			expect.assertions(1);

			await expect(repository.lookupExists(env.AVAIL_OBJECT)).resolves.toBeTruthy();
		});

		it("Should look up if an nonexistant object exists and respond false", async() => {
			expect.assertions(1);

			await expect(repository.lookupExists(env.UNAVAIL_OBJECT)).resolves.toBeFalsy();
		});

		it("Should get the head commit", async() => {
			expect.assertions(2);

			const master_commit = await repository.head();

			expect(master_commit).toBeDefined();
			expect(master_commit).toBeInstanceOf(Commit);
		});

		it("Should get the commits", async() => {
			expect.hasAssertions();

			const commits = await repository.commits();

			expect(commits).toBeDefined();

			for(const commit of commits) {
				expect(commit).toBeDefined();
				expect(commit).toBeInstanceOf(Commit);
			}
		});

		it("Should get the tree", async() => {
			expect.assertions(2);

			const tree = await repository.tree();

			expect(tree).toBeDefined();
			expect(tree).toBeInstanceOf(Tree);
		});

		it("Should get the branches", async() => {
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

		it("Should get the tags", async() => {
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