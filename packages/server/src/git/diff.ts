import { Diff as NodeGitDiff } from "nodegit";
import { Patch } from "./patch";

type PatchHeaderData = {
	indexes: number[],
	lengths: number[],
	last: number | null
}

export class Diff {
	private _ng_diff: NodeGitDiff;

	constructor(diff: NodeGitDiff) {
		this._ng_diff = diff;
	}

	public async rawPatches(): Promise<string> {
		return String(await this._ng_diff.toBuf(1));
	}

	public async patchHeaderData(): Promise<PatchHeaderData> {
		const raw_patches = await this.rawPatches();
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

	public async patches(): Promise<Patch[]> {
		return (await this._ng_diff.patches()).map(patch => new Patch(this, patch));
	}
}