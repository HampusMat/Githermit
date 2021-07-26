import { readFile, readdir } from "fs";
import { createError, MiscError } from "./error";

/**
 * Asynchronously find an item in an array that matches the requirements set by the callback
 *
 * @param arr - The array to look in
 * @param callback - A callback that knowns what you're looking for
 * @returns The item in the array you wanted to find
 */
export async function findAsync<T>(arr: T[], callback: (t: T) => Promise<boolean>): Promise<T> {
	const results = await Promise.all(arr.map(callback));
	const index = results.findIndex(result => result);
	return arr[index];
}

/**
 * Returns the content of a file inside a repository
 *
 * @param base_dir - The directory which the repository is in
 * @param repository - The directory of a bare repository
 * @param file - The path of a file
 */
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

/**
 * Returns all of the files & folders inside of a directory
 *
 * @param directory - The directory to look in
 * @returns An array of directory content
 */
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