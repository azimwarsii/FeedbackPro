import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { 
  title: "Analytics | FeedbackPro",
  description:
    "Analytics for FeedbackPro",
  // other metadata
};
export default function page() {
  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
