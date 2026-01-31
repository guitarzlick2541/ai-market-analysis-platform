'use client'

import { useState } from 'react'
import {
    Star,
    TrendingUp,
    TrendingDown,
    Trash2,
    Plus,
    Bell,
    BellOff,
    DollarSign,
    AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

// Mock watchlist data
const initialWatchlist = [
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 43250.50, change: 2.35, alertEnabled: true, signal: 'BUY' as const },
    { symbol: 'ETH-USD', name: 'Ethereum', price: 2580.20, change: -1.12, alertEnabled: true, signal: 'HOLD' as const },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 0.85, alertEnabled: false, signal: 'BUY' as const },
    { symbol: 'NVDA', name: 'NVIDIA', price: 615.27, change: 3.42, alertEnabled: true, signal: 'BUY' as const },
    { symbol: 'XAU-USD', name: 'Gold', price: 2045.30, change: 0.42, alertEnabled: false, signal: 'HOLD' as const },
]

export default function WatchlistPage() {
    const [watchlist, setWatchlist] = useState(initialWatchlist)
    const [showAddModal, setShowAddModal] = useState(false)

    const removeFromWatchlist = (symbol: string) => {
        setWatchlist(watchlist.filter(item => item.symbol !== symbol))
    }

    const toggleAlert = (symbol: string) => {
        setWatchlist(watchlist.map(item =>
            item.symbol === symbol ? { ...item, alertEnabled: !item.alertEnabled } : item
        ))
    }

    const getSignalClass = (signal: string) => {
        switch (signal) {
            case 'BUY': return 'signal-buy'
            case 'SELL': return 'signal-sell'
            case 'HOLD': return 'signal-hold'
            default: return ''
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Watchlist</h1>
                    <p className="text-gray-400 text-sm">Track your favorite assets</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Asset
                </button>
            </div>

            {/* Watchlist Grid */}
            {watchlist.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchlist.map((asset) => (
                        <div key={asset.symbol} className="glass-card-hover p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-accent-green" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-lg">{asset.symbol}</div>
                                        <div className="text-sm text-gray-500">{asset.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => toggleAlert(asset.symbol)}
                                        className={`p-2 rounded-lg transition-colors ${asset.alertEnabled
                                                ? 'text-accent-green hover:bg-accent-green/10'
                                                : 'text-gray-500 hover:bg-dark-700'
                                            }`}
                                    >
                                        {asset.alertEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => removeFromWatchlist(asset.symbol)}
                                        className="p-2 rounded-lg text-gray-500 hover:text-signal-sell hover:bg-signal-sell/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <div className="text-2xl font-bold">${asset.price.toLocaleString()}</div>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${asset.change >= 0 ? 'text-signal-buy' : 'text-signal-sell'
                                        }`}>
                                        {asset.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {asset.change >= 0 ? '+' : ''}{asset.change}%
                                    </div>
                                </div>
                                <span className={getSignalClass(asset.signal)}>
                                    {asset.signal}
                                </span>
                            </div>

                            <Link
                                href={`/dashboard?asset=${asset.symbol}`}
                                className="block w-full text-center py-2 border border-white/10 rounded-xl text-sm hover:bg-white/5 transition-colors"
                            >
                                View Analysis
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                    <p className="text-gray-400 mb-6">Add assets to track their performance and get AI signals</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Your First Asset
                    </button>
                </div>
            )}

            {/* Price Alerts Section */}
            <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-accent-cyan" />
                    <h2 className="text-lg font-semibold">Active Alerts</h2>
                </div>
                <div className="space-y-3">
                    {watchlist.filter(a => a.alertEnabled).length > 0 ? (
                        watchlist.filter(a => a.alertEnabled).map((asset) => (
                            <div key={asset.symbol} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-accent-green" />
                                    <span className="font-medium">{asset.symbol}</span>
                                </div>
                                <span className="text-sm text-gray-400">
                                    Signal alerts enabled
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No active alerts</p>
                    )}
                </div>
            </section>
        </div>
    )
}
