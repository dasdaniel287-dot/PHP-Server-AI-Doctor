export interface DiagnosticResult {
  title: string;
  severity: 'Critical' | 'Warning' | 'Configuration' | string;
  affectedComponent: string;
  summary: string;
  rootCause: string;
  oneClickFix: {
    fixName: string;
    targetFileName: string;
    fixedContent: string;
    diffExplanation: string;
    terminalCommands: string[];
    configSnippet?: string;
  };
  preventionTips: string[];
  verificationCheck?: string;
}

export interface PresetProblem {
  id: string;
  name: string;
  badge: string;
  category: 'PHP-FPM' | 'Memory & Limits' | 'Database/PDO' | 'Headers & Output' | 'SSL & cURL' | 'Composer' | 'Laravel/WP' | 'Nginx/Apache';
  errorLog: string;
  codeSnippet: string;
  targetFileName: string;
  environment: string;
  serverType: string;
  phpVersion: string;
  quickDescription: string;
  solution?: DiagnosticResult;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  purpose?: string;
}

export interface GeneratedProject {
  projectName: string;
  description: string;
  files: ProjectFile[];
  gitInitInstructions: string[];
}

export interface GitHubPushResult {
  success: boolean;
  repoUrl: string;
  owner: string;
  repoName: string;
  committedFiles: number;
  message: string;
}
