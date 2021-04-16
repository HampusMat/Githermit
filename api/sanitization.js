function sanitizeRepoName(dirty)
{
	const valid_repo_name = /^[a-zA-Z0-9\.\-_]+$/;
	if(valid_repo_name.test(dirty)) {
		return true;
	}
	return false;
}

module.exports.sanitizeRepoName = sanitizeRepoName;