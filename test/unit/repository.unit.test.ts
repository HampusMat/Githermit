import { Repository } from "server/src/git/repository";

describe("Repository", () => {
	const base_dir = "/home/hampus/Projects";

	test("Open existing repository", async () => {
		const openRepository = jest.fn(() => Repository.open(base_dir, "githermit"));

		await openRepository();
		
		expect(openRepository).toReturn();
	});

	test("Open nonexistant repository throws", async () => {
		expect(Repository.open(base_dir, "angular")).rejects.toThrow();
	});

	test("Open all repositories", async () => {
		const openAllRepositories = jest.fn(() => Repository.openAll(base_dir));

		await openAllRepositories();

		expect(openAllRepositories).toReturn();
	});

	describe("Functions", () => {
		let repository: Repository;

		beforeAll(async () => {
			repository = await Repository.open(base_dir, "githermit");
		});

		test("Lookup if an existing object exists", async () => {
			const exists = await repository.lookupExists("16778756fb25808a1311403590cd7d36fbbeee6c");

			expect(exists).toBeTruthy();
		});

		test("Lookup if an nonexistant object exists", async () => {
			const exists = await repository.lookupExists("601747563bff808a1d12403690cd7d36fbbeafcc");

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