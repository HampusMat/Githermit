import { access, mkdir, remove, writeFile } from "fs-extra";
import { config } from "dotenv";
import { EnvironmentVariables } from "./util";
import { Clone } from "nodegit";

config({ path: "test/test.env" });

const env = process.env as EnvironmentVariables;

export default async function(): Promise<void> {
	const can_access = await access(env.GIT_DIR)
		.then(() => true)
		.catch(() => false);

	if(can_access) {
		await remove(env.GIT_DIR);
	}

	await mkdir(env.GIT_DIR);

	const repository = await Clone.clone(env.AVAIL_REPO_URL, `${env.GIT_DIR}/${env.AVAIL_REPO}`, { bare: 1 });

	const config = await repository.config();
	await config.setString("user.name", "BobDylan");
	await config.setString("user.email", "bob@example.com");

	await repository.fetchAll();
	await repository.createTag((await repository.getMasterCommit()).id(), "1.2", "Fixed stuff");

	await writeFile(`${env.GIT_DIR}/${env.AVAIL_REPO}/owner`, "Bob");
}