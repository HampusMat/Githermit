import {
	Branch, Commit,
	Hunk, Hunks,
	LatestCommit, LogCommit,
	Patch, PatchHeaderData,
	Repository, RequestInfo,
	ShortBranch, Tag,
	Tree, TreeEntry
} from "./git_types";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pack, pack } from "tar-stream";
import { join, parse } from "path";
import { readFile, readdir } from "fs";
import { IncomingMessage } from "http";
import { Route } from "../fastify_types";
import { URL } from "whatwg-url";
import { createGzip } from "zlib";
import nodegit from "nodegit";
import { pipeline } from "stream";
import { spawn } from "child_process";
import { verifyGitRequest } from "./util";

function getFullRepositoryName(repo_name: string) {
	return repo_name.endsWith(".git") ? repo_name : `${repo_name}.git`;
}

function getHunkContent(hunk: string[]) {
	interface Lines {
		new_lines: number[],
		deleted_lines: number[]
	}

	const lines = hunk.reduce((result: Lines, line, index) => {
		if(line.charAt(0) === "+") {
			hunk[index] = line.slice(1);
			result.new_lines.push(index);
		}
		else if(line.charAt(0) === "-") {
			hunk[index] = line.slice(1);
			result.deleted_lines.push(index);
		}
		return result;
	}, { new_lines: [], deleted_lines: [] });

	return { ...lines, hunk: hunk.join("\n") };
}

