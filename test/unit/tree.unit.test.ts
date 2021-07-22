import { Repository } from "server/src/git/repository";
import { Tree } from "server/src/git/tree";
import { TreeEntry } from "server/src/git/tree_entry";
import { BaseError } from "server/src/git/error";
import { EnvironmentVariables } from "../util";

const env = process.env as EnvironmentVariables;

describe("Tree", () => {
	it("Should get the tree of a repository", async () => {
		expect.assertions(2);

		const tree = await Tree.ofRepository(await Repository.open(env.BASE_DIR, env.AVAIL_REPO));

		expect(tree).toBeDefined();
		expect(tree).toBeInstanceOf(Tree);
	});

	describe("Methods", () => {
		let tree: Tree;

		beforeAll(async () => {
			tree = await Tree.ofRepository(await Repository.open(env.BASE_DIR, env.AVAIL_REPO));
		});

		it("Should get the entries", () => {
			expect.hasAssertions();
			
			const entries = tree.entries();

			expect(entries).toBeDefined();

			for(const entry of entries) {
				expect(entry).toBeDefined();
				expect(entry).toBeInstanceOf(TreeEntry);
			}
		});

		it("Should return the entry of a path", async () => {
			expect.assertions(2);

			const entry = await tree.find("packages/server");

			expect(entry).toBeDefined();
			expect(entry).toBeInstanceOf(Tree);
		});

		it("Should fail to return the entry of a nonexistent path", async () => {
			expect.assertions(1);

			await expect(tree.find("dependencies/libstd++")).rejects.toBeInstanceOf(BaseError);
		});

		it("Should find out if an existent path exists and return true", async () => {
			expect.assertions(1);

			await expect(tree.findExists("packages/shared_types/package.json")).resolves.toBeTruthy();
		});

		it("Should find out if a nonexistent path exists and return false", async () => {
			expect.assertions(1);

			await expect(tree.findExists("packages/core/main.js")).resolves.toBeFalsy();
		});
	});
});