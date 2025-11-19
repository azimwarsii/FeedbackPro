"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCustomerStore } from "@/store/useCustomerStore";
import { SessionUser } from "@/types/session";

export default function CustomerStoreInitializer() {
	const { data: session, status } = useSession();
	const { setCustomers, reset } = useCustomerStore();

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			const run = async () => {
				const safeUser = session.user as SessionUser;
				const userId = safeUser?.id;
				const baseUrl =
					process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

				if (baseUrl && userId) {
					try {
						// Fetch all customers for the user
						const res = await fetch(
							`${baseUrl.replace(/\/+$/, "")}/customers?userId=${encodeURIComponent(userId)}`,
							{
								method: "GET",
							}
						);
						if (res.ok) {
							const data = await res.json().catch(() => null);
							const customers = data?.customers || data?.customer || (Array.isArray(data) ? data : []);
							if (Array.isArray(customers)) {
								setCustomers(customers);
							}
						}
					} catch (error) {
						console.error("Error fetching customers:", error);
					}
				}
			};
			run();
		} else if (status === "unauthenticated") {
			reset();
		}
	}, [status, session, setCustomers, reset]);

	return null;
}



