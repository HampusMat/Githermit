type Params = {
	[key: string]: string | string[]
}

export function getParam(params: Params, param: string): string {
	return params[param].toString();
}
