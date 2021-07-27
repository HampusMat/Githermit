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

interface HunkLines {
	new_lines: number[],
	deleted_lines: number[]
}

interface ProcessedHunk extends HunkLines {
	hunk: string
}

/**
 * Prepare a hunk for further usage
 *
 * @param hunk - The hunk to process
 * @returns A processed hunk
 */
function sliceAndCountHunk(hunk: string[]): ProcessedHunk {
	const lines = hunk.reduce((result: HunkLines, line, index) => {
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

/**
 * A representation of a patch
 */
export class Patch {
	private _ng_patch: NodeGitPatch;
	private _diff: Diff;
	private _index: number;

	public from: string;
	public to: string;
	public additions: number;
	public deletions: number;

	/**
	 * @param diff - The commit diff that contains the patch
	 * @param patch - An instance of Nodegit patch
	 */
	constructor(diff: Diff, patch: NodeGitPatch, index: number) {
		this._ng_patch = patch;
		this._diff = diff;
		this._index = index;

		this.from = patch.oldFile().path();
		this.to = patch.newFile().path();
		this.additions = patch.lineStats()["total_additions"];
		this.deletions = patch.lineStats()["total_deletions"];
	}

	/**
	 * Returns patch's bounds
	 *
	 * @remarks
	 *
	 * These bounds are in the context of it's whole diff
	 *
	 * @returns A patch bounds instance which contains a start & an end property
	 */
	private async _bounds(): Promise<PatchBounds> {
		const raw_patches = (await this._diff.rawPatches()).split("\n");
		const patch_header_data = await this._diff.patchHeaderData();

		return {
			start: patch_header_data.indexes[this._index] + patch_header_data.lengths[this._index],
			end: (typeof patch_header_data.indexes[this._index + 1] === "undefined") ? raw_patches.length - 1 : patch_header_data.indexes[this._index + 1]
		};
	}

	/**
	 * Returns the patch's content
	 */
	private async _content(): Promise<string> {
		const raw_patches = (await this._diff.rawPatches()).split("\n");
		const bounds = await this._bounds();

		return raw_patches.slice(bounds.start, bounds.end).join("\n");
	}

	/**
	 * Returns if the patch is too large or not
	 *
	 * @returns Whether or not the patch is too large
	 */
	public async isTooLarge(): Promise<boolean> {
		const content = (await this._content()).split("\n");
		const line_lengths = content.map(line => line.length).reduce((result, length) => result + length);

		if(content.length > 5000 || line_lengths > 5000) {
			return true;
		}

		return false;
	}

	/**
	 * Returns the patch's hunks
	 *
	 * @returns An array of hunk instances
	 */
	public async getHunks(): Promise<Hunk[] | null> {
		const content = (await this._content()).split("\n");
		const hunks = await this._ng_patch.hunks();

		if(hunks.length === 0) {
			return null;
		}

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
					...sliceAndCountHunk(content.slice(result.prev, hunk_header_index))
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
			...sliceAndCountHunk(content.slice(<number>hunks_data.prev))
		});

		return hunks_data.hunks;
	}
}