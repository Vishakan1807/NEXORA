const fs = require('fs');
const path = require('path');

const routes = [
  'code', 'qa', 'security', 'performance',
  'runtime', 'certification', 'providers',
  'logs', 'metrics', 'settings', 'audit'
];

const content = `import { Card, CardBody, EmptyState } from '@/components/ui';

export default function ComingSoonPage() {
  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <h1 className="nx-page__title">Coming Soon</h1>
        <p className="nx-page__description">This module is currently in development for a future phase.</p>
      </div>
      <Card>
        <CardBody style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState 
            icon="🚧"
            title="Under Construction"
            description="Our AI agents are hard at work building this feature! Check back in the next phase."
          />
        </CardBody>
      </Card>
    </div>
  );
}
`;

routes.forEach(route => {
  const dir = path.join('src', 'app', 'dashboard', route);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});
console.log('Created placeholder pages.');
