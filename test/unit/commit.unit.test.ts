import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";
import { EnvironmentVariables, expectCommitProperties } from "../util";
import { Diff } from "server/src/git/diff";
import { Tree } from "server/src/git/tree";

const env = process.env as EnvironmentVariables;

describe("Commit", () => {
	let repository: Repository;

	beforeAll(async() => {
		repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
	});

	describe("Class methods", () => {
		it("Should look up a commit", async() => {
			expect.assertions(8);

			const commit = await Commit.lookup(repository, env.AVAIL_COMMIT);

			expect(commit).toBeDefined();
			expect(commit).toBeInstanceOf(Commit);

			expectCommitProperties(commit);
		});

		it("Should look up a nonexistant commit and throw", async() => {
			expect.assertions(1);

			await expect(Commit.lookup(repository, env.UNAVAIL_COMMIT)).rejects.toThrow();
		});

		it("Should look up if an existent commit exists and respond true", async() => {
			expect.assertions(1);

			await expect(Commit.lookupExists(repository, env.AVAIL_COMMIT)).resolves.toBeTruthy();
		});

		it("Should look up if an nonexistant commit exists and respond false", async() => {
			expect.assertions(1);

			await expect(Commit.lookupExists(repository, env.UNAVAIL_COMMIT)).resolves.toBeFalsy();
		});
	});

	describe("Instance methods", () => {
		let commit: Commit;

		beforeAll(async() => {
			commit = await Commit.lookup(repository, "8feb65c5467cc3ad48270183113a121c4a9f86ca");
		});

		it("Should get the stats", async() => {
			expect.assertions(4);

			const stats = await commit.stats();

			expect(stats).toBeDefined();

			expect(stats).toHaveProperty("insertions");
			expect(stats).toHaveProperty("deletions");
			expect(stats).toHaveProperty("files_changed");
		});

		it("Should get the diff", async() => {
			expect.assertions(2);

			const diff = await commit.diff();

			expect(diff).toBeDefined();
			expect(diff).toBeInstanceOf(Diff);
		});

		it("Should get the tree", async() => {
			expect.assertions(2);

			const tree = await commit.tree();

			expect(tree).toBeDefined();
			expect(tree).toBeInstanceOf(Tree);
		});

		it("Should get if it's signed and respond true", async() => {
			expect.assertions(2);

			const is_signed = await commit.isSigned();

			expect(is_signed).toBeDefined();
			expect(is_signed).toBeTruthy();
		});

		it("Should get if a unsigned commit is signed and respond false", async() => {
			expect.assertions(2);

			const other_commit = await Commit.lookup(repository, "7578c24113ba71d7435a94c649566e4e39e0e88c");

			const is_signed = await other_commit.isSigned();

			expect(is_signed).toBeDefined();
			expect(is_signed).toBeFalsy();
		});

		it("Should get the author", async() => {
			expect.assertions(7);

			const author = await commit.author();

			expect(author).toBeDefined();

			expect(author).toHaveProperty("name");
			expect(author.name).toBeDefined();

			expect(author).toHaveProperty("email");
			expect(author.email).toBeDefined();

			expect(author).toHaveProperty("fingerprint");

			const fingerprint = await author.fingerprint();

			expect(fingerprint).toBeDefined();
		});
	});
});