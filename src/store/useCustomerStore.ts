import { create } from "zustand";
import { Response } from "@/store/useResponseStore";
import { Invitation } from "@/types/customer";

export interface Customer {
	_id?: string;
	id?: string;
	name: string;
	phone: string;
	email: string;
	responses?: Response[];
	invitations?: Invitation[];
	reward_pending?: number;
	reward_received?: number;
	user: string; // User ID
	createdAt?: string;
	updatedAt?: string;
}

type CustomersState = {
	customers: Customer[];
};

type CustomersActions = {
	addCustomer: (customer: Customer) => void;
	addCustomers: (customers: Customer[]) => void;
	setCustomers: (customers: Customer[]) => void;
	updateCustomer: (id: string, updates: Partial<Customer>) => void;
	removeCustomer: (id: string) => void;
	reset: () => void;
};

export const useCustomerStore = create<CustomersState & CustomersActions>((set) => ({
	customers: [],
	addCustomer: (customer) =>
		set((state) => {
			// Check if customer already exists (by id)
			const exists = state.customers.some((c) => c._id === customer._id || c.id === customer.id);
			if (exists) {
				// Update existing customer
				return {
					customers: state.customers.map((c) =>
						c._id === customer._id || c.id === customer.id ? { ...c, ...customer } : c
					),
				};
			}
			// Add new customer
			return {
				customers: [...state.customers, customer],
			};
		}),
	addCustomers: (customers) =>
		set((state) => {
			// Add multiple customers, avoiding duplicates
			const existingIds = new Set(state.customers.map(c => c._id || c.id));
			const newCustomers = customers.filter(c => !existingIds.has(c._id || c.id));
			return {
				customers: [...state.customers, ...newCustomers],
			};
		}),
	setCustomers: (customers) => set(() => ({ customers })),
	updateCustomer: (id, updates) =>
		set((state) => ({
			customers: state.customers.map((c) =>
				c._id === id || c.id === id ? { ...c, ...updates } : c
			),
		})),
	removeCustomer: (id) =>
		set((state) => ({
			customers: state.customers.filter((c) => c._id !== id && c.id !== id),
		})),
	reset: () => set(() => ({ customers: [] })),
}));



