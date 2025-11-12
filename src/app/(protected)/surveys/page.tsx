import Surveys from "@/components/surveys/SurveyDashboard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Surveys | FeedbackPro",
  description:
    "Surveys list and management for FeedbackPro",
  // other metadata
};
export default function page() {
  return (
    <div>
      <Surveys />
    </div>
  );
}
