"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import UserStoreInitializer from "@/context/UserStoreInitializer";
import SurveyStoreInitializer from "@/context/SurveyStoreInitializer";
import CampaignStoreInitializer from "@/context/CampaignStoreInitializer";
import CustomerStoreInitializer from "@/context/CustomerStoreInitializer";
import ResponseStoreInitializer from "@/context/ResponseStoreInitializer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }
  if (status === "unauthenticated") redirect("/signin");
  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <UserStoreInitializer />
      <SurveyStoreInitializer />
      <CampaignStoreInitializer />
      <CustomerStoreInitializer />
      <ResponseStoreInitializer />
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
