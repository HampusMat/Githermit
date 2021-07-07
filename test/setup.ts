import { access, mkdir, remove, copy } from "fs-extra";
import { promisify } from "util";
import { exec } from "child_process";
import { config } from "dotenv";

const promiseExec = promisify(exec);
config({ path: "test/test.env" });

export default async function init() {
	const can_access = await access(process.env.BASE_DIR)
		.then(() => true)
		.catch(() => false);

	console.log(can_access);

	if(can_access) {
		await remove(process.env.BASE_DIR);
	}

	await mkdir(process.env.BASE_DIR);
	await mkdir(`${process.env.BASE_DIR}/${process.env.AVAIL_REPO}`);

	await copy(".git", `${process.env.BASE_DIR}/${process.env.AVAIL_REPO}`);

	process.chdir(`${process.env.BASE_DIR}/${process.env.AVAIL_REPO}`);

	const { stdout, stderr } = await promiseExec("git config core.bare true");

	if(stderr) {
		throw(stderr);
	}

	process.chdir("../..");
}