import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerOverview } from '@/components/servers/ServerOverview';
import { ServerDeployments } from '@/components/servers/ServerDeployments';
import { ServerDomains } from '@/components/servers/ServerDomains';
import { ServerEnvVars } from '@/components/servers/ServerEnvVars';
import { ServerAnalytics } from '@/components/servers/ServerAnalytics';
import { ServerFunctions } from '@/components/servers/ServerFunctions';
import { ServerSettings } from '@/components/servers/ServerSettings';
import { ServerLogs } from '@/components/servers/ServerLogs';
import { NewProjectModal } from '@/components/servers/NewProjectModal';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Rocket, Globe, Key, BarChart3, Zap, Settings, FileText } from 'lucide-react';

export default function Servers() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Server Manager
            </h2>
            <p className="text-muted-foreground">
              Deploy, manage, and scale your applications with ease
            </p>
          </div>
          <Button 
            onClick={() => setShowNewProject(true)}
            className="bg-orange-gradient hover:opacity-90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="glass-card rounded-xl p-2 overflow-x-auto">
            <TabsList className="bg-transparent gap-1 w-full justify-start">
              <TabsTrigger 
                value="overview" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="deployments" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Deployments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="domains" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Domains</span>
              </TabsTrigger>
              <TabsTrigger 
                value="env" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Environment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="functions" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Functions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <ServerOverview onSelectProject={setSelectedProject} onNewProject={() => setShowNewProject(true)} />
          </TabsContent>

          <TabsContent value="deployments" className="mt-0">
            <ServerDeployments />
          </TabsContent>

          <TabsContent value="domains" className="mt-0">
            <ServerDomains />
          </TabsContent>

          <TabsContent value="env" className="mt-0">
            <ServerEnvVars />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <ServerLogs />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <ServerAnalytics />
          </TabsContent>

          <TabsContent value="functions" className="mt-0">
            <ServerFunctions />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ServerSettings />
          </TabsContent>
        </Tabs>

        {/* New Project Modal */}
        <NewProjectModal 
          open={showNewProject} 
          onOpenChange={setShowNewProject} 
        />
      </div>
    </DashboardLayout>
  );
}
