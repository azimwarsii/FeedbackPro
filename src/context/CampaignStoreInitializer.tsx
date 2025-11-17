"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCampaignStore } from "@/store/useCampaignStore";

export default function CampaignStoreInitializer() {
	const { data: session, status } = useSession();
	const { setCampaigns, reset } = useCampaignStore();

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			const run = async () => {
				const safeUser = session?.user as any;
				const userId = safeUser?.id as string | undefined;
				const baseUrl =
					process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

				if (baseUrl && userId) {
					try {
						// Fetch all campaigns for the user
						const res = await fetch(
							`${baseUrl.replace(/\/+$/, "")}/campaigns?userId=${encodeURIComponent(userId)}`,
							{
								method: "GET",
							}
						);
						if (res.ok) {
							const data = await res.json().catch(() => null);
							const campaigns = data?.campaigns || data?.campaign || (Array.isArray(data) ? data : []);
							if (Array.isArray(campaigns)) {
								setCampaigns(campaigns);
							}
						}
					} catch (error) {
						console.error("Error fetching campaigns:", error);
					}
				}
			};
			run();
		} else if (status === "unauthenticated") {
			reset();
		}
		console.log("CampaignStoreInitializer", status, session);
	}, [status, session, setCampaigns, reset]);

	return null;
}

