const yaml = require("js-yaml");
const fs = require("fs");

const settings = yaml.load(fs.readFileSync(`${__dirname}/../../settings.yml`, "utf8"));

module.exports = {
	devServer: {
		host: settings.host,
		port: settings.dev_port,
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
