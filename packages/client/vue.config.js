const fs = require("fs");
const path = require("path");

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "/../../settings.json"), "utf-8"));

module.exports = {
	devServer: {
		host: settings.host,
		port: settings.dev.port,
		proxy: {
			"^/api": {
				target: `http://${settings.host}:${settings.port}`,
				changeOrigin: true
			},
			"^/[a-zA-Z0-9\\.\\-_]+/info/refs": {
				target: `http://${settings.host}:${settings.port}`,
				changeOrigin: true
			},
			"^/[a-zA-Z0-9\\.\\-_]+/git-upload-pack": {
				target: `http://${settings.host}:${settings.port}`,
				changeOrigin: true
			}
		}
	},
	chainWebpack: config => {
		config
			.plugin("html")
			.tap(args => {
				args[0].title = settings.title;
				return args;
			});
	}
};