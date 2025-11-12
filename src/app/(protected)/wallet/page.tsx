import WalletDashboard from "@/components/wallet/WalletDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet | FeedbackPro - Next.js Dashboard Template",
  description:
    "This is the Wallet page for FeedbackPro - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Wallet() {
  return <WalletDashboard />;
}
