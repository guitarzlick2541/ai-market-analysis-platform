'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    TrendingUp,
    Brain,
    Shield,
    Zap,
    BarChart3,
    ArrowRight,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-dark-900">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
                </div>

                {/* Navigation */}
                <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-8 h-8 text-accent-green" />
                            <span className="text-xl font-bold gradient-text">MarketAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="btn-ghost">Login</Link>
                            <Link href="/register" className="btn-primary flex items-center gap-2">
                                Get Started <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 border border-accent-green/30 rounded-full mb-8">
                        <Zap className="w-4 h-4 text-accent-green" />
                        <span className="text-sm text-accent-green">AI-Powered Market Intelligence</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="text-white">Real-Time</span>{' '}
                        <span className="gradient-text">AI Market</span>{' '}
                        <span className="text-white">Analysis</span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Harness the power of FinBERT sentiment analysis and Temporal Fusion Transformers
                        to make smarter trading decisions across Stocks, Crypto, and Gold markets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                            Start Free <ChevronRight className="w-5 h-5" />
                        </Link>
                        <Link href="/dashboard" className="btn-secondary text-lg px-8 py-4">
                            View Demo
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                        {[
                            { value: '99.9%', label: 'Uptime' },
                            { value: '<50ms', label: 'Latency' },
                            { value: '24/7', label: 'Market Coverage' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="gradient-text">Cutting-Edge</span> AI Technology
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Our platform combines state-of-the-art machine learning models
                            specifically designed for financial market analysis.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Brain,
                                title: 'FinBERT Sentiment',
                                description: 'Financial-domain BERT model for accurate news sentiment analysis and market mood detection.',
                                accent: 'green'
                            },
                            {
                                icon: BarChart3,
                                title: 'TFT Price Prediction',
                                description: 'Temporal Fusion Transformer for multi-horizon forecasting with interpretable attention.',
                                accent: 'cyan'
                            },
                            {
                                icon: Shield,
                                title: 'Risk Assessment',
                                description: 'Real-time risk scoring and position sizing recommendations based on volatility.',
                                accent: 'purple'
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="glass-card-hover p-8 group"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-accent-${feature.accent}/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-7 h-7 text-accent-${feature.accent}`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-8">
                <div className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-green/5 to-accent-cyan/5" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h2>
                        <p className="text-gray-400 mb-8">
                            Join thousands of traders using AI-powered insights to stay ahead of the market.
                        </p>
                        <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                            Get Started Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-accent-green" />
                        <span className="font-semibold gradient-text">MarketAI</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        © 2026 MarketAI. For educational purposes only.
                    </p>
                </div>
            </footer>
        </main>
    )
}
