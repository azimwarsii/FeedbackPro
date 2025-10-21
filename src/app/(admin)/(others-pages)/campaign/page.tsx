import Campaigns from "@/components/campaigns/Campaigns";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Campaigns | FeedbackPro",
  description:
    "Campaigns list and management for FeedbackPro",
  // other metadata
};
export default function page() {
  return (
    <div>
      <Campaigns />
    </div>
  );
}
