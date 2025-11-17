"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";    

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't redirect authenticated users on feedback pages
  // The feedback page itself will handle authentication requirements
  return <SessionProvider><div>{children}</div></SessionProvider>;
}
