import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Customers from "@/components/customers/Customers";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Customers | FeedbackPro",
  description:
    "Manage your customer base and track engagement for FeedbackPro",
  // other metadata
};

export default function CustomersPage() {
  return (
    <div>
      <Customers />
    </div>
  );
}
