import { ConvenientHunk, Repository, Revwalk, TreeEntry } from "nodegit";
import { join, parse } from "path";
import { readFile, readdir } from "fs";
import { FastifyRequest } from "fastify";
import { IncomingMessage } from "http";
import { URL } from "whatwg-url";
import { formatDistance } from "date-fns";
import { spawn } from "child_process";
import { verifyGitRequest } from "./util";

function addRepoDirSuffix(repo_name: string) {
	return repo_name.endsWith(".git") ? repo_name : `${repo_name}.git`;
}

function parseHunkAddDel(hunk: string[]) {
	interface Lines {
		new_lines: number[],
		deleted_lines: number[]
	}

	const lines = hunk.reduce((lines_obj: Lines, line, index) => {
		if(line.charAt(0) === "+") {
			hunk[index] = line.slice(1);
			lines_obj.new_lines.push(index);
		}
		else if(line.charAt(0) === "-") {
			hunk[index] = line.slice(1);
			lines_obj.deleted_lines.push(index);
		}
		return lines_obj;
	}, { new_lines: [], deleted_lines: [] });

	return Object.assign(lines, { hunk: hunk.join("\n") });
}

function getPatchHeaderData(patch_headers: string[], all_patches: string[]) {
	interface PatchHeaderData {
		indexes: number[],
		lengths: number[],
		last: number | null
	};

	return patch_headers.reduce((patch_header_data, line, index) => {
		// The start of a patch header
		if((/^diff --git/u).test(line)) {
			patch_header_data.indexes.push(all_patches.indexOf(line));

			if(patch_header_data.last !== null) {
				patch_header_data.lengths.push(patch_headers.slice(patch_header_data.last, index).length);
			}
			patch_header_data.last = index;
		}

		// Include the last patch header when the end is reached
		if(index === patch_headers.length - 1 && patch_header_data.last !== null) {
			patch_header_data.lengths.push(patch_headers.slice(patch_header_data.last, index).length);
		}

		return patch_header_data;
	}, <PatchHeaderData>{ indexes: [], lengths: [], last: null });
}

function getHunksData(hunks: ConvenientHunk[], patch_content: string[]) {
	return hunks.reduce((hunks_data, hunk, hunk_index) => {
		const hunk_header = hunk.header();
		const hunk_header_index = patch_content.indexOf(hunk_header.replace(/\n/gu, ""));

		if(hunks_data.prev !== null) {
			const prev_hunk = hunks[hunk_index - 1];
			hunks_data.hunks.push({
				new_start: prev_hunk.newStart(),
				new_lines: prev_hunk.newLines(),
				old_start: prev_hunk.oldStart(),
				old_lines: prev_hunk.oldLines(),
				...parseHunkAddDel(patch_content.slice(hunks_data.prev, hunk_header_index))
			});
		}

		hunks_data.prev = hunk_header_index;
		return hunks_data;
	}, { prev: null, hunks: [] });
}

function Patch(patch, too_large, hunks) {
	this.from = patch.oldFile().path();
	this.to = patch.newFile().path();
	this.additions = patch.lineStats()["total_additions"];
	this.deletions = patch.lineStats()["total_deletions"];
	this.too_large = too_large;
	this.hunks = hunks;
}

export type GitRequestInfo = {
	repo: string,
	url_path: string,
	parsed_url: URL,
	url_path_parts: string[],
	is_discovery: boolean,
	service: string | null,
	content_type: string
};

function extractRequestInfo(req: FastifyRequest): GitRequestInfo {
	const params: any = req.params;

	const repo = params.repo + ".git";
	const url_path = req.url.replace(params.repo, repo);

	const parsed_url = new URL(`${req.protocol}://${req.hostname}${url_path}`);
	const url_path_parts = parsed_url.pathname.split("/");

	const is_discovery = (/\/info\/refs$/u).test(parsed_url.pathname);

	const service = is_discovery ? parsed_url.searchParams.get("service") : url_path_parts[url_path_parts.length - 1];

	const content_type = `application/x-${service}-${is_discovery ? "advertisement" : "result"}`;

	return {
		repo,
		url_path,
		parsed_url,
		is_discovery,
		url_path_parts,
		service,
		content_type
	};
}

