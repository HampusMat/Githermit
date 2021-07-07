import { Repository } from "server/src/git/repository";
import { Commit } from "server/src/git/commit";

describe("Commit", () => {
	let repository: Repository;

	beforeAll(async () => {
		repository = await Repository.open(process.env.BASE_DIR, process.env.AVAIL_REPO);
	});

	test("Lookup a existing commit by id", async () => {
		const lookupCommit = jest.fn(() => Commit.lookup(repository, process.env.AVAIL_COMMIT));

		const commit = await lookupCommit();

		expect(lookupCommit).toReturn();
		expect(commit.id).toBe(process.env.AVAIL_COMMIT);
	});

	test("Lookup a nonexistant commit by id throws", async () => {
		expect(Commit.lookup(repository, process.env.UNAVAIL_COMMIT)).rejects.toThrow();
	});

	test("Lookup if an existing commit exists by id", async () => {
		expect(Commit.lookupExists(repository, process.env.AVAIL_COMMIT)).resolves.toBeTruthy();
	});

	test("Lookup if an nonexistant commit exists by id", async () => {
		expect(Commit.lookupExists(repository, process.env.UNAVAIL_COMMIT)).resolves.toBeFalsy();
	});

	describe("Functions", () => {
		let commit: Commit;

		beforeAll(async () => {
			jest.setTimeout(10000);

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