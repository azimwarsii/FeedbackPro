import ProfileInformationCard from "@/components/settings/ProfileInformationCard";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";
import SecurityPrivacyCard from "@/components/settings/SecurityPrivacyCard";
import BillingSubscriptionCard from "@/components/settings/BillingSubscriptionCard";
import SettingsNavigation from "@/components/settings/SettingsNavigation";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Settings | FeedbackPro",
  description:
    "Settings for FeedbackPro",
};

export default function Settings() {
  return (
    <div className="flex gap-6">
      {/* Navigation Sidebar */}
      <SettingsNavigation />
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <ProfileInformationCard />
        <NotificationPreferencesCard />
        <SecurityPrivacyCard />
        <BillingSubscriptionCard />
      </div>
    </div>
  );
}
