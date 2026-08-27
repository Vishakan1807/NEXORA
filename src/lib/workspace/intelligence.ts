import fs from 'fs';
import path from 'path';

export interface CodeChunk {
  filePath: string;
  content: string;
  chunkIndex: number;
  metadata: {
    language: string;
    startLine: number;
    endLine: number;
  };
}

const CHUNK_SIZE = 1500; // rough characters per chunk
const CHUNK_OVERLAP = 200;

function getLanguageFromExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.py': 'python', '.go': 'go', '.rs': 'rust',
    '.java': 'java', '.cpp': 'cpp', '.c': 'c',
    '.md': 'markdown', '.json': 'json',
  };
  return map[ext] || 'unknown';
}

/**
 * Reads a file and splits it into logical chunks with overlap.
 * In a production system, this would use a full AST parser (like tree-sitter) 
 * to split exactly on function boundaries. For Phase 2, we use smart overlap chunking.
 */
export async function chunkFile(workspacePath: string, relativeFilePath: string): Promise<CodeChunk[]> {
  const fullPath = path.join(workspacePath, relativeFilePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const language = getLanguageFromExtension(relativeFilePath);
  
  const chunks: CodeChunk[] = [];
  
  // Basic chunking logic by characters (in real life, chunk by tokens)
  let currentIndex = 0;
  let chunkIndex = 0;
  
  while (currentIndex < content.length) {
    let chunkEnd = currentIndex + CHUNK_SIZE;
    
    // Try to find a newline to break at instead of breaking mid-word
    if (chunkEnd < content.length) {
      const nextNewline = content.indexOf('\n', chunkEnd);
      const prevNewline = content.lastIndexOf('\n', chunkEnd);
      
      if (prevNewline > currentIndex && chunkEnd - prevNewline < 500) {
        chunkEnd = prevNewline;
      } else if (nextNewline !== -1 && nextNewline - chunkEnd < 500) {
        chunkEnd = nextNewline;
      }
    } else {
      chunkEnd = content.length;
    }

    const chunkContent = content.substring(currentIndex, chunkEnd);
    
    // Calculate line numbers roughly
    const textBefore = content.substring(0, currentIndex);
    const startLine = textBefore.split('\n').length;
    const endLine = startLine + chunkContent.split('\n').length - 1;

    chunks.push({
      filePath: relativeFilePath,
      content: chunkContent,
      chunkIndex,
      metadata: {
        language,
        startLine,
        endLine
      }
    });

    chunkIndex++;
    currentIndex = chunkEnd - CHUNK_OVERLAP; // Move forward, minus overlap
    if (currentIndex <= 0 || chunkEnd === content.length) break;
  }

  return chunks;
}

/**
 * Scans a workspace and returns all chunkable text files.
 */
export function getWorkspaceFiles(workspacePath: string): string[] {
  const files: string[] = [];
  
  function walk(current: string, relativeDir: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      
      const full = path.join(current, entry.name);
      const rel = path.posix.join(relativeDir, entry.name);
      
      if (entry.isDirectory()) {
        walk(full, rel);
      } else {
        // Only include source code files, ignore binaries/images
        const lang = getLanguageFromExtension(entry.name);
        if (lang !== 'unknown') {
          files.push(rel);
        }
      }
    }
  }
  
  walk(workspacePath, '');
  return files;
}
