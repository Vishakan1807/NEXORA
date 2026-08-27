import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Security Helper to ensure paths stay within the workspace
function resolveAndValidatePath(workspaceRoot: string, targetPath: string): string {
  const resolved = path.resolve(workspaceRoot, targetPath);
  if (!resolved.startsWith(path.resolve(workspaceRoot))) {
    throw new Error('Security Error: Path traversal attempt blocked.');
  }
  return resolved;
}

export const getWorkspaceTools = (workspaceRoot: string) => ({
  readFile: tool({
    description: 'Read the complete text content of a file in the workspace.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path to the file from the workspace root (e.g., src/index.ts)'),
    }),
    execute: async ({ filePath }: { filePath: string }) => {
      try {
        const fullPath = resolveAndValidatePath(workspaceRoot, filePath);
        if (!fs.existsSync(fullPath)) {
          return `Error: File not found at ${filePath}`;
        }
        return fs.readFileSync(fullPath, 'utf8');
      } catch (error: any) {
        return `Error reading file: ${error.message}`;
      }
    },
  }),

  writeToFile: tool({
    description: 'Create a new file or overwrite an existing file with new content.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path where the file should be written'),
      content: z.string().describe('The full content to write to the file'),
    }),
    execute: async ({ filePath, content }: { filePath: string, content: string }) => {
      try {
        const fullPath = resolveAndValidatePath(workspaceRoot, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        return `Successfully wrote to ${filePath}`;
      } catch (error: any) {
        return `Error writing file: ${error.message}`;
      }
    },
  }),

  runCommand: tool({
    description: 'Execute a terminal command (e.g., npm run build, ls -la, git status) within the workspace directory. WARNING: Only use safe commands.',
    inputSchema: z.object({
      command: z.string().describe('The shell command to execute'),
    }),
    execute: async ({ command }: { command: string }) => {
      try {
        // Basic safety check for incredibly dangerous commands
        const dangerousPrefixes = ['rm -rf /', 'mkfs', 'dd '];
        if (dangerousPrefixes.some(p => command.includes(p))) {
          return 'Command blocked for safety reasons.';
        }

        const { stdout, stderr } = await execAsync(command, { 
          cwd: workspaceRoot,
          timeout: 30000 // 30 second timeout
        });
        
        if (stderr && !stdout) {
          return `Command executed with warnings/errors:\n${stderr}`;
        }
        return `Command output:\n${stdout}${stderr ? '\nStderr:\n' + stderr : ''}`;
      } catch (error: any) {
        return `Command failed:\n${error.message}`;
      }
    },
  })
});
