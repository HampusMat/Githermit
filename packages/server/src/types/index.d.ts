export type CacheConfig = {
	enabled: boolean,
	ttl?: number,
	max?: number,
	refreshThreshold?: number
}

export type Settings = {
	host: string,
	port: number,
	title: string,
	about: string,
	git_dir: string,
	cache?: CacheConfig,
	dev?: {
		port: number
	}
}