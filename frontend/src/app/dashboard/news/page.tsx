'use client'

import { useState } from 'react'
import {
    Newspaper,
    TrendingUp,
    TrendingDown,
    Clock,
    ExternalLink,
    Filter,
    RefreshCw,
    Brain
} from 'lucide-react'

// Mock news data with sentiment
const newsData = [
    {
        id: '1',
        title: 'Bitcoin ETF approval drives institutional adoption surge as major banks announce crypto custody services',
        description: 'Major financial institutions are racing to offer cryptocurrency services following the historic ETF approval, marking a new era for digital assets.',
        source: 'CoinDesk',
        url: '#',
        publishedAt: '2 hours ago',
        sentiment: 'positive' as const,
        sentimentScore: 0.89,
        relevantAssets: ['BTC-USD', 'ETH-USD'],
        aiSummary: 'Institutional adoption accelerating with ETF approval. Bullish signal for major cryptocurrencies.'
    },
    {
        id: '2',
        title: 'Federal Reserve signals potential rate cuts in Q1 2026 amid cooling inflation',
        description: 'Fed Chair indicates readiness to adjust monetary policy as inflation metrics continue to improve toward target levels.',
        source: 'Bloomberg',
        url: '#',
        publishedAt: '4 hours ago',
        sentiment: 'positive' as const,
        sentimentScore: 0.72,
        relevantAssets: ['XAU-USD', 'AAPL', 'MSFT'],
        aiSummary: 'Rate cuts typically positive for risk assets. Watch for equity market rally.'
    },
    {
        id: '3',
        title: 'Market volatility increases amid geopolitical tensions in Eastern Europe',
        description: 'Global markets experience heightened uncertainty as diplomatic relations deteriorate in key regions.',
        source: 'Reuters',
        url: '#',
        publishedAt: '6 hours ago',
        sentiment: 'negative' as const,
        sentimentScore: 0.65,
        relevantAssets: ['XAU-USD'],
        aiSummary: 'Safe-haven assets likely to benefit. Gold showing strength amid uncertainty.'
    },
    {
        id: '4',
        title: 'NVIDIA announces breakthrough AI chip architecture with 3x performance gains',
        description: 'The new Blackwell Ultra series promises revolutionary performance for AI training and inference workloads.',
        source: 'TechCrunch',
        url: '#',
        publishedAt: '8 hours ago',
        sentiment: 'positive' as const,
        sentimentScore: 0.91,
        relevantAssets: ['NVDA'],
        aiSummary: 'Strong catalyst for NVDA. AI hardware demand remains robust.'
    },
    {
        id: '5',
        title: 'Ethereum network upgrade successfully deployed, reducing gas fees by 40%',
        description: 'The long-awaited Pectra upgrade goes live, significantly improving transaction efficiency and user experience.',
        source: 'The Block',
        url: '#',
        publishedAt: '10 hours ago',
        sentiment: 'positive' as const,
        sentimentScore: 0.85,
        relevantAssets: ['ETH-USD'],
        aiSummary: 'Technical improvement bullish for ETH adoption. Lower fees attract more users.'
    },
    {
        id: '6',
        title: 'Regulatory crackdown on crypto exchanges intensifies in Asia Pacific',
        description: 'Several countries announce stricter compliance requirements for cryptocurrency trading platforms.',
        source: 'Financial Times',
        url: '#',
        publishedAt: '12 hours ago',
        sentiment: 'negative' as const,
        sentimentScore: 0.58,
        relevantAssets: ['BTC-USD', 'ETH-USD'],
        aiSummary: 'Short-term negative pressure possible. Long-term clarity may benefit regulated players.'
    },
]

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative'

export default function NewsPage() {
    const [filter, setFilter] = useState<SentimentFilter>('all')
    const [isLoading, setIsLoading] = useState(false)

    const filteredNews = newsData.filter(news =>
        filter === 'all' || news.sentiment === filter
    )

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'text-signal-buy bg-signal-buy/20 border-signal-buy/30'
            case 'negative': return 'text-signal-sell bg-signal-sell/20 border-signal-sell/30'
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
        }
    }

    const getSentimentBarColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'bg-signal-buy'
            case 'negative': return 'bg-signal-sell'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">News & Sentiment</h1>
                    <p className="text-gray-400 text-sm">AI-powered market news analysis with FinBERT</p>
                </div>
                <button
                    onClick={() => setIsLoading(true)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Sentiment Overview */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Positive', count: newsData.filter(n => n.sentiment === 'positive').length, color: 'signal-buy' },
                    { label: 'Neutral', count: newsData.filter(n => n.sentiment === 'neutral').length, color: 'gray-400' },
                    { label: 'Negative', count: newsData.filter(n => n.sentiment === 'negative').length, color: 'signal-sell' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-4 text-center">
                        <div className={`text-3xl font-bold text-${stat.color}`}>{stat.count}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                {(['all', 'positive', 'neutral', 'negative'] as SentimentFilter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                                ? f === 'positive' ? 'bg-signal-buy text-dark-900' :
                                    f === 'negative' ? 'bg-signal-sell text-white' :
                                        'bg-accent-green text-dark-900'
                                : 'bg-dark-700 text-gray-400 hover:text-white'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* News List */}
            <div className="space-y-4">
                {filteredNews.map((news) => (
                    <article key={news.id} className="glass-card-hover p-6">
                        <div className="flex items-start gap-4">
                            {/* Sentiment Indicator */}
                            <div className="flex flex-col items-center gap-2 pt-1">
                                <div className={`w-3 h-3 rounded-full ${getSentimentBarColor(news.sentiment)}`} />
                                <div className="w-0.5 h-full bg-dark-600" />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <h2 className="text-lg font-semibold leading-snug hover:text-accent-green transition-colors cursor-pointer">
                                        {news.title}
                                    </h2>
                                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(news.sentiment)}`}>
                                        {news.sentiment.toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                    {news.description}
                                </p>

                                {/* AI Summary */}
                                <div className="p-3 bg-dark-700/50 rounded-xl mb-4">
                                    <div className="flex items-center gap-2 text-xs text-accent-cyan mb-2">
                                        <Brain className="w-3 h-3" />
                                        <span>AI Analysis</span>
                                    </div>
                                    <p className="text-sm">{news.aiSummary}</p>
                                </div>

                                {/* Sentiment Score Bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Sentiment Score</span>
                                        <span className={
                                            news.sentiment === 'positive' ? 'text-signal-buy' :
                                                news.sentiment === 'negative' ? 'text-signal-sell' : 'text-gray-400'
                                        }>
                                            {(news.sentimentScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${getSentimentBarColor(news.sentiment)}`}
                                            style={{ width: `${news.sentimentScore * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Newspaper className="w-3 h-3" />
                                            {news.source}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {news.publishedAt}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {news.relevantAssets.map((asset) => (
                                            <span key={asset} className="px-2 py-1 bg-dark-700 rounded-lg text-xs font-medium">
                                                {asset}
                                            </span>
                                        ))}
                                        <a href={news.url} className="p-1 text-gray-500 hover:text-accent-green transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}
