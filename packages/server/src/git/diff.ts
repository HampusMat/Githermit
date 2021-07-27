import { Diff as NodeGitDiff } from "nodegit";
import { Patch } from "./patch";

type PatchHeaderData = {
	indexes: number[],
	lengths: number[],
	last: number | null
}

/**
 * A representation of a diff
 */
export class Diff {
	private _ng_diff: NodeGitDiff;

	/**
	 * @param diff A Nodegit diff
	 */
	constructor(diff: NodeGitDiff) {
		this._ng_diff = diff;
	}

	/**
	 * Returns all of the diff's patches in a raw format
	 */
	public async rawPatches(): Promise<string> {
		return String(await this._ng_diff.toBuf(1));
	}

	/**
	 * Returns information about patch headers
	 *
	 * @returns The indexes and lengths of patch headers
	 */
	public async patchHeaderData(): Promise<Omit<PatchHeaderData, "last">> {
		const raw_patches = (await this.rawPatches()).split("\n");
		const patch_headers = String(await this._ng_diff.toBuf(2)).split("\n");

		return patch_headers.reduce((result, line, index) => {
			// The start of a patch header
			if((/^diff --git/u).test(line)) {
				result.indexes.push(raw_patches.indexOf(line));

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
	}

	/**
	 * Returns the diff's patches
	 *
	 * @returns An array of patch instances
	 */
	public async patches(): Promise<Patch[]> {
		return (await this._ng_diff.patches()).map((patch, index) => new Patch(this, patch, index));
	}
}