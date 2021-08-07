import { BaseTreeEntry, BlobTreeEntry, TreeEntry } from "server/src/git/tree_entry";
import { Repository } from "server/src/git/repository";
import { EnvironmentVariables } from "../util";
import { Commit } from "server/src/git/commit";
import { Tree } from "server/src/git/tree";
import { Blob } from "../../packages/server/src/git/blob";

const env = process.env as EnvironmentVariables;

describe("Tree entry", () => {
	describe("Base tree entry", () => {
		describe("Class methods", () => {
			let tree_entry: BaseTreeEntry;

			beforeAll(async() => {
				const repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
				const tree = await repository.tree();
				tree_entry = tree.entries()[0];
			});

			it("Should get the latest commit", async() => {
				expect.assertions(2);

				const latest_commit = await tree_entry.latestCommit();

				expect(latest_commit).toBeDefined();
				expect(latest_commit).toBeInstanceOf(Commit);
			});

			it("Should get whole commit history", async() => {
				expect.hasAssertions();

				const history = await tree_entry.history();

				expect(history).toBeDefined();
				expect(history.length).toBeGreaterThanOrEqual(1);

				for(const hist_entry of history) {
					expect(hist_entry).toBeDefined();
					expect(hist_entry).toBeInstanceOf(Commit);
				}
			});

			it("Should get 5 entries of the commit history", async() => {
				expect.hasAssertions();

				const history = await tree_entry.history(5);

				expect(history).toBeDefined();
				expect(history).toHaveLength(5);

				for(const hist_entry of history) {
					expect(hist_entry).toBeDefined();
					expect(hist_entry).toBeInstanceOf(Commit);
				}
			});
		});

	});

	describe("Tree entry", () => {
		describe("Class methods", () => {
			let tree_entry: BaseTreeEntry;

			beforeAll(async() => {
				const repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
				const tree = await repository.tree();
				const entry = tree.entries().find(entry => entry.path === "test");
				if(!entry) {
					throw(new Error("Couldn't find the test directory!"));
				}

				tree_entry = entry;
			});

			it("Should get the tree", async() => {
				expect.assertions(2);

				const entry = tree_entry as TreeEntry;

				const tree = await entry.tree();

				expect(tree).toBeDefined();
				expect(tree).toBeInstanceOf(Tree);
			});
		});
	});

	describe("Blob tree entry", () => {
		describe("Class methods", () => {
			let tree_entry: BaseTreeEntry;

			beforeAll(async() => {
				const repository = await Repository.open(env.BASE_DIR, env.AVAIL_REPO);
				const tree = await repository.tree();
				tree_entry = tree.entries()[0];
			});

			it("Should get the blob", async() => {
				expect.assertions(2);

				const entry = tree_entry as BlobTreeEntry;

				const blob = await entry.blob();

				expect(blob).toBeDefined();
				expect(blob).toBeInstanceOf(Blob);
			});
		});
	});
});
