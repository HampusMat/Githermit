const { spawn } = require("child_process");
const { differenceInMilliseconds } = require('date-fns');
const fs = require('fs');

function execGit(path, action, args = [""], error)
{
	const git = spawn("git", ["-C", path, action, args].concat(args));
	
	git.on("error", (err) =>
	{
		const no_such_file_or_dir = new RegExp(`cannot change to '${path.replace('/', "\/")}': No such file or directory\\n$`);

		if(no_such_file_or_dir.test(err.toString())) {
			error({ "error": 404 })
			return;
		}
		error({ "error": err });
	});

	git.stderr.on("data", () => error({ "error": "Failed to communicate with git!" }));

	return git;
}

function getLog(base_dir, path)
{
	return new Promise((resolve) =>
	{
		let log = [];

		const log_format='{"hash":"%H","author":"%an","author_email":"%ae","date":"%at","subject":"%s"}';
		const git = execGit(`${base_dir}/${path}`, "log", [`--format=format:${log_format}`, "--shortstat"], (err) => resolve(err));
		
		git.stdout.on("data", (data) =>
		{
			data = data.toString().split('\n').filter((item) => item != "");
			data[0] = JSON.parse(data[0]);

			["files changed", "insertions", "deletions"].forEach((stat) =>
			{
				const stat_nr = new RegExp(`(\\d+)\\ ${stat.replaceAll(/s(?=(\ |$))/g, "s?")}`).exec(data[1]);
				data[0][stat.replaceAll(" ", "_")] = stat_nr ? stat_nr[1] : 0;
			});

			log.push(data[0]);
		});
		
		git.on("close", (code) =>
		{
			if(code === 0) {
				resolve({ "data": log });
				return;
			}
			resolve({ "error": "Failed to communicate with git!" });
		});
	})
}

function getOptimalDateDifference(difference)
{
	const time_values = { "second": 1000, "minute": 60000, "hour": 3600000, "day": 86400000, "week": 604800000, "month": 2629800000, "year": 31557600000 };

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

function getTimeSinceLatestCommit(path)
{
	return new Promise((resolve) =>
	{
		const git = execGit(path, "log", [`--format=format:%at`, "-n 1"], (err) => resolve(err));

		const commit = [];

		git.stdout.on("data", (data) => commit.push(data));

		git.on("close", (code) =>
		{
			const commit_timestamp = new Date(Number(Buffer.concat(commit).toString()) * 1000);
			const now_date = new Date();

			resolve(getOptimalDateDifference(differenceInMilliseconds(now_date, commit_timestamp)));
		});
	});
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

function getRepos(base_dir)
{
	return new Promise((resolve) =>
	{
		fs.readdir(base_dir, async (err, content) =>
		{
			if(err) {
				resolve({ "error": err });
				return;
			}
			resolve({ "data": content });
		});
	});
}

module.exports.getLog = getLog;
module.exports.getBasicRepoInfo = getBasicRepoInfo;
module.exports.getRepos = getRepos;
module.exports.getRepoFile = getRepoFile;