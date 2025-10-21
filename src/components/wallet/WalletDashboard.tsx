"use client";
import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  DollarSign,
  Banknote,
  Smartphone,
  Building2
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  status: "completed" | "pending";
  date: string;
  type: "credit" | "debit";
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

const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Payment from Client ABC",
    amount: 2500.00,
    status: "completed",
    date: "2024-01-15",
    type: "credit"
  },
  {
    id: "2", 
    description: "Subscription Renewal",
    amount: -99.00,
    status: "completed",
    date: "2024-01-14",
    type: "debit"
  },
  {
    id: "3",
    description: "Pending Payment from XYZ Corp",
    amount: 1500.00,
    status: "pending",
    date: "2024-01-16",
    type: "credit"
  },
  {
    id: "4",
    description: "Marketing Campaign Spend",
    amount: -450.00,
    status: "completed",
    date: "2024-01-13",
    type: "debit"
  },
  {
    id: "5",
    description: "Refund Processing",
    amount: -75.00,
    status: "pending",
    date: "2024-01-12",
    type: "debit"
  }
];

export default function WalletDashboard() {
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const availableBalance = 12500.00;
  const pendingAmount = 1500.00;
  const totalAdded = 45000.00;
  const totalSpent = 32500.00;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full dark:bg-amber-900/20 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 
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
    if (!amount || !selectedPaymentMethod) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      handleCloseModal();
      // Here you would typically show a success message or redirect
      alert(`Successfully added ${formatCurrency(parseFloat(amount))} to your wallet!`);
    }, 2000);
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
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
      </div>
      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(availableBalance)}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">+5.2% from last month</p>
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
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">2 transactions pending</p>
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
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-lg font-bold ${getAmountColor(transaction.amount)}`}>
                        {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  +{formatCurrency(4000)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Expenses</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(2500)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Net</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{formatCurrency(1500)}
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
