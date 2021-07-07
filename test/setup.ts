import { access, mkdir, remove } from "fs-extra";
import { promisify } from "util";
import { exec } from "child_process";
import { config } from "dotenv";

const promiseExec = promisify(exec);
config({ path: "test/test.env" });

export default async function init() {
	const can_access = await access(process.env.BASE_DIR)
		.then(() => true)
		.catch(() => false);

	if(can_access) {
		await remove(process.env.BASE_DIR);
	}

	await mkdir(process.env.BASE_DIR);

	const git_clone = await promiseExec(`git clone -q --bare ${process.env.AVAIL_REPO_URL} ${process.env.BASE_DIR}/${process.env.AVAIL_REPO}`);

	if(git_clone.stderr) {
		throw(git_clone.stderr);
	}
}