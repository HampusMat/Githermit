import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { exit } from "process";
import { Settings } from "./types";
import buildApp from "./app";

const settings = JSON.parse(readFileSync(join(__dirname, "/../../../settings.json"), "utf-8")) as Settings;

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
try {
	readdirSync(settings.git_dir);
}
catch {
	console.error(`Error: Git directory ${settings.git_dir} doesn't exist!`);
	exit(1);
}

const app = buildApp(settings);

app.listen(settings.port, settings.host, (err: Error, addr: string) => {
	if(err) {
		console.error(err);
		exit(1);
	}

	console.log(`Githermit is running on ${addr}`);
});