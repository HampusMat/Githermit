import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";
import { exit } from "process";
import { Settings } from "./types";
import buildApp from "./app";

const settings = load(readFileSync(join(__dirname, "/../../../settings.yml"), "utf8")) as Settings;
const settings_keys = Object.keys(settings);

const mandatory_settings = [ "host", "port", "dev_port", "title", "about", "base_dir", "production" ];

// Make sure that all the required settings are present
const settings_not_included = mandatory_settings.filter(x => !settings_keys.includes(x));
if(settings_not_included.length !== 0) {
	console.log(`Error: settings.yml is missing ${(settings_not_included.length > 1) ? "keys" : "key"}:`);
	console.log(settings_not_included.join(", "));
	exit(1);
}

// Make sure that there's not an excessive amount of settings
const mandatory_not_included = settings_keys.filter(x => !mandatory_settings.includes(x));
if(mandatory_not_included.length !== 0) {
	console.log(`Error: settings.yml includes ${(mandatory_not_included.length > 1) ? "pointless keys" : "a pointless key"}:`);
	console.log(mandatory_not_included.join(", "));
	exit(1);
}

// Make sure that the base directory specified in the settings actually exists
try {
	readdirSync(settings.base_dir);
}
catch {
	console.error(`Error: Tried opening the base directory. No such directory: ${settings.base_dir}`);
	exit(1);
}

const dist_dir = join(__dirname, "/../../client/dist");

if(settings.production) {
	try {
		readdirSync(dist_dir);
	}
	catch {
		console.error("Error: Tried opening the dist directory but it doesn't exist.\nDid you accidentally turn on the production setting?");
		exit(1);
	}
}

const app = buildApp(settings, dist_dir);

app.listen(settings.port, settings.host, (err: Error, addr: string) => {
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`App is running on ${addr}`);
});