import { readFile, readdir } from "fs";

export async function findAsync<T>(arr: T[], callback: (t: T) => Promise<boolean>): Promise<T> {
	const results = await Promise.all(arr.map(callback));
	const index = results.findIndex(result => result);
	return arr[index];
}

export type Author = {
	name: string,
	email: string
}

export function getFile(base_dir: string, repository: string, file: string): Promise<string | null> {
	return new Promise(resolve => {
		readFile(`${base_dir}/${repository}/${file}`, (err, content) => {
			if(err) {
				resolve(null);
				return;
			}
			resolve(content.toString().replace(/\n/gu, ""));
		});
	});
}

export function getDirectory(directory: string): Promise<string[]> {
	return new Promise<string[]>(resolve => {
		readdir(directory, (err, dir_content) => {
			if(err) {
				resolve([]);
			}

			resolve(dir_content);
		});
	});
}