"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useResponseStore } from "@/store/useResponseStore";
import { SessionUser } from "@/types/session";

export default function ResponseStoreInitializer() {
	const { data: session, status } = useSession();
	const { setResponses, reset } = useResponseStore();

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			const run = async () => {
				const safeUser = session.user as SessionUser;
				const userId = safeUser?.id;
				const baseUrl =
					process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

				if (baseUrl && userId) {
					try {
						// Fetch all responses for the user
						const res = await fetch(
							`${baseUrl.replace(/\/+$/, "")}/responses?userId=${encodeURIComponent(userId)}`,
							{
								method: "GET",
							}
						);
						if (res.ok) {
							const data = await res.json().catch(() => null);
							const responses = data?.responses || data?.response || (Array.isArray(data) ? data : []);
							if (Array.isArray(responses)) {
								setResponses(responses);
							}
						}
					} catch (error) {
						console.error("Error fetching responses:", error);
					}
				}
			};
			run();
		} else if (status === "unauthenticated") {
			reset();
		}
	}, [status, session, setResponses, reset]);

	return null;
}

