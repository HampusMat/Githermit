import { ErrorType } from "./types";

export * from "./types";

export class ServerError extends Error {
	code: number;

	constructor(where: string, error_type: { code: number, message: string }) {
		super(`A ${where} error has occured: ${error_type.message}`);

		this.name = "Server Error";
		this.code = error_type.code;
	}
}

export enum ErrorWhere {
	Repository = "repository",
	Tree = "tree",
	Tag = "tag",
	Branch = "branch",
	Commit = "commit",
	Diff = "diff",
	Misc = "misc",
	Blob = "blob",
	Patch = "patch"
}

/**
 * A error factory
 *
 * @param where - Where the error has occured
 * @param err_type - What type of error it is
 * @param args - Parameters for the error type
 *
 * @returns A server error
 *
 * @example Example usage:
 * import { ErrorType, NotFoundError, createError } from "./error";
 *
 * throw(createError(ErrorType.Repository, NotFoundError, "chili sauce"));
 */
export function createError<T extends new (...args: string[]) => ErrorType>(where: ErrorWhere, ErrType: T, ...args: ConstructorParameters<T>): ServerError;

/**
 * A error factory
 *
 * @param where - Where the error has occured
 * @param err_type - What type of error it is
 *
 * @returns A server error
 *
 * @example Example usage:
 * import { ErrorType, UnknownError, createError } from "./error";
 *
 * throw(createError(ErrorType.Repository, UnknownError));
 */
export function createError<T extends new () => ErrorType>(where: ErrorWhere, ErrType: T): ServerError;

export function createError<T extends new(...args: string[]) => ErrorType>(where: ErrorWhere, ErrType: T, ...args: ConstructorParameters<T>): ServerError {
	return new ServerError(where, new ErrType(...args));
}