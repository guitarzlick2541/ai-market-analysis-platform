'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    DollarSign,
    Star,
    Brain,
    AlertTriangle,
    Target,
    Percent,
    Clock,
    ChevronRight,
    BarChart3,
    RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import CandlestickChart from '@/components/charts/CandlestickChart'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Asset type definition
interface MarketAsset {
    symbol: string
    name: string
    price: number
    change: number
    type: string
    volume_24h?: number
    market_cap?: number
}

interface NewsItem {
    id: string
    title: string
    publisher: string
    link: string
    published_at: number
    thumbnail?: string
    related_tickers: string[]
}

interface FeatureImportance {
    name: string
    value: number
}

interface AISignalData {
    asset: string
    signal: string
    confidence: number
    risk_level: string // Note: Backend uses snake_case
    predicted_price: number
    predicted_range: {
        low: number
        high: number
    }
    trend: string
    feature_importance: FeatureImportance[]
    timestamp: string
}

// Default assets to display (Magnificent 7 + Crypto + Gold)
const defaultAssets: MarketAsset[] = [
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 0, change: 0, type: 'crypto' },
    { symbol: 'ETH-USD', name: 'Ethereum', price: 0, change: 0, type: 'crypto' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft', price: 0, change: 0, type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet', price: 0, change: 0, type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon', price: 0, change: 0, type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA', price: 0, change: 0, type: 'stock' },
    { symbol: 'META', name: 'Meta Platforms', price: 0, change: 0, type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla', price: 0, change: 0, type: 'stock' },
    { symbol: 'XAU-USD', name: 'Gold', price: 0, change: 0, type: 'commodity' },
]


// Helper to format market cap
const formatMarketCap = (num?: number) => {
    if (!num) return 'N/A'
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
}

// Helper to format volume
const formatVolume = (num?: number) => {
    if (!num) return 'N/A'
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toLocaleString()
}


