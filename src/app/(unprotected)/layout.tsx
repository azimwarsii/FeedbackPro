"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import React from "react";    

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  if (session) redirect("/");
  return <SessionProvider><div>{children}</div></SessionProvider>;
}
