
import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";

describe("Commit", () => {
	const base_dir = "/home/hampus/Projects";

	let repository: Repository;

	beforeAll(async () => {
		repository = await Repository.open(base_dir, "githermit");
	});

	test("Lookup a existing commit by id", async () => {
		const id = "d546492f4fd400ae61a6abbe1905fdbc67451c4d";

		const lookupCommit = jest.fn(() => Commit.lookup(repository, id));

		const commit = await lookupCommit();

		expect(lookupCommit).toReturn();
		expect(commit.id).toBe(id);
	});

	test("Lookup a nonexistant commit by id throws", async () => {
		const id = "a546392f4fd440ae61a6afec1d25fdbc67251e2b";

		expect(Commit.lookup(repository, id)).rejects.toThrow();
	});

	test("Lookup if an existing commit exists by id", async () => {
		const id = "d546492f4fd400ae61a6abbe1905fdbc67451c4d";

		expect(Commit.lookupExists(repository, id)).resolves.toBeTruthy();
	});

	test("Lookup if an nonexistant commit exists by id", async () => {
		const id = "a546392f4fd440ae61a6afec1d25fdbc67251e2b";

		expect(Commit.lookupExists(repository, id)).resolves.toBeFalsy();
	});

	describe("Functions", () => {
		let commit: Commit;

		beforeAll(async () => {
			commit = await repository.latestCommit();
		});

		test("Get stats", async () => {
			const getStats = jest.fn(() => commit.stats());

			await getStats();

			expect(getStats).toReturn();
		});

		test("Get diff", async () => {
			const getDiff = jest.fn(() => commit.diff());

			await getDiff();

			expect(getDiff).toReturn();
		});
		
		test("Get tree", async () => {
			const getTree = jest.fn(() => commit.tree());

			await getTree();

			expect(getTree).toReturn();
		});
	});	
});