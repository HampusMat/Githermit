function sanitizeRepoName(dirty)
{
	const valid_repo_name = /^[a-zA-Z0-9\.\-_]+$/;
	return valid_repo_name.test(dirty);
}

function sanitizeCommitID(dirty)
{
	const valid_commit_id = /^[a-fA-F0-9]{40}$/;
	return valid_commit_id.test(dirty);
}

module.exports.sanitizeRepoName = sanitizeRepoName;
module.exports.sanitizeCommitID = sanitizeCommitID;