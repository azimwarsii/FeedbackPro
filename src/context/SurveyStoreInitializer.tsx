"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSurveysStore } from "@/store/useSurveysStore";
import { SessionUser } from "@/types/session";

export default function SurveyStoreInitializer() {
	const { data: session, status } = useSession();
	const { setSurveys, reset } = useSurveysStore();

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			const run = async () => {
				const safeUser = session.user as SessionUser;
				const userId = safeUser?.id;
				const baseUrl =
					process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

				if (baseUrl && userId) {
					try {
						// Fetch all surveys for the user
						const res = await fetch(
							`${baseUrl.replace(/\/+$/, "")}/surveys?userId=${encodeURIComponent(userId)}`,
							{
								method: "GET",
							}
						);
						if (res.ok) {
							const data = await res.json().catch(() => null);
							const surveys = data?.surveys || data?.survey || (Array.isArray(data) ? data : []);
							if (Array.isArray(surveys)) {
								setSurveys(surveys);
							}
						}
					} catch (error) {
						console.error("Error fetching surveys:", error);
					}
				}
			};
			run();
		} else if (status === "unauthenticated") {
			reset();
		}
		console.log("SurveyStoreInitializer", status, session);
	}, [status, session, setSurveys, reset]);

	return null;
}

