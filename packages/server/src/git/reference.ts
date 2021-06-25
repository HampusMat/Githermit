import { Reference as NodeGitReference } from "nodegit";
import { Repository } from "./repository";

export abstract class Reference {
	protected _ng_reference: NodeGitReference;
	protected _owner: Repository;

	public id: string;
	public name: string;

	constructor(owner: Repository, reference: NodeGitReference) {
		this._ng_reference = reference;
		this._owner = owner;

		this.id = reference.target().tostrS();
		this.name = reference.shorthand();
	}
}