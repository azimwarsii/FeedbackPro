export interface FetchedUser {
	_id?: string;
	id?: string;
	email?: string;
	name?: string;
	role?: "admin" | "user" | string;
	companyName?: string;
	bio?: string;
	createdAt?: string;
	updatedAt?: string;
}

