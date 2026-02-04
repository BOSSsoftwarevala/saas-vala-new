import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Users, FileText, Terminal } from 'lucide-react';
import { SecurityControlPanel } from '@/components/servers/SecurityControlPanel';
import { PermissionMatrix } from '@/components/servers/PermissionMatrix';
import { AuditLogViewer } from '@/components/servers/AuditLogViewer';
import { DeploymentLogViewer } from '@/components/servers/DeploymentLogViewer';
import { LiveSecurityAlertPanel } from '@/components/servers/LiveSecurityAlertPanel';
import { supabase } from '@/integrations/supabase/client';

export default function SecurityLogs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('security');

  const handleLogAction = async (action: string, details: Record<string, unknown>) => {
    const { data: userData } = await supabase.auth.getUser();
    
    try {
      // Log to activity_logs table
      const { error } = await supabase.from('activity_logs').insert([{
        action,
        entity_type: 'server_security',
        entity_id: (details.server_id as string) || 'global',
        performed_by: userData.user?.id || null,
        details: details as unknown as Record<string, never>,
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 space-y-6 pr-0 xl:pr-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/servers')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Security & Logs
                </h2>
                <p className="text-muted-foreground text-sm">
                  Access control, permissions, and audit trail
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Audit</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <SecurityControlPanel
                  serverName="All Servers"
                  onLogAction={handleLogAction}
                />
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="mt-0">
                <PermissionMatrix />
              </TabsContent>

              {/* Audit Tab */}
              <TabsContent value="audit" className="mt-0">
                <AuditLogViewer />
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="mt-0">
                <DeploymentLogViewer />
              </TabsContent>
            </div>
          </Tabs>

          {/* Final System Lock Notice */}
          <div className="glass-card rounded-xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span className="font-display font-bold text-foreground">SERVER MANAGER: FINAL LOCK</span>
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-success/10">
                <p className="font-medium text-success">✓ Fully Secured</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="font-medium text-success">✓ Fully Traceable</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="font-medium text-success">✓ Role Controlled</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="font-medium text-success">✓ Production Ready</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              No changes allowed without new phase approval
            </p>
          </div>

          {/* Brand Lock */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            Powered by <span className="font-semibold text-primary">SoftwareVala™</span>
          </p>
        </div>

        {/* Live Security Alert Panel (Right Side) */}
        <LiveSecurityAlertPanel />
      </div>
    </DashboardLayout>
  );
}
