'use client'

import { useState } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Star,
    StarOff,
    DollarSign,
    BarChart3,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'

// Mock market data
const allAssets = [
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 43250.50, change: 2.35, volume: 28500000000, marketCap: 847000000000, type: 'crypto', inWatchlist: true },
    { symbol: 'ETH-USD', name: 'Ethereum', price: 2580.20, change: -1.12, volume: 15200000000, marketCap: 310000000000, type: 'crypto', inWatchlist: true },
    { symbol: 'SOL-USD', name: 'Solana', price: 98.45, change: 5.67, volume: 2800000000, marketCap: 42000000000, type: 'crypto', inWatchlist: false },
    { symbol: 'DOGE-USD', name: 'Dogecoin', price: 0.0825, change: -2.34, volume: 580000000, marketCap: 11800000000, type: 'crypto', inWatchlist: false },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 0.85, volume: 52000000, marketCap: 2900000000000, type: 'stock', inWatchlist: true },
    { symbol: 'MSFT', name: 'Microsoft', price: 402.56, change: 1.23, volume: 21000000, marketCap: 2990000000000, type: 'stock', inWatchlist: false },
    { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, change: -0.45, volume: 18500000, marketCap: 1780000000000, type: 'stock', inWatchlist: false },
    { symbol: 'NVDA', name: 'NVIDIA', price: 615.27, change: 3.42, volume: 45000000, marketCap: 1520000000000, type: 'stock', inWatchlist: true },
    { symbol: 'XAU-USD', name: 'Gold', price: 2045.30, change: 0.42, volume: 185000000000, marketCap: null, type: 'commodity', inWatchlist: true },
    { symbol: 'XAG-USD', name: 'Silver', price: 23.15, change: -0.28, volume: 8500000000, marketCap: null, type: 'commodity', inWatchlist: false },
]

type AssetFilter = 'all' | 'crypto' | 'stock' | 'commodity'

export default function MarketsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<AssetFilter>('all')
    const [assets, setAssets] = useState(allAssets)

    const filteredAssets = assets.filter((asset) => {
        const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'all' || asset.type === filter
        return matchesSearch && matchesFilter
    })

    const toggleWatchlist = (symbol: string) => {
        setAssets(assets.map(asset =>
            asset.symbol === symbol
                ? { ...asset, inWatchlist: !asset.inWatchlist }
                : asset
        ))
    }

    const formatVolume = (volume: number) => {
        if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`
        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
        return `$${volume.toLocaleString()}`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Markets</h1>
                <p className="text-gray-400 text-sm">Browse and analyze all available assets</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'crypto', 'stock', 'commodity'] as AssetFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-accent-green text-dark-900'
                                    : 'bg-dark-700 text-gray-400 hover:text-white'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Assets Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="w-12 px-4 py-4"></th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-400">Asset</th>
                                <th className="px-4 py-4 text-right text-sm font-medium text-gray-400">Price</th>
                                <th className="px-4 py-4 text-right text-sm font-medium text-gray-400">24h Change</th>
                                <th className="px-4 py-4 text-right text-sm font-medium text-gray-400">Volume</th>
                                <th className="px-4 py-4 text-right text-sm font-medium text-gray-400">Market Cap</th>
                                <th className="px-4 py-4 text-right text-sm font-medium text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAssets.map((asset) => (
                                <tr key={asset.symbol} className="hover:bg-dark-700/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleWatchlist(asset.symbol)}
                                            className="text-gray-500 hover:text-accent-green transition-colors"
                                        >
                                            {asset.inWatchlist ? (
                                                <Star className="w-5 h-5 fill-accent-green text-accent-green" />
                                            ) : (
                                                <StarOff className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-accent-green" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{asset.symbol}</div>
                                                <div className="text-sm text-gray-500">{asset.name}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${asset.type === 'crypto' ? 'bg-purple-500/20 text-purple-400' :
                                                    asset.type === 'stock' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {asset.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono font-medium">
                                        ${asset.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`flex items-center justify-end gap-1 font-medium ${asset.change >= 0 ? 'text-signal-buy' : 'text-signal-sell'
                                            }`}>
                                            {asset.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {asset.change >= 0 ? '+' : ''}{asset.change}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-gray-400">
                                        {formatVolume(asset.volume)}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-gray-400">
                                        {asset.marketCap ? formatVolume(asset.marketCap) : '—'}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Link
                                            href={`/dashboard?asset=${asset.symbol}`}
                                            className="inline-flex items-center gap-1 text-sm text-accent-green hover:underline"
                                        >
                                            Analyze <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredAssets.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No assets found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    )
}
