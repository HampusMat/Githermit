export abstract class ErrorType {
	code: number;
	message: string;

	constructor(code: number, message: string) {
		this.code = code;
		this.message = message;
	}
}

export class UnknownError extends ErrorType {
	constructor() {
		super(500, "Unknown error!");
	}
}

export class NotFoundError extends ErrorType {
	constructor(target: string) {
		super(404, `${target} not found!`);
	}
}

export class FailedError extends ErrorType {
	constructor(attempt: string) {
		super(500, `Failed to ${attempt}!`);
	}
}

export class IsNotError extends ErrorType {
	constructor(target: string, not: string) {
		super(500, `${target} is not a ${not}!`);
	}
}

export class CommitNotSignedError extends ErrorType {
	constructor() {
		super(500, "Commit isn't signed!");
	}
}

export class NotInKeyringError extends ErrorType {
	constructor(email: string) {
		super(500, `A public key for '${email}' doesn't exist in the server pgp keyring!`);
	}
}

export class PatchTooLargeError extends ErrorType {
	constructor() {
		super(500, "Patch is too large for parsing!");
	}
}

export class DiffTooLargeError extends ErrorType {
	constructor() {
		super(500, "Diff is too large for parsing!");
	}
}