"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/types/session";
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  CreditCard,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  DollarSign,
  Banknote,
  Smartphone,
  Building2,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface Transaction {
  _id?: string;
  id?: string;
  description?: string;
  amount: number;
  type: "credit" | "debit";
  balanceAfter?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fee: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "credit_card",
    name: "Credit/Debit Card",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Visa, Mastercard, American Express",
    processingTime: "Instant",
    fee: "2.9% + $0.30"
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: <Building2 className="w-5 h-5" />,
    description: "ACH, Wire Transfer",
    processingTime: "1-3 business days",
    fee: "Free"
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: <Banknote className="w-5 h-5" />,
    description: "PayPal Balance or Bank",
    processingTime: "Instant",
    fee: "2.9% + $0.30"
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Touch ID or Face ID",
    processingTime: "Instant",
    fee: "2.9% + $0.30"
  }
];

export default function WalletDashboard() {
  const { data: session } = useSession();
  const userId = (session?.user as SessionUser)?.id;
  
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; type: "success" | "error" | "info"; title: string; message: string }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showMessage = (type: "success" | "error" | "info", title: string, message: string) => {
    setMessageModal({ isOpen: true, type, title, message });
  };

  const closeMessage = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  const getMessageIcon = () => {
    switch (messageModal.type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getMessageColors = () => {
    switch (messageModal.type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const fetchWalletData = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(userId)}/wallet`, {
        method: "GET",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "Failed to load wallet data.";
        setError(String(msg));
        setBalance(0);
        setTransactions([]);
        return;
      }

      setBalance(data?.balance || 0);
      setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
    } catch (e) {
      console.error("Error fetching wallet data:", e);
      setError("Network error while loading wallet data.");
      setBalance(0);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  const totalAdded = useMemo(() => {
    return transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const pendingAmount = 0; // Transactions don't have status in your API, so no pending

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = () => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/20 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Completed
      </span>
    );
  };

  const getAmountColor = (type: "credit" | "debit") => {
    return type === "credit"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getAmountIcon = (type: string) => {
    return type === "credit" 
      ? <ArrowUpRight className="w-4 h-4" />
      : <ArrowDownRight className="w-4 h-4" />;
  };

  const handleAddFunds = () => {
    setIsAddFundsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddFundsModalOpen(false);
    setAmount("");
    setSelectedPaymentMethod("");
    setIsProcessing(false);
  };

  const handleProcessPayment = async () => {
    if (!amount || !selectedPaymentMethod || !userId) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage("error", "Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }

    setIsProcessing(true);

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const res = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(userId)}/wallet/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountNum,
            description: `Added funds via ${selectedPaymentMethod}`,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "Failed to add funds.";
        console.error("Add funds failed", { status: res.status, statusText: res.statusText, body: data });
        showMessage("error", `Error ${res.status}`, msg);
        setIsProcessing(false);
        return;
      }

      // Update balance and refresh transactions
      if (data?.balance !== undefined) {
        setBalance(data.balance);
      }
      await fetchWalletData();

      setIsProcessing(false);
      handleCloseModal();
      showMessage("success", "Funds Added", `Successfully added ${formatCurrency(amountNum)} to your wallet!`);
    } catch (e) {
      console.error("Error adding funds:", e);
      showMessage("error", "Network Error", "Network error while adding funds. Please try again.");
      setIsProcessing(false);
    }
  };

  const calculateFee = (amount: number, methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return 0;
    
    if (method.fee === "Free") return 0;
    
    // Parse fee like "2.9% + $0.30"
    const [percentage, fixed] = method.fee.split(" + ");
    const percent = parseFloat(percentage.replace("%", "")) / 100;
    const fixedFee = parseFloat(fixed.replace("$", ""));
    
    return (amount * percent) + fixedFee;
  };

  const getTotalAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fee = calculateFee(baseAmount, selectedPaymentMethod);
    return baseAmount + fee;
  };


  return (
    <div className="space-y-6">
      {/* Message Modal */}
      <Modal
        isOpen={messageModal.isOpen}
        onClose={closeMessage}
        className="max-w-md"
      >
        <div className="p-6">
          <div className={`flex items-start gap-4 p-4 rounded-lg border ${getMessageColors()}`}>
            <div className="flex-shrink-0">{getMessageIcon()}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {messageModal.title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {messageModal.message}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={closeMessage}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
      {/* Enhanced Header Section */}
      {/* <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet Dashboard</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your funds and track financial transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={handleAddFunds}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>
      </div> */}
       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Wallet Dashboard</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your funds and track financial transactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWalletData}
              disabled={isLoading}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            {/* <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button> */}
          </div>
          <button 
            onClick={handleAddFunds}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Funds</span>
            <span className="sm:hidden">Add Funds</span>
          </button>
        </div>
      </div>

      
      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "Loading..." : formatCurrency(balance)}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(pendingAmount)}</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No pending transactions</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Total Added */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Added</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">+{formatCurrency(totalAdded)}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">Lifetime deposits</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-red-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalSpent)}</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Lifetime expenses</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transaction History
                </h2>
                <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            {error && (
              <div className="p-6 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                No transactions found.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => {
                  const id = transaction._id || transaction.id || "";
                  const dateStr = transaction.createdAt || transaction.updatedAt || "";
                  const displayAmount = transaction.type === "credit" ? transaction.amount : -Math.abs(transaction.amount);
                  
                  return (
                    <div key={id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            transaction.type === "credit" 
                              ? "bg-green-100 dark:bg-green-900/20" 
                              : "bg-red-100 dark:bg-red-900/20"
                          }`}>
                            {getAmountIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {transaction.description || `${transaction.type === "credit" ? "Credit" : "Debit"} transaction`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {dateStr ? new Date(dateStr).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                            {displayAmount >= 0 ? "+" : ""}{formatCurrency(displayAmount)}
                          </p>
                          {getStatusBadge()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Payment Methods</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Download className="w-5 h-5" />
                <span className="font-medium">Download Statements</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Spending Analytics</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              This Month
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Income</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +{formatCurrency(
                    transactions
                      .filter((t) => t.type === "credit")
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Expenses</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(
                    transactions
                      .filter((t) => t.type === "debit")
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Net</span>
                  <span className={`text-lg font-bold ${
                    totalAdded - totalSpent >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {totalAdded - totalSpent >= 0 ? "+" : ""}{formatCurrency(totalAdded - totalSpent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {isAddFundsModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm" 
          style={{ 
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Funds</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add money to your wallet</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Add
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum amount: $1.00
                </p>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedPaymentMethod === method.id
                              ? "bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {method.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{method.fee}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{method.processingTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              {amount && selectedPaymentMethod && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Amount to add</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Processing fee</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(calculateFee(parseFloat(amount), selectedPaymentMethod))}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900 dark:text-white">Total to pay</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {formatCurrency(getTotalAmount())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={!amount || !selectedPaymentMethod || isProcessing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    `Add ${amount ? formatCurrency(parseFloat(amount)) : '$0.00'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
