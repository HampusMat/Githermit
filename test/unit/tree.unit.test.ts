import { Repository } from "server/src/git/repository";
import { Tree } from "server/src/git/tree";
import { BaseTreeEntry, BlobTreeEntry, TreeEntry } from "server/src/git/tree_entry";
import { ServerError } from "server/src/git/error";
import { EnvironmentVariables } from "../util";
import { extract, Headers } from "tar-stream";

const env = process.env as EnvironmentVariables;

describe("Tree", () => {
	describe("Class methods", () => {
		it("Should get the tree of a repository", async() => {
			expect.assertions(2);

			const tree = await Tree.ofRepository(await Repository.open(env.GIT_DIR, env.AVAIL_REPO));

			expect(tree).toBeDefined();
			expect(tree).toBeInstanceOf(Tree);
		});
	});

	describe("Instance methods", () => {
		let tree: Tree;

		beforeAll(async() => {
			tree = await Tree.ofRepository(await Repository.open(env.GIT_DIR, env.AVAIL_REPO));
		});

		it("Should get the entries", () => {
			expect.hasAssertions();

			const entries = tree.entries();

			expect(entries).toBeDefined();

			for(const entry of entries) {
				expect(entry).toBeDefined();
				expect(entry).toBeInstanceOf(BaseTreeEntry);
			}
		});

		it("Should return the entry of a path", async() => {
			expect.assertions(2);

			const entry = await tree.find("packages/server");

			expect(entry).toBeDefined();
			expect(entry).toBeInstanceOf(TreeEntry);
		});

		it("Should fail to return the entry of a nonexistent path", async() => {
			expect.assertions(1);

			await expect(tree.find("dependencies/libstd++")).rejects.toBeInstanceOf(ServerError);
		});

		it("Should find out if an existent path exists and return true", async() => {
			expect.assertions(1);

			await expect(tree.findExists("packages/api/package.json")).resolves.toBeTruthy();
		});

		it("Should find out if a nonexistent path exists and return false", async() => {
			expect.assertions(1);

			await expect(tree.findExists("packages/core/main.js")).resolves.toBeFalsy();
		});

		it("Should create an archive", async() => {
			const archive = await tree.createArchive();

			expect(archive).toBeDefined();

			const extract_archive = extract();

			archive.pipe(extract_archive);

			type Entry = {
				header: Headers,
				content: Buffer[]
			};

			// Extract the archive entries to an array of entries
			const entries = await new Promise((resolve: (value: Entry[]) => void) => {
				const entries: Entry[] = [];

				extract_archive.on("finish", () => {
					resolve(entries);
				});

				extract_archive.on("entry", (header, stream, next) => {
					const content: Buffer[] = [];

					stream.on("data", (chunk: Buffer) => {
						content.push(chunk);
					});

					stream.on("end", async() => {
						entries.push({ header, content });
						next();
					});

					stream.resume();
				});
			});

			expect(entries).toBeDefined();
			expect(entries.length).toBeGreaterThan(1);

			for(const entry of entries) {
				expect(entry).toBeDefined();
				expect(entry.content).toBeDefined();

				const content = entry.content.join().toString();

				// Get the file content directly
				const tree_entry = await tree.find(entry.header.name.split("/").slice(1).join("/")) as BlobTreeEntry;
				const file_content = await (await tree_entry.blob()).content();

				expect(content).toEqual(file_content);
			}
		});
	});
});