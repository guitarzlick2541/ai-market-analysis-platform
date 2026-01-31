'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface CandlestickChartProps {
    symbol: string
    timeframe: string
    data?: CandlestickData<Time>[]
    onDataUpdate?: (data: CandlestickData<Time>) => void
}

interface OHLCVResponse {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CandlestickChart({
    symbol,
    timeframe,
    data,
    onDataUpdate
}: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
    const [chartData, setChartData] = useState<CandlestickData<Time>[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Use ref to track current fetch request
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)

    // Fetch real data from backend API
    const fetchHistoricalData = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController()

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/market/history/${symbol}?timeframe=${timeframe}&limit=100`,
                { signal: abortControllerRef.current.signal }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`)
            }

            const apiData: OHLCVResponse[] = await response.json()

            // Check if component is still mounted and this is still the current request
            if (!isMountedRef.current) return

            // Convert API response to chart format
            const candleData: CandlestickData<Time>[] = apiData.map((candle) => ({
                time: candle.time as Time,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
            }))

            // Generate volume data
            const volumeData = apiData.map((candle) => ({
                time: candle.time as Time,
                value: candle.volume || Math.random() * 1000000 + 500000,
                color: candle.close >= candle.open ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 71, 87, 0.3)',
            }))

            setChartData(candleData)

            // Update chart series
            if (candleSeriesRef.current && candleData.length > 0) {
                candleSeriesRef.current.setData(candleData)
            }
            if (volumeSeriesRef.current && volumeData.length > 0) {
                volumeSeriesRef.current.setData(volumeData)
            }

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return
            }

            console.error('Error fetching chart data:', err)

            if (!isMountedRef.current) return

            setError(err instanceof Error ? err.message : 'Failed to load chart data')

            // Fallback to mock data if API fails
            const mockData = generateFallbackData()
            setChartData(mockData)
            if (candleSeriesRef.current) {
                candleSeriesRef.current.setData(mockData)
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false)
            }
        }
    }, [symbol, timeframe])

    // Fallback mock data generator (used when API fails)
    const generateFallbackData = (): CandlestickData<Time>[] => {
        const data: CandlestickData<Time>[] = []
        let basePrice = symbol.includes('BTC') ? 43000 : symbol.includes('ETH') ? 2500 : 100
        const now = Math.floor(Date.now() / 1000)

        for (let i = 0; i < 100; i++) {
            const time = (now - (100 - i) * 3600) as Time
            const volatility = basePrice * 0.01
            const open = basePrice + (Math.random() - 0.5) * volatility
            const close = open + (Math.random() - 0.5) * volatility
            const high = Math.max(open, close) + Math.random() * (volatility / 2)
            const low = Math.min(open, close) - Math.random() * (volatility / 2)

            data.push({ time, open, high, low, close })
            basePrice = close
        }

        return data
    }

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(0, 255, 136, 0.3)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#00FF88',
                },
                horzLine: {
                    color: 'rgba(0, 255, 136, 0.3)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#00FF88',
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
        })

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#00FF88',
            downColor: '#FF4757',
            borderUpColor: '#00FF88',
            borderDownColor: '#FF4757',
            wickUpColor: '#00FF88',
            wickDownColor: '#FF4757',
        })

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: '#00D4FF',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        })

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries
        volumeSeriesRef.current = volumeSeries

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                })
            }
        }

        window.addEventListener('resize', handleResize)
        handleResize()

        // Initial data fetch
        fetchHistoricalData()

        // Cleanup
        return () => {
            isMountedRef.current = false
            window.removeEventListener('resize', handleResize)
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            chart.remove()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch data when symbol or timeframe changes
    useEffect(() => {
        isMountedRef.current = true
        if (candleSeriesRef.current) {
            fetchHistoricalData()
        }

        return () => {
            // Abort any pending request when symbol/timeframe changes
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [symbol, timeframe])

    // Simulate real-time updates
    useEffect(() => {
        if (!candleSeriesRef.current || chartData.length === 0) return

        const interval = setInterval(() => {
            const lastCandle = chartData[chartData.length - 1]
            if (!lastCandle) return

            // Update current candle with small price change
            const priceChange = (Math.random() - 0.5) * (lastCandle.close * 0.001)
            const updatedCandle: CandlestickData<Time> = {
                time: lastCandle.time,
                open: lastCandle.open,
                high: Math.max(lastCandle.high, lastCandle.close + priceChange),
                low: Math.min(lastCandle.low, lastCandle.close + priceChange),
                close: lastCandle.close + priceChange,
            }

            candleSeriesRef.current?.update(updatedCandle)

            if (onDataUpdate) {
                onDataUpdate(updatedCandle)
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [chartData, onDataUpdate])

    return (
        <div className="relative w-full h-full min-h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-800/50 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">กำลังโหลดข้อมูล...</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute top-2 right-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs z-10">
                    ⚠️ ใช้ข้อมูลสำรอง (API Error)
                </div>
            )}
            <div
                ref={chartContainerRef}
                className="w-full h-full"
            />
        </div>
    )
}
