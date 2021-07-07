import { Repository } from "server/src/git/repository";

describe("Repository", () => {
	test("Open existing repository", async () => {
		const openRepository = jest.fn(() => Repository.open(process.env.BASE_DIR, process.env.AVAIL_REPO));

		await openRepository();
		
		expect(openRepository).toReturn();
	});

	test("Open nonexistant repository throws", async () => {
		expect(Repository.open(process.env.BASE_DIR, process.env.UNAVAIL_REPO)).rejects.toThrow();
	});

	test("Open all repositories", async () => {
		const openAllRepositories = jest.fn(() => Repository.openAll(process.env.BASE_DIR));

		await openAllRepositories();

		expect(openAllRepositories).toReturn();
	});

	describe("Functions", () => {
		let repository: Repository;

		beforeAll(async () => {
			repository = await Repository.open(process.env.BASE_DIR, process.env.AVAIL_REPO);
		});

		test("Lookup if an existing object exists", async () => {
			const exists = await repository.lookupExists(process.env.AVAIL_OBJECT);

			expect(exists).toBeTruthy();
		});

		test("Lookup if an nonexistant object exists", async () => {
			const exists = await repository.lookupExists(process.env.UNAVAIL_OBJECT);

			expect(exists).toBeFalsy();
		});

		test("Get latest commit", async () => {
			const getLatestCommit = jest.fn(() => repository.latestCommit());

			await getLatestCommit();
		
			expect(getLatestCommit).toReturn();
		});

		test("Get commits", async () => {
			const getCommits = jest.fn(() => repository.commits());

			await getCommits();

			expect(getCommits).toReturn();
		});

		test("Get tree", async () => {
			const getTree = jest.fn(() => repository.tree());

			await getTree();

			expect(getTree).toReturn();
		});

		test("Get branches", async () => {
			const getBranches = jest.fn(() => repository.branches());

			await getBranches();

			expect(getBranches).toReturn();
		});

		test("Get tags", async () => {
			const getTags = jest.fn(() => repository.tags());

			await getTags();
			
			expect(getTags).toReturn();
		});
	});
});