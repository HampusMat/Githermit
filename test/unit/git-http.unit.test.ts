import { FastifyInstance } from "fastify";
import buildApp from "server/src/app";
import { EnvironmentVariables } from "../util";
import { readFile } from "fs/promises";
import { Readable } from "stream";

const env = process.env as EnvironmentVariables;

describe("Git HTTP backend", () => {
	let app: FastifyInstance;

	beforeAll(() => {
		app = buildApp({
			host: "localhost",
			port: 1337,
			dev_port: 8080,
			title: "lmao",
			about: "lmao",
			base_dir: "/tmp/githermit_test",
			production: false
		}, "");
	});

	describe("info/refs", () => {
		it("Should make a valid response when the service is git-upload-pack", async () => {
			expect.assertions(7);

			const res = await app.inject({
				method: "GET",
				url: `${env.AVAIL_REPO}/info/refs?service=git-upload-pack`
			});

			expect(res).toBeDefined();
			expect(res).toHaveProperty("statusCode");
			expect(res.statusCode).toEqual(200);
			expect(res).toHaveProperty("payload");
			expect(res.payload).toBeDefined();

			const payload_lines = res.payload.split("\n");

			expect(payload_lines[0]).toEqual("001e# service=git-upload-pack");
			expect(payload_lines[payload_lines.length - 1]).toEqual("0000");
		});

		it("Should respond with 403 when the service is git-receive-pack", async () => {
			expect.assertions(3);

			const res = await app.inject({
				method: "GET",
				url: `${env.AVAIL_REPO}/info/refs?service=git-receive-pack`
			});

			expect(res).toBeDefined();
			expect(res).toHaveProperty("statusCode");
			expect(res.statusCode).toEqual(403);
		});
	});

	describe("git-upload-pack", () => {
		it("Should make a valid response", async () => {
			expect.assertions(6);

			const head = /^[a-f0-9]+/.exec((await readFile(env.BASE_DIR + "/" + env.AVAIL_REPO + "/FETCH_HEAD")).toString());

			const res = await app.inject({
				method: "POST",
				url: `${env.AVAIL_REPO}/git-upload-pack`,
				payload: Readable.from([`0098want ${head} multi_ack_detailed no-done side-band-64k thin-pack ofs-delta deepen-since deepen-not agent=git/2.32.0\n\
00000009done`]),
				headers: {
					"content-type": "application/x-git-upload-pack-request"
				}
			});

			expect(res).toBeDefined();
			expect(res).toHaveProperty("statusCode");
			expect(res.statusCode).toEqual(200);
			expect(res).toHaveProperty("rawPayload");
			expect(res.rawPayload).toBeDefined();
			expect(res.rawPayload).toBeInstanceOf(Buffer);
		});
	});

	describe("git-receive-pack", () => {
		it("Should respond with 403", async () => {
			expect.assertions(3);

			const res = await app.inject({
				method: "POST",
				url: `${env.AVAIL_REPO}/git-receive-pack`,
				headers: {
					"content-type": "application/x-git-receive-pack-request"
				}
			});
			
			expect(res).toBeDefined();
			expect(res).toHaveProperty("statusCode");
			expect(res.statusCode).toEqual(403);
		});
	});
});