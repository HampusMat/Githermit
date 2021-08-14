import { Branch } from "server/src/git/branch";
import { Repository } from "server/src/git/repository";
import { EnvironmentVariables } from "../util";

const env = process.env as EnvironmentVariables;

describe("Branch", () => {
	describe("Class methods", () => {
		it("Should lookup a branch", async() => {
			expect.assertions(2);

			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);
			const branch = await Branch.lookup(repository, "master");

			expect(branch).toBeDefined();
			expect(branch).toBeInstanceOf(Branch);
		});

		it("Should lookup if an existent branch exists and respond true", async() => {
			expect.assertions(2);

			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);
			const branch_exists = await Branch.lookupExists(repository.ng_repository, "master");

			expect(branch_exists).toBeDefined();
			expect(branch_exists).toBeTruthy();
		});

		it("Should lookup if an nonexistent branch exists and respond false", async() => {
			expect.assertions(2);

			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);
			const branch_exists = await Branch.lookupExists(repository.ng_repository, "wubbalubbadubdub");

			expect(branch_exists).toBeDefined();
			expect(branch_exists).toBeFalsy();
		});
	});

	describe("Instance methods", () => {
		let branch: Branch;

		beforeAll(async() => {
			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);

			branch = await Branch.lookup(repository, "master");
		});

		it("Should get the latest commit", async() => {
			expect.assertions(4);

			const latest_commit = await branch.latestCommit();

			expect(latest_commit).toBeDefined();
			expect(latest_commit).toHaveProperty("id");
			expect(latest_commit).toHaveProperty("message");
			expect(latest_commit).toHaveProperty("date");
		});
	});
});