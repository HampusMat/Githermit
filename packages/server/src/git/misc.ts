import { readFile, readdir } from "fs";
import { createError, MiscError } from "./error";

export async function findAsync<T>(arr: T[], callback: (t: T) => Promise<boolean>): Promise<T> {
	const results = await Promise.all(arr.map(callback));
	const index = results.findIndex(result => result);
	return arr[index];
}

export function getFile(base_dir: string, repository: string, file: string): Promise<string> {
	return new Promise((resolve, reject) => {
		readFile(`${base_dir}/${repository}/${file}`, (err, content) => {
			if(err) {
				reject(createError(MiscError, 500, "Failed to open repository file " + file));
				return;
			}

			resolve(content.toString().replace(/\n/gu, ""));
		});
	});
}

export function getDirectory(directory: string): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		readdir(directory, (err, dir_content) => {
			if(err) {
				reject(createError(MiscError, 500, "Failed to open directory " + directory));
				return;
			}

			resolve(dir_content);
		});
	});
}