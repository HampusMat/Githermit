import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";
import { EnvironmentVariables, expectCommitProperties } from "../util";
import { Diff } from "server/src/git/diff";
import { Tree } from "server/src/git/tree";

const env = process.env as EnvironmentVariables;

jest.setTimeout(10000);

describe("Commit", () => {
	let repository: Repository;

	beforeAll(async () => {
		repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
	});

	it("Looks up a commit", async () => {
		expect.assertions(8);

		const commit = await Commit.lookup(repository, env.AVAIL_COMMIT);

		expect(commit).toBeDefined();
		expect(commit).toBeInstanceOf(Commit);

		expectCommitProperties(commit);
	});

	it("Looks up a nonexistant commit and throws", async () => {
		expect.assertions(1);

		await expect(Commit.lookup(repository, env.UNAVAIL_COMMIT)).rejects.toThrow();
	});

	it("Looks up if an commit that exists exist", async () => {
		expect.assertions(1);

		await expect(Commit.lookupExists(repository, env.AVAIL_COMMIT)).resolves.toBeTruthy();
	});

	it("Looks up if an nonexistant commit exists", async () => {
		expect.assertions(1);

		await expect(Commit.lookupExists(repository, env.UNAVAIL_COMMIT)).resolves.toBeFalsy();
	});

	describe("Methods", () => {
		let commit: Commit;

		beforeAll(async () => {
			commit = await repository.latestCommit();
		});

		it("Gets the stats", async () => {
			expect.assertions(4);

			const stats = await commit.stats();

			expect(stats).toBeDefined();

			expect(stats).toHaveProperty("insertions");
			expect(stats).toHaveProperty("deletions");
			expect(stats).toHaveProperty("files_changed");
		});

		it("Gets the diff", async () => {
			expect.assertions(2);

			const diff = await commit.diff();

			expect(diff).toBeDefined();
			expect(diff).toBeInstanceOf(Diff);
		});
		
		it("Gets the tree", async () => {
			expect.assertions(2);

			const tree = await commit.tree();

			expect(tree).toBeDefined();
			expect(tree).toBeInstanceOf(Tree);
		});
	});	
});