function getPatchHeaderData(patch_headers: string[], all_patches: string[]) {
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

function getHunks(hunks: nodegit.ConvenientHunk[], patch_content: string[]) {
	return hunks.reduce((hunks_data: Hunks, hunk, hunk_index) => {
		const hunk_header = hunk.header();
		const hunk_header_index = patch_content.indexOf(hunk_header.replace(/\n/gu, ""));

		if(hunks_data.prev !== null) {
			const prev_hunk = hunks[hunk_index - 1];
			hunks_data.hunks.push({
				new_start: prev_hunk.newStart(),
				new_lines_cnt: prev_hunk.newLines(),
				old_start: prev_hunk.oldStart(),
				old_lines_cnt: prev_hunk.oldLines(),
				...getHunkContent(patch_content.slice(hunks_data.prev, hunk_header_index))
			});
		}

		hunks_data.prev = hunk_header_index;
		return hunks_data;
	}, { prev: null, hunks: [] });
}

function getPatch(patch: nodegit.ConvenientPatch, too_large: boolean, hunks?: Hunk[]): Patch {
	return {
		from: patch.oldFile().path(),
		to: patch.newFile().path(),
		additions: patch.lineStats()["total_additions"],
		deletions: patch.lineStats()["total_deletions"],
		too_large: too_large,
		hunks: hunks || null
	};
}

interface Request extends FastifyRequest {
	params: Route["Params"],
}

function getRequestInfo(req: Request): RequestInfo {
	const repo = req.params.repo + ".git";
	const url_path = req.url.replace(req.params.repo, repo);

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

async function getTreeEntryLastCommit(repo: nodegit.Repository, tree_entry: nodegit.TreeEntry) {
	const walker = nodegit.Revwalk.create(repo);
	walker.pushHead();

	const raw_commits = await walker.getCommitsUntil(() => true);

	return raw_commits.reduce((acc, commit) => {
		return acc.then(result => {
			if(result.id === null) {
				return commit.getDiff().then(diffs => diffs[0].patches().then(patches => {
					let matching_path_patch = null;
					if(tree_entry.isBlob()) {
						matching_path_patch = patches.find(patch => patch.newFile().path() === tree_entry.path());
					}
					else {
						matching_path_patch = patches.find(patch => parse(patch.newFile().path()).dir.startsWith(tree_entry.path()));
					}

					if(matching_path_patch) {
						result.id = commit.sha();
						result.message = commit.message().replace(/\n/gu, "");
						result.date = commit.time();
					}
					return result;
				}));
			}

			return result;
		});
	}, Promise.resolve(<LatestCommit>{ id: null, message: null, date: null }));
}

function readDirectory(directory: string) {
	return new Promise<string[]>(resolve => {
		readdir(directory, (err, dir_content) => {
			if(err) {
				resolve([]);
			}

			resolve(dir_content);
		});
	});
}

async function addArchiveEntries(entries: nodegit.TreeEntry[], repo_name: string, archive: Pack) {
	for(const tree_entry of entries) {
		if(tree_entry.isBlob()) {
			const blob = await tree_entry.getBlob();
			archive.entry({ name: `${repo_name}/${tree_entry.path()}` }, blob.content().toString());
		}
		else if(tree_entry.isTree()) {
			const tree = await tree_entry.getTree();
			addArchiveEntries(tree.entries(), repo_name, archive);
		}
	}
}

function getTreeEntries(repo: nodegit.Repository, entries: nodegit.TreeEntry[]) {
	return entries.reduce((acc, entry) => {
		return acc.then(result => {
			return getTreeEntryLastCommit(repo, entry).then(last_commit => {
				result.push({
					name: parse(entry.path()).base,
					id: entry.sha(),
					type: entry.isBlob() ? "blob" : "tree",
					latest_commit: {
						id: last_commit.id,
						message: last_commit.message,
						date: last_commit.date
					}
				});
				return result;
			});
		});
	}, Promise.resolve(<TreeEntry[]>[]));
}

export class GitAPI {
	base_dir: string;

	constructor(base_dir: string) {
		this.base_dir = base_dir;
	}

	openRepository(repo_name: string): Promise<nodegit.Repository> {
		return nodegit.Repository.openBare(`${this.base_dir}/${getFullRepositoryName(repo_name)}`);
	}

	async getLog(repo_name: string): Promise<LogCommit[]> {
		const repo = await this.openRepository(repo_name);

		const walker: nodegit.Revwalk = nodegit.Revwalk.create(repo);
		walker.pushHead();

		const raw_commits = await walker.getCommitsUntil(() => true);

		return Promise.all(raw_commits.map(async commit => <LogCommit>{
			id: commit.sha(),
			author: {
				name: commit.author().name(),
				email: commit.author().email()
			},
			date: commit.time(),
			message: commit.message(),
			insertions: <number>(await (await commit.getDiff())[0].getStats()).insertions(),
			deletions: <number>(await (await commit.getDiff())[0].getStats()).deletions(),
			files_changed: <number>(await (await commit.getDiff())[0].getStats()).filesChanged()
		}));
	}

	async getRepositoryLastCommit(repo_name: string): Promise<number> {
		const repo = await this.openRepository(repo_name);

		const master_commit = await repo.getMasterCommit();

		return master_commit.time();
	}

	getRepositoryFile(repo_name: string, file: string): Promise<string | null> {
		return new Promise(resolve => {
			const full_repo_name = getFullRepositoryName(repo_name);
			readFile(`${this.base_dir}/${full_repo_name}/${file}`, (err, content) => {
				if(err) {
					resolve(null);
					return;
				}
				resolve(content.toString().replace(/\n/gu, ""));
			});
		});
	}

	async getRepositories(): Promise<Repository[] | null> {
		const dir_content = await readDirectory(this.base_dir);

		if(dir_content.length === 0) {
			return null;
		}

		return dir_content.filter(repo => repo.endsWith(".git")).reduce((acc, repo) => {
			return acc.then(repos => {
				return this.getRepositoryFile(repo, "description").then(description => {
					return this.getRepositoryFile(repo, "owner").then(owner => {
						return this.getRepositoryLastCommit(repo).then(last_commit_date => {
							repos.push({
								name: repo.slice(0, -4),
								description: description,
								owner: owner,
								last_updated: last_commit_date
							});
							return repos;
						});
					});
				});
			});
		}, Promise.resolve(<Repository[]>[]));
	}

	async getCommit(repo_name: string, commit_oid: string): Promise<Commit> {
		const repo = await this.openRepository(repo_name);
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

					arr.push(getPatch(patch, true));
					return arr;
				}

				const hunks_data = getHunks(hunks, patch_content);

				const prev_hunk = hunks[hunks.length - 1];
				hunks_data.hunks.push({
					new_start: prev_hunk.newStart(),
					new_lines_cnt: prev_hunk.newLines(),
					old_start: prev_hunk.oldStart(),
					old_lines_cnt: prev_hunk.oldLines(),
					...getHunkContent(patch_content.slice(<number>hunks_data.prev, patch_end))
				});

				arr.push(getPatch(patch, false, hunks_data.hunks));

				return arr;
			}));
		}, Promise.resolve(<Patch[]>[]));

		return {
			id: commit.sha(),
			author: {
				name: commit.author().name(),
				email: commit.author().email()
			},
			message: commit.message(),
			date: commit.time(),
			patches: await parsed_patches
		};
	}

	connectToGitHTTPBackend(req: Request, reply: FastifyReply): void {
		const request_info = getRequestInfo(req);

		const valid_request = verifyGitRequest(request_info);
		if(valid_request.success === false && valid_request.code) {
			reply.header("Content-Type", request_info.content_type);
			reply.code(valid_request.code).send(valid_request.message);
			return;
		}

		reply.raw.writeHead(200, { "Content-Type": request_info.content_type });

		const spawn_args = [ "--stateless-rpc", join(this.base_dir, request_info.repo) ];
		if(request_info.is_discovery) {
			spawn_args.push("--advertise-refs");
		}

		const git_pack = spawn(<string>request_info.service, spawn_args);

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

	async getTree(repo_name: string, tree_path: string | null): Promise<Tree | null> {
		const repo = await this.openRepository(repo_name);
		const master_commit = await repo.getMasterCommit();

		const tree = await master_commit.getTree();

		if(tree_path) {
			const path_entry = await tree.getEntry(tree_path)
				.catch(() => null);

			if(!path_entry) {
				return null;
			}

			if(path_entry.isBlob()) {
				return { type: "blob", content: (await path_entry.getBlob()).content().toString() };
			}

			const path_entry_tree = await path_entry.getTree();
			return { type: "tree", content: await getTreeEntries(repo, path_entry_tree.entries()) };
		}

		return { type: "tree", content: await getTreeEntries(repo, tree.entries()) };
	}

	async doesObjectExist(repo_name: string, id: string): Promise<boolean> {
		const repo = await this.openRepository(repo_name);

		return nodegit.Object.lookup(repo, nodegit.Oid.fromString(id), nodegit.Object.TYPE.ANY)
			.then(() => true)
			.catch(() => false);
	}

	async doesReadmeExist(repo_name: string): Promise<boolean> {
		const repo = await this.openRepository(repo_name);

		const master_commit = await repo.getMasterCommit();
		const tree = await master_commit.getTree();

		return tree.getEntry("README.md").catch(() => null)
			.then(() => true)
			.catch(() => false);
	}

	async getBranches(repo_name: string): Promise<ShortBranch[]> {
		const repo = await this.openRepository(repo_name);

		const references = await repo.getReferences();

		return references.filter(ref => ref.isBranch()).map(ref => {
			return {
				id: ref.target().tostrS(),
				name: ref.shorthand()
			};
		});
	}

	async getBranch(repo_name: string, branch_id: string): Promise<Branch | null> {
		const repo = await this.openRepository(repo_name);

		const references = await repo.getReferences();
		const branches = references.filter(ref => ref.isBranch());

		const branch = branches.find(_branch => _branch.target().tostrS() === branch_id);
		if(!branch) {
			return null;
		}

		const latest_commit = await repo.getBranchCommit(branch);

		return {
			id: branch.target().tostrS(),
			name: branch.shorthand(),
			latest_commit: {
				id: latest_commit.sha(),
				message: latest_commit.message(),
				date: latest_commit.time()
			}
		};
	}

	async getTags(repo_name: string): Promise<Tag[]> {
		const repo = await this.openRepository(repo_name);

		const references = await repo.getReferences();

		return Promise.all(references.filter(ref => ref.isTag()).map(async ref => {
			const tagger = (await nodegit.Tag.lookup(repo, ref.target())).tagger();

			return {
				name: ref.shorthand(),
				author: {
					name: tagger.name(),
					email: tagger.email()
				},
				date: tagger.when().time()
			};
		}));
	}

	async downloadTagArchive(repo_name: string, tag_name: string, reply: FastifyReply): Promise<void> {
		const repo = await this.openRepository(repo_name);

		const reference = await repo.getReference(tag_name)
			.catch(() => {
				reply.code(404).send("Tag not found!");
				return null;
			});
		if(!reference) {
			return;
		}

		const commit = await nodegit.Commit.lookup(repo, (await reference.peel(nodegit.Object.TYPE.COMMIT)).id());
		const tree = await commit.getTree();

		const archive = pack();
		const gzip = createGzip();

		reply.raw.writeHead(200, {
			"Content-Encoding": "gzip",
			"Content-Type": "application/gzip",
			"Content-Disposition": `attachment; filename="${repo_name}-${tag_name}.tar.gz"`
		});

		pipeline(archive, gzip, reply.raw, () => reply.raw.end());

		gzip.on("close", () => reply.raw.end());
		gzip.on("error", () => reply.raw.end());
		archive.on("error", () => reply.raw.end());

		addArchiveEntries(tree.entries(), repo_name, archive)
			.then(() => archive.finalize())
			.catch(() => {
				archive.finalize();
				reply.raw.end();
			});
	}
}