import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Find all route.ts files
const files = globSync('src/app/api/**/route.ts', { absolute: true });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix cookies().get() -> (await cookies()).get()
  if (content.includes('cookies().get(') || content.includes('cookies().set(')) {
    content = content.replace(/cookies\(\)\.get\(/g, '(await cookies()).get(');
    content = content.replace(/cookies\(\)\.set\(/g, '(await cookies()).set(');
    changed = true;
  }
  
  // Fix params type for dynamic routes (Next 15)
  // From: { params }: { params: { id: string } }
  // To: { params }: { params: Promise<{ id: string }> }
  if (content.includes('{ params }: { params: {')) {
    content = content.replace(
      /{ params }: { params: {([^}]+)} }/g,
      (match, inner) => `{ params }: { params: Promise<{${inner}}> }`
    );
    changed = true;
  }

  if (content.includes('const { id } = params;')) {
    content = content.replace('const { id } = params;', 'const { id } = await params;');
    changed = true;
  }
  if (content.includes('const { workspaceId } = params;')) {
    content = content.replace('const { workspaceId } = params;', 'const { workspaceId } = await params;');
    changed = true;
  }
  // In [id]/role/route.ts: params.id -> (await params).id
  if (content.includes('params.id')) {
    content = content.replace(/params\.id/g, '(await params).id');
    changed = true;
  }
  
  // In [workspaceId]/index/route.ts: params.workspaceId -> (await params).workspaceId
  if (content.includes('params.workspaceId')) {
    content = content.replace(/params\.workspaceId/g, '(await params).workspaceId');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
}
