import { redirect } from 'next/navigation';

// Metrics and System Logs serve the same purpose — redirect to logs
export default function MetricsPage() {
  redirect('/dashboard/logs');
}
