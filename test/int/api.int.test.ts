import { FastifyInstance } from "fastify";
import buildApp from "server/src/app";
import { EnvironmentVariables } from "../util";
import { readFile } from "fs-extra";
import { Info, Repository, RepositorySummary } from "api/src";
import axios, { AxiosResponse } from "axios";
import { Unzip } from "zlib";
import { Readable } from "stream";

const env = process.env as EnvironmentVariables;

const host = "localhost";
const port = 8080;

describe("API", () => {
	let app: FastifyInstance;

	beforeAll(async() => {
		app = await buildApp({
			host: host,
			port: port,
			title: "Bob's cool projects",
			about: "All of my personal projects. Completely FOSS.",
			git_dir: env.GIT_DIR,
			cache: {
				enabled: false
			},
			dev: {
				port: 0
			}
		}, null);

		await app.listen(port);

		axios.defaults.baseURL = `http://${host}:${port}`;
	});

	afterAll(async() => {
		await app.close();
	});

	describe("GET /api/v1/info", () => {
		let res: AxiosResponse;

		beforeAll(async() => {
			res = await axios.get("/api/v1/info");
		});

		it("Should respond", () => {
			expect.assertions(4);

			expect(res).toBeDefined();
			expect(res).toHaveProperty("status");
			expect(res).toHaveProperty("data");
			expect(res.data).toBeDefined();
		});

		it("Should respond without an error", () => {
			expect.assertions(5);

			expect(res.status).toEqual(200);

			const json: Record<string, string> = res.data;

			expect(json).toBeDefined();
			expect(json.error).toBeUndefined();
			expect(json).toHaveProperty("data");
			expect(json.data).toBeDefined();
		});

		it("Should have a valid response", () => {
			expect.assertions(4);

			const info = res.data.data as Info;

			expect(info).toHaveProperty("title");
			expect(info.title).toEqual("Bob's cool projects");

			expect(info).toHaveProperty("about");
			expect(info.about).toEqual("All of my personal projects. Completely FOSS.");
		});
	});

	describe("GET /api/v1/repos", () => {
		let res: AxiosResponse;

		beforeAll(async() => {
			res = await axios.get("/api/v1/repos");
		});

		it("Should respond", () => {
			expect.assertions(4);

			expect(res).toBeDefined();
			expect(res).toHaveProperty("status");
			expect(res).toHaveProperty("data");
			expect(res.data).toBeDefined();
		});

		it("Should respond without an error", () => {
			expect.assertions(5);

			expect(res.status).toEqual(200);

			const json: Record<string, string> = res.data;

			expect(json).toBeDefined();
			expect(json.error).toBeUndefined();
			expect(json).toHaveProperty("data");
			expect(json.data).toBeDefined();
		});

		it("Should have a valid response", () => {
			expect.hasAssertions();

			const repositories = res.data.data as RepositorySummary[];

			expect(repositories).toBeDefined();

			for(const repository of repositories) {
				expect(repository).toHaveProperty("name");
				expect(repository.name).toEqual(env.AVAIL_REPO.slice(0, -4));

				expect(repository).toHaveProperty("description");
				expect(repository.description).toEqual("Unnamed repository; edit this file 'description' to name the repository.");

				expect(repository).toHaveProperty("last_updated");
				expect(repository.last_updated).toBeDefined();
			}

		});
	});

	describe("GET /api/v1/repos/:repository", () => {
		let res: AxiosResponse;

		beforeAll(async() => {
			res = await axios.get(`/api/v1/repos/${env.AVAIL_REPO.slice(0, -4)}`);
		});

		it("Should respond", () => {
			expect.assertions(4);

			expect(res).toBeDefined();
			expect(res).toHaveProperty("status");
			expect(res).toHaveProperty("data");
			expect(res.data).toBeDefined();
		});

		it("Should respond without an error", () => {
			expect.assertions(5);

			expect(res.status).toEqual(200);

			const json: Record<string, string> = res.data;

			expect(json).toBeDefined();
			expect(json.error).toBeUndefined();
			expect(json).toHaveProperty("data");
			expect(json.data).toBeDefined();
		});

		it("Should have a valid response", () => {
			expect.hasAssertions();

			const repository = res.data.data as Repository;

			expect(repository).toHaveProperty("name");
			expect(repository.name).toEqual(env.AVAIL_REPO.slice(0, -4));

			expect(repository).toHaveProperty("description");
			expect(repository.description).toEqual("Unnamed repository; edit this file 'description' to name the repository.");

			expect(repository).toHaveProperty("has_readme");
			expect(repository.has_readme).toBeDefined();
		});
	});

	describe("GET /:repository/refs/tags/:tag", () => {
		let res: AxiosResponse;

		beforeAll(async() => {
			res = await axios.get(`/${env.AVAIL_REPO.slice(0, -4)}/refs/tags/1.2`, {
				responseType: "stream"
			});
		});

		it("Should respond", () => {
			expect.assertions(4);

			expect(res).toBeDefined();
			expect(res).toHaveProperty("status");
			expect(res).toHaveProperty("data");
			expect(res.data).toBeDefined();
		});

		it("Should respond without an error", () => {
			expect.assertions(1);

			expect(res.status).toEqual(200);
		});

		it("Should have a valid response", async() => {
			expect(res).toBeDefined();

			const data = res.data as Unzip;

			const content: Buffer[] = [];

			data.on("data", (chunk: Buffer) => {
				content.push(chunk);
			});

			await new Promise(resolve => {
				data.on("end", () => {
					resolve(null);
				});
			});

			expect(content.length).toBeGreaterThanOrEqual(1);
			expect(content.join().toString()).toBeDefined();
		});
	});

	describe("Git HTTP", () => {
		describe("GET /:repository/info/refs", () => {
			let res: AxiosResponse;

			beforeAll(async() => {
				res = await axios.get(`/${env.AVAIL_REPO}/info/refs?service=git-upload-pack`);
			});

			it("Should respond", () => {
				expect.assertions(4);

				expect(res).toBeDefined();
				expect(res).toHaveProperty("status");
				expect(res).toHaveProperty("data");
				expect(res.data).toBeDefined();
			});

			it("Should have a valid response when the service is git-upload-pack", () => {
				expect.assertions(3);

				expect(res.status).toEqual(200);

				const payload_lines = res.data.split("\n");

				expect(payload_lines[0]).toEqual("001e# service=git-upload-pack");
				expect(payload_lines[payload_lines.length - 1]).toEqual("0000");
			});

			it("Should respond with 403 when the service is git-receive-pack", async() => {
				expect.assertions(3);

				const err_res = await axios.get(`/${env.AVAIL_REPO}/info/refs?service=git-receive-pack`, {
					validateStatus: () => true
				});

				expect(err_res).toBeDefined();
				expect(err_res).toHaveProperty("status");
				expect(err_res.status).toEqual(403);
			});
		});

		describe("POST /:repository/git-upload-pack", () => {
			let res: AxiosResponse;

			beforeAll(async() => {
				const body = new Readable({ read: () => null });

				let head = (await readFile(`${env.GIT_DIR}/${env.AVAIL_REPO}/FETCH_HEAD`)).toString();

				const find_head = /^[a-f0-9]+/.exec(head);

				if(!find_head) {
					throw(new Error("Failed to get repository head!"));
				}

				head = find_head[0];

				body.push(`0098want ${head} multi_ack_detailed no-done side-band-64k thin-pack ofs-delta deepen-since deepen-not agent=git/2.32.0\n00000009done\n`);
				body.push(null);

				res = await axios.post(`/${env.AVAIL_REPO.slice(0, -4)}/git-upload-pack`, body, {
					responseType: "arraybuffer",
					headers: {
						"Content-Type": "application/x-git-upload-pack-request",
						Accept: "*/*",
						"Transfer-Encoding": "chunked",
						Connection: "keep-alive",
						Expect: "100-continue"
					},
					data: body,
					decompress: false
				});
			});

			it("Should respond", () => {
				expect.assertions(4);

				expect(res).toBeDefined();
				expect(res).toHaveProperty("status");
				expect(res).toHaveProperty("data");
				expect(res.data).toBeDefined();
			});

			it("Should respond without an error", () => {
				expect.assertions(1);

				expect(res.status).toEqual(200);
			});

			it("Should have a valid response", async() => {
				expect.hasAssertions();

				const data_lines = res.data.toString().split("\n");

				expect(data_lines.length).toBeGreaterThan(5);

				/*
					Replaces carriage returns with '###' and removes some headers & some unnecessary stuff at the last line.
					This is so that parsing is easier.
				*/
				data_lines[2] = data_lines[2]
					.replace(/[\x0D]/g, "###")
					.replace(/[0-9a-f]{4}[\x02]/g, "");

				data_lines[3] = data_lines[3]
					.replace(/[\x0D]/g, "###")
					.replace(/[0-9a-f]{4}[\x02]/g, "");

				data_lines[data_lines.length - 1] = data_lines[data_lines.length - 1].replace(/.*[\x01]/, "");

				expect(data_lines[0]).toEqual("0008NAK");
				expect(data_lines[1]).toMatch(/Enumerating objects: \d+, done\.$/);

				// Make sure the progress output for counting objects is fine and dandy
				const counting_objects = data_lines[2].split("###");

				for(const progress of counting_objects.slice(0, -1)) {
					expect(progress).toMatch(/^Counting objects:\s+\d+%\s\(\d+\/\d+\)/);
				}

				expect(counting_objects[counting_objects.length - 1]).toMatch(/^Counting objects:\s+\d+%\s\(\d+\/\d+\),\sdone\./);

				// Make sure the progress output for compressing objects is fine and dandy
				const compressing_objects = data_lines[3].split("###");

				for(const progress of compressing_objects.slice(0, -1)) {
					expect(progress).toMatch(/^Compressing objects:\s+\d+%\s\(\d+\/\d+\)/);
				}

				expect(compressing_objects[counting_objects.length - 1]).toMatch(/^Compressing objects:\s+\d+%\s\(\d+\/\d+\),\sdone\./);

				// Just to be sure
				expect(data_lines[data_lines.length - 1]).toMatch(/^.?0{4}/);
			});
		});

		describe("POST /:repository/git-receive-pack", () => {
			it("Should respond with 403", async() => {
				expect.assertions(3);

				const res = await axios.post(`/${env.AVAIL_REPO}/git-receive-pack`, null, {
					headers: {
						"Content-Type": "application/x-git-receive-pack-request"
					},
					validateStatus: () => true
				});

				expect(res).toBeDefined();
				expect(res).toHaveProperty("status");
				expect(res.status).toEqual(403);
			});
		});
	});
});