import { FastifyInstance } from "fastify";
import buildApp from "server/src/app";
import { EnvironmentVariables } from "../util";
import { readFile } from "fs-extra";
import { exec, ExecException } from "child_process";

const env = process.env as EnvironmentVariables;

const host = "localhost";
const port = 8080;

describe("Git HTTP backend", () => {
	let app: FastifyInstance;

	beforeAll(() => {
		app = buildApp({
			host: host,
			port: port,
			dev_port: 0,
			title: "",
			about: "",
			base_dir: env.BASE_DIR,
			production: false
		}, "");
	});

	afterAll(async() => {
		await app.close();
	});

	describe("info/refs", () => {
		it("Should make a valid response when the service is git-upload-pack", async() => {
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

		it("Should respond with 403 when the service is git-receive-pack", async() => {
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
		it("Should make a valid response", async() => {
			expect.hasAssertions();

			await app.listen(port);

			const head = /^[a-f0-9]+/.exec((await readFile(`${env.BASE_DIR}/${env.AVAIL_REPO}/FETCH_HEAD`)).toString())[0];
			const data = `0098want ${head} multi_ack_detailed no-done side-band-64k thin-pack ofs-delta deepen-since deepen-not agent=git/2.32.0\n00000009done`;

			/* Send a post request to git-upload-pack with curl

			   I did it this way because i just couldn't get chunked responses
			   to work with LightMyRequest or Supertest */
			const res = new Promise((resolve: (value: Record<string, Buffer>) => void, reject: (value: ExecException) => void) => {
				const curl_params = [
					"-X POST",
					"-sS",
					"-f",
					"-H \"Content-Type: application/x-git-upload-pack-request\"",
					"-T -"
				].join(" ");
				const command = `echo "${data}" | curl ${curl_params} http://${host}:${port}/${env.AVAIL_REPO}/git-upload-pack`;

				exec(command, { maxBuffer: 5368709120, encoding: "buffer" }, (err, stdout, stderr) => {
					if(err) {
						reject(err);
						return;
					}
					resolve({ stdout, stderr });
				});
			});

			const { stdout, stderr } = await res;

			expect(stderr).toBeInstanceOf(Buffer);
			expect(stderr.length).toEqual(0);

			expect(stdout).toBeInstanceOf(Buffer);
			expect(stdout.length).toBeGreaterThan(1);

			const readable_stdout = stdout.toString().split("\n");

			expect(readable_stdout.length).toBeGreaterThan(5);

			readable_stdout[2] = readable_stdout[2]
				.replace(/[\x0D]/g, "###")
				.replace(/[0-9a-f]{4}[\x02]/g, "");

			readable_stdout[3] = readable_stdout[3]
				.replace(/[\x0D]/g, "###")
				.replace(/[0-9a-f]{4}[\x02]/g, "");

			readable_stdout[readable_stdout.length - 1] = readable_stdout[readable_stdout.length - 1].replace(/.*[\x01]/, "");

			expect(readable_stdout[0]).toEqual("0008NAK");
			expect(readable_stdout[1]).toMatch(/Enumerating objects: \d+, done\.$/);

			// Make sure the progress output for counting objects is fine and dandy
			const counting_objects = readable_stdout[2].split("###");

			for(const progress of counting_objects.slice(0, -1)) {
				expect(progress).toMatch(/^Counting objects:\s+\d+%\s\(\d+\/\d+\)/);
			}

			expect(counting_objects[counting_objects.length - 1]).toMatch(/^Counting objects:\s+\d+%\s\(\d+\/\d+\),\sdone\./);

			// Make sure the progress output for compressing objects is fine and dandy
			const compressing_objects = readable_stdout[3].split("###");

			for(const progress of compressing_objects.slice(0, -1)) {
				expect(progress).toMatch(/^Compressing objects:\s+\d+%\s\(\d+\/\d+\)/);
			}

			expect(compressing_objects[counting_objects.length - 1]).toMatch(/^Compressing objects:\s+\d+%\s\(\d+\/\d+\),\sdone\./);

			// Just to be sure
			expect(readable_stdout[readable_stdout.length - 1]).toMatch(/^.?0{4}/);
		});
	});

	describe("git-receive-pack", () => {
		it("Should respond with 403", async() => {
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