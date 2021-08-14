import { findAsync, getDirectory, getFile } from "server/src/git/misc";
import { ServerError } from "server/src/git/error";
import { EnvironmentVariables } from "../util";

const env = process.env as EnvironmentVariables;

describe("Miscellaneous functions", () => {
	describe("findAsync", () => {
		const data: Promise<string>[] = [
			new Promise(resolve => {
				resolve("hello!");
			}),
			new Promise(resolve => {
				resolve("Dad i'm hungry");
			}),
			new Promise(resolve => {
				resolve("Hi, hungry. I'm dad");
			})
		];

		it("Should find an existent item in an array", async() => {
			expect.assertions(2);

			const result = await findAsync(data, async item => {
				return await item === "Dad i'm hungry";
			});

			expect(result).toBeDefined();
			expect(result).toEqual("Dad i'm hungry");
		});

		it("Should fail to find a nonexistent item in an array", async() => {
			expect.assertions(1);

			const result = await findAsync(data, async item => {
				return await item === "Hello there";
			});

			expect(result).toBeUndefined();
		});
	});

	describe("getFile", () => {
		it("Should return the content of a file in a bare git repository", async() => {
			expect.assertions(2);

			const content = await getFile(env.GIT_DIR, env.AVAIL_REPO, "description");

			expect(content).toBeDefined();
			expect(content).toEqual("Unnamed repository; edit this file 'description' to name the repository.");
		});

		it("Should fail to return the content of a nonexistent file in a bare repository", async() => {
			expect.assertions(1);

			await expect(getFile(env.GIT_DIR, env.AVAIL_REPO, "myselfasteem")).rejects.toBeInstanceOf(ServerError);
		});
	});

	describe("getDirectory", () => {
		it("Should return the content of a directory", async() => {
			expect.assertions(3);

			const dir = await getDirectory(`${env.GIT_DIR}/${env.AVAIL_REPO}/refs`);

			expect(dir).toBeDefined();
			expect(dir).toContain("heads");
			expect(dir).toContain("tags");
		});

		it("Should fail to return the content of a nonexistent directory", async() => {
			expect.assertions(1);

			await expect(getDirectory(`${env.GIT_DIR}/${env.AVAIL_REPO}/something`)).rejects.toBeInstanceOf(ServerError);
		});
	});
});