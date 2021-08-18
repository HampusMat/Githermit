import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { exit } from "process";
import { Settings } from "./types";
import buildApp from "./app";
import { ServerCache } from "./cache";

async function main() {
	const settings = JSON.parse(await readFile(join(__dirname, "/../../../settings.json"), { encoding: "utf-8" })) as Settings;

	const settings_keys = Object.keys(settings);

	const mandatory_settings = [ "host", "port", "title", "about", "git_dir" ];

	// Get missing mandatory settings
	const settings_not_included = mandatory_settings.filter(x => !settings_keys.includes(x));

	// Error out and exit if there's any missing settings
	if(settings_not_included.length !== 0) {
		console.log(`Error: settings file is missing ${(settings_not_included.length > 1) ? "keys" : "key"}:`);
		console.log(settings_not_included.join(", "));
		exit(1);
	}

	// Make sure that the git directory specified in the settings actually exists
	await readdir(settings.git_dir).catch(() => {
		console.error(`Error: Git directory ${settings.git_dir} doesn't exist!`);
		exit(1);
	});

	const cache = (settings.cache && settings.cache.enabled === true) || settings.cache === undefined || settings.cache.enabled === undefined
		? new ServerCache(settings.cache)
		: null;

	if(cache) {
		await cache.init(settings.git_dir);
		if(!cache.ready) {
			console.error("Error: cache failed to initialize!");
			return 1;
		}
	}

	const app = await buildApp(settings, cache);

	app.listen(settings.port, settings.host, (err: Error, addr: string) => {
		if(err) {
			console.error(err);
			exit(1);
		}

		console.log(`Githermit is running on ${addr}`);
	});
}

main();