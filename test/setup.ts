import { access, mkdir, remove } from "fs-extra";
import { promisify } from "util";
import { exec } from "child_process";
import { config } from "dotenv";
import { EnvironmentVariables } from "./util";

const promiseExec = promisify(exec);
config({ path: "test/test.env" });

const env = process.env as EnvironmentVariables;

export default async function init() {
	const can_access = await access(env.BASE_DIR)
		.then(() => true)
		.catch(() => false);

	if(can_access) {
		await remove(env.BASE_DIR);
	}

	await mkdir(env.BASE_DIR);

	const git_clone = await promiseExec(`git clone -q --bare ${env.AVAIL_REPO_URL} ${env.BASE_DIR}/${env.AVAIL_REPO}`);

	if(git_clone.stderr) {
		throw(git_clone.stderr);
	}

	const git_fetch = await promiseExec(`git -C ${env.BASE_DIR}/${env.AVAIL_REPO} fetch -q --all`);

	if(git_fetch.stderr) {
		throw(git_fetch.stderr);
	}
}