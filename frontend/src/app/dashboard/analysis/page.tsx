'use client'

import { useState } from 'react'
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Target,
    Activity,
    BarChart3,
    PieChart,
    Zap,
    RefreshCw,
    Info
} from 'lucide-react'

// Mock AI analysis data
const analysisData = {
    asset: 'BTC-USD',
    name: 'Bitcoin',
    currentPrice: 43250.50,
    prediction: {
        trend: 'UP' as const,
        confidence: 78,
        signal: 'BUY' as const,
        riskLevel: 'MEDIUM' as const,
        targetPrice: 45200,
        targetRange: { low: 42500, high: 47000 },
        timeframe: '24h'
    },
    technicalIndicators: [
        { name: 'RSI (14)', value: 58.2, signal: 'Neutral', description: 'Neither overbought nor oversold' },
        { name: 'MACD', value: 125.4, signal: 'Bullish', description: 'MACD line above signal line' },
        { name: 'MA (50)', value: 41800, signal: 'Bullish', description: 'Price above 50-day MA' },
        { name: 'MA (200)', value: 38500, signal: 'Bullish', description: 'Price above 200-day MA' },
        { name: 'Bollinger', value: 'Upper', signal: 'Caution', description: 'Near upper band' },
        { name: 'Volume', value: '↑ 15%', signal: 'Bullish', description: 'Increasing volume confirms trend' },
    ],
    featureImportance: [
        { name: 'Sentiment Score', value: 0.28, color: '#00FF88' },
        { name: 'Volume Change', value: 0.22, color: '#00D4FF' },
        { name: 'RSI Signal', value: 0.18, color: '#8B5CF6' },
        { name: 'MACD Signal', value: 0.15, color: '#FBBF24' },
        { name: 'Price Momentum', value: 0.17, color: '#EC4899' },
    ],
    sentiment: {
        overall: 'positive',
        score: 0.72,
        newsCount: 12,
        positiveCount: 8,
        negativeCount: 2,
        neutralCount: 2
    },
    modelInfo: {
        primary: 'Temporal Fusion Transformer (TFT)',
        fallback: 'LSTM',
        lastTrained: '2026-01-30',
        accuracy: 76.4
    }
}

