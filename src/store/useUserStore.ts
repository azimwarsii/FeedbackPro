import { create } from "zustand";

export type UserState = {
	id?: string;
	name?: string;
	email?: string;
	companyName?: string;
	bio?: string;
};

type UserActions = {
	setUser: (user: UserState) => void;
	updateProfile: (payload: Pick<UserState, "companyName" | "bio">) => void;
	reset: () => void;
};

export const useUserStore = create<UserState & UserActions>((set) => ({
	id: undefined,
	name: undefined,
	email: undefined,
	companyName: undefined,
	bio: undefined,
	setUser: (user) => set(() => ({ ...user })),
	updateProfile: ({ companyName, bio }) =>
		set((state) => ({
			...state,
			companyName: companyName ?? state.companyName,
			bio: bio ?? state.bio,
		})),
	reset: () =>
		set(() => ({
			id: undefined,
			name: undefined,
			email: undefined,
			companyName: undefined,
			bio: undefined,
		})),
}));
