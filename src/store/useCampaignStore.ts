import { create } from "zustand";

export interface Contact {
	name: string;
	phone: string;
	email: string;
	filled?: boolean;
}

export interface Reward {
	type: "cash reward" | "promo code";
	amount?: number; // For cash reward
	amount_utilized?: number; // For cash reward
	code?: string; // For promo code
	description?: string; // For promo code
	codes_utilized?: number; // For promo code
}

export interface Campaign {
	_id?: string;
	id?: string;
	name: string;
	description: string;
	message_template: string;
	contacts?: Contact[]; // Legacy: for backward compatibility
	customerIds?: string[]; // New: array of customer IDs
	reward?: Reward;
	survey?: string; // Survey ID
	user: string; // User ID
    responses: number;
	createdAt?: string;
	updatedAt?: string;
	status: string;
}

type CampaignsState = {
	campaigns: Campaign[];
};

type CampaignsActions = {
	addCampaign: (campaign: Campaign) => void;
	setCampaigns: (campaigns: Campaign[]) => void;
	updateCampaign: (id: string, updates: Partial<Campaign>) => void;
	updateCampaignContact: (campaignId: string, contactEmail: string, filled: boolean) => void;
	incrementCampaignResponse: (campaignId: string) => void;
	updateRewardUtilization: (campaignId: string, rewardType: "cash reward" | "promo code") => void;
	removeCampaign: (id: string) => void;
	reset: () => void;
};

export const useCampaignStore = create<CampaignsState & CampaignsActions>((set) => ({
	campaigns: [],
	addCampaign: (campaign) =>
		set((state) => {
			// Check if campaign already exists (by id)
			const exists = state.campaigns.some((c) => c._id === campaign._id);
			if (exists) {
				// Update existing campaign
				return {
					campaigns: state.campaigns.map((c) =>
						c._id === campaign._id ? { ...c, ...campaign } : c
					),
				};
			}
			// Add new campaign
			return {
				campaigns: [...state.campaigns, campaign],
			};
		}),
	setCampaigns: (campaigns) => set(() => ({ campaigns })),
	updateCampaign: (id, updates) =>
		set((state) => ({
			campaigns: state.campaigns.map((c) =>
				c._id === id || c.id === id ? { ...c, ...updates } : c
			),
		})),
	updateCampaignContact: (campaignId, contactEmail, filled) =>
		set((state) => ({
			campaigns: state.campaigns.map((c) => {
				if (c._id === campaignId || c.id === campaignId) {
					const updatedContacts = (c.contacts || []).map((contact) => {
						if (contact.email.toLowerCase().trim() === contactEmail.toLowerCase().trim()) {
							return { ...contact, filled };
						}
						return contact;
					});
					return { ...c, contacts: updatedContacts };
				}
				return c;
			}),
		})),
	incrementCampaignResponse: (campaignId) =>
		set((state) => ({
			campaigns: state.campaigns.map((c) => {
				if (c._id === campaignId || c.id === campaignId) {
					return { ...c, responses: (c.responses || 0) + 1 };
				}
				return c;
			}),
		})),
	updateRewardUtilization: (campaignId, rewardType) =>
		set((state) => ({
			campaigns: state.campaigns.map((c) => {
				if (c._id === campaignId || c.id === campaignId) {
					const reward = c.reward;
					if (!reward) return c;
					
					if (rewardType === "cash reward" && reward.amount) {
						return {
							...c,
							reward: {
								...reward,
								amount_utilized: (reward.amount_utilized || 0) + reward.amount,
							},
						};
					} else if (rewardType === "promo code") {
						return {
							...c,
							reward: {
								...reward,
								codes_utilized: (reward.codes_utilized || 0) + 1,
							},
						};
					}
					return c;
				}
				return c;
			}),
		})),
	removeCampaign: (id) =>
		set((state) => ({
			campaigns: state.campaigns.filter((c) => c._id !== id && c.id !== id),
		})),
	reset: () => set(() => ({ campaigns: [] })),
}));