export default function AnalysisPage() {
    const [selectedAsset, setSelectedAsset] = useState('BTC-USD')
    const [isLoading, setIsLoading] = useState(false)

    const getSignalClass = (signal: string) => {
        switch (signal) {
            case 'BUY': return 'signal-buy'
            case 'SELL': return 'signal-sell'
            case 'HOLD': return 'signal-hold'
            default: return ''
        }
    }

    const getIndicatorSignalColor = (signal: string) => {
        switch (signal) {
            case 'Bullish': return 'text-signal-buy'
            case 'Bearish': return 'text-signal-sell'
            case 'Caution': return 'text-signal-hold'
            default: return 'text-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">AI Analysis</h1>
                    <p className="text-gray-400 text-sm">Deep dive into AI predictions and model insights</p>
                </div>
                <button
                    onClick={() => setIsLoading(true)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                </button>
            </div>

            {/* Asset Selector */}
            <div className="glass-card p-4 flex items-center gap-4">
                <span className="text-gray-400">Analyzing:</span>
                <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="bg-dark-700 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-green"
                >
                    <option value="BTC-USD">Bitcoin (BTC-USD)</option>
                    <option value="ETH-USD">Ethereum (ETH-USD)</option>
                    <option value="AAPL">Apple (AAPL)</option>
                    <option value="XAU-USD">Gold (XAU-USD)</option>
                </select>
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                    <Brain className="w-4 h-4 text-accent-green" />
                    <span>Model: {analysisData.modelInfo.primary}</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Prediction Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Signal Summary */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-accent-green" />
                            <h2 className="text-lg font-semibold">AI Prediction Summary</h2>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                                <div className={`text-2xl font-bold mb-1 ${getSignalClass(analysisData.prediction.signal)} inline-block px-4 py-1`}>
                                    {analysisData.prediction.signal}
                                </div>
                                <div className="text-xs text-gray-500">Signal</div>
                            </div>
                            <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                                <div className="text-2xl font-bold text-accent-green mb-1">{analysisData.prediction.confidence}%</div>
                                <div className="text-xs text-gray-500">Confidence</div>
                            </div>
                            <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                                <div className={`text-2xl font-bold mb-1 ${analysisData.prediction.trend === 'UP' ? 'text-signal-buy' : 'text-signal-sell'
                                    }`}>
                                    {analysisData.prediction.trend}
                                </div>
                                <div className="text-xs text-gray-500">Trend</div>
                            </div>
                            <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                                <div className={`text-2xl font-bold mb-1 ${analysisData.prediction.riskLevel === 'LOW' ? 'text-signal-buy' :
                                        analysisData.prediction.riskLevel === 'MEDIUM' ? 'text-signal-hold' : 'text-signal-sell'
                                    }`}>
                                    {analysisData.prediction.riskLevel}
                                </div>
                                <div className="text-xs text-gray-500">Risk Level</div>
                            </div>
                        </div>

                        {/* Price Targets */}
                        <div className="p-4 bg-dark-700/30 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-accent-cyan" />
                                    <span className="font-medium">Price Targets ({analysisData.prediction.timeframe})</span>
                                </div>
                                <span className="text-sm text-gray-400">Current: ${analysisData.currentPrice.toLocaleString()}</span>
                            </div>
                            <div className="relative h-8 bg-dark-600 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-signal-sell via-signal-hold to-signal-buy rounded-full"
                                    style={{ width: '100%' }}
                                />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-dark-900"
                                    style={{ left: '45%' }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-signal-sell">${analysisData.prediction.targetRange.low.toLocaleString()}</span>
                                <span className="text-accent-green font-medium">${analysisData.prediction.targetPrice.toLocaleString()}</span>
                                <span className="text-signal-buy">${analysisData.prediction.targetRange.high.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-accent-cyan" />
                            <h2 className="text-lg font-semibold">Technical Indicators</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {analysisData.technicalIndicators.map((indicator) => (
                                <div key={indicator.name} className="p-4 bg-dark-700/50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{indicator.name}</span>
                                        <span className={`text-sm font-medium ${getIndicatorSignalColor(indicator.signal)}`}>
                                            {indicator.signal}
                                        </span>
                                    </div>
                                    <div className="text-xl font-mono mb-1">{indicator.value}</div>
                                    <div className="text-xs text-gray-500">{indicator.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Feature Importance */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <PieChart className="w-5 h-5 text-accent-green" />
                            <h2 className="text-lg font-semibold">Feature Importance</h2>
                        </div>
                        <div className="space-y-4">
                            {analysisData.featureImportance.map((feature) => (
                                <div key={feature.name}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-400">{feature.name}</span>
                                        <span className="font-medium">{(feature.value * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${feature.value * 100}%`, backgroundColor: feature.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-dark-700/50 rounded-lg">
                            <div className="flex items-start gap-2 text-xs text-gray-400">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Feature importance shows which inputs had the most influence on the model's prediction.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment Summary */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="w-5 h-5 text-accent-cyan" />
                            <h2 className="text-lg font-semibold">Sentiment Summary</h2>
                        </div>
                        <div className="text-center mb-4">
                            <div className={`text-3xl font-bold mb-1 ${analysisData.sentiment.overall === 'positive' ? 'text-signal-buy' :
                                    analysisData.sentiment.overall === 'negative' ? 'text-signal-sell' : 'text-gray-400'
                                }`}>
                                {(analysisData.sentiment.score * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-500">{analysisData.sentiment.overall.toUpperCase()}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-signal-buy/10 rounded-lg">
                                <div className="text-lg font-bold text-signal-buy">{analysisData.sentiment.positiveCount}</div>
                                <div className="text-xs text-gray-500">Positive</div>
                            </div>
                            <div className="p-2 bg-gray-500/10 rounded-lg">
                                <div className="text-lg font-bold text-gray-400">{analysisData.sentiment.neutralCount}</div>
                                <div className="text-xs text-gray-500">Neutral</div>
                            </div>
                            <div className="p-2 bg-signal-sell/10 rounded-lg">
                                <div className="text-lg font-bold text-signal-sell">{analysisData.sentiment.negativeCount}</div>
                                <div className="text-xs text-gray-500">Negative</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Based on {analysisData.sentiment.newsCount} news articles
                        </div>
                    </div>

                    {/* Model Info */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-accent-green" />
                            <h2 className="text-lg font-semibold">Model Info</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Primary Model</span>
                                <span className="font-medium">TFT</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fallback</span>
                                <span className="font-medium">LSTM</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Last Trained</span>
                                <span className="font-medium">{analysisData.modelInfo.lastTrained}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Historical Accuracy</span>
                                <span className="font-medium text-accent-green">{analysisData.modelInfo.accuracy}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
