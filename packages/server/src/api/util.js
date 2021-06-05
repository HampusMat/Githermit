const fs = require("fs");
const git = require("./git");

function verifyRepoName(dirty, base_dir)
{
	return new Promise((resolve) =>
	{
		const is_valid_repo_name = /^[a-zA-Z0-9\\.\-_]+$/.test(dirty);
		if(!is_valid_repo_name) {
			resolve("ERR_REPO_REGEX");
		}

		fs.readdir(base_dir, (err, dir_content) =>
		{
			if(err) {
				resolve("ERR_REPO_NOT_FOUND");
			}
			
			dir_content = dir_content.filter(repo => repo.endsWith(".git"));
			if(!dir_content.includes(dirty + ".git")) {
				resolve("ERR_REPO_NOT_FOUND");
			}
			
			resolve(true);
		});
	});
}

async function verifyCommitID(base_dir, repo, dirty)
{
	if(!/^[a-fA-F0-9]+$/.test(dirty)) {
		return "ERR_COMMIT_REGEX";
	}

	const commit_exists = await git.doesCommitExist(base_dir, repo, dirty);

	if(!commit_exists) {
		return "ERR_COMMIT_NOT_FOUND";
	}

	return true;
}

module.exports.verifyRepoName = verifyRepoName;
module.exports.verifyCommitID = verifyCommitID;