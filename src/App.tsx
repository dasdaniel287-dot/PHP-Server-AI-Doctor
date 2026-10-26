/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProblemSolver } from './components/ProblemSolver';
import { ProjectForge } from './components/ProjectForge';
import { ServerSimulator } from './components/ServerSimulator';
import { AiChatDrawer } from './components/AiChatDrawer';
import { Terminal, Shield, Zap, Github, Server, Cpu, Globe, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'solver' | 'forge' | 'simulator'>('solver');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [customFileForForge, setCustomFileForForge] = useState<{ path: string; content: string } | null>(null);
  const [simulatorTestCase, setSimulatorTestCase] = useState<{
    name: string;
    errorLog: string;
    isFixed: boolean;
  } | null>(null);

  // Bridges solver result to GitHub Project Forge
  const handlePackageForGitHub = (file: { path: string; content: string }) => {
    setCustomFileForForge(file);
    setActiveTab('forge');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bridges solver result to Server Simulator
  const handleSimulateServer = (testCase: { name: string; errorLog: string; isFixed: boolean }) => {
    setSimulatorTestCase(testCase);
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'solver' && (
          <ProblemSolver
            onPackageForGitHub={handlePackageForGitHub}
            onSimulateServer={handleSimulateServer}
          />
        )}

        {activeTab === 'forge' && (
          <ProjectForge customFileFromSolver={customFileForForge} />
        )}

        {activeTab === 'simulator' && (
          <ServerSimulator initialTestCase={simulatorTestCase} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-slate-400">PHP Server AI Doctor v2.0 • Production Ready</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Gemini 3.8 Flash Diagnostics
            </span>
            <span className="flex items-center gap-1">
              <Github className="w-3.5 h-3.5 text-cyan-400" />
              GitHub REST API v3
            </span>
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              PHP 8.3 &amp; 8.4 Support
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive AI Assistant Drawer */}
      <AiChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
