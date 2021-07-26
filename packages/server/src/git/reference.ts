import { Reference as NodeGitReference } from "nodegit";
import { Repository } from "./repository";

type ReferenceClass<T> = new(owner: Repository, reference: NodeGitReference) => T;

export function isNodeGitReferenceBranch(ref: NodeGitReference): boolean {
	return Boolean(ref.isBranch());
}

export function isNodeGitReferenceTag(ref: NodeGitReference): boolean {
	return Boolean(ref.isTag());
}

/**
 * A representation of a reference
 */
export abstract class Reference {
	protected _ng_reference: NodeGitReference;
	protected _owner: Repository;

	public id: string;
	public name: string;

	/**
	 * @param owner - The repository which the reference is in
	 * @param reference - An instance of a Nodegit reference
	 */
	constructor(owner: Repository, reference: NodeGitReference) {
		this._ng_reference = reference;
		this._owner = owner;

		this.id = reference.target().tostrS();
		this.name = reference.shorthand();
	}

	public static async all<T>(owner: Repository, Target: ReferenceClass<T>, ref_fn: (ref: NodeGitReference) => boolean): Promise<T[]> {
		const references = await owner.nodegitRepository.getReferences();
		return references.filter(ref_fn).map(ref => new Target(owner, ref));
	}
}