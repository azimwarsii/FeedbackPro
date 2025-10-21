"use client";
import React, { useState } from "react";

export default function NotificationPreferencesCard() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("daily");

  return (
    <div id="notifications" className="p-5 border  bg-white dark:bg-gray-900  border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Notification Preferences
        </h4>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                Email Notifications
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive updates about campaigns and responses
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                emailNotifications ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                Push Notifications
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get instant alerts on your device
              </p>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                pushNotifications ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Email Frequency */}
          <div>
            <h5 className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">
              Email Frequency
            </h5>
            <div className="space-y-2">
              {["Daily digest", "Weekly digest", "Monthly digest", "Never"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value={option.toLowerCase().replace(" ", "-")}
                    checked={emailFrequency === option.toLowerCase().replace(" ", "-")}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
