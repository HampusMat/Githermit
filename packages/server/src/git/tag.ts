import { Object as NodeGitObject, Tag as NodeGitTag } from "nodegit";
import { Pack, pack } from "tar-stream";
import { Author } from "./misc";
import { Blob } from "./blob";
import { Commit } from "./commit";
import { FastifyReply } from "fastify";
import { Reference } from "./reference";
import { Repository } from "./repository";
import { Tree } from "./tree";
import { TreeEntry } from "./tree_entry";
import { createGzip } from "zlib";
import { pipeline } from "stream";

async function addArchiveEntries(entries: TreeEntry[], repository: string, archive: Pack) {
	for(const tree_entry of entries) {
		const peeled = (await tree_entry.peel());

		if(tree_entry.type === "blob") {
			if(peeled instanceof Blob) {
				archive.entry({ name: `${repository}/${tree_entry.path}` }, await peeled.content());
			}
		}
		else if(peeled instanceof Tree) {
			addArchiveEntries(peeled.entries(), repository, archive);
		}
	}
}

export class Tag extends Reference {
	async author(): Promise<Author> {
		const tagger = (await NodeGitTag.lookup(this._owner.nodegitRepository, this._ng_reference.target())).tagger();
		return {
			name: tagger.name(),
			email: tagger.email()
		};
	}

	async date(): Promise<number> {
		return (await NodeGitTag.lookup(this._owner.nodegitRepository, this._ng_reference.target())).tagger().when()
			.time();
	}

	async downloadTarball(reply: FastifyReply): Promise<void> {
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

		addArchiveEntries(await tree.entries(), this._owner.name.short, archive)
			.then(() => archive.finalize())
			.catch(() => {
				archive.finalize();
				reply.raw.end();
			});
	}

	static async lookup(owner: Repository, tag: string): Promise<Tag | null> {
		const reference = await owner.nodegitRepository.getReference(tag).catch(err => {
			if(err.errno === -3) {
				return null;
			}

			throw(err);
		});
		return reference ? new Tag(owner, reference) : null;
	}
}