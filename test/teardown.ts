import { remove } from "fs-extra";

export default async function(): Promise<void> {
	await remove(process.env.BASE_DIR);
}