import { Repository } from "server/src/git/repository";
import { Diff } from "server/src/git/diff";
import { EnvironmentVariables } from "../util";
import { Patch } from "server/src/git/patch";

const env = process.env as EnvironmentVariables;

describe("Diff", () => {
	let diff: Diff;

	beforeAll(async() => {
		const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);

		diff = await (await repository.head()).diff();
	});

	describe("Instance methods", () => {
		it("Should get the raw patches", async() => {
			expect.assertions(2);

			const raw_patches = await diff.rawPatches();

			expect(raw_patches).toBeDefined();
			expect(typeof raw_patches).toEqual("string");
		});

		it("Should get the header data", async() => {
			expect.assertions(4);

			const patch_header_data = await diff.patchHeaderData();

			expect(patch_header_data).toBeDefined();

			expect(patch_header_data).toHaveProperty("indexes");
			expect(patch_header_data).toHaveProperty("lengths");
			expect(patch_header_data).toHaveProperty("last");
		});

		it("Should get the patches", async() => {
			expect.hasAssertions();

			const patches = await diff.patches();

			expect(patches).toBeDefined();

			for(const patch of patches) {
				expect(patch).toBeDefined();
				expect(patch).toBeInstanceOf(Patch);
			}
		});
	});
});