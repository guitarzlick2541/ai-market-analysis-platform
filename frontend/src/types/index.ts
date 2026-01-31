// Type definitions for the AI Market Analysis Platform

// ===== Market Types =====
export type AssetType = 'crypto' | 'stock' | 'commodity'
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W'

export interface Asset {
    symbol: string
    name: string
    type: AssetType
    price: number
    change24h: number
    volume24h: number
    marketCap?: number
    image?: string
}

export interface OHLCV {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

// ===== AI Signal Types =====
export type SignalAction = 'BUY' | 'SELL' | 'HOLD'
export type TrendDirection = 'UP' | 'DOWN' | 'SIDEWAYS'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AISignal {
    asset: string
    timestamp: string
    signal: SignalAction
    confidence: number
    trend: TrendDirection
    riskLevel: RiskLevel
    predictedPrice: number
    predictedRange: {
        low: number
        high: number
    }
    featureImportance: FeatureImportance[]
    reasoning?: string
}

export interface FeatureImportance {
    name: string
    value: number
}

// ===== Sentiment Types =====
export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface SentimentAnalysis {
    text: string
    sentiment: SentimentLabel
    confidence: number
    scores: {
        positive: number
        neutral: number
        negative: number
    }
    relevantAssets: string[]
}

export interface NewsItem {
    id: string
    title: string
    description?: string
    source: string
    url: string
    publishedAt: string
    sentiment: SentimentLabel
    sentimentScore: number
    relevantAssets: string[]
    aiSummary?: string
}

// ===== User Types =====
export type UserRole = 'FREE' | 'PRO' | 'ADMIN'

export interface User {
    id: string
    email: string
    displayName?: string
    role: UserRole
    createdAt: string
    updatedAt: string
}

export interface Watchlist {
    id: string
    userId: string
    assetSymbol: string
    addedAt: string
}

export interface Alert {
    id: string
    userId: string
    assetSymbol: string
    alertType: 'price' | 'signal'
    condition: 'above' | 'below' | 'equals'
    targetValue: number
    isActive: boolean
    createdAt: string
    triggeredAt?: string
}

// ===== API Response Types =====
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

// ===== WebSocket Types =====
export interface WSMessage {
    type: 'price' | 'signal' | 'news' | 'alert'
    payload: unknown
    timestamp: string
}

export interface WSPriceUpdate {
    symbol: string
    price: number
    change: number
    volume: number
}

export interface WSSignalUpdate {
    asset: string
    signal: SignalAction
    confidence: number
    trend: TrendDirection
}
