/**
 * Utilities for managing server-side cache
 *
 * @module cache
 */

import { caching, Cache } from "cache-manager";
import { cacheAllSources, CacheSource } from "./sources";
import { CacheConfig } from "../types";

export *as sources from "./sources";

export class ServerCache {
	private _cache: Cache;

	public ready = false;

	/**
	 * @param [config] - Cache configuration from the settings
	 */
	constructor(config?: Omit<CacheConfig, "enabled">) {
		this._cache = caching({
			store: "memory",
			max: config?.max || 5000000,
			ttl: config?.ttl || 120,
			refreshThreshold: config?.refreshThreshold || 80
		});
	}

	/**
	 * Returns the cache value specified in the source & caches it if need be
	 *
	 * @template T - The constructor of a cache source
	 * @param Source - Information about where to get the value from
	 * @param args - Source arguments
	 * @returns A value from the cache
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async receive<T extends new(...args: any[]) => CacheSource>(Source: T, ...args: ConstructorParameters<T>): Promise<unknown> {
		const source = new Source(...args);

		const result = await this._cache.wrap(source.key(), () => source.func()) as T;

		return source.post
			? source.post(result) as T
			: result;
	}

	/**
	 * Initialize the cache.
	 * This will cache all of the available sources.
	 *
	 * @param git_dir - A git directory
	 */
	public async init(git_dir: string): Promise<void> {
		if(this.ready === true) {
			throw(new Error("Cache has already been initialized!"));
		}

		await cacheAllSources(this, git_dir);

		this.ready = true;
	}
}