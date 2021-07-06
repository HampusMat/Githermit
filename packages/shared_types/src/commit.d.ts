import { Author } from "./misc";

export type Hunk = {
	new_start: number,
	new_lines_cnt: number,
	new_lines: number[],
	old_start: number,
	old_lines_cnt: number,
	deleted_lines: number[],
	hunk: string
}

export type Patch = {
	additions: number,
	deletions: number,
	from: string,
	to: string,
	too_large: boolean,
	hunks: Hunk[]
}
export interface Commit {
	message: string,
	author: Author,
	date: number,
	insertions: number,
	deletions: number,
	files_changed: number,
	diff: Patch[]
}

export type LogCommit = {
	id: string,
	author: {
		name: string,
		email: string
	},
	message: string,
	date: number,
	insertions: number,
	deletions: number,
	files_changed: number
}

export type LatestCommit = {
	id: string,
	message: string,
	date: number
}