import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AutoPilotDashboard } from '@/components/automation/AutoPilotDashboard';

export default function Automation() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🤖 AI Auto-Pilot</h1>
          <p className="text-muted-foreground">
            AI handles all client requests • Auto-builds 2 software daily • Auto SEO & Backlinks • 4-day billing alerts
          </p>
        </div>
        <AutoPilotDashboard />
      </div>
    </DashboardLayout>
  );
}
