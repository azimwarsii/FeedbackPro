"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { useEffect } from "react";
import { SessionUser } from "@/types/session";

export default function ProfileInformationCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const { data: session } = useSession();
  const storeCompanyName = useUserStore((s) => s.companyName);
  const storeBio = useUserStore((s) => s.bio);
  const { updateProfile } = useUserStore();

  // Prefill modal inputs from store whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCompanyName(storeCompanyName ?? "");
      setBio(storeBio ?? "");
    }
  }, [isOpen, storeCompanyName, storeBio]);
  const handleSave = async () => {
    console.log(session?.user)
    try {
      const userId = (session?.user as SessionUser)?.id;
      if (!userId) {
        console.error("No user id found in session");
        return;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      if (!baseUrl) {
        console.error("Missing NEXT_PUBLIC_API_BASE_URL/BACKEND_URL. Set it to your Express origin, e.g., http://localhost:3001");
        return;
      }
      const endpoint = `${baseUrl.replace(/\/+$/, "")}/edit/${userId}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: companyName ?? undefined,
          bio: bio ?? undefined,
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(`Failed to update profile. ${response.status} ${response.statusText} at ${endpoint}. Body:`, text);
        return;
      }
      // Update user store locally after successful save
      updateProfile({
        companyName: companyName ?? undefined,
        bio: bio ?? undefined,
      });
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await handleSave();
  };

  return (
    <>
      <div id="profile" className="p-5 border bg-white dark:bg-gray-900 border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Profile Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {session?.user?.name?.split(" ")[0]}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {session?.user?.name?.split(" ")[session?.user?.name?.split(" ").length - 1]}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {session?.user?.email}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Company Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {storeCompanyName}
                </p>
              </div>

              <div className="col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Bio
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {storeBio}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Profile Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your profile details to keep your information up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    defaultValue={session?.user?.name?.split(" ")[0] || "John"}
                    disabled={true}
                  />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    defaultValue={session?.user?.name?.split(" ")[session?.user?.name?.split(" ").length - 1] || "Doe"}
                    disabled={true}
                  />
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    defaultValue={session?.user?.email || "john@company.com"}
                    disabled={true}
                  />
                </div>

                <div>
                  <Label>Company Name</Label>
                  <Input type="text" defaultValue={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>

                <div className="col-span-2">
                  <Label>Bio</Label>
                  <textarea
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
