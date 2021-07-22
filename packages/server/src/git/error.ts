export abstract class BaseError implements Error {
	code: number;
	name: string;
	message: string;
	stack?: string | undefined;

	constructor(code: number, message: string) {
		this.name = "Githermit Error";

		this.code = code;
		this.message = message;
	}
}

export class RepositoryError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A repository error has occured: " + message);
	}
}

export class BranchError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A branch error has occured: " + message);
	}
}

export class TagError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A tag error has occured: " + message);
	}
}

export class TreeError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A tree error has occured: " + message);
	}
}

export class BlobError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A blob error has occured: " + message);
	}
}

export class MiscError extends BaseError {
	constructor(code: number, message: string) {
		super(code, "A misc error has occured: " + message);
	}
}

type ErrorConstructorType<T> = new (code: number, message: string) => T;

export function createError<E extends BaseError>(ErrorConstructor: ErrorConstructorType<E>, code: number, message: string): E {
	return new ErrorConstructor(code, message);
}