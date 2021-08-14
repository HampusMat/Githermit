import { Repository } from "server/src/git/repository";
import { Tag } from "server/src/git/tag";
import { EnvironmentVariables } from "../util";

const env = process.env as EnvironmentVariables;

describe("Tag", () => {
	describe("Class methods", () => {
		it("Should lookup a tag", async() => {
			expect.assertions(2);

			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);

			const tag = await Tag.lookup(repository, "1.2");

			expect(tag).toBeDefined();
			expect(tag).toBeInstanceOf(Tag);
		});
	});

	describe("Instance methods", () => {
		let tag: Tag;

		beforeAll(async() => {
			const repository = await Repository.open(env.GIT_DIR, env.AVAIL_REPO);
			tag = await Tag.lookup(repository, "1.2");
		});

		it("Should get the author", async() => {
			expect.assertions(5);

			const author = await tag.author();

			expect(author).toBeDefined();

			expect(author).toHaveProperty("name");
			expect(author.name).toEqual("BobDylan");

			expect(author).toHaveProperty("email");
			expect(author.email).toEqual("bob@example.com");
		});

		it("Should get the date", async() => {
			expect.assertions(2);

			const date = await tag.date();

			expect(date).toBeDefined();
			expect(typeof date).toEqual("number");
		});
	});
});