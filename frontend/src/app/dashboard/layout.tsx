'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    TrendingUp,
    Star,
    Brain,
    Newspaper,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronDown
} from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Markets', href: '/dashboard/markets', icon: TrendingUp },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: Star },
    { name: 'AI Analysis', href: '/dashboard/analysis', icon: Brain },
    { name: 'News', href: '/dashboard/news', icon: Newspaper },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-dark-900 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-dark-800 border-r border-white/5
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Brain className="w-8 h-8 text-accent-green" />
                        <span className="text-xl font-bold gradient-text">MarketAI</span>
                    </Link>
                    <button
                        className="lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        // For dashboard, match exactly. For others, match if starts with href
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <button className="nav-item w-full text-signal-sell hover:bg-signal-sell/10">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-16 bg-dark-800/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search assets, news..."
                                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-green/50"
                            />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-green rounded-full" />
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded-xl transition-colors"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center">
                                    <span className="text-sm font-semibold text-dark-900">U</span>
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-medium">User</div>
                                    <div className="text-xs text-gray-500">Free Plan</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 glass-card py-2">
                                    <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white">
                                        Settings
                                    </Link>
                                    <Link href="/dashboard/settings#billing" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white">
                                        Billing
                                    </Link>
                                    <hr className="my-2 border-white/5" />
                                    <button className="w-full text-left px-4 py-2 text-sm text-signal-sell hover:bg-signal-sell/10">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
