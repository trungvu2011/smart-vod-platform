import { useState, useEffect } from 'react';
import {
  User, Palette, Bell, Shield, Database,
  Moon, Sun, Monitor, LogOut, Trash2, Download
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { userApi } from '../api/userApi';
import UserAvatar from '../components/ui/UserAvatar';

type SettingsTab = 'account' | 'appearance' | 'notifications' | 'security' | 'data';

const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'account', label: 'Account Settings', icon: <User size={18} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { key: 'security', label: 'Privacy & Security', icon: <Shield size={18} /> },
  { key: 'data', label: 'Data & Storage', icon: <Database size={18} /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const { user, setUser } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    training: true,
    townhall: true,
    courseUpdates: false,
  });
  const [twoFactor, setTwoFactor] = useState(false);
  const [offlineQuality, setOfflineQuality] = useState('720p');

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Load sessions when entering security tab
  useEffect(() => {
    if (activeTab === 'security') {
      setLoadingSessions(true);
      userApi.getSessions()
        .then(setSessions)
        .catch(console.error)
        .finally(() => setLoadingSessions(false));
    }
  }, [activeTab]);

  const handleRevokeSession = async (id: string) => {
    try {
      await userApi.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to revoke session', err);
    }
  };

  const handleSaveProfile = async () => {
    setUpdatingProfile(true);
    try {
      const updatedUser = await userApi.updateMe({ fullName });
      setUser(updatedUser);
      alert('Profile updated!');
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;
    setUpdatingPassword(true);
    try {
      await userApi.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      alert('Password updated!');
    } catch (err) {
      console.error('Failed to update password', err);
      alert('Failed to update password. Check your old password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings nav */}
        <div className="md:w-64 flex-shrink-0">
          {/* User card */}
          <div className="flex items-center gap-3 p-4 mb-4 rounded-wp-lg bg-wp-surface-container">
            <UserAvatar
              src={user?.avatarUrl}
              name={user?.fullName}
              className="w-12 h-12 hidden md:block"
            />
            <div>
              <p className="text-sm font-semibold text-wp-on-surface">{user?.fullName}</p>
              <p className="text-xs text-wp-on-surface-variant">{user?.title}</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-wp-surface-container-high text-wp-primary'
                    : 'text-wp-on-surface-variant hover:bg-wp-surface-container-high/50 hover:text-wp-on-surface'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-wp-on-surface">Account Settings</h2>
                <p className="text-sm text-wp-on-surface-variant mt-1">
                  Update your personal information and contact details.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-wp-surface-container rounded-wp-xl p-6">
                <div>
                  <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">Full Name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-wp-surface-lowest rounded-wp text-sm text-wp-on-surface
                      focus:outline-none focus:bg-wp-surface-container-highest focus:shadow-wp-glow transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">Email</label>
                  <input
                    defaultValue={user?.email}
                    disabled
                    className="w-full px-4 py-3 bg-wp-surface-lowest opacity-50 rounded-wp text-sm text-wp-on-surface cursor-not-allowed"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveProfile} 
                disabled={updatingProfile}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-wp-on-surface mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-wp-surface-container rounded-wp-xl p-6">
                  <div>
                    <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">Old Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-wp-surface-lowest rounded-wp text-sm text-wp-on-surface
                        focus:outline-none focus:bg-wp-surface-container-highest focus:shadow-wp-glow transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-wp-surface-lowest rounded-wp text-sm text-wp-on-surface
                        focus:outline-none focus:bg-wp-surface-container-highest focus:shadow-wp-glow transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleChangePassword} 
                  disabled={updatingPassword || !oldPassword || !newPassword}
                  className="btn-secondary text-sm mt-4 disabled:opacity-50"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </section>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-wp-on-surface">Appearance</h2>
                <p className="text-sm text-wp-on-surface-variant mt-1">
                  Customize how WayPoint looks on your device.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'dark', icon: <Moon size={24} />, label: 'Dark Mode', desc: 'Better for focus and battery' },
                  { key: 'light', icon: <Sun size={24} />, label: 'Light Mode', desc: 'Classic high-contrast look' },
                  { key: 'system', icon: <Monitor size={24} />, label: 'System', desc: 'Match your OS setting' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDarkMode(opt.key === 'dark')}
                    className={`p-5 rounded-wp-lg text-left transition-all duration-200
                      ${(darkMode && opt.key === 'dark') || (!darkMode && opt.key === 'light')
                        ? 'bg-wp-primary-container/15 ring-1 ring-wp-primary/30'
                        : 'bg-wp-surface-container hover:bg-wp-surface-container-high'
                      }`}
                  >
                    <div className={`mb-3 ${(darkMode && opt.key === 'dark') || (!darkMode && opt.key === 'light')
                      ? 'text-wp-primary' : 'text-wp-on-surface-variant'}`}>
                      {opt.icon}
                    </div>
                    <p className="text-sm font-semibold text-wp-on-surface">{opt.label}</p>
                    <p className="text-xs text-wp-on-surface-variant mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-wp-on-surface">Notifications</h2>
                <p className="text-sm text-wp-on-surface-variant mt-1">
                  Control which alerts you receive and where.
                </p>
              </div>
              <div className="space-y-4 bg-wp-surface-container rounded-wp-xl p-6">
                {[
                  { key: 'training' as const, label: 'New Mandatory Training', desc: 'Alerts for time-sensitive compliance courses' },
                  { key: 'townhall' as const, label: 'Townhall Reminders', desc: 'Push notifications 15 minutes before live events' },
                  { key: 'courseUpdates' as const, label: 'Course Updates', desc: 'Comments and new content in your enrolled courses' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-wp-on-surface">{item.label}</p>
                      <p className="text-xs text-wp-on-surface-variant mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200
                        ${notifications[item.key] ? 'bg-wp-primary-container' : 'bg-wp-surface-bright'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                        ${notifications[item.key] ? 'translate-x-5.5 left-0' : 'left-0.5'}`}
                        style={{ transform: notifications[item.key] ? 'translateX(22px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Privacy & Security */}
          {activeTab === 'security' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-wp-on-surface">Privacy & Security</h2>
                <p className="text-sm text-wp-on-surface-variant mt-1">
                  Manage your account protection and active logins.
                </p>
              </div>

              {/* 2FA */}
              <div className="bg-wp-surface-container rounded-wp-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-wp-on-surface">Two-factor Authentication</p>
                    <p className="text-xs text-wp-on-surface-variant mt-0.5">
                      Secure your account with a secondary verification code.
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200
                      ${twoFactor ? 'bg-wp-primary-container' : 'bg-wp-surface-bright'}`}
                  >
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: twoFactor ? 'translateX(22px)' : 'translateX(0)', left: '2px' }}
                    />
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="text-sm font-semibold text-wp-on-surface mb-3">Active Sessions</h3>
                {loadingSessions ? (
                  <p className="text-sm text-wp-on-surface-variant animate-pulse">Loading sessions...</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.length === 0 ? (
                      <p className="text-sm text-wp-on-surface-variant">No active sessions found.</p>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-wp-surface-container rounded-wp-lg">
                          <div>
                            <p className="text-sm font-medium text-wp-on-surface">{session.device}</p>
                            <p className="text-xs text-wp-on-surface-variant">{session.location}</p>
                          </div>
                          <div className="text-right">
                            {session.isCurrent ? (
                              <span className="text-xs font-medium text-green-400">Current Session</span>
                            ) : (
                              <div>
                                <p className="text-xs text-wp-outline">{new Date(session.lastActive).toLocaleString()}</p>
                                <button 
                                  onClick={() => handleRevokeSession(session.id)}
                                  className="text-xs text-wp-error hover:underline mt-0.5 flex items-center gap-1 ml-auto"
                                >
                                  <LogOut size={12} /> Revoke
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Data & Storage */}
          {activeTab === 'data' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-wp-on-surface">Data & Storage</h2>
                <p className="text-sm text-wp-on-surface-variant mt-1">
                  Manage local files and bandwidth consumption.
                </p>
              </div>

              <div className="bg-wp-surface-container rounded-wp-xl p-6 space-y-5">
                {/* Cache */}
                <div>
                  <h3 className="text-sm font-semibold text-wp-on-surface mb-1">Cache Management</h3>
                  <p className="text-xs text-wp-on-surface-variant mb-3">
                    Clear temporary files to free up space. This won't delete your offline videos.
                  </p>
                  <button className="btn-secondary text-xs flex items-center gap-2">
                    <Trash2 size={14} /> Clear Cache
                  </button>
                </div>

                <hr className="border-wp-outline-variant/10" />

                {/* Offline */}
                <div>
                  <h3 className="text-sm font-semibold text-wp-on-surface mb-1">Offline Viewing</h3>
                  <p className="text-xs text-wp-on-surface-variant mb-3">
                    Choose the default quality for downloaded videos.
                  </p>
                  <div className="flex gap-2">
                    {['480p', '720p', '1080p'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setOfflineQuality(q)}
                        className={`px-4 py-2 rounded-wp text-xs font-medium transition-all
                          ${offlineQuality === q
                            ? 'bg-wp-primary-container text-white'
                            : 'bg-wp-surface-container-high text-wp-on-surface-variant hover:bg-wp-surface-bright'
                          }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-wp-outline mt-3 flex items-center gap-1">
                    <Download size={12} /> Last synced: Today at 09:42 AM
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
