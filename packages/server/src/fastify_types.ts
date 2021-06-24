import { FastifyRequest, RequestGenericInterface } from "fastify";
import { ReplyGenericInterface } from "fastify/types/reply";

export interface Request extends RequestGenericInterface {
	Params: {
		[key: string]: string
	},
	Querystring: {
		[key: string]: string
	}
}

export interface Route extends Request, ReplyGenericInterface {}

export type CoolFastifyRequest = FastifyRequest<Route>;