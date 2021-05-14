const { spawn } = require("child_process");
const { formatDistance } = require('date-fns');
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

	git.stderr.on("data", (err) => error({ "error": "Failed to communicate with git!", "message": err.toString() }));

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

function getTimeSinceLatestCommit(path)
{
	return new Promise((resolve) =>
	{
		const git = execGit(path, "log", [`--format=format:%at`, "-n 1"], (err) => resolve(err));

		const commit = [];

		git.stdout.on("data", (data) => commit.push(data));

		git.on("close", (code) =>
		{
			resolve(formatDistance(new Date(), new Date(Number(Buffer.concat(commit).toString()) * 1000)));
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

function parseCommitFilePart(part)
{
	let new_lines = [];
	let deleted_lines = [];
	let old_from;
	let old_to;
	let from;
	let to;

	if(/^@@\ -[0-9,]+\ \+[0-9,]+\ @@/.test(part[0])) {
		const from_to = /^@@\ (-[0-9,]+)\ (\+[0-9,]+)\ @@(?:\ (.*))?/.exec(part[0]);

		old_from = Number(from_to[1].split(',')[0].slice(1));
		old_to = Number(from_to[1].split(',')[1]);

		from = Number(from_to[2].split(',')[0].slice(1));
		to = Number(from_to[2].split(',')[1]);

		if(old_from === 1 || from === 1) {
			part = part.slice(1);
		}
	}
	else {
		old_from = 1;
		old_to = part.length - new_lines.length;

		from = 1;
		to = part.length - deleted_lines.length;
	}

	part.forEach((line, index) =>
	{
		if(line.charAt(0) === '+') {
			line = line.slice(1);
			new_lines.push(index);
		}
		else if(line.charAt(0) === '-') {
			line = line.slice(1);
			deleted_lines.push(index);
		}
		else {
			["+", "-"].forEach((char) =>
			{
				const find_char = new RegExp(`(?<=^<span.*>)\\${char}(?=.*<\/span>)`);
				if(find_char.test(line)) {
					console.log(`${char} ${line}`);
					const char_index = find_char.exec(line)["index"];
					line = line.slice(0, char_index) + line.slice(char_index + 1)
					if(char === "+") {
						new_lines.push(index);
					}
					else if(char === "-") {
						deleted_lines.push(index);
					}
				}
			})
		}
		part[index] = line;
	});

	return { "new_lines": new_lines, "deleted_lines": deleted_lines, "old_from": old_from, "old_to": old_to, "from": from, "to": to, "part": part.join("\n") };
}

function getCommit(base_dir, repo, hash)
{
	return new Promise((resolve) =>
	{
		const git = execGit(`${base_dir}/${repo}`, "show", ['--format=format:{\"hash\": \"%H\", \"author\": \"%an <%ae>\", \"date\": \"%at\", \"message\": \"%s\"}', hash], (err) => resolve(err));

		let commit = [];

		git.stdout.on("data", (data) =>
		{
			commit.push(data);
		});
		
		git.on("close", () =>
		{
			let diff = commit.toString().split('\n').slice(1);

			var result = [];

			let start;
			diff.forEach((line, index) =>
			{
				if(/^diff\ --git a\/[^\ ]+\ b\/[^\ ]+$/.test(line) || index === diff.length - 1) {
					if(start != undefined) {
						let file_diff = diff.slice(start, index);
						let chunk_header_index = file_diff.findIndex((line) => /^@@\ -[0-9,]+\ \+[0-9,]+\ @@/.test(line));
						if(chunk_header_index === -1) {
							chunk_header_index = file_diff.length;
						}

						let file_info = {};
						let header;
						
						console.log(file_diff.join("\n"));
						if(chunk_header_index != file_diff.length) {
							const from_to = file_diff.slice(chunk_header_index - 2, chunk_header_index);
							file_info["from"] = from_to[0].slice(4);
							file_info["to"] = from_to[1].slice(4);

							const chunk_header = /^@@\ (-[0-9,]+)\ (\+[0-9,]+)\ @@(?:\ (.*))?/.exec(file_diff[chunk_header_index]);

							file_info["from_file_range"] = chunk_header[1];
							file_info["to_file_range"] = chunk_header[2];

							let raw_diff = file_diff.slice(chunk_header_index);
							let parsed_diff = [];

							let last_diff_start = 0;
							raw_diff.forEach((diff_line, diff_index) =>
							{
								console.log(raw_diff.length + " " + diff_index + " " + diff_line);
								if(/^@@\ -[0-9,]+\ \+[0-9,]+\ @@/.test(diff_line) && diff_index !== 0) {
									let part = parseCommitFilePart(raw_diff.slice(last_diff_start, diff_index));
									parsed_diff.push(part);
									last_diff_start = diff_index;
								}
								else if(diff_index === raw_diff.length - 1) {
									let part = parseCommitFilePart(raw_diff.slice(last_diff_start, diff_index + 1));
									parsed_diff.push(part);
								}
							});

							console.log(raw_diff);

							file_info["diff"] = parsed_diff;


							header = file_diff.slice(1, chunk_header_index - 2);
						}
						else {
							const from_to = /^diff\ --git (a\/[^\ ]+)\ (b\/[^\ ]+)$/.exec(file_diff[0]);
							file_info["from"] = from_to[1];
							file_info["to"] = from_to[2];
							header = file_diff.slice(1, chunk_header_index);
						}
						
						header.forEach((line) =>
						{
							if(line.includes("old mode") || line.includes("new mode") || line.includes("deleted file mode") || line.includes("new file mode")) {
								const data = /^(.*mode)\ (\d{6})$/.exec(line);
								file_info[data[1].replaceAll(' ', "_")] = data[2];
							}
							else if(line.includes("copy from") || line.includes("copy to")) {
								const data = /^(copy\ from|to)\ (.*)/.exec(line);
								file_info[data[1].replaceAll(' ', "_")] = data[2];
							}
							else if(line.includes("rename from") || line.includes("rename to")) {
								const data = /^(rename\ from|to)\ (.*)/.exec(line);
								file_info[data[1].replaceAll(' ', "_")] = data[2];
							}
							else if(line.includes("similarity index") || line.includes("dissimilarity index")) {
								const data = /^((?:dis)?similarity\ index)\ (\d+%)$/.exec(line);
								file_info[data[1].replaceAll(' ', "_")] = data[2];
							}
							else if(line.includes("index")) {
								const data = /^index\ ([0-9a-f,]+)\.\.([0-9a-f,]+)(?:\ ([0-9,]+))?$/.exec(line).slice(1);
								file_info["index"] = { "before": data[0], "after": data[1] };
								if(data[2]) {
									file_info["index"]["mode"] = data[2];
								}
							}
						});
						result.push(file_info);
					}
					start = index;
				}
				if(index === diff.length - 1) {
					let data = JSON.parse(commit.toString().split('\n').slice(0,1)[0]);
					data["files"] = result;
					resolve({ "data": data });
				}
			});
		});
	})
}

module.exports.getLog = getLog;
module.exports.getBasicRepoInfo = getBasicRepoInfo;
module.exports.getRepos = getRepos;
module.exports.getRepoFile = getRepoFile;
module.exports.getCommit = getCommit;