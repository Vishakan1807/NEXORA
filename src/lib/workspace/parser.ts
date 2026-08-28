import fs from 'fs';
import path from 'path';

export interface ProjectMeta {
  languages: string[];
  frameworks: string[];
  buildSystems: string[];
  packageManagers: string[];
  hasTests: boolean;
  hasDocker: boolean;
  hasCi: boolean;
  entryPoints: string[];
  totalFiles: number;
  totalSize: number;
}

export function analyzeWorkspace(workspacePath: string): ProjectMeta {
  const meta: ProjectMeta = {
    languages: [],
    frameworks: [],
    buildSystems: [],
    packageManagers: [],
    hasTests: false,
    hasDocker: false,
    hasCi: false,
    entryPoints: [],
    totalFiles: 0,
    totalSize: 0,
  };

  const languagesSet = new Set<string>();
  const frameworksSet = new Set<string>();
  
  function walkDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
        continue; // Skip large/ignored dirs
      }

      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'tests' || entry.name === 'test') {
          meta.hasTests = true;
        }
        if (entry.name === '.github' || entry.name === '.gitlab') {
          meta.hasCi = true;
        }
        walkDir(fullPath);
      } else {
        meta.totalFiles++;
        meta.totalSize += fs.statSync(fullPath).size;

        // Simple Language Detection
        if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) languagesSet.add('TypeScript');
        if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) languagesSet.add('JavaScript');
        if (entry.name.endsWith('.py')) languagesSet.add('Python');
        if (entry.name.endsWith('.go')) languagesSet.add('Go');
        if (entry.name.endsWith('.rs')) languagesSet.add('Rust');
        if (entry.name.endsWith('.java')) languagesSet.add('Java');

        // Package Managers & Build Systems
        if (entry.name === 'package.json') {
          meta.packageManagers.push('npm/yarn/pnpm');
          meta.buildSystems.push('Node.js');
          
          // Peek inside package.json for frameworks
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['next']) frameworksSet.add('Next.js');
            if (deps['react']) frameworksSet.add('React');
            if (deps['express']) frameworksSet.add('Express');
            if (deps['jest'] || deps['vitest'] || deps['mocha']) meta.hasTests = true;
          } catch {
            // ignore
          }
        }
        if (entry.name === 'requirements.txt' || entry.name === 'Pipfile') meta.packageManagers.push('pip');
        if (entry.name === 'Cargo.toml') {
          meta.packageManagers.push('cargo');
          meta.buildSystems.push('cargo');
        }
        if (entry.name === 'pom.xml') {
          meta.packageManagers.push('maven');
          meta.buildSystems.push('maven');
        }

        // Docker
        if (entry.name === 'Dockerfile' || entry.name === 'docker-compose.yml') {
          meta.hasDocker = true;
        }

        // Entry points
        if (['index.ts', 'index.js', 'main.py', 'main.go', 'main.rs'].includes(entry.name)) {
          meta.entryPoints.push(entry.name);
        }
      }
    }
  }

  walkDir(workspacePath);

  meta.languages = Array.from(languagesSet);
  meta.frameworks = Array.from(frameworksSet);
  
  // Deduplicate
  meta.packageManagers = [...new Set(meta.packageManagers)];
  meta.buildSystems = [...new Set(meta.buildSystems)];

  return meta;
}
