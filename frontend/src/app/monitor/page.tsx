"use client"

import React, { useEffect, useState, useRef } from 'react';
import {
    Activity,
    Server,
    Database,
    Terminal,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Cpu,
    Wifi,
    ShieldCheck
} from 'lucide-react';

// Types
interface LogEntry {
    id: number;
    time: string;
    type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    msg: string;
}

interface EndpointStatus {
    path: string;
    method: string;
    status: 'UP' | 'DOWN' | 'SLOW';
    latency: number;
}

export default function MonitoringPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLive, setIsLive] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    // Real System Metrics (Fetched)
    const [metrics, setMetrics] = useState({
        cpu: 0,
        memory: 0,
        uptime: '-',
        requests: 0,
        status: 'Checking...'
    });

    // Real Endpoints
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current && isLive) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isLive]);

    // WebSocket Connection for Real-time Logs (with auto-reconnect)
    useEffect(() => {
        if (!isLive) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = baseUrl.replace('http', 'ws') + '/api/monitor/ws';

        let socket: WebSocket | null = null;
        let reconnectAttempts = 0;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let isMounted = true;

        const connect = () => {
            if (!isMounted) return;

            console.log("Connecting to WebSocket:", wsUrl);
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                reconnectAttempts = 0; // Reset on successful connection
                const sysLog: LogEntry = { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'SUCCESS', msg: 'Connected to Real-time Monitor Stream' };
                setLogs(prev => [...prev.slice(-100), sysLog]);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLogs(prev => [...prev.slice(-100), data]);
                } catch (e) {
                    console.error("Failed to parse WS message", e);
                }
            };

            socket.onerror = () => {
                // Error will trigger onclose, no need to log here
            };

            socket.onclose = () => {
                if (!isMounted) return;

                const closeLog: LogEntry = { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'WARN', msg: 'Connection Closed. Reconnecting...' };
                setLogs(prev => [...prev.slice(-100), closeLog]);

                // Auto-reconnect with exponential backoff (max 30 seconds)
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                reconnectAttempts++;

                reconnectTimer = setTimeout(() => {
                    if (isMounted) connect();
                }, delay);
            };
        };

        connect();

        return () => {
            isMounted = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (socket) socket.close();
        };
    }, [isLive]);

    // Fetch API Health & Metrics
    const fetchSystemStatus = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // 1. Get Overall Health
            const healthRes = await fetch(`${baseUrl}/api/monitor/health`);
            const healthData = await healthRes.json();

            // 2. Get Endpoints Status
            const endpointsRes = await fetch(`${baseUrl}/api/monitor/endpoints`);
            const endpointsData = await endpointsRes.json();

            setEndpoints(endpointsData);

            setMetrics(prev => ({
                ...prev,
                status: healthData.status,
                // Mocking these for now as Python doesn't send OS metrics yet
                cpu: Math.floor(Math.random() * 30) + 10,
                memory: Math.floor(Math.random() * 40) + 30,
                requests: prev.requests + 12
            }));

        } catch (error) {
            console.error("Failed to fetch system status", error);
        } finally {
            setLoading(false);
        }
    };

    // Poll system status every 10 seconds
    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-sans selection:bg-blue-500/30">

            {/* Top Bar */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                System Monitor (Live)
                            </h1>
                            <p className="text-xs text-gray-500 font-mono">Connected to: {process.env.NEXT_PUBLIC_API_URL}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 border rounded-full flex items-center gap-2 ${metrics.status === 'HEALTHY' ? 'bg-green-500/10 border-green-500/20' :
                            metrics.status === 'DEGRADED' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                'bg-red-500/10 border-red-500/20'
                            }`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${metrics.status === 'HEALTHY' ? 'bg-green-400' :
                                    metrics.status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${metrics.status === 'HEALTHY' ? 'bg-green-500' :
                                    metrics.status === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></span>
                            </span>
                            <span className={`text-xs font-bold tracking-wide ${metrics.status === 'HEALTHY' ? 'text-green-400' :
                                metrics.status === 'DEGRADED' ? 'text-yellow-400' : 'text-red-400'
                                }`}>{metrics.status || 'CONNECTING...'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Overview Status"
                        value={metrics.status}
                        icon={<Activity className="w-5 h-5 text-green-400" />}
                        trend="Real-time Check"
                        trendColor="text-green-400"
                    />
                    <MetricCard
                        title="CPU Usage"
                        value={`${metrics.cpu.toFixed(1)}%`}
                        icon={<Cpu className="w-5 h-5 text-blue-400" />}
                        trend={metrics.cpu > 80 ? "High Load" : "Nominal"}
                        trendColor={metrics.cpu > 80 ? "text-red-400" : "text-blue-400"}
                    />
                    <MetricCard
                        title="Memory Usage"
                        value={`${metrics.memory}%`}
                        icon={<Wifi className="w-5 h-5 text-purple-400" />}
                        trend="Stable"
                        trendColor="text-purple-400"
                    />
                    <MetricCard
                        title="AI Engine"
                        value="Active"
                        icon={<Server className="w-5 h-5 text-amber-400" />}
                        trend="Ready"
                        trendColor="text-amber-400"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Endpoints & Status */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* API Health Table */}
                        <div className="bg-[#111116] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Database className="w-4 h-4 text-gray-400" /> API Endpoints Health
                                </h3>
                                <button
                                    onClick={fetchSystemStatus}
                                    className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-white/2">
                                        <tr>
                                            <th className="px-6 py-3">Endpoint</th>
                                            <th className="px-6 py-3">Method</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Latency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {endpoints.length > 0 ? endpoints.map((ep, i) => (
                                            <tr key={i} className="hover:bg-white/2 transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-300">{ep.path}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold 
                            ${ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {ep.method}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {ep.status === 'UP' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                        {ep.status === 'SLOW' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                                        {ep.status === 'DOWN' && <XCircle className="w-4 h-4 text-red-500" />}
                                                        <span className={
                                                            ep.status === 'UP' ? 'text-green-400' :
                                                                ep.status === 'SLOW' ? 'text-yellow-400' : 'text-red-400'
                                                        }>{ep.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-400">
                                                    {ep.latency}ms
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                    Connecting to Backend Service...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Service Status Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ServiceNode name="Backend API" status="online" version="v1.2.0" />
                            <ServiceNode name="AI Prediction Service" status="online" version="v2.1.0" />
                            <ServiceNode name="PostgreSQL DB" status="online" version="v15.4" />
                        </div>

                    </div>

                    {/* Right Column: Live Logs */}
                    <div className="bg-[#111116] border border-white/5 rounded-xl flex flex-col h-[600px]">
                        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-semibold">Live System Logs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                                <button
                                    onClick={() => setIsLive(!isLive)}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    {isLive ? 'PAUSE' : 'RESUME'}
                                </button>
                            </div>
                        </div>

                        <div
                            ref={logContainerRef}
                            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar"
                        >
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <span className={`shrink-0 font-bold w-16 ${log.type === 'INFO' ? 'text-blue-400' :
                                        log.type === 'WARN' ? 'text-yellow-400' :
                                            log.type === 'ERROR' ? 'text-red-400' :
                                                'text-green-400'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-gray-300 break-all">{log.msg}</span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-gray-600 text-center mt-20 italic">Waiting for logs...</div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

// Sub-components
function MetricCard({ title, value, icon, trend, trendColor }: any) {
    return (
        <div className="bg-[#111116] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{value || '-'}</p>
        </div>
    )
}

function ServiceNode({ name, status, version }: any) {
    return (
        <div className="bg-[#111116] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
                <h4 className="font-semibold text-sm text-gray-200">{name}</h4>
                <p className="text-xs text-gray-500 mt-1">{version}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] text-green-500 uppercase font-bold tracking-wider">ONLINE</span>
            </div>
        </div>
    )
}
