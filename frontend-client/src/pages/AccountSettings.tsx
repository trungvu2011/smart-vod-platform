import { useState } from "react";
import { User, Bell, Lock, Shield, CreditCard, Globe, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState("Account");

  const tabs = [
    { id: "Account", icon: User },
    { id: "Notifications", icon: Bell },
    { id: "Privacy", icon: Lock },
    { id: "Security", icon: Shield },
    { id: "Billing", icon: CreditCard },
    { id: "Appearance", icon: Moon },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-surface-dark pb-6">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-surface-dark text-primary"
                  : "text-text-secondary hover:bg-surface-dark hover:text-text-primary"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 flex flex-col gap-8">
          {activeTab === "Account" && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-dark relative group">
                    <img src="https://picsum.photos/seed/myprofile/200/200" alt="Profile" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-xs font-medium text-white">Change</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="rounded-lg bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                      Upload new picture
                    </button>
                    <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
                      Remove picture
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-text-secondary">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      defaultValue="Alex"
                      className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-text-secondary">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      defaultValue="Streamer"
                      className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    defaultValue="alex@streamflow.com"
                    className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bio" className="text-sm font-medium text-text-secondary">Bio</label>
                  <textarea
                    id="bio"
                    rows={4}
                    defaultValue="Content creator focused on web development tutorials."
                    className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-surface-dark">
                <button className="rounded-xl px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                  Cancel
                </button>
                <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab !== "Account" && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-dark">
              <p className="text-text-secondary">{activeTab} settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
