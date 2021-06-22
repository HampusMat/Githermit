export interface Hunk {
	new_start: number,
	new_lines_cnt: number,
	old_start: number,
	old_lines_cnt: number,
	new_lines: number[],
	deleted_lines: number[],
	hunk: string
}
export interface Patch {
	from: string,
	to: string,
	additions: number,
	deletions: number,
	too_large: boolean,
	hunks: Hunk[] | null
}
export interface RequestInfo {
	repo: string,
	url_path: string,
	parsed_url: URL,
	url_path_parts: string[],
	is_discovery: boolean,
	service: string | null,
	content_type: string
}
export interface LatestCommit {
	id: string | null,
	message: string | null,
	date: number | null
}
export interface ShortTreeEntry {
	name: string,
	id: string,
	type: "blob" | "tree",
	latest_commit: LatestCommit
}
export type Tree = {
	type: "blob" | "tree",
	content: string | ShortTreeEntry[]
}
export interface ShortRepository {
	name: string,
	description: string | null,
	owner: string | null,
	last_updated: number
}
export type Author = {
	name: string,
	email: string
}
export type LogCommit = {
	id: string,
	author: Author,
	date: number,
	message: string,
	insertions: number,
	deletions: number,
	files_changed: number
}
export type ShortCommit = {
	id: string,
	author: Author,
	message: string,
	date: number,
	patches: Patch[]
}
export interface Hunks {
	prev: null | number,
	hunks: Hunk[]
}
export interface ShortBranch {
	id: string,
	name: string
}
export interface Branch extends ShortBranch {
	latest_commit: LatestCommit
}
export type ShortTag = {
	name: string,
	date: number,
	author: Author
}
export type PatchHeaderData = {
	indexes: number[],
	lengths: number[],
	last: number | null
}