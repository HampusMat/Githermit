import { Diff as NodeGitDiff } from "nodegit";
import { Patch } from "./patch";

type PatchHeaderData = {
	indexes: number[],
	lengths: number[],
	last: number | null
}

type DiffConstructorData = {
	patch_buf: string,
	patch_header_buf: string
}

export class Diff {
	private _ng_diff: NodeGitDiff;

	public raw_patches: string;
	public patch_header_indexes: number[];
	public patch_header_lengths: number[];

	constructor(diff: NodeGitDiff, data: DiffConstructorData) {
		this._ng_diff = diff;
		this.raw_patches = data.patch_buf;

		const raw_patches_arr = this.raw_patches.split("\n");
		const patch_headers = data.patch_header_buf.split("\n");

		const patch_header_data = patch_headers.reduce((result, line, index) => {
			// The start of a patch header
			if((/^diff --git/u).test(line)) {
				result.indexes.push(raw_patches_arr.indexOf(line));

				if(result.last !== null) {
					result.lengths.push(patch_headers.slice(result.last, index).length);
				}
				result.last = index;
			}

			// Include the last patch header when the end is reached
			if(index === patch_headers.length - 1 && result.last !== null) {
				result.lengths.push(patch_headers.slice(result.last, index).length);
			}

			return result;
		}, <PatchHeaderData>{ indexes: [], lengths: [], last: null });

		this.patch_header_indexes = patch_header_data.indexes;
		this.patch_header_lengths = patch_header_data.lengths;

	}

	async getPatches(): Promise<Patch[]> {
		return (await this._ng_diff.patches()).map((patch, index) => new Patch(this, patch, index));
	}

	static async get(diff: NodeGitDiff): Promise<Diff> {
		return new Diff(diff, {
			patch_buf: String((await diff.toBuf(1))),
			patch_header_buf: String((await diff.toBuf(2)))
		});
	}
}