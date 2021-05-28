const { formatDistance } = require('date-fns');
const fs = require('fs');
const git = require("nodegit");
const zlib = require("zlib");
const { spawn } = require('child_process');
const whatwg = require("whatwg-url");
const path = require("path");

function addRepoDirSuffix(repo_name)
{
	if(!repo_name.endsWith(".git")) {
		return repo_name + ".git";
	}
	return repo_name;
}

async function getLog(base_dir, repo_name)
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

	return await commits;
}

async function getTimeSinceLatestCommit(base_dir, repo_name)
{
	const repo = await git.Repository.openBare(`${base_dir}/${repo_name}`)
	const master_commit = await repo.getMasterCommit();

	return formatDistance(new Date(), master_commit.date());
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
		fs.readdir(base_dir, (err, dir_content) =>
		{
			if(err) {
				resolve({ "error": err });
				return;
			}
			
			dir_content.filter(repo => repo.endsWith(".git")).reduce((acc, repo) =>
			{
				return acc.then((repos) =>
				{
					return getRepoFile(base_dir, repo, "description").then((description) =>
					{
						return getRepoFile(base_dir, repo, "owner").then((owner) =>
						{
							return getTimeSinceLatestCommit(base_dir, repo).then((last_commit_date) =>
							{
								repos[repo.slice(0, -4)] = { "description": description, "owner": owner, "last_updated": last_commit_date };
								return repos;
							});
						});
					});
				});
			}, Promise.resolve({})).then((repos) =>
			{
				resolve(repos);
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

async function getCommit(base_dir, repo_name, commit_oid)
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
			if(/^diff --git/.test(line)) {
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
	}, Promise.resolve([ [], [], undefined ]));
	
	console.log(patch_header_data);

	const patches = await diff.patches();
	const parsed_patches = patches.reduce((acc, patch, patch_index) =>
	{
		return acc.then((arr) =>
		{
			return patch.hunks().then((hunks) =>
			{
				console.log("\n" + patch.newFile().path());
				
				const patch_start = patch_header_data[0][patch_index] + patch_header_data[1][patch_index];
				const patch_end = (patch_header_data[0][patch_index + 1] !== undefined) ? patch_header_data[0][patch_index + 1] : all_patches.length - 1;
				const patch_content = all_patches.slice(patch_start, patch_end);

				const line_lengths = patch_content.map((line) => line.length).reduce((acc, length) => acc + length);
				
				if(patch_content.length > 5000 || line_lengths > 5000) {
					console.log("Too large!");
					
					arr.push({
						from: patch.oldFile().path(),
						to: patch.newFile().path(),
						additions: patch.lineStats()["total_additions"],
						deletions: patch.lineStats()["total_deletions"],
						too_large: true,
						hunks: null
					});
					return arr;
				}

				// Go through all of the patch's hunks
				// Patches are split into parts of where in the file the change is made. Those parts are called hunks.
				return hunks.reduce((acc, hunk, hunk_index) =>
				{
					return acc.then((hunks_data) =>
					{
						const hunk_header = hunk.header();
						const hunk_header_index = patch_content.indexOf(hunk_header.replace(/\n/g, ""));

						if(hunks_data[0] !== undefined) {
							const prev_hunk = hunks[hunk_index - 1];
							hunks_data[1].push(Object.assign({
								new_start: prev_hunk.newStart(),
								new_lines: prev_hunk.newLines(),
								old_start: prev_hunk.oldStart(),
								old_lines: prev_hunk.oldLines(),
							}, parseHunkAddDel(patch_content.slice(hunks_data[0], hunk_header_index))));

							hunks_data[2] = hunks_data + patch_content.slice(hunks_data[0], hunk_header_index).length;
						}

						hunks_data[0] = hunk_header_index;
						return hunks_data;
					});
				}, Promise.resolve([ undefined, [], 0 ])).then((hunks_data) =>
				{
					const prev_hunk = hunks[hunks.length - 1];
					hunks_data[1].push(Object.assign({
						new_start: prev_hunk.newStart(),
						new_lines: prev_hunk.newLines(),
						old_start: prev_hunk.oldStart(),
						old_lines: prev_hunk.oldLines(),
					}, parseHunkAddDel(patch_content.slice(hunks_data[0], patch_end))));

					arr.push({
						from: patch.oldFile().path(),
						to: patch.isDeleted() ? "/dev/null" : patch.newFile().path(),
						additions: patch.lineStats()["total_additions"],
						deletions: patch.lineStats()["total_deletions"],
						too_large: false,
						hunks: hunks_data[1]
					});

					return arr;
				});
			});
		});
	}, Promise.resolve([]));

	return {
		hash: commit.sha(),
		author: commit.author().toString(),
		message: commit.message(),
		date: commit.date(),
		patches: await parsed_patches
	};
}

async function doesCommitExist(base_dir, repo_name, commit_oid)
{
	const repo = await git.Repository.openBare(`${base_dir}/${repo_name}`)

	try {
		await repo.getCommit(commit_oid);
		return true;
	}
	catch {
		return false;
	}
}

function connectToGitHTTPBackend(base_dir, req, reply)
{
	const url_path = req.url.replace(req.params.repo, req.params.repo + ".git");
	const repo = req.params.repo + ".git";
	const repo_path = path.join(base_dir, repo);

	req = req.headers['Content-Encoding'] == 'gzip' ? req.pipe(zlib.createGunzip()) : req;

	const parsed_url = new whatwg.URL(`${req.protocol}://${req.hostname}${url_path}`);
	const url_path_parts = parsed_url.pathname.split('/');
	
	let service;
	let info = false;

	if(/\/info\/refs$/.test(parsed_url.pathname)) {
		service = parsed_url.searchParams.get("service");
		info = true;
	}
	else {
		service = url_path_parts[url_path_parts.length-1];
	}
		
	const content_type = `application/x-${service}-${info ? "advertisement" : "result"}`;

	if(/\.\/|\.\./.test(parsed_url.pathname)) {
		reply.header("Content-Type", content_type);
		reply.code(404).send("Git repository not found!\n");
		return;
	}

	if(service !== 'git-upload-pack') {
		reply.header("Content-Type", content_type);
		reply.code(403).send("Access denied!\n");
		return;
	}
		
	reply.raw.writeHead(200, { "Content-Type": content_type });

	const spawn_args = [ "--stateless-rpc", repo_path ];

	if(info) {
		spawn_args.push("--advertise-refs");
	}

	const git_pack = spawn(service, spawn_args);
	
	if(info) {
		const s = '# service=' + service + '\n';
		const n = (4 + s.length).toString(16);
		reply.raw.write(Buffer.from((Array(4 - n.length + 1).join('0') + n + s) + '0000'));
	}
	else {
		req.body.on("data", (data) => git_pack.stdin.write(data));
		req.body.on("close", () => git_pack.stdin.end());
	}

	git_pack.on("error", (err) => console.log(err))
	git_pack.stderr.on("data", (stderr) => console.log(stderr));

	git_pack.stdout.on("data", (data) =>
	{
		reply.raw.write(data);
	});

	git_pack.on("close", () => reply.raw.end());
}

module.exports.getLog = getLog;
module.exports.getRepos = getRepos;
module.exports.getRepoFile = getRepoFile;
module.exports.getCommit = getCommit;
module.exports.doesCommitExist = doesCommitExist;
module.exports.connectToGitHTTPBackend = connectToGitHTTPBackend;