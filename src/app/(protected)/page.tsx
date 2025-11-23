import { EcommerceMetrics } from "@/components/ecommerce/Metrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/ResponesRate";
import MonthlySalesChart from "@/components/ecommerce/RewardsPaid";
import RecentCampaigns from "@/components/ecommerce/RecentCampaigns";
import QuickActions from "@/components/ecommerce/QuickActions";


// export const metadata: Metadata = {
//   title:
//     "FeedbackPro - Home",
//   description: "This is Next.js Home for FeedbackPro Dashboard Template",
// };

export default function Ecommerce() {

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <QuickActions />
      </div>

      <div className="col-span-12">
        <RecentCampaigns />
      </div>
    </div>
  );
}
