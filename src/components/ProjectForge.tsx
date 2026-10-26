import React, { useState, useEffect } from 'react';
import {
  Github,
  Folder,
  File,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Shield,
  Key,
  Terminal,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileCode,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/templates';
import { GeneratedProject, ProjectFile, GitHubPushResult } from '../types';
import { downloadProjectZip } from '../utils/zipExport';

interface ProjectForgeProps {
  customFileFromSolver?: { path: string; content: string } | null;
}

export const ProjectForge: React.FC<ProjectForgeProps> = ({ customFileFromSolver }) => {
  // Active Project
  const [activeProject, setActiveProject] = useState<GeneratedProject>(STARTER_TEMPLATES[0]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(activeProject.files[0]?.path || 'public/index.php');

  // AI Custom Generator state
  const [isGeneratingAiProject, setIsGeneratingAiProject] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('Modern PHP 8.3 REST API');
  const [selectedPhpVersion, setSelectedPhpVersion] = useState<string>('8.3');

  // GitHub Direct Push state
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('php_doctor_gh_token') || '';
  });
  const [saveTokenLocally, setSaveTokenLocally] = useState<boolean>(true);
  const [repoName, setRepoName] = useState<string>(activeProject.projectName);
  const [repoDescription, setRepoDescription] = useState<string>(activeProject.description);
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [isPushingToGithub, setIsPushingToGithub] = useState<boolean>(false);
  const [githubPushResult, setGithubPushResult] = useState<GitHubPushResult | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Copy indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // If solver passed a file, merge or add it
  useEffect(() => {
    if (customFileFromSolver) {
      setActiveProject((prev) => {
        const existingIdx = prev.files.findIndex((f) => f.path === customFileFromSolver.path);
        let updatedFiles = [...prev.files];
        if (existingIdx >= 0) {
          updatedFiles[existingIdx] = {
            ...updatedFiles[existingIdx],
            content: customFileFromSolver.content,
          };
        } else {
          updatedFiles.push({
            path: customFileFromSolver.path,
            content: customFileFromSolver.content,
            language: customFileFromSolver.path.endsWith('.php') ? 'php' : 'ini',
            purpose: 'Repaired file from AI Server Doctor',
          });
        }
        return {
          ...prev,
          files: updatedFiles,
        };
      });
      setSelectedFilePath(customFileFromSolver.path);
    }
  }, [customFileFromSolver]);

  // Keep repo name in sync when template changes
  const handleSelectTemplate = (template: GeneratedProject) => {
    setActiveProject(template);
    setSelectedFilePath(template.files[0]?.path || 'public/index.php');
    setRepoName(template.projectName);
    setRepoDescription(template.description);
    setGithubPushResult(null);
    setGithubError(null);
  };

  // AI Project Generation
  const handleGenerateAiProject = async () => {
    setIsGeneratingAiProject(true);
    setGithubError(null);
    setGithubPushResult(null);

    try {
      const response = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: repoName || 'custom-php-app',
          projectType,
          phpVersion: selectedPhpVersion,
          customPrompt,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate project structure.');
      }

      const generated: GeneratedProject = await response.json();
      setActiveProject(generated);
      setRepoName(generated.projectName);
      setRepoDescription(generated.description);
      if (generated.files.length > 0) {
        setSelectedFilePath(generated.files[0].path);
      }
    } catch (err: any) {
      console.error('Failed to generate project:', err);
      setGithubError(err.message || 'AI project generation failed.');
    } finally {
      setIsGeneratingAiProject(false);
    }
  };

  // 1-Click GitHub Repository Creator & Pusher
  const handlePushToGithub = async () => {
    if (!githubToken.trim()) {
      setGithubError('Please enter your GitHub Personal Access Token (classic or fine-grained with "repo" scope).');
      return;
    }
    if (!repoName.trim()) {
      setGithubError('Please enter a repository name.');
      return;
    }

    if (saveTokenLocally) {
      localStorage.setItem('php_doctor_gh_token', githubToken.trim());
    } else {
      localStorage.removeItem('php_doctor_gh_token');
    }

    setIsPushingToGithub(true);
    setGithubError(null);
    setGithubPushResult(null);

    try {
      const response = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken.trim(),
          repoName: repoName.trim().replace(/\s+/g, '-'),
          description: repoDescription,
          isPrivate: isPrivateRepo,
          files: activeProject.files,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'GitHub repository creation failed.');
      }

      setGithubPushResult(data);
    } catch (err: any) {
      console.error('Error pushing to GitHub:', err);
      setGithubError(err.message || 'GitHub API call failed. Verify your token has "repo" permissions.');
    } finally {
      setIsPushingToGithub(false);
    }
  };

  // 1-Click ZIP Download
  const handleDownloadZip = async () => {
    await downloadProjectZip(repoName || activeProject.projectName, activeProject.files);
  };

  const selectedFile = activeProject.files.find((f) => f.path === selectedFilePath) || activeProject.files[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-2">
              <Github className="w-3.5 h-3.5 text-cyan-400" />
              1-Click GitHub Repository Forge
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create &amp; Push Production PHP Repositories
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Select a modern PHP template, export your repaired server files, or generate a tailored architecture with AI.
              Push directly to your GitHub account with 1-click or download a complete, runnable .ZIP bundle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadZip}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download .ZIP ({activeProject.files.length} files)</span>
            </button>

            <a
              href="#github-push-section"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition hover:scale-[1.02]"
            >
              <Github className="w-4 h-4" />
              <span>1-Click Push to GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Preset Starter Templates & AI Custom Prompt Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Templates Selector */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Production Starter Templates:
            </span>
            <span className="text-xs text-slate-500 font-mono">Docker + Nginx + CI Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STARTER_TEMPLATES.map((tmpl) => {
              const isSelected = activeProject.projectName === tmpl.projectName;
              return (
                <button
                  key={tmpl.projectName}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`text-left p-3 rounded-lg border transition text-xs ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold truncate">{tmpl.projectName}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                      {tmpl.files.length} files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Custom Project Generator */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AI Custom Project Generator:
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Prompt Gemini to tailor architecture, packages, and Docker configs:
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Stripe webhook handler with Redis queue, MySQL migrations, and PHP 8.3 strict types..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleGenerateAiProject}
            disabled={isGeneratingAiProject}
            className="mt-3 w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            {isGeneratingAiProject ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Complete Repo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Project with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Repository Explorer (Tree + Code Viewer) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-slate-200">
              Repository: {activeProject.projectName}
            </span>
            <span className="text-xs text-slate-500">({activeProject.files.length} files)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(selectedFile?.content || '', 'selected-file')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              {copiedKey === 'selected-file' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px]">
          {/* File Tree Left Sidebar */}
          <div className="bg-slate-950/80 p-3 border-r border-slate-800 md:col-span-1 space-y-1 overflow-y-auto max-h-[500px]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider">
              Project Files
            </div>
            {activeProject.files.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <File className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* File Content Right Pane */}
          <div className="md:col-span-3 bg-slate-900/60 flex flex-col justify-between">
            <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-mono px-4">
              <span>{selectedFile?.path}</span>
              {selectedFile?.purpose && (
                <span className="text-[11px] text-slate-500 italic max-w-md truncate">
                  {selectedFile.purpose}
                </span>
              )}
            </div>

            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[440px] leading-relaxed select-text">
              {selectedFile?.content}
            </pre>
          </div>
        </div>
      </div>

      {/* GitHub 1-Click Push Integration Box */}
      <div id="github-push-section" className="rounded-2xl border border-indigo-500/30 bg-slate-900 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              One-Click Push to Your GitHub Account
            </h3>
            <p className="text-xs text-slate-400">
              Directly provisions the repository under your account and commits all files in 1 click.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Repository Name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. modern-php83-api"
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
              <label className="flex items-center space-x-1 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveTokenLocally}
                  onChange={(e) => setSaveTokenLocally(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0 w-3 h-3"
                />
                <span>Save token locally</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Visibility</label>
            <div className="flex items-center space-x-2 mt-1">
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

        {/* Push Trigger Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Tokens are stored only in your browser localStorage and never logged.</span>
          </div>

          <button
            onClick={handlePushToGithub}
            disabled={isPushingToGithub}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide transition shadow-lg ${
              isPushingToGithub
                ? 'bg-indigo-800 text-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/20 hover:scale-[1.02]'
            }`}
          >
            {isPushingToGithub ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Repo &amp; Committing {activeProject.files.length} Files...</span>
              </>
            ) : (
              <>
                <Github className="w-4 h-4" />
                <span>🚀 1-Click Create GitHub Repo &amp; Push</span>
              </>
            )}
          </button>
        </div>

        {/* GitHub Success Notification */}
        {githubPushResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-white">Repository Created Successfully!</h4>
                <p className="text-xs text-emerald-300">
                  {githubPushResult.committedFiles} files committed directly to {githubPushResult.owner}/{githubPushResult.repoName}.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={githubPushResult.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Error notification */}
        {githubError && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-100">GitHub API Error</p>
              <p className="text-red-300 mt-0.5">{githubError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Git CLI Instructions as alternative */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Standard Terminal Git Commands (Manual Push):
          </span>
          <button
            onClick={() => handleCopy(activeProject.gitInitInstructions.join('\n'), 'git-cli')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            {copiedKey === 'git-cli' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Instructions</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 space-y-1">
          {activeProject.gitInitInstructions.map((line, idx) => (
            <div key={idx} className="text-slate-400">
              <span className="text-emerald-400">$</span> {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
