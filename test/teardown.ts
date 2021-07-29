import { remove } from "fs-extra";
import { EnvironmentVariables } from "./util";

const env = process.env as EnvironmentVariables;

export default async function(): Promise<void> {
	await remove(env.BASE_DIR);
}