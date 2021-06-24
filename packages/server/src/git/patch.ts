import { Diff } from "./diff";
import { ConvenientPatch as NodeGitPatch } from "nodegit";

type Hunk = {
	new_start: number,
	new_lines_cnt: number,
	old_start: number,
	old_lines_cnt: number,
	new_lines: number[],
	deleted_lines: number[],
	hunk: string
}

type Hunks = {
	prev: null | number,
	hunks: Hunk[]
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

export class Patch {
	private _ng_patch: NodeGitPatch;

	public from: string;
	public to: string;
	public additions: number;
	public deletions: number;
	public too_large = false;
	public content: string | null = null;

	constructor(diff: Diff, patch: NodeGitPatch, index: number) {
		this._ng_patch = patch;

		this.from = patch.oldFile().path();
		this.to = patch.newFile().path();
		this.additions = patch.lineStats()["total_additions"];
		this.deletions = patch.lineStats()["total_deletions"];

		const raw_patches_arr = diff.raw_patches.split("\n");
		const start = diff.patch_header_indexes[index] + diff.patch_header_lengths[index];
		const end = (typeof diff.patch_header_indexes[index + 1] === "undefined") ? raw_patches_arr.length - 1 : diff.patch_header_indexes[index + 1];

		const patch_content = raw_patches_arr.slice(start, end);

		if(patch_content.length !== 0) {
			this.content = patch_content.join("\n");

			const line_lengths = patch_content.map(line => line.length).reduce((result, length) => result + length);

			if(patch_content.length > 5000 || line_lengths > 5000) {
				this.too_large = true;
			}
		}
	}

	async getHunks(): Promise<Hunk[] | null> {
		if(!this.content) {
			return null;
		}

		const content = this.content.split("\n");
		const hunks = await this._ng_patch.hunks();

		const hunks_data = hunks.reduce((result: Hunks, hunk, hunk_index) => {
			const hunk_header = hunk.header();
			const hunk_header_index = content.indexOf(hunk_header.replace(/\n/gu, ""));

			if(result.prev !== null) {
				const prev_hunk = hunks[hunk_index - 1];
				result.hunks.push({
					new_start: prev_hunk.newStart(),
					new_lines_cnt: prev_hunk.newLines(),
					old_start: prev_hunk.oldStart(),
					old_lines_cnt: prev_hunk.oldLines(),
					...getHunkContent(content.slice(result.prev, hunk_header_index))
				});
			}

			result.prev = hunk_header_index;
			return result;
		}, { prev: null, hunks: [] });

		const prev_hunk = hunks[hunks.length - 1];
		hunks_data.hunks.push({
			new_start: prev_hunk.newStart(),
			new_lines_cnt: prev_hunk.newLines(),
			old_start: prev_hunk.oldStart(),
			old_lines_cnt: prev_hunk.oldLines(),
			...getHunkContent(content.slice(<number>hunks_data.prev))
		});

		return hunks_data.hunks;
	}
}