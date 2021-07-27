import { Reference as NodeGitReference } from "nodegit";
import { Repository } from "./repository";

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
}