"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";

export default function UserStoreInitializer() {
	const { data: session, status } = useSession();
	const { setUser, reset } = useUserStore();

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			const run = async () => {
				const safeUser = session?.user as any;
				const id = safeUser?.id as string | undefined;
				const email = (safeUser?.email as string | undefined) || "";
				const baseUrl =
					process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

				let fetchedUser: any | undefined = undefined;
				if (baseUrl && id) {
					try {
						const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/users/${id}`, {
							method: "GET",
						});
						if (res.ok) {
							const data = await res.json().catch(() => null);
							fetchedUser = (data?.user ?? data ?? undefined) as any;
						}
					} catch {
						// ignore
					}
				}

				// Write minimal fields and common attributes
				setUser({
					id,
					name: safeUser?.name ?? undefined,
					email: email || undefined,
					companyName: fetchedUser?.companyName ?? undefined,
					bio: fetchedUser?.bio ?? undefined,
				});
			};
			run();
		} else if (status === "unauthenticated") {
			reset();
		}
	}, [status, session, setUser, reset]);

	return null;
}