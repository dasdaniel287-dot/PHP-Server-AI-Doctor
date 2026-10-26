import JSZip from 'jszip';
import { ProjectFile } from '../types';

export async function downloadProjectZip(projectName: string, files: ProjectFile[]): Promise<void> {
  const zip = new JSZip();

  files.forEach((file) => {
    // JSZip handles folder paths like 'src/Http/Router.php' seamlessly
    zip.file(file.path, file.content);
  });

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${projectName || 'php-project'}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
