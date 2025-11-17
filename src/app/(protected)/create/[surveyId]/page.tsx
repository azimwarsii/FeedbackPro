import CreateSurvey from "@/components/surveys/SurveyBuilder";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Edit Survey | FeedbackPro",
  description:
    "Edit survey for FeedbackPro",
  // other metadata
};
export default async function EditSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  return (
    <div>
      <CreateSurvey surveyId={surveyId} />
    </div>
  );
}

