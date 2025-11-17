import { create } from "zustand";

export interface Response {
	_id?: string;
	id?: string;
	userId: string;
	surveyId: string;
	campaignId: string;
	responders_email: string;
	responders_phone: string;
	answers: any[];
	started_at: string;
	completed_at?: string;
	bot_score?: number;
	is_suspected_bot?: boolean;
	reward_amount?: number;
	reward_status?: "pending" | "paid" | "declined";
	ip_address?: string;
	user_agent?: string;
	createdAt?: string;
	updatedAt?: string;
}

type ResponsesState = {
	responses: Response[];
};

type ResponsesActions = {
	addResponse: (response: Response) => void;
	setResponses: (responses: Response[]) => void;
	updateResponse: (id: string, updates: Partial<Response>) => void;
	removeResponse: (id: string) => void;
	reset: () => void;
};

export const useResponseStore = create<ResponsesState & ResponsesActions>((set) => ({
	responses: [],
	addResponse: (response) =>
		set((state) => {
			// Check if response already exists (by id)
			const exists = state.responses.some((r) => r._id === response._id || r.id === response.id);
			if (exists) {
				// Update existing response
				return {
					responses: state.responses.map((r) =>
						r._id === response._id || r.id === response.id ? { ...r, ...response } : r
					),
				};
			}
			// Add new response
			return {
				responses: [...state.responses, response],
			};
		}),
	setResponses: (responses) => set(() => ({ responses })),
	updateResponse: (id, updates) =>
		set((state) => ({
			responses: state.responses.map((r) =>
				r._id === id || r.id === id ? { ...r, ...updates } : r
			),
		})),
	removeResponse: (id) =>
		set((state) => ({
			responses: state.responses.filter((r) => r._id !== id && r.id !== id),
		})),
	reset: () => set(() => ({ responses: [] })),
}));

