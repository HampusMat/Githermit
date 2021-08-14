import { Object as NodeGitObject, Tag as NodeGitTag } from "nodegit";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { createGzip } from "zlib";
import { pipeline } from "stream";
import { createError, ErrorWhere, FailedError, NotFoundError } from "./error";
import { Author } from "../../../api/src";
import { promisify } from "util";

/**
 * A representation of a tag
 *
 * @extends Reference
 */
export class Tag extends Reference {
	/**
	 * Returns the tag's author
	 *
	 * @returns An instance of an author
	 */
	public async author(): Promise<Author> {
		const tagger = (await NodeGitTag.lookup(this._owner.ng_repository, this._ng_reference.target())).tagger();
		return {
			name: tagger.name(),
			email: tagger.email()
		};
	}

	/**
	 * Returns the tag's creation date
	 *
	 * @returns A Unix Epoch timestamp for the tag's date
	 */
	public async date(): Promise<number> {
		return (await NodeGitTag.lookup(this._owner.ng_repository, this._ng_reference.target())).tagger().when()
			.time();
	}

	/**
	 * Download the tag's tarball
	 *
	 * @param reply - A Fastify reply
	 */
	public async downloadTarball(reply: FastifyReply): Promise<void> {
		const commit = await Commit.lookup(this._owner, (await this._ng_reference.peel(NodeGitObject.TYPE.COMMIT)).id());
		const tree = await commit.tree();

		reply.raw.writeHead(200, {
			"Content-Encoding": "gzip",
			"Content-Type": "application/gzip",
			"Content-Disposition": `attachment; filename="${this._owner.name.short}-${this._owner.name.short}.tar.gz"`
		});

		const archive = await tree.createArchive().catch((err: Error) => err);

		if(archive instanceof Error) {
			console.log(archive);
			reply.raw.end();
			return;
		}

		const gzip = createGzip();

		promisify(pipeline)(archive, gzip, reply.raw);

		// Gzip error
		gzip.on("error", err => {
			console.log(err);
			reply.raw.end();
		});

		// Tar error
		archive.on("error", err => {
			console.log(err);
			reply.raw.end();
		});
	}

	/**
	 * Lookup a tag
	 *
	 * @param owner - The repository which the tag is in
	 * @param tag - The name of the tag to look for
	 * @returns An instance of a tag
	 */
	public static async lookup(owner: Repository, tag: string): Promise<Tag> {
		const reference = await owner.ng_repository.getReference(tag).catch(err => {
			if(err.errno === -3) {
				throw(createError(ErrorWhere.Tag, NotFoundError, "Tag"));
			}

			throw(createError(ErrorWhere.Tag, FailedError, "get tag"));
		});

		return new Tag(owner, reference);
	}
}