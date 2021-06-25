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

type PatchBounds = {
	start: number,
	end: number
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
	private _diff: Diff;

	public from: string;
	public to: string;
	public additions: number;
	public deletions: number;

	constructor(diff: Diff, patch: NodeGitPatch) {
		this._ng_patch = patch;
		this._diff = diff;

		this.from = patch.oldFile().path();
		this.to = patch.newFile().path();
		this.additions = patch.lineStats()["total_additions"];
		this.deletions = patch.lineStats()["total_deletions"];
	}

	private async bounds(index: number): Promise<PatchBounds> {
		const raw_patches = await (await this._diff.rawPatches()).split("\n");
		const patch_header_data = await this._diff.patchHeaderData();

		return {
			start: patch_header_data.indexes[index] + patch_header_data.lengths[index],
			end: (typeof patch_header_data.indexes[index + 1] === "undefined") ? raw_patches.length - 1 : patch_header_data.indexes[index + 1]
		};
	}

	private async content(index: number): Promise<string> {
		const raw_patches = await (await this._diff.rawPatches()).split("\n");
		const bounds = await this.bounds(index);

		return raw_patches.slice(bounds.start, bounds.end).join("\n");
	}

	public async isTooLarge(index: number): Promise<boolean> {
		const content = (await this.content(index)).split("\n");
		const line_lengths = content.map(line => line.length).reduce((result, length) => result + length);

		if(content.length > 5000 || line_lengths > 5000) {
			return true;
		}

		return false;
	}

	public async getHunks(index: number): Promise<Hunk[] | null> {
		const content = (await this.content(index)).split("\n");
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