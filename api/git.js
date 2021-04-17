const { exec } = require("child_process");
const { differenceInMilliseconds } = require('date-fns');
const fs = require('fs');

const log_format='{"hash": "%H", "author": "%an", "author_email": "%ae", "date": "%at", "subject": "%s"}';

function execGit(path, action , format, args = "")
{
	return new Promise((resolve) =>
	{
		exec(`git -C ${path} ${action} ${args} --format=format:'${format}'`, (error, stdout, stderr) =>
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

			resolve({ "data": stdout });
		});
	});
}

async function getLog(path)
{
	let log = await execGit(path, "log", log_format);

	if(!log["error"]) {
		log["data"] = log["data"].split('\n');
		log["data"].forEach((entry, index) => log["data"][index] = JSON.parse(entry));
	}

	return log;
}

function getOptimalDateDifference(difference)
{
	const time_values = {
		"second": 1000,
		"minute": 60000,
		"hour": 3600000,
		"day": 86400000,
		"week": 604800000,
		"month": 2629800000,
		"year": 31557600000
	};

	let last;
	for(const [key, value] of Object.entries(time_values)) {
		if(difference > value) {
			last = key;
			continue;
		}
		break;
	}

	return `${Math.round(difference / time_values[last])} ${last}s`;
}

async function getTimeSinceLatestCommit(path)
{
	let commit_timestamp = (await execGit(path, "log", "%at", "-n 1"));

	if(!commit_timestamp["error"]) {
		commit_timestamp = commit_timestamp["data"] * 1000;

		const commit_date = new Date(commit_timestamp);
		const now_date = new Date();

		const difference = getOptimalDateDifference(differenceInMilliseconds(now_date, commit_date));

		return difference;
	}
	return commit_timestamp;
}

function getRepoFile(base_dir, repo, file)
{
	return new Promise(resolve =>
	{
		fs.readFile(`${base_dir}/${repo}/${file}`, async (err, content) =>
		{			
			if(!err) {
				resolve(content.toString().replaceAll('\n', ''));
				return;
			}
			resolve("");
		});
	});
}

function getBasicRepoInfo(base_dir, repo_dirs)
{
	return new Promise((resolve) =>
	{
		let repos = {};
		repo_dirs.forEach(async (repo, index, arr) =>
		{
			const desc = await getRepoFile(base_dir, repo, "description");
			const owner = await getRepoFile(base_dir, repo, "owner");
			const last_commit_date = await getTimeSinceLatestCommit(`${base_dir}/${repo}`);

			let repo_name = "";
			repo_name = repo.slice(0, -4);
			repos[repo_name] = { "description": desc, "owner": owner, "last_updated": last_commit_date };

			if(index === 0) resolve(repos);
		});	
	});
}

module.exports.getLog = getLog;
module.exports.getBasicRepoInfo = getBasicRepoInfo;