async function getTreeEntryLastCommit(repo: Repository, tree_entry: TreeEntry) {
	const walker = Revwalk.create(repo);
	walker.pushHead();

	interface LastTreeEntryCommit {
		id: string | null,
		message: string | null,
		date: Date | null
	};

	const raw_commits = await walker.getCommitsUntil(() => true);

	return raw_commits.reduce((acc, commit) => acc.then(obj => {
		if(obj.id === null) {
			return commit.getDiff().then(diffs => diffs[0].patches().then(patches => {
				let matching_path_patch = null;
				if(tree_entry.isBlob()) {
					matching_path_patch = patches.find(patch => patch.newFile().path() === tree_entry.path());
				}
				else {
					matching_path_patch = patches.find(patch => parse(patch.newFile().path()).dir.startsWith(tree_entry.path()));
				}

				if(matching_path_patch) {
					obj.id = commit.sha();
					obj.message = commit.message().replace(/\n/gu, "");
					obj.date = commit.date();
				}
				return obj;
			}));
		}

		return obj;
	}), Promise.resolve(<LastTreeEntryCommit>{ id: null, message: null, date: null }));
}

export class Git {
	base_dir: string;

	constructor(base_dir: string) {
		this.base_dir = base_dir;
	}

	async getLog(repo_name: string) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);

		const walker: Revwalk = Revwalk.create(repo);
		walker.pushHead();

		const raw_commits = await walker.getCommitsUntil(() => true);

		const commits = await Promise.all(raw_commits.map(async commit => ({
			commit: commit.sha(),
			author_full: commit.author().toString(),
			author_name: commit.author().name(),
			author_email: commit.author().email(),
			date: commit.date(),
			message: commit.message().replace(/\n/gu, ""),
			insertions: (await (await commit.getDiff())[0].getStats()).insertions(),
			deletions: (await (await commit.getDiff())[0].getStats()).deletions(),
			files_changed: (await (await commit.getDiff())[0].getStats()).filesChanged()
		})));

		return commits;
	}

	async getTimeSinceLatestCommit(repo_name: string) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);

		const master_commit = await repo.getMasterCommit();

		return formatDistance(new Date(), master_commit.date());
	}

	getRepoFile(repo_name: string, file: string) {
		return new Promise(resolve => {
			const full_repo_name = addRepoDirSuffix(repo_name);
			readFile(`${this.base_dir}/${full_repo_name}/${file}`, (err, content) => {
				if(!err) {
					resolve(content.toString().replace(/\n/gu, ""));
					return;
				}
				resolve("");
			});
		});
	}

	getRepos() {
		return new Promise(resolve => {
			readdir(this.base_dir, (err: Error, dir_content: string[]) => {
				if(err) {
					resolve({ "error": err });
					return;
				}

				dir_content.filter(repo => repo.endsWith(".git")).reduce((acc, repo) => {
					return acc.then((repos: any) => {
						return this.getRepoFile(repo, "description").then(description => {
							return this.getRepoFile(repo, "owner").then(owner => {
								return this.getTimeSinceLatestCommit(repo).then(last_commit_date => {
									repos[repo.slice(0, -4)] = { "description": description, "owner": owner, "last_updated": last_commit_date };
									return repos;
								});
							});
						});
					});
				}, Promise.resolve({}))
					.then(repos => {
						resolve(repos);
					});
			});
		});
	}

	async getCommit(repo_name: string, commit_oid: string) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);
		const commit = await repo.getCommit(commit_oid);
		const diff = (await commit.getDiff())[0];
		const all_patches = (await diff.toBuf(1)).toString().split("\n");
		const patch_header_data = getPatchHeaderData((await diff.toBuf(2)).toString().split("\n"), all_patches);

		const parsed_patches = (await diff.patches()).reduce((acc, patch, patch_index) => {
			return acc.then(arr => patch.hunks().then(hunks => {
				const patch_start = patch_header_data.indexes[patch_index] + patch_header_data.lengths[patch_index];
				const patch_end = (typeof patch_header_data.indexes[patch_index + 1] === "undefined") ? all_patches.length - 1 : patch_header_data.indexes[patch_index + 1];
				const patch_content = all_patches.slice(patch_start, patch_end);

				const line_lengths = patch_content.map(line => line.length).reduce((result, length) => result + length);

				if(patch_content.length > 5000 || line_lengths > 5000) {
					console.log("Too large!");

					arr.push(new Patch(patch, true, null));
					return arr;
				}

				const hunks_data = getHunksData(hunks, patch_content);

				const prev_hunk = hunks[hunks.length - 1];
				hunks_data.hunks.push({
					new_start: prev_hunk.newStart(),
					new_lines: prev_hunk.newLines(),
					old_start: prev_hunk.oldStart(),
					old_lines: prev_hunk.oldLines(),
					...parseHunkAddDel(patch_content.slice(hunks_data.prev, patch_end))
				});

				arr.push(new Patch(patch, false, hunks_data.hunks));

				return arr;
			}));
		}, Promise.resolve([]));

		return {
			hash: commit.sha(),
			author: commit.author().toString(),
			message: commit.message(),
			date: commit.date(),
			patches: await parsed_patches
		};
	}

	connectToGitHTTPBackend(req, reply) {
		const request_info = extractRequestInfo(req);

		const valid_request = verifyGitRequest(request_info);
		if(valid_request.success === false) {
			reply.header("Content-Type", request_info.content_type);
			reply.code(valid_request.code).send(valid_request.message);
			return;
		}

		reply.raw.writeHead(200, { "Content-Type": request_info.content_type });

		const spawn_args = [ "--stateless-rpc", join(this.base_dir, request_info.repo) ];
		if(request_info.is_discovery) {
			spawn_args.push("--advertise-refs");
		}

		const git_pack = spawn(request_info.service, spawn_args);

		if(request_info.is_discovery) {
			const s = "# service=" + request_info.service + "\n";
			const n = (4 + s.length).toString(16);
			reply.raw.write(Buffer.from((Array(4 - n.length + 1).join("0") + n + s) + "0000"));
		}
		else {
			const request_body: IncomingMessage = req.raw;

			request_body.on("data", data => git_pack.stdin.write(data));
			request_body.on("close", () => git_pack.stdin.end());
		}

		git_pack.on("error", err => console.log(err));

		git_pack.stderr.on("data", (stderr: Buffer) => console.log(stderr.toString()));
		git_pack.stdout.on("data", data => reply.raw.write(data));

		git_pack.on("close", () => reply.raw.end());
	}

	async getTree(repo_name, tree_path) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);
		const master_commit = await repo.getMasterCommit();

		const tree = await master_commit.getTree();

		let entries = [];
		if(tree_path) {
			try {
				const path_entry = await tree.getEntry(tree_path);

				if(path_entry.isBlob()) {
					return { type: "blob", content: (await path_entry.getBlob()).content().toString() };
				}

				entries = await (await path_entry.getTree()).entries();
			}
			catch(err) {
				if(err.errno === -3) {
					return { error: 404 };
				}
				return { error: 500 };
			}
		}
		else {
			entries = tree.entries();
		}

		return {
			type: "tree",
			tree: await entries.reduce((acc, entry) => {
				return acc.then(obj => {
					return getTreeEntryLastCommit(repo, entry).then(last_commit => {
						obj[parse(entry.path()).base] = {
							oid: entry.oid(),
							type: entry.isBlob() ? "blob" : "tree",
							last_commit: {
								id: last_commit.id,
								message: last_commit.message,
								date: last_commit.date
							}
						};
						return obj;
					});
				});
			}, Promise.resolve({}))
		};
	}

	async doesCommitExist(repo_name, commit_oid) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);

		try {
			await repo.getCommit(commit_oid);
			return true;
		}
		catch {
			return false;
		}
	}

	async doesReadmeExist(repo_name) {
		const full_repo_name = addRepoDirSuffix(repo_name);
		const repo = await Repository.openBare(`${this.base_dir}/${full_repo_name}`);

		const master_commit = await repo.getMasterCommit();
		const tree = await master_commit.getTree();

		const readme = await tree.getEntry("README.md").catch(() => null);

		return Boolean(readme);
	}
};