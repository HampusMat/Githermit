import { Repository } from "server/src/git/repository";
import { Tree } from "server/src/git/tree";
import { EnvironmentVariables } from "../util";
import { Blob } from "server/src/git/blob";

const env = process.env as EnvironmentVariables;

describe("Blob", () => {
	describe("Class methods", () => {
		it("Should the get a blob from a path in a tree", async() => {
			expect.assertions(2);

			const tree = await Tree.ofRepository(await Repository.open(env.GIT_DIR, env.AVAIL_REPO));
			const blob = await Blob.fromPath(tree, "packages/client/src/main.ts");

			expect(blob).toBeDefined();
			expect(blob).toBeInstanceOf(Blob);
		});
	});

	describe("Instance methods", () => {
		let blob: Blob;

		beforeAll(async() => {
			const tree = await Tree.ofRepository(await Repository.open(env.GIT_DIR, env.AVAIL_REPO));
			blob = await Blob.fromPath(tree, "packages/client/src/main.ts");
		});

		it("Should get the content", async() => {
			expect.assertions(2);

			const content = await blob.content();

			expect(content).toBeDefined();
			expect(typeof content).toEqual("string");
		});
	});
});