const { formatDistance } = require('date-fns');
const fs = require('fs');
const git = require("nodegit");

function addRepoDirSuffix(repo_name)
{
	if(!repo_name.endsWith(".git")) {
		return repo_name + ".git";
	}
	return repo_name;
}

function getLog(base_dir, repo_name)
{
	return new Promise(async (resolve) =>
	{
		const repo = await git.Repository.openBare(`${base_dir}/${repo_name}`)

		const walker = git.Revwalk.create(repo);
		walker.pushHead();

		const raw_commits = await walker.getCommits();
		
		const commits = Promise.all(raw_commits.map(async commit => ({
			commit: commit.sha(),
			author_full: commit.author().toString(),
			author_name: commit.author().name(),
			author_email: commit.author().email(),
			date: commit.date(),
			message: commit.message().replace(/\n/g, ""),
			insertions: (await (await commit.getDiff())[0].getStats()).insertions(),
			deletions: (await (await commit.getDiff())[0].getStats()).deletions(),
			files_changed: (await (await commit.getDiff())[0].getStats()).filesChanged()
		})));		

		resolve(await commits);
	});
}

function getTimeSinceLatestCommit(base_dir, repo_name)
{
	return new Promise(async (resolve) =>
	{
		const repo = await git.Repository.openBare(`${base_dir}/${repo_name}`)
		const master_commit = await repo.getMasterCommit();

		resolve(formatDistance(new Date(), master_commit.date()));
	});
}

function getRepoFile(base_dir, repo, file)
{
	return new Promise(resolve =>
	{
		fs.readFile(`${base_dir}/${repo}/${file}`, async (err, content) =>
		{			
			if(!err) {
				resolve(content.toString().replace(/\n/g, ""));
				return;
			}
			resolve("");
		});
	});
}

function getRepos(base_dir)
{
	return new Promise((resolve) =>
	{
		fs.readdir(base_dir, async (err, dir_content) =>
		{
			if(err) {
				resolve({ "error": err });
				return;
			}
			
			dir_content = dir_content.filter(repo => repo.endsWith(".git"));

			let repos = {};

			dir_content.forEach(async (repo, index) =>
			{
				const desc = await getRepoFile(base_dir, repo, "description");
				const owner = await getRepoFile(base_dir, repo, "owner");
				const last_commit_date = await getTimeSinceLatestCommit(base_dir, repo);

				let repo_name = "";
				repo_name = repo.slice(0, -4);
				repos[repo_name] = { "description": desc, "owner": owner, "last_updated": last_commit_date };

				if(index === 0) {
					resolve(repos);
				}
			});
		});
	});
}

function parseHunkAddDel(hunk)
{
	let new_lines = [];
	let deleted_lines = [];

	hunk.forEach((line, index) =>
	{
		if(line.charAt(0) === '+') {
			hunk[index] = line.slice(1);
			new_lines.push(index);
		}
		else if(line.charAt(0) === '-') {
			hunk[index] = line.slice(1);
			deleted_lines.push(index);
		}
	});

	return { new: new_lines, deleted: deleted_lines, hunk: hunk.join("\n") };
}

function getCommit(base_dir, repo_name, commit_oid)
{
	return new Promise(async (resolve) =>
	{
		repo_name = addRepoDirSuffix(repo_name);

		const repo = await git.Repository.openBare(`${base_dir}/${repo_name}`)
		const commit = await repo.getCommit(commit_oid);
		const diff = (await commit.getDiff())[0];
		const all_patches = (await diff.toBuf(1)).split('\n');

		// Get the count of lines for all of patches's headers
		const patch_headers = (await diff.toBuf(2)).split('\n');
		const patch_header_data = await patch_headers.reduce((acc, line, index) =>
		{
			return acc.then((arr) =>
			{
				if(/^diff\ --git/.test(line)) {
					arr[0].push(all_patches.indexOf(line));
					
					if(arr[2] != undefined) {
						arr[1].push(patch_headers.slice(arr[2], index).length);
					}
					arr[2] = index;
				}
				else if(index == patch_headers.length - 1 && arr[2] != undefined) {
					arr[1].push(patch_headers.slice(arr[2], index).length);
				}
				return arr;
			});
		}, Promise.resolve([[], [], undefined]));
		
		console.log(patch_header_data);

		const patches = await diff.patches();
		const test = patches.reduce((acc, patch, patch_index) =>
		{
			return acc.then((arr) =>
			{
				return patch.hunks().then((hunks) =>
				{
					console.log(patch.newFile().path());
					
					// Go through all of the patch's hunks
					// Patches are split into parts of where in the file the change is made. Those parts are called hunks.
					return hunks.reduce((acc, hunk, hunk_index) =>
					{
						return acc.then((hunks_data) =>
						{
							const hunk_header = hunk.header();
							//const hunk_header_index = all_patches.indexOf(hunk_header.replace(/\n/g, ""));
							const hunk_header_index = patch_header_data[0][patch_index] + hunks_data[2] + patch_header_data[1][patch_index];
							
							if(hunks_data[0] !== undefined) {
								const prev_hunk = hunks[hunk_index - 1];
								//console.log(all_patches.slice(last_index, hunk_header_index));
								hunks_data[1].push(Object.assign({
									new_start: prev_hunk.newStart(),
									new_lines: prev_hunk.newLines(),
									old_start: prev_hunk.oldStart(),
									old_lines: prev_hunk.oldLines(),
								}, parseHunkAddDel(all_patches.slice(hunks_data[0], hunk_header_index))));

								hunks_data[2] = hunks_data + all_patches.slice(hunks_data[0], hunk_header_index).length;
							}
	
							hunks_data[0] = hunk_header_index;
							return hunks_data;
						});
					}, Promise.resolve([undefined, [], 0])).then((hunks_data) =>
					{
						console.log("	Patch start: " + hunks_data[0] + "	" + all_patches[hunks_data[0]]);

						const patch_end = (patch_header_data[0][patch_index + 1] !== undefined) ? patch_header_data[0][patch_index + 1] : all_patches.length;
						console.log("	Patch end: " + patch_end + "		" + all_patches[patch_end]);

						const prev_hunk = hunks[hunks.length - 1];
						hunks_data[1].push(Object.assign({
							new_start: prev_hunk.newStart(),
							new_lines: prev_hunk.newLines(),
							old_start: prev_hunk.oldStart(),
							old_lines: prev_hunk.oldLines(),
						}, parseHunkAddDel(all_patches.slice(hunks_data[0], patch_end))));

						if(patch_index === 8 || patch_index === 7) {
							console.log(all_patches.slice(hunks_data[0], patch_end));
						}
						
						arr.push({ from: patch.oldFile().path(), to: patch.newFile().path(), hunks: hunks_data[1] });

						return arr;
					});
				});
			});
		}, Promise.resolve([]));

		test.then((result) =>
		{
			resolve({
				hash: commit.sha(),
				author: commit.author().toString(),
				message: commit.message(),
				date: commit.date(),
				patches: result
			});
			//console.log(result);
		});
	});
}

module.exports.getLog = getLog;
module.exports.getRepos = getRepos;
module.exports.getRepoFile = getRepoFile;
module.exports.getCommit = getCommit;