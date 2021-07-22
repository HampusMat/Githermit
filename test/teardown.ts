import { remove } from "fs-extra";

export default async function teardown() {
	await remove(process.env.BASE_DIR);
}