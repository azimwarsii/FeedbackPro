import { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			email?: string;
			name?: string;
		} & DefaultSession["user"];
	}
}

export interface SessionUser {
	id: string;
	email?: string;
	name?: string;
}

