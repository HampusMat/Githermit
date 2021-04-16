const { exec } = require("child_process");

const log_format='{"hash": "%H", "author": "%an", "author_email": "%ae", "date": "%at", "subject": "%s"}'

function getLog(path)
{
	return new Promise((resolve) =>
	{
		exec(`git -C ${path} log --format=format:'${log_format}'`, (error, stdout, stderr) =>
		{
			if(error) {
				const no_such_fileor_dir = new RegExp(`cannot change to '${path.replace('/', "\/")}': No such file or directory\\n$`);

				if(no_such_fileor_dir.test(error.message)) {
					resolve({ "error": 404 });
					return;
				}
				resolve({ "error": error.message });
				return;
			}
			if(stderr) {
				resolve({ "error": "Failed to communicate with git!" });
				return;
			}

			const log = stdout.split('\n');
			log.forEach((entry, index) => log[index] = JSON.parse(entry));

			resolve({ "data": log });
		});
	});
}

function getTimeSinceLatestCommit(path)
{
	return new Promise((resolve) =>
	{
		exec(`git -C ${path} log -n 1 --date=unix'`, (error, stdout, stderr) =>
		{
			if(error) {
				const no_such_fileor_dir = new RegExp(`cannot change to '${path.replace('/', "\/")}': No such file or directory\\n$`);

				if(no_such_fileor_dir.test(error.message)) {
					resolve({ "error": 404 });
					return;
				}
				resolve({ "error": error.message });
				return;
			}
			if(stderr) {
				resolve({ "error": "Failed to communicate with git!" });
				return;
			}

			const 

			resolve({ "data": log });
		});
	});
}

module.exports.getLog = getLog;