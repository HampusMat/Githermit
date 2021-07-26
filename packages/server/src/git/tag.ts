import { Object as NodeGitObject, Tag as NodeGitTag } from "nodegit";
import { Pack, pack } from "tar-stream";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { BaseTreeEntry, BlobTreeEntry, TreeEntry } from "./tree_entry";
import { createGzip } from "zlib";
import { pipeline } from "stream";
import { createError, TagError } from "./error";
import { Author } from "../../../shared_types/src";

async function addArchiveEntries(entries: BaseTreeEntry[], repository: string, archive: Pack) {
	for(const tree_entry of entries) {
		if(tree_entry instanceof BlobTreeEntry) {
			archive.entry({ name: `${repository}/${tree_entry.path}` }, await tree_entry.content());
		}
		else if(tree_entry instanceof TreeEntry) {
			await addArchiveEntries((await tree_entry.tree()).entries(), repository, archive);
		}
	}
}

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
		const tagger = (await NodeGitTag.lookup(this._owner.nodegitRepository, this._ng_reference.target())).tagger();
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
		return (await NodeGitTag.lookup(this._owner.nodegitRepository, this._ng_reference.target())).tagger().when()
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

		const archive = pack();
		const gzip = createGzip();

		reply.raw.writeHead(200, {
			"Content-Encoding": "gzip",
			"Content-Type": "application/gzip",
			"Content-Disposition": `attachment; filename="${this._owner.name.short}-${this._owner.name.short}.tar.gz"`
		});

		pipeline(archive, gzip, reply.raw, () => reply.raw.end());

		gzip.on("close", () => reply.raw.end());
		gzip.on("error", () => reply.raw.end());
		archive.on("error", () => reply.raw.end());

		addArchiveEntries(tree.entries(), this._owner.name.short, archive)
			.then(() => {
				archive.finalize();
			})
			.catch(() => {
				archive.finalize();
				reply.raw.end();
			});
	}

	/**
	 * Lookup a tag
	 *
	 * @param owner - The repository which the tag is in
	 * @param tag - The SHA of the tag to look for
	 * @returns An instance of a tag
	 */
	public static async lookup(owner: Repository, tag: string): Promise<Tag> {
		const reference = await owner.nodegitRepository.getReference(tag).catch(err => {
			if(err.errno === -3) {
				throw(createError(TagError, 404, "Tag not found"));
			}

			throw(createError(TagError, 404, "Failed to get tag"));
		});

		return new Tag(owner, reference);
	}
}