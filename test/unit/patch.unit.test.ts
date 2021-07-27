import { Commit } from "../../packages/server/src/git/commit";
import { Patch } from "../../packages/server/src/git/patch";
import { Repository } from "../../packages/server/src/git/repository";
import { EnvironmentVariables } from "../util";

const env = process.env as EnvironmentVariables;

describe("Patch", () => {
	describe("Class methods", () => {
		it("Should get a patch from a diff", async() => {
			expect.assertions(2);

			const repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
			const commit = await Commit.lookup(repository, "d856031c58e26992f3e0a481084a190a50b0bcf7");

			const patch = await Patch.fromDiff(await commit.diff(), 1);

			expect(patch).toBeDefined();
			expect(patch).toBeInstanceOf(Patch);
		});

		it("Should get all patches from a diff", async() => {
			expect.hasAssertions();

			const repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
			const commit = await Commit.lookup(repository, "7b3292af22a0496007e974b65cd2e34521c9c429");

			const patches = await Patch.allFromDiff(await commit.diff());

			expect(patches).toBeDefined();
			expect(patches).toHaveLength(9);

			for(const patch of patches) {
				expect(patch).toBeDefined();
				expect(patch).toBeInstanceOf(Patch);
			}
		});
	});

	describe("Instance methods", () => {
		let repository: Repository;
		let patch: Patch;

		beforeAll(async() => {
			repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
			const commit = await Commit.lookup(repository, "7b3292af22a0496007e974b65cd2e34521c9c429");

			patch = await Patch.fromDiff(await commit.diff(), 4);
		});

		it("Should get if the patch is too large and respond false", async() => {
			expect.assertions(2);

			const too_large = await patch.isTooLarge();

			expect(too_large).toBeDefined();
			expect(too_large).toBeFalsy();
		});

		it("Should get if a huge patch is too large and respond true", async() => {
			expect.assertions(2);

			const other_commit = await Commit.lookup(repository, "8645568c6c96300c1b7709c3a0d674c120d88a13");
			const other_patch = await Patch.fromDiff(await other_commit.diff(), 2);

			const too_large = await other_patch.isTooLarge();

			expect(too_large).toBeDefined();
			expect(too_large).toBeTruthy();
		});

		it("Should get the hunks", async() => {
			expect.hasAssertions();

			const hunks = await patch.getHunks();

			expect(hunks).toBeDefined();
			expect(hunks).toHaveLength(5);

			for(const hunk of hunks) {
				expect(hunk).toBeDefined();
				expect(hunk).toHaveProperty("new_start");
				expect(hunk).toHaveProperty("new_lines_cnt");
				expect(hunk).toHaveProperty("old_start");
				expect(hunk).toHaveProperty("old_lines_cnt");
				expect(hunk).toHaveProperty("new_lines");
				expect(hunk).toHaveProperty("deleted_lines");
				expect(hunk).toHaveProperty("hunk");
			}
		});

		it("Should get the hunks of an empty patch and respond with null", async() => {
			expect.assertions(2);

			const other_commit = await Commit.lookup(repository, "ef256e9e40b5fd0cc741c509e611808cc66bafad");
			const other_patch = await Patch.fromDiff(await other_commit.diff(), 10);

			const hunks = await other_patch.getHunks();

			expect(hunks).toBeDefined();
			expect(hunks).toBeNull();
		});
	});
});