"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function SecurityPrivacyCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving security changes...");
    closeModal();
  };

  return (
    <>
      <div id="security" className="p-5  bg-white dark:bg-gray-900  border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Security & Privacy
          </h4>

          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Two-Factor Authentication
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add an extra layer of security
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {twoFactorEnabled ? "Enabled" : "Not Enabled"}
                </p>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  twoFactorEnabled
                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    : "bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30"
                }`}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* Change Password */}
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Change Password
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update your account password
                </p>
              </div>
              <button
                onClick={openModal}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.5 1.5C12.3284 1.5 13 2.17157 13 3V4H14.5C15.3284 4 16 4.67157 16 5.5V13.5C16 14.3284 15.3284 15 14.5 15H1.5C0.671573 15 0 14.3284 0 13.5V5.5C0 4.67157 0.671573 4 1.5 4H3V3C3 2.17157 3.67157 1.5 4.5 1.5H11.5ZM4.5 3H11.5V4H4.5V3ZM1.5 5.5V13.5H14.5V5.5H1.5Z"
                    fill=""
                  />
                </svg>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Enter your current password and choose a new password.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 pb-3">
              <div className="space-y-4">
                <div>
                  <Label>Current password</Label>
                  <Input type="password" placeholder="Enter current password" />
                </div>

                <div>
                  <Label>New password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>

                <div>
                  <Label>Confirm new password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
