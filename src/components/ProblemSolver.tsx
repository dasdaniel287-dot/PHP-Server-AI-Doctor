import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { PRESET_PROBLEMS } from '../data/presets';
import { DiagnosticResult, PresetProblem, ProjectFile } from '../types';

interface ProblemSolverProps {
  onPackageForGitHub: (file: { path: string; content: string }) => void;
  onSimulateServer: (testCase: { name: string; errorLog: string; isFixed: boolean }) => void;
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  onPackageForGitHub,
  onSimulateServer,
}) => {
  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('memory-exhausted');
  const currentPreset = PRESET_PROBLEMS.find((p) => p.id === selectedPresetId) || PRESET_PROBLEMS[0];

  // User inputs
  const [errorLog, setErrorLog] = useState<string>(currentPreset.errorLog);
  const [codeSnippet, setCodeSnippet] = useState<string>(currentPreset.codeSnippet);
  const [targetFileName, setTargetFileName] = useState<string>(currentPreset.targetFileName);
  const [environment, setEnvironment] = useState<string>(currentPreset.environment);
  const [serverType, setServerType] = useState<string>(currentPreset.serverType);
  const [phpVersion, setPhpVersion] = useState<string>(currentPreset.phpVersion);

  // Active input tab
  const [inputTab, setInputTab] = useState<'log' | 'code'>('log');

  // Loading & Diagnostics state
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedFix, setAppliedFix] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Switch preset
  const handleSelectPreset = (preset: PresetProblem) => {
    setSelectedPresetId(preset.id);
    setErrorLog(preset.errorLog);
    setCodeSnippet(preset.codeSnippet);
    setTargetFileName(preset.targetFileName);
    setEnvironment(preset.environment);
    setServerType(preset.serverType);
    setPhpVersion(preset.phpVersion);
    setDiagnosticResult(null);
    setAppliedFix(false);
  };

  // 1-Click AI Solve Action
  const handleSolveProblem = async () => {
    if (!errorLog.trim() && !codeSnippet.trim()) {
      setErrorMessage('Please provide an error log or code snippet.');
      return;
    }

    setIsDiagnosing(true);
    setErrorMessage(null);
    setAppliedFix(false);

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorLog,
          codeSnippet,
          targetFileName,
          environment,
          serverType,
          phpVersion,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred during diagnosis.');
      }

      const data: DiagnosticResult = await response.json();
      setDiagnosticResult(data);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(err.message || 'Failed to solve problem. Please check your network and try again.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 1-Click Apply Fix
  const handleApplyFix = () => {
    if (diagnosticResult?.oneClickFix?.fixedContent) {
      setCodeSnippet(diagnosticResult.oneClickFix.fixedContent);
      setAppliedFix(true);
      setInputTab('code');
    }
  };

  // Copy helper
  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Intro */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Automated AI Diagnostic &amp; Resolution Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              One-Click PHP Server Problem Solver
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Select a common real-world server crash or paste your own PHP stack trace, 500 error, or Nginx/Apache log.
              Click the button below to get the instant root cause, repaired code diff, and copy-paste terminal repair commands.
            </p>
          </div>

          <button
            onClick={handleSolveProblem}
            disabled={isDiagnosing}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl ${
              isDiagnosing
                ? 'bg-indigo-700 text-slate-200 cursor-not-allowed opacity-90'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.99]'
            }`}
          >
            {isDiagnosing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Diagnosing Server Issue...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current text-amber-300" />
                <span>⚡ 1-Click AI Solve Problem</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Problem Picker */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick Presets / Real-World Server Breakdowns:
          </span>
          <span className="text-xs text-slate-500 font-mono">8 Common Scenarios</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_PROBLEMS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{preset.name.split(':')[0]}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{preset.quickDescription}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environment & Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Target File</label>
          <input
            type="text"
            value={targetFileName}
            onChange={(e) => setTargetFileName(e.target.value)}
            placeholder="e.g. index.php, php.ini, nginx.conf"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Server Runtime</label>
          <select
            value={serverType}
            onChange={(e) => setServerType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Nginx + PHP-FPM">Nginx + PHP-FPM</option>
            <option value="Apache mod_php">Apache mod_php</option>
            <option value="Docker PHP-FPM">Docker PHP-FPM</option>
            <option value="Caddy + PHP-FPM">Caddy + PHP-FPM</option>
            <option value="PHP CLI Built-in">PHP Built-in CLI Server</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">PHP Version</label>
          <select
            value={phpVersion}
            onChange={(e) => setPhpVersion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
          >
            <option value="PHP 8.4">PHP 8.4 (Latest)</option>
            <option value="PHP 8.3">PHP 8.3 (Stable)</option>
            <option value="PHP 8.2">PHP 8.2</option>
            <option value="PHP 8.1">PHP 8.1</option>
            <option value="PHP 7.4">PHP 7.4 (Legacy)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Operating System</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Ubuntu 22.04 LTS / Docker">Ubuntu 22.04 / Docker</option>
            <option value="Debian 12 Bookworm">Debian 12 Bookworm</option>
            <option value="Alpine Linux (Container)">Alpine Linux</option>
            <option value="RHEL / AlmaLinux / CentOS">RHEL / AlmaLinux</option>
            <option value="cPanel / Shared Hosting">cPanel / Shared</option>
            <option value="Windows / XAMPP / Laragon">Windows / XAMPP / Laragon</option>
          </select>
        </div>
      </div>

      {/* Input Work area */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        {/* Workspace Tab Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-2.5">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setInputTab('log')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                inputTab === 'log'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Server Error Log / Stack Trace</span>
              {errorLog.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setInputTab('code')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                inputTab === 'code'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Code / Config Snippet ({targetFileName})</span>
              {appliedFix && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                  Fix Applied
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                if (inputTab === 'log') setErrorLog('');
                else setCodeSnippet('');
              }}
              className="text-slate-500 hover:text-slate-300 transition"
              title="Clear tab content"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-4">
          {inputTab === 'log' ? (
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Paste raw Apache/Nginx error log, PHP fatal error message, Docker stderr, or stack trace:
              </p>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="[26-Oct-2026 14:22:09 UTC] PHP Fatal error: Allowed memory size of 134217728 bytes exhausted..."
                rows={8}
                className="w-full bg-slate-950 font-mono text-xs text-amber-200/90 border border-slate-800 rounded-lg p-3 focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">
                  Target file contents ({targetFileName}):
                </p>
                {appliedFix && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Repaired code is active in this editor
                  </span>
                )}
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="<?php\n// Your PHP code or server config here..."
                rows={10}
                className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-lg p-3 focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500" />
            <span>AI analyzes syntax, runtime parameters, PHP-FPM pools, memory limits, and socket permissions.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSolveProblem}
              disabled={isDiagnosing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-md transition"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>Solve Problem Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-100">Diagnosis Error</h4>
            <p className="text-xs text-red-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC RESULTS & 1-CLICK RESOLUTION SUITE */}
      {diagnosticResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Executive Verdict Card */}
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/60 p-5 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Problem Solved
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {diagnosticResult.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      diagnosticResult.severity.toLowerCase().includes('critical')
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {diagnosticResult.severity}
                  </span>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {diagnosticResult.affectedComponent}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Summary
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{diagnosticResult.summary}</p>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Root Cause Analysis
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{diagnosticResult.rootCause}</p>
                </div>
              </div>
            </div>

            {/* 1-Click Code Fix Block */}
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Fixed Code / Configuration: {diagnosticResult.oneClickFix.targetFileName}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {diagnosticResult.oneClickFix.diffExplanation}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleApplyFix}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-md ${
                      appliedFix
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                    }`}
                  >
                    {appliedFix ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Fix Applied to Workspace</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>✨ 1-Click Apply Fix</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleCopy(diagnosticResult.oneClickFix.fixedContent, 'fixed-code')
                    }
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    {copiedSection === 'fixed-code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="bg-slate-900/90 px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{diagnosticResult.oneClickFix.targetFileName}</span>
                  <span className="text-emerald-400 font-semibold">Production Ready</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
                  {diagnosticResult.oneClickFix.fixedContent}
                </pre>
              </div>

              {/* 1-Click Terminal Repair Commands */}
              {diagnosticResult.oneClickFix.terminalCommands && diagnosticResult.oneClickFix.terminalCommands.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      1-Click Terminal Repair Commands (Bash / Docker):
                    </h5>
                    <button
                      onClick={() =>
                        handleCopy(
                          diagnosticResult.oneClickFix.terminalCommands.join('\n'),
                          'terminal-commands'
                        )
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                    >
                      {copiedSection === 'terminal-commands' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied All</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy All</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {diagnosticResult.oneClickFix.terminalCommands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-200"
                      >
                        <span className="text-emerald-400 select-all">$ {cmd}</span>
                        <button
                          onClick={() => handleCopy(cmd, `cmd-${idx}`)}
                          className="text-slate-400 hover:text-slate-200 p-1"
                          title="Copy command"
                        >
                          {copiedSection === `cmd-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prevention Checklist */}
              {diagnosticResult.preventionTips && diagnosticResult.preventionTips.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Prevention &amp; Performance Checklist:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {diagnosticResult.preventionTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Bridge: Package for GitHub or Test in Simulator */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      onSimulateServer({
                        name: diagnosticResult.title,
                        errorLog,
                        isFixed: true,
                      })
                    }
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <span>🧪 Verify in Server Simulator</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    onPackageForGitHub({
                      path: diagnosticResult.oneClickFix.targetFileName || 'public/index.php',
                      content: diagnosticResult.oneClickFix.fixedContent,
                    })
                  }
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition hover:scale-[1.02]"
                >
                  <span>🚀 Package Fixed Code into GitHub Project</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
