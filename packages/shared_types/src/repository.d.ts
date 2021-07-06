interface RepositoryBase {
	name: string,
	description: string
}

export interface RepositorySummary extends RepositoryBase {
	last_updated: number | string
}

export interface Repository extends RepositoryBase {
	has_readme: boolean
}