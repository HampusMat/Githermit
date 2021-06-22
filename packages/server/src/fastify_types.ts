import { ReplyGenericInterface } from "fastify/types/reply";
import { RequestGenericInterface } from "fastify";

export interface Request extends RequestGenericInterface {
	Params: {
		[key: string]: string
	},
	Querystring: {
		[key: string]: string
	}
}

export interface Route extends Request, ReplyGenericInterface {}