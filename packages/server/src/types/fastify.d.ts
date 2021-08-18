import { FastifyRequest, RequestGenericInterface } from "fastify";
import { ReplyGenericInterface } from "fastify/types/reply";
import { Settings } from ".";
import { ServerCache } from "../cache";

export interface Request extends RequestGenericInterface {
	Params: Record<string, string>,
	Querystring: Record<string, string>
}

export interface Route extends Request, ReplyGenericInterface {}

export type CoolFastifyRequest = FastifyRequest<Route>;

export type FastifyPluginOptions = {
	config: {
		settings: Settings,
		cache: ServerCache | null
	}
}