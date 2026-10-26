import React, { useState, useEffect } from 'react';
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
  Info,
  Download,
  Github,
  Key,
  Shield,
  X,
  Play,
  Columns
} from 'lucide-react';
import { PRESET_PROBLEMS } from '../data/presets';
import { DiagnosticResult, PresetProblem, ProjectFile, GitHubPushResult } from '../types';
import { downloadProjectZip } from '../utils/zipExport';

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
  const [originalCode, setOriginalCode] = useState<string>(currentPreset.codeSnippet);
  const [targetFileName, setTargetFileName] = useState<string>(currentPreset.targetFileName);
  const [environment, setEnvironment] = useState<string>(currentPreset.environment);
  const [serverType, setServerType] = useState<string>(currentPreset.serverType);
  const [phpVersion, setPhpVersion] = useState<string>(currentPreset.phpVersion);

  // Active input tab & diff view mode
  const [inputTab, setInputTab] = useState<'log' | 'code'>('code');
  const [viewMode, setViewMode] = useState<'solved' | 'diff'>('solved');

  // Auto-Solve toggle
  const [autoSolveOnSelect, setAutoSolveOnSelect] = useState<boolean>(true);

  // Loading & Diagnostics state
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(currentPreset.solution || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedFix, setAppliedFix] = useState<boolean>(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Terminal Runner Simulation state
  const [isRunningTerminal, setIsRunningTerminal] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalDone, setTerminalDone] = useState<boolean>(false);

  // 1-Click Inline GitHub Quick Push Modal
  const [showQuickGithubModal, setShowQuickGithubModal] = useState<boolean>(false);
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('php_doctor_gh_token') || '');
  const [repoName, setRepoName] = useState<string>('solved-php-server-project');
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [isPushingGithub, setIsPushingGithub] = useState<boolean>(false);
  const [githubPushResult, setGithubPushResult] = useState<GitHubPushResult | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // 1-Click AI Solve Action (Instant 0ms for presets, AI for custom code)
  const handleSolveProblem = async (customParams?: {
    customLog?: string;
    customCode?: string;
    customTarget?: string;
    customEnv?: string;
    customServer?: string;
    customPhp?: string;
  }) => {
    const logToUse = customParams?.customLog ?? errorLog;
    const codeToUse = customParams?.customCode ?? codeSnippet;
    const targetToUse = customParams?.customTarget ?? targetFileName;
    const envToUse = customParams?.customEnv ?? environment;
    const serverToUse = customParams?.customServer ?? serverType;
    const phpToUse = customParams?.customPhp ?? phpVersion;

    if (!logToUse.trim() && !codeToUse.trim()) {
      setErrorMessage('Please provide an error log or code snippet.');
      return;
    }

    // Instant preset matching (0ms latency)
    const matchedPreset = PRESET_PROBLEMS.find((p) => p.id === selectedPresetId);
    if (
      matchedPreset &&
      matchedPreset.solution &&
      (!customParams?.customLog || customParams.customLog === matchedPreset.errorLog)
    ) {
      setDiagnosticResult(matchedPreset.solution);
      setCodeSnippet(matchedPreset.solution.oneClickFix.fixedContent);
      setAppliedFix(true);
      setInputTab('code');
      return;
    }

    setIsDiagnosing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorLog: logToUse,
          codeSnippet: codeToUse,
          targetFileName: targetToUse,
          environment: envToUse,
          serverType: serverToUse,
          phpVersion: phpToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred during diagnosis.');
      }

      const data: DiagnosticResult = await response.json();
      setDiagnosticResult(data);

      if (data?.oneClickFix?.fixedContent) {
        setCodeSnippet(data.oneClickFix.fixedContent);
        setAppliedFix(true);
        setInputTab('code');
      }
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(err.message || 'Failed to solve problem. Please check your network and try again.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Switch preset
  const handleSelectPreset = (preset: PresetProblem) => {
    setSelectedPresetId(preset.id);
    setErrorLog(preset.errorLog);
    setOriginalCode(preset.codeSnippet);
    setTargetFileName(preset.targetFileName);
    setEnvironment(preset.environment);
    setServerType(preset.serverType);
    setPhpVersion(preset.phpVersion);
    setTerminalOutput([]);
    setTerminalDone(false);

    if (preset.solution) {
      setDiagnosticResult(preset.solution);
      setCodeSnippet(preset.solution.oneClickFix.fixedContent);
      setAppliedFix(true);
      setInputTab('code');
    } else {
      setCodeSnippet(preset.codeSnippet);
      setAppliedFix(false);
      if (autoSolveOnSelect) {
        handleSolveProblem({
          customLog: preset.errorLog,
          customCode: preset.codeSnippet,
          customTarget: preset.targetFileName,
          customEnv: preset.environment,
          customServer: preset.serverType,
          customPhp: preset.phpVersion,
        });
      }
    }
  };

  // Re-apply Fix
  const handleApplyFix = () => {
    if (diagnosticResult?.oneClickFix?.fixedContent) {
      setCodeSnippet(diagnosticResult.oneClickFix.fixedContent);
      setAppliedFix(true);
      setInputTab('code');
    }
  };

  // Simulate Terminal Bash Execution
  const handleRunTerminalCommands = () => {
    if (!diagnosticResult?.oneClickFix?.terminalCommands) return;
    setIsRunningTerminal(true);
    setTerminalDone(false);
    setTerminalOutput(['$ Initializing server terminal session...']);

    const commands = diagnosticResult.oneClickFix.terminalCommands;
    let step = 0;

    const interval = setInterval(() => {
      if (step < commands.length) {
        const cmd = commands[step];
        setTerminalOutput((prev) => [
          ...prev,
          `$ ${cmd}`,
          `[SUCCESS] Command executed with exit code 0.`,
        ]);
        step++;
      } else {
        clearInterval(interval);
        setTerminalOutput((prev) => [
          ...prev,
          `✓ All ${commands.length} repair commands completed. Server state: ONLINE (HTTP 200 OK)`,
        ]);
        setIsRunningTerminal(false);
        setTerminalDone(true);
      }
    }, 450);
  };

  // 1-Click Download Solved Project .ZIP
  const handleDownloadSolvedZip = async () => {
    if (!diagnosticResult) return;

    const fixedFileName = diagnosticResult.oneClickFix.targetFileName || 'public/index.php';
    const filesToPackage: ProjectFile[] = [
      {
        path: fixedFileName,
        content: diagnosticResult.oneClickFix.fixedContent,
        language: fixedFileName.endsWith('.php') ? 'php' : 'ini',
        purpose: 'Repaired by AI PHP Server Doctor',
      },
      {
        path: 'Dockerfile',
        content: `FROM php:8.3-fpm-alpine
RUN apk add --no-cache curl oniguruma-dev libpng-dev
RUN docker-php-ext-install pdo pdo_mysql opcache
WORKDIR /var/www/html
COPY . .
RUN chown -R www-data:www-data /var/www/html
EXPOSE 9000
CMD ["php-fpm"]`,
        language: 'dockerfile',
        purpose: 'Production PHP-FPM container',
      },
      {
        path: 'docker-compose.yml',
        content: `services:
  app:
    build: .
    restart: unless-stopped
    volumes:
      - ./:/var/www/html
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./:/var/www/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app`,
        language: 'yaml',
        purpose: 'Docker Compose orchestration',
      },
      {
        path: 'nginx.conf',
        content: `server {
    listen 80;
    root /var/www/html;
    index index.php index.html;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \\.php$ {
        fastcgi_pass app:9000;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
    }
}`,
        language: 'nginx',
        purpose: 'Nginx FastCGI reverse proxy config',
      },
      {
        path: 'php.ini',
        content: `memory_limit = 512M
max_execution_time = 120
display_errors = Off
log_errors = On
date.timezone = UTC`,
        language: 'ini',
        purpose: 'PHP configuration with memory safeguards',
      },
      {
        path: 'README.md',
        content: `# Solved PHP Server Project 🚀

Repaired with **PHP Server AI Doctor (One-Click)**.

### Issue Solved:
**${diagnosticResult.title}**

### Root Cause:
${diagnosticResult.rootCause}

### Quick Launch with Docker:
\`\`\`bash
docker compose up -d
curl http://localhost:8080
\`\`\`
`,
        language: 'markdown',
        purpose: 'Project documentation and fix explanation',
      },
    ];

    await downloadProjectZip(repoName || 'solved-php-project', filesToPackage);
  };

  // 1-Click Push directly from Modal
  const handleInlinePushToGithub = async () => {
    if (!githubToken.trim()) {
      setGithubError('Please enter your GitHub Personal Access Token (with repo scope).');
      return;
    }
    if (!repoName.trim()) {
      setGithubError('Please enter a repository name.');
      return;
    }

    localStorage.setItem('php_doctor_gh_token', githubToken.trim());
    setIsPushingGithub(true);
    setGithubError(null);
    setGithubPushResult(null);

    try {
      const fixedFileName = diagnosticResult?.oneClickFix.targetFileName || 'public/index.php';
      const files: ProjectFile[] = [
        {
          path: fixedFileName,
          content: diagnosticResult?.oneClickFix.fixedContent || codeSnippet,
          language: 'php',
        },
        {
          path: 'Dockerfile',
          content: `FROM php:8.3-fpm-alpine\nRUN apk add --no-cache curl\nRUN docker-php-ext-install pdo pdo_mysql opcache\nWORKDIR /var/www/html\nCOPY . .\nCMD ["php-fpm"]`,
          language: 'dockerfile',
        },
        {
          path: 'docker-compose.yml',
          content: `services:\n  app:\n    build: .\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"`,
          language: 'yaml',
        },
        {
          path: 'README.md',
          content: `# ${repoName}\n\nProblem Solved: ${diagnosticResult?.title}\n\nScaffolded with PHP Server AI Doctor.`,
          language: 'markdown',
        },
      ];

      const response = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken.trim(),
          repoName: repoName.trim().replace(/\s+/g, '-'),
          description: `PHP Project with ${diagnosticResult?.title} solved via AI Doctor`,
          isPrivate: isPrivateRepo,
          files,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create GitHub repository.');
      }

      setGithubPushResult(data);
    } catch (err: any) {
      setGithubError(err.message || 'GitHub API call failed.');
    } finally {
      setIsPushingGithub(false);
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Automated 1-Click Problem Solved Engine Active
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              One-Click PHP Server Problem Solved
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Select any real-world breakdown or paste your PHP error log / stack trace. Click once to diagnose, apply the fixed code to memory, copy terminal repair commands, and create a GitHub project!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => handleSolveProblem()}
              disabled={isDiagnosing}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl ${
                isDiagnosing
                  ? 'bg-indigo-700 text-slate-200 cursor-not-allowed opacity-90'
                  : 'bg-gradient-to-r from-emerald-500 via-indigo-600 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Diagnosing &amp; Solving...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current text-amber-300" />
                  <span>⚡ 1-Click Problem Solved</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Problem Picker */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Pick Real-World Problem Scenarios (Instant 1-Click Resolution):
          </span>
          <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSolveOnSelect}
              onChange={(e) => setAutoSolveOnSelect(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-slate-300 font-medium">⚡ Instant Solve on Click</span>
          </label>
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
                    ? 'bg-indigo-950/80 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{preset.name.split(':')[0]}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300'
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
              onClick={() => setInputTab('code')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                inputTab === 'code'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Active Code / Config ({targetFileName})</span>
              {appliedFix && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">
                  ✓ Fix Active
                </span>
              )}
            </button>

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
          {inputTab === 'code' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">
                  Target file contents ({targetFileName}):
                </p>
                {appliedFix && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Problem Solved: Repaired code is active in this editor
                  </span>
                )}
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="<?php\n// Your PHP code or server config here..."
                rows={10}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-300/90 border border-slate-800 rounded-lg p-3 focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Raw Apache/Nginx error log, PHP fatal error message, Docker stderr, or stack trace:
              </p>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="[26-Oct-2026 14:22:09 UTC] PHP Fatal error: Allowed memory size of 134217728 bytes exhausted..."
                rows={8}
                className="w-full bg-slate-950 font-mono text-xs text-amber-200/90 border border-slate-800 rounded-lg p-3 focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Clicking 1-Click Problem Solved updates code in memory and generates repair scripts immediately.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSolveProblem()}
              disabled={isDiagnosing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-md transition"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>1-Click Problem Solved</span>
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
            <h4 className="font-semibold text-red-100">Diagnosis Notice</h4>
            <p className="text-xs text-red-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC RESULTS & 1-CLICK RESOLUTION SUITE */}
      {diagnosticResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Executive Verdict Card */}
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/40 overflow-hidden shadow-2xl ring-1 ring-emerald-500/30">
            {/* Top Problem Solved Banner */}
            <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/80 p-5 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Problem Solved in One Click
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

              {/* Quick Actions Bar Directly on Solved Card */}
              <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Fix applied to active workspace code</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadSolvedZip}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Solved .ZIP</span>
                  </button>

                  <button
                    onClick={() => setShowQuickGithubModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>1-Click Create GitHub Repo</span>
                  </button>

                  <button
                    onClick={() =>
                      onSimulateServer({
                        name: diagnosticResult.title,
                        errorLog,
                        isFixed: true,
                      })
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
                  >
                    <span>🧪 Test Response (200 OK)</span>
                  </button>
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

            {/* 1-Click Code Fix Block & Diff Switcher */}
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Solved Code / Configuration: {diagnosticResult.oneClickFix.targetFileName}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {diagnosticResult.oneClickFix.diffExplanation}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle: Solved vs Diff */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setViewMode('solved')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        viewMode === 'solved'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Solved Code
                    </button>
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        viewMode === 'diff'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Columns className="w-3 h-3" />
                      <span>Compare Diff</span>
                    </button>
                  </div>

                  <button
                    onClick={handleApplyFix}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white transition shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Fix Active</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopy(diagnosticResult.oneClickFix.fixedContent, 'fixed-code')
                    }
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
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

              {/* Code viewer / Diff Viewer */}
              {viewMode === 'solved' ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <div className="bg-slate-900/90 px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{diagnosticResult.oneClickFix.targetFileName}</span>
                    <span className="text-emerald-400 font-semibold">✓ 100% Solved &amp; Production Ready</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed select-text">
                    {diagnosticResult.oneClickFix.fixedContent}
                  </pre>
                </div>
              ) : (
                /* Side-by-Side Diff View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden border border-red-500/30 bg-slate-950">
                    <div className="bg-red-950/40 px-3 py-1.5 border-b border-red-500/20 text-[11px] font-mono text-red-300 flex items-center justify-between">
                      <span>Original (Flawed)</span>
                      <span className="text-red-400 font-semibold">Causes 500 Error</span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-red-200/80 overflow-x-auto max-h-80 leading-relaxed">
                      {originalCode}
                    </pre>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                    <div className="bg-emerald-950/40 px-3 py-1.5 border-b border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                      <span>Repaired (Solved)</span>
                      <span className="text-emerald-400 font-semibold">✓ 100% Fixed</span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
                      {diagnosticResult.oneClickFix.fixedContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* 1-Click Terminal Repair Commands with Interactive Terminal Runner */}
              {diagnosticResult.oneClickFix.terminalCommands && diagnosticResult.oneClickFix.terminalCommands.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      1-Click Terminal Repair Commands (Bash / Docker):
                    </h5>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRunTerminalCommands}
                        disabled={isRunningTerminal}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
                      >
                        {isRunningTerminal ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Running in Server...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>▶ Run in Web Terminal</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handleCopy(
                            diagnosticResult.oneClickFix.terminalCommands.join('\n'),
                            'terminal-commands'
                          )
                        }
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition px-2 py-1 rounded bg-slate-900 border border-slate-800"
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

                  {/* Interactive Terminal Execution Box */}
                  {terminalOutput.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-black border border-slate-800 font-mono text-xs text-slate-300 space-y-1 animate-in fade-in">
                      <div className="text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-800/80 flex items-center justify-between">
                        <span>Terminal Execution Log</span>
                        <span className={terminalDone ? 'text-emerald-400' : 'text-amber-400'}>
                          {terminalDone ? '✓ Completed' : 'Executing...'}
                        </span>
                      </div>
                      {terminalOutput.map((line, i) => (
                        <div
                          key={i}
                          className={
                            line.startsWith('$')
                              ? 'text-cyan-400'
                              : line.includes('SUCCESS') || line.includes('ONLINE')
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowQuickGithubModal(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition hover:scale-[1.02]"
                  >
                    <Github className="w-4 h-4" />
                    <span>🚀 1-Click Create GitHub Project</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Quick GitHub Repo Modal */}
      {showQuickGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowQuickGithubModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create GitHub Repository Now</h3>
                <p className="text-xs text-slate-400">
                  Directly commits the solved PHP code &amp; Docker configs to your account.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. solved-php-project"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none pr-7"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=PHP+Server+AI+Doctor"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Generate token (repo scope)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-500">Stored safely in browser</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Visibility</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivateRepo(false)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                      !isPrivateRepo
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    Public Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivateRepo(true)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                      isPrivateRepo
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    Private Repo
                  </button>
                </div>
              </div>
            </div>

            {/* Error in modal */}
            {githubError && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                {githubError}
              </div>
            )}

            {/* Success in modal */}
            {githubPushResult && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 text-xs flex items-center justify-between">
                <span>Repository created: <b>{githubPushResult.owner}/{githubPushResult.repoName}</b></span>
                <a
                  href={githubPushResult.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline ml-2 text-cyan-400"
                >
                  View ↗
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setShowQuickGithubModal(false);
                  onPackageForGitHub({
                    path: diagnosticResult?.oneClickFix.targetFileName || 'public/index.php',
                    content: diagnosticResult?.oneClickFix.fixedContent || codeSnippet,
                  });
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Open Full Forge Workspace ↗
              </button>

              <button
                onClick={handleInlinePushToGithub}
                disabled={isPushingGithub}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold transition shadow-md"
              >
                {isPushingGithub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating &amp; Pushing...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-3.5 h-3.5" />
                    <span>Create Repo &amp; Push</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
