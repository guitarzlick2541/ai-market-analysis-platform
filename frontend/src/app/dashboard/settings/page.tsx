'use client'

import { useState } from 'react'
import {
    Settings,
    User,
    Bell,
    Shield,
    Palette,
    CreditCard,
    LogOut,
    Save,
    Check,
    Moon,
    Sun
} from 'lucide-react'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [saved, setSaved] = useState(false)
    const [settings, setSettings] = useState({
        displayName: 'User',
        email: 'user@example.com',
        timezone: 'Asia/Bangkok',
        language: 'en',
        // Notification settings
        emailNotifications: true,
        pushNotifications: true,
        priceAlerts: true,
        signalAlerts: true,
        newsDigest: false,
        // Display settings
        darkMode: true,
        compactView: false,
        showVolume: true,
        defaultTimeframe: '1h',
    })

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'display', label: 'Display', icon: Palette },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-400 text-sm">Manage your account and preferences</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-48 shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-accent-green/10 text-accent-green'
                                        : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 glass-card p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Profile Settings</h2>

                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center">
                                    <span className="text-2xl font-bold text-dark-900">U</span>
                                </div>
                                <button className="btn-secondary text-sm">Change Avatar</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={settings.displayName}
                                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                        className="input-field"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                                        <option value="America/New_York">America/New_York (UTC-5)</option>
                                        <option value="Europe/London">Europe/London (UTC+0)</option>
                                        <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Notification Preferences</h2>

                            <div className="space-y-4">
                                {[
                                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                                    { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when price targets are hit' },
                                    { key: 'signalAlerts', label: 'AI Signal Alerts', desc: 'Notifications for new BUY/SELL signals' },
                                    { key: 'newsDigest', label: 'Daily News Digest', desc: 'Summary of market news every morning' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                                        <div>
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-sm text-gray-500">{item.desc}</div>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings[item.key as keyof typeof settings] ? 'bg-accent-green' : 'bg-dark-600'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-7' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Display Tab */}
                    {activeTab === 'display' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Display Settings</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        <div>
                                            <div className="font-medium">Dark Mode</div>
                                            <div className="text-sm text-gray-500">Use dark theme</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.darkMode ? 'bg-accent-green' : 'bg-dark-600'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Default Chart Timeframe</label>
                                    <select
                                        value={settings.defaultTimeframe}
                                        onChange={(e) => setSettings({ ...settings, defaultTimeframe: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="1m">1 Minute</option>
                                        <option value="5m">5 Minutes</option>
                                        <option value="15m">15 Minutes</option>
                                        <option value="1h">1 Hour</option>
                                        <option value="4h">4 Hours</option>
                                        <option value="1D">1 Day</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                                    <div>
                                        <div className="font-medium">Show Volume Bars</div>
                                        <div className="text-sm text-gray-500">Display volume on charts</div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, showVolume: !settings.showVolume })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.showVolume ? 'bg-accent-green' : 'bg-dark-600'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.showVolume ? 'translate-x-7' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Security Settings</h2>

                            <div className="space-y-4">
                                <button className="w-full text-left p-4 bg-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors">
                                    <div className="font-medium">Change Password</div>
                                    <div className="text-sm text-gray-500">Update your account password</div>
                                </button>
                                <button className="w-full text-left p-4 bg-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors">
                                    <div className="font-medium">Two-Factor Authentication</div>
                                    <div className="text-sm text-gray-500">Add an extra layer of security</div>
                                </button>
                                <button className="w-full text-left p-4 bg-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors">
                                    <div className="font-medium">Active Sessions</div>
                                    <div className="text-sm text-gray-500">Manage your logged-in devices</div>
                                </button>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <button className="flex items-center gap-2 text-signal-sell hover:underline">
                                    <LogOut className="w-4 h-4" />
                                    <span>Log out of all devices</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Billing & Subscription</h2>

                            <div className="p-6 bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/30 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm text-gray-400">Current Plan</div>
                                        <div className="text-2xl font-bold">FREE</div>
                                    </div>
                                    <span className="px-3 py-1 bg-accent-green/20 text-accent-green rounded-full text-sm font-medium">
                                        Active
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">
                                    You're on the free plan. Upgrade to unlock premium features.
                                </p>
                                <button className="btn-primary">Upgrade to Pro</button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-medium">Plan Features</h3>
                                <div className="space-y-2">
                                    {[
                                        'Real-time price data',
                                        'Basic AI signals',
                                        '5 Watchlist items',
                                        '3 Price alerts',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                            <Check className="w-4 h-4 text-accent-green" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-2"
                        >
                            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