export default function DashboardPage() {
    const [selectedAsset, setSelectedAsset] = useState('BTC-USD')
    const [selectedTimeframe, setSelectedTimeframe] = useState('1h')
    const [isLoading, setIsLoading] = useState(false)
    const [marketAssets, setMarketAssets] = useState<MarketAsset[]>(defaultAssets)
    const [aiSignal, setAiSignal] = useState<AISignalData | null>(null)
    const [news, setNews] = useState<NewsItem[]>([])
    const [isSignalLoading, setIsSignalLoading] = useState(false)

    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D']

    // Fetch real market prices from backend
    const fetchMarketPrices = useCallback(async () => {
        setIsLoading(true)
        try {
            const symbols = defaultAssets.map(a => a.symbol).join(',')
            const response = await fetch(`${API_BASE_URL}/api/market/quotes?symbols=${symbols}`)

            if (response.ok) {
                const data = await response.json()
                if (data.quotes && data.quotes.length > 0) {
                    setMarketAssets(prevAssets => {
                        const updatedAssets = [...prevAssets]
                        data.quotes.forEach((quote: MarketAsset & { change_24h: number }) => {
                            const index = updatedAssets.findIndex(a => a.symbol === quote.symbol)
                            if (index !== -1) {
                                updatedAssets[index] = {
                                    ...updatedAssets[index],
                                    price: quote.price,
                                    change: quote.change_24h,
                                    type: quote.type || updatedAssets[index].type,
                                    volume_24h: quote.volume_24h,
                                    market_cap: quote.market_cap
                                }
                            }
                        })
                        return updatedAssets
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch market prices:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch News
    const fetchNews = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/market/news`)
            if (response.ok) {
                const data = await response.json()
                setNews(data)
            }
        } catch (error) {
            console.error('Failed to fetch news:', error)
        }
    }, [])

    // Fetch AI Signal for selected asset
    const fetchAISignal = useCallback(async () => {
        setIsSignalLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/signals/${selectedAsset}`)
            if (response.ok) {
                const data = await response.json()
                setAiSignal(data)
            }
        } catch (error) {
            console.error('Failed to fetch AI signal:', error)
        } finally {
            setIsSignalLoading(false)
        }
    }, [selectedAsset])

    // Initial fetch and periodic updates
    useEffect(() => {
        fetchMarketPrices()
        fetchNews()
        const interval = setInterval(() => {
            fetchMarketPrices()
            fetchNews()
        }, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [fetchMarketPrices, fetchNews])

    // Fetch AI signal when asset changes
    useEffect(() => {
        fetchAISignal()
    }, [fetchAISignal])

    const getSignalClass = (signal: string) => {
        switch (signal) {
            case 'BUY': return 'signal-buy'
            case 'SELL': return 'signal-sell'
            case 'HOLD': return 'signal-hold'
            default: return ''
        }
    }

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-signal-buy" />
        if (change < 0) return <TrendingDown className="w-4 h-4 text-signal-sell" />
        return <Minus className="w-4 h-4 text-gray-400" />
    }

    const handleRefresh = () => {
        fetchMarketPrices()
        fetchAISignal()
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-gray-400 text-sm">Real-time market analysis powered by AI</p>
                </div>
                <button
                    className="btn-secondary flex items-center gap-2"
                    onClick={handleRefresh}
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading || isSignalLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Market Overview Cards */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Market Overview</h2>
                    <Link href="/dashboard/markets" className="text-sm text-accent-green hover:underline flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-2">
                    {marketAssets.map((asset) => (
                        <button
                            key={asset.symbol}
                            onClick={() => setSelectedAsset(asset.symbol)}
                            className={`glass-card-hover p-4 text-left transition-all min-w-[200px] ${selectedAsset === asset.symbol ? 'border-accent-green/50 shadow-glow-green' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-accent-green" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{asset.symbol}</div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{asset.name}</div>
                                    </div>
                                </div>
                                {getTrendIcon(asset.change)}
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-lg font-bold">
                                        ${asset.price >= 1000
                                            ? asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : asset.price.toFixed(2)
                                        }
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex flex-col">
                                        <span>Vol: {formatVolume(asset.volume_24h)}</span>
                                        {asset.type !== 'crypto' && <span>Cap: {formatMarketCap(asset.market_cap)}</span>}
                                    </div>
                                </div>
                                <div className={`text-xs font-medium ${asset.change >= 0 ? 'text-signal-buy' : 'text-signal-sell'}`}>
                                    {asset.change >= 0 ? '+' : ''}{typeof asset.change === 'number' ? asset.change.toFixed(2) : '0.00'}%
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Grid: Chart + AI Panel + News */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Candlestick Chart Section */}
                <section className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold">{selectedAsset}</h2>
                            <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1 hidden sm:flex">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setSelectedTimeframe(tf)}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${selectedTimeframe === tf
                                            ? 'bg-accent-green text-dark-900 font-medium'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1 text-sm border border-white/10 rounded-lg hover:bg-white/5">
                                Indicators
                            </button>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-[400px] w-full mt-4">
                        <CandlestickChart
                            symbol={selectedAsset}
                            timeframe={selectedTimeframe}
                        />
                    </div>
                </section>

                {/* AI Signal Panel */}
                <section className="glass-card p-6 min-h-[500px]">
                    <div className="flex items-center gap-2 mb-6">
                        <Brain className={`w-5 h-5 text-accent-green ${isSignalLoading ? 'animate-pulse' : ''}`} />
                        <h2 className="text-lg font-semibold">AI Signal Analysis</h2>
                    </div>

                    {isSignalLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                            <RefreshCw className="w-8 h-8 animate-spin text-accent-cyan" />
                            <p>Analyzing market data...</p>
                        </div>
                    ) : aiSignal ? (
                        <>
                            {/* Signal Badge */}
                            <div className="text-center mb-6">
                                <div className={`inline-block ${getSignalClass(aiSignal.signal)} px-8 py-3 text-2xl font-bold pulse-glow rounded-xl border border-white/10`}>
                                    {aiSignal.signal}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    AI Confidence: spans multiple intervals
                                </p>
                            </div>

                            {/* Confidence Gauge */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">Confidence Score</span>
                                    <span className="font-semibold text-accent-green">{aiSignal.confidence}%</span>
                                </div>
                                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-accent-green to-accent-cyan rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${aiSignal.confidence}%` }}
                                    />
                                </div>
                            </div>

                            {/* Signal Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Risk Level</span>
                                    </div>
                                    <span className={`font-medium ${aiSignal.risk_level === 'LOW' ? 'text-signal-buy' :
                                        aiSignal.risk_level === 'MEDIUM' ? 'text-signal-hold' : 'text-signal-sell'
                                        }`}>
                                        {aiSignal.risk_level}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Target className="w-4 h-4" />
                                        <span>Target Range</span>
                                    </div>
                                    <span className="font-medium text-sm">
                                        ${aiSignal.predicted_range?.low?.toLocaleString() ?? 0} - ${aiSignal.predicted_range?.high?.toLocaleString() ?? 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Activity className="w-4 h-4" />
                                        <span>Predicted Trend</span>
                                    </div>
                                    <span className={`font-medium flex items-center gap-1 ${aiSignal.trend === 'UP' ? 'text-signal-buy' : 'text-signal-sell'
                                        }`}>
                                        {aiSignal.trend === 'UP' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {aiSignal.trend}
                                    </span>
                                </div>
                            </div>

                            {/* Feature Importance */}
                            <div className="mt-6">
                                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Key Drivers</h3>
                                <div className="space-y-2">
                                    {aiSignal.feature_importance?.slice(0, 4).map((feature) => (
                                        <div key={feature.name} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 w-24 truncate">{feature.name}</span>
                                            <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-cyan/70 rounded-full"
                                                    style={{ width: `${Math.abs(feature.value * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select an asset to view analysis
                        </div>
                    )}
                </section>
            </div>

            {/* News & Sentiment Section */}
            <section className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent-cyan" />
                        <h2 className="text-lg font-semibold">Recent News & Sentiment</h2>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {news.length > 0 ? news.map((item) => (
                        <a
                            key={item.id}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors cursor-pointer border border-white/5 flex flex-col h-full group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan">
                                    {item.publisher}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.published_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex items-start gap-4 flex-1">
                                {item.thumbnail && (
                                    <img
                                        src={item.thumbnail}
                                        alt=""
                                        className="w-16 h-16 rounded-lg object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                )}
                                <h3 className="text-sm font-medium line-clamp-3 group-hover:text-accent-green transition-colors">
                                    {item.title}
                                </h3>
                            </div>

                            {item.related_tickers && item.related_tickers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-4">
                                    {item.related_tickers.slice(0, 3).map(t => (
                                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </a>
                    )) : (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                            Loading latest market news...
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
