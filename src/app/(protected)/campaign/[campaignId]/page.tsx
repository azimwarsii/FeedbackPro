"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCampaignStore } from "@/store/useCampaignStore";
import { SessionUser } from "@/types/session";
import { ArrowLeft, Users, DollarSign, Tag, Mail, FileText, Gift, BarChart3, Clock, Phone, Edit2, Save, X, Copy, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import CampaignResponsesModal from "@/components/campaigns/CampaignResponsesModal";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const campaignId = params.campaignId as string;
  const campaigns = useCampaignStore((state) => state.campaigns);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSMS, setIsEditingSMS] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    message_template: ""
  });

  const campaign = campaigns.find(c => (c._id || c.id) === campaignId);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The campaign you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/campaign")}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Get customer details from contacts
  const getCampaignCustomers = () => {
    if (campaign.contacts && campaign.contacts.length > 0) {
      // Convert contacts to customer-like objects for display
      return campaign.contacts.map((contact, index) => ({
        _id: `temp-${index}`,
        id: `temp-${index}`,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      }));
    }
    return [];
  };

  const campaignCustomers = getCampaignCustomers();
  const isPromoCode = campaign.reward?.type === "promo code";
  const totalContacts = campaign.contacts?.length || 0;
  const responses = campaign.responses || 0;
  const responseRate = totalContacts > 0 ? Math.round((responses / totalContacts) * 100) : 0;

  // Calculate budget/spent for cash rewards
  let budget = 0;
  let spent = 0;
  if (campaign.reward?.type === "cash reward" && campaign.reward.amount) {
    budget = campaign.reward.amount * totalContacts;
    spent = campaign.reward.amount_utilized || (campaign.reward.amount * responses);
  }

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "paused":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "completed":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleEditClick = (field: "name" | "description" | "message_template") => {
    setEditFormData({
      name: campaign.name,
      description: campaign.description || "",
      message_template: campaign.message_template || ""
    });
    if (field === "name") setIsEditingTitle(true);
    if (field === "description") setIsEditingDescription(true);
    if (field === "message_template") setIsEditingSMS(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setIsEditingSMS(false);
    setEditFormData({
      name: "",
      description: "",
      message_template: ""
    });
  };

  const handleSaveEdit = async (field: "name" | "description" | "message_template") => {
    const safeUser = session?.user as SessionUser;
    const userId = safeUser?.id;

    if (!userId) {
      alert("You must be logged in to update a campaign.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
    const updates: Partial<{ name: string; description: string; message_template: string }> = {};

    if (field === "name") {
      if (!editFormData.name.trim()) {
        alert("Campaign name cannot be empty");
        return;
      }
      updates.name = editFormData.name.trim();
    } else if (field === "description") {
      updates.description = editFormData.description;
    } else if (field === "message_template") {
      updates.message_template = editFormData.message_template;
    }

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        // Update campaign in store
        updateCampaign(campaignId, updates);

        // Close edit mode
        setIsEditingTitle(false);
        setIsEditingDescription(false);
        setIsEditingSMS(false);

        alert("Campaign updated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to update campaign: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      alert("An error occurred while updating the campaign. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <CampaignResponsesModal
        isOpen={showResponsesModal}
        onClose={() => setShowResponsesModal(false)}
        campaignId={campaignId}
        campaignName={campaign.name}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/campaign")}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 px-2 py-1"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit("name")}
                  className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                  title="Save"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
                <button
                  onClick={() => handleEditClick("name")}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title="Edit title"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Created on {formatDate(campaign.createdAt)}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(campaign.status)}`}>
          {campaign.status}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => setShowContactsModal(true)}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalContacts}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Click to view all</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowResponsesModal(true)}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-left hover:shadow-md transition-all duration-200 hover:border-green-300 dark:hover:border-green-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{responses}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {responseRate}% response rate · Click to view all
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </button>

        {isPromoCode ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promo Codes Utilized</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {campaign.reward?.codes_utilized || 0} / {totalContacts}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  ${spent.toFixed(2)} / ${budget.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                {formatDate(campaign.updatedAt || campaign.createdAt)}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </h2>
              {!isEditingDescription && (
                <button
                  onClick={() => handleEditClick("description")}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit description"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSaveEdit("description")}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {campaign.description || "No description provided."}
              </p>
            )}
          </div>

          {/* SMS Template */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                SMS Template
              </h2>
              {!isEditingSMS && (
                <button
                  onClick={() => handleEditClick("message_template")}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit SMS template"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditingSMS ? (
              <div className="space-y-3">
                <textarea
                  value={editFormData.message_template}
                  onChange={(e) => setEditFormData({ ...editFormData, message_template: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSaveEdit("message_template")}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                  {campaign.message_template || "No SMS template provided."}
                </p>
              </div>
            )}
            {campaign.image && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Campaign Image</p>
                <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img
                    src={campaign.image}
                    alt={campaign.name}
                    className="w-full h-full object-cover max-h-64"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-mono">
                    Variable: {"{image}"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reward Information */}
          {campaign.reward && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Reward Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reward Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                    {campaign.reward.type}
                  </p>
                </div>
                {isPromoCode ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promo Code</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 font-mono">
                        {campaign.reward.code || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {campaign.reward.description || "No description provided."}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilization</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {campaign.reward.codes_utilized || 0} of {totalContacts} codes used
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount per Response</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        ${campaign.reward.amount?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        ${budget.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount Utilized</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        ${spent.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(campaign.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(campaign.updatedAt || campaign.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* External Survey Redirect Link - Only if external link exists */}
          {campaign.externalSurveyLink && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                Redirect Setup
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="mb-2 font-medium">Instructions:</p>
                  <p>
                    Copy the link below and paste it as the <strong>Redirect URL</strong> in your external survey tool (e.g., Google Forms, Typeform) settings.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Redirect Link</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${campaignId}${campaign.code ? `?code=${campaign.code}` : ''}`}
                        className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-mono focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/feedback/${campaignId}${campaign.code ? `?code=${campaign.code}` : ''}`;
                        navigator.clipboard.writeText(link);
                        alert("Link copied to clipboard!");
                      }}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {campaign.code && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Includes your unique verification code: <strong>{campaign.code}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contacts Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contacts Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalContacts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Responses</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">{responses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Rate</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{responseRate}%</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(responseRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* Contacts Modal */}
      < Modal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)
        }
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">
              Total Contacts: {totalContacts}
            </h2>
          </div>

          {campaignCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {campaignCustomers.map((customer, index) => (
                    <tr
                      key={customer._id || customer.id || index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No contacts found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This campaign doesn&apos;t have any contacts yet.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowContactsModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal >
    </div >
  );
}

