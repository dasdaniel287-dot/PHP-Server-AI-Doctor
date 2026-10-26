import React, { useState } from 'react';
import {
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  HardDrive,
  Activity,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ServerSimulatorProps {
  initialTestCase?: {
    name: string;
    errorLog: string;
    isFixed: boolean;
  } | null;
}

export const ServerSimulator: React.FC<ServerSimulatorProps> = ({ initialTestCase }) => {
  const [isFixed, setIsFixed] = useState<boolean>(initialTestCase?.isFixed ?? true);
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [endpoint, setEndpoint] = useState<string>('/api/export-orders');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simulationRun, setSimulationRun] = useState<boolean>(true);

  // Simulated results based on fix status
  const handleRunRequest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setSimulationRun(true);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Simulator Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Live Virtual PHP-FPM / Nginx Request Simulator
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Test &amp; Verify Server State
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Verify how your PHP server and process manager react before and after applying the AI 1-Click fix.
              Observe status codes, memory peak allocation, FastCGI socket timeouts, and error logs in real-time.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setIsFixed(false);
                setSimulationRun(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isFixed
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Broken State (Before)
            </button>
            <button
              onClick={() => {
                setIsFixed(true);
                setSimulationRun(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isFixed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ 1-Click Fix Applied (After)
            </button>
          </div>
        </div>
      </div>

      {/* Request Bar */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="w-full sm:w-auto flex items-center bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="bg-transparent px-3 py-2 text-xs font-bold font-mono text-cyan-400 focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="w-full flex-1 relative">
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="e.g. /api/export-orders"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleRunRequest}
            disabled={isRunning}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-md transition"
          >
            {isRunning ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Send Request</span>
          </button>
        </div>
      </div>

      {/* Simulated Response Console */}
      {simulationRun && (
        <div className="space-y-4 animate-in fade-in">
          {/* Status Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                HTTP Status
              </span>
              <div className="flex items-center space-x-2">
                {isFixed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-base font-bold font-mono text-emerald-400">200 OK</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4 text-red-400" />
                    <span className="text-base font-bold font-mono text-red-400">500 Fatal Error</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Peak Memory
              </span>
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span className={`text-base font-bold font-mono ${isFixed ? 'text-slate-200' : 'text-red-400'}`}>
                  {isFixed ? '18.4 MB / 512 MB' : '134.2 MB / 128 MB'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Response Latency
              </span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-base font-bold font-mono text-slate-200">
                  {isFixed ? '26 ms' : '5,420 ms (Crashing)'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                PHP Runtime
              </span>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-base font-bold font-mono text-indigo-300">
                  PHP 8.3-FPM
                </span>
              </div>
            </div>
          </div>

          {/* Response Payload & Headers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Response Body</span>
                <span className={isFixed ? 'text-emerald-400' : 'text-red-400'}>
                  {isFixed ? 'application/json' : 'text/html (PHP Fatal)'}
                </span>
              </div>
              <pre className="p-4 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed text-slate-200">
                {isFixed ? (
`{
  "status": "success",
  "endpoint": "${endpoint}",
  "processed_at": "${new Date().toISOString()}",
  "records_exported": 250000,
  "memory_used": "18.42 MB",
  "memory_limit": "512 MB",
  "execution_time_sec": 0.026,
  "server": "PHP-FPM 8.3 / Nginx 1.26"
}`
                ) : (
`<br />
<b>Fatal error</b>:  Allowed memory size of 134217728 bytes exhausted (tried to allocate 33554440 bytes) in <b>/var/www/html/export.php</b> on line <b>42</b><br />
[error] 142#142: *1 FastCGI sent in stderr: "PHP message: PHP Fatal error: Allowed memory size exhausted" while reading response header from upstream`
                )}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>Simulated HTTP Headers</span>
              </div>
              <div className="p-4 font-mono text-xs space-y-2 text-slate-300">
                <div>
                  <span className="text-indigo-400">Server:</span> nginx/1.26.1
                </div>
                <div>
                  <span className="text-indigo-400">X-Powered-By:</span> PHP/8.3.6
                </div>
                <div>
                  <span className="text-indigo-400">Content-Type:</span>{' '}
                  {isFixed ? 'application/json; charset=UTF-8' : 'text/html; charset=UTF-8'}
                </div>
                <div>
                  <span className="text-indigo-400">X-FastCGI-Status:</span>{' '}
                  {isFixed ? '200' : '500 FastCGI stderr'}
                </div>
                <div>
                  <span className="text-indigo-400">X-PHP-Memory-Limit:</span>{' '}
                  {isFixed ? '512M' : '128M'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
