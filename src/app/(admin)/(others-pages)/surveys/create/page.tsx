import CreateSurvey from "@/components/surveys/SurveyBuilder";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Create Survey | FeedbackPro",
  description:
    "Create survey for FeedbackPro",
  // other metadata
};
export default function page() {
  return (
    <div>
      <CreateSurvey />
    </div>
  );
}
