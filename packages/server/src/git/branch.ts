import { CommitSummary } from "./commit";
import { Reference } from "./reference";
import { Repository } from "./repository";

export class Branch extends Reference {
	async latestCommit(): Promise<CommitSummary> {
		const latest_commit = this._owner.nodegitRepository.getBranchCommit(this._ng_reference);
		return {
			id: (await latest_commit).sha(),
			message: (await latest_commit).message(),
			date: (await latest_commit).time()
		};
	}

	static async lookup(owner: Repository, branch: string): Promise<Branch | null> {
		const reference = await owner.nodegitRepository.getBranch(branch).catch(err => {
			if(err.errno === -3) {
				return null;
			}
			throw(err);
		});
		return reference ? new Branch(owner, reference) : null;
	}
}