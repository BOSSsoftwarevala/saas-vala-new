import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Search,
  Server,
  GitBranch,
  ExternalLink,
  MoreVertical,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ServerOverviewProps {
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

const statusConfig: Record<string, {
  icon: typeof CheckCircle2;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  animate?: boolean;
}> = {
  ready: {
    icon: CheckCircle2,
    label: 'Ready',
    color: 'text-success',
    bgColor: 'bg-success/20',
    borderColor: 'border-success/30',
  },
  building: {
    icon: Loader2,
    label: 'Building',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    borderColor: 'border-warning/30',
    animate: true,
  },
  error: {
    icon: XCircle,
    label: 'Error',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    borderColor: 'border-destructive/30',
  },
};

interface ServerRow {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  git_branch: string | null;
  status: string | null;
  last_deploy_at: string | null;
  last_deploy_message: string | null;
  server_type: string | null;
}

const typeIcons: Record<string, string> = {
  vps: '🖥️',
  vercel: '▲',
  cloud: '☁️',
  self: '🟢',
  hybrid: '⚡',
};

const mapStatus = (s: string | null) => {
  if (s === 'live') return 'ready';
  if (s === 'deploying') return 'building';
  if (s === 'stopped' || s === 'error') return 'error';
  return 'ready';
};

const timeAgo = (ts: string | null) => {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

export function ServerOverview({ onSelectProject, onNewProject }: ServerOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployCount, setDeployCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: srvData }, { count }] = await Promise.all([
        supabase.from('servers').select('*').order('created_at', { ascending: false }),
        supabase.from('deployments').select('*', { count: 'exact', head: true }),
      ]);
      setServers((srvData as ServerRow[]) || []);
      setDeployCount(count || 0);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredProjects = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subdomain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = servers.filter(s => s.status === 'live').length;
  const buildingCount = servers.filter(s => s.status === 'deploying').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="status-dot status-online" />
              <p className="text-2xl font-bold text-success">{activeCount}</p>
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Loader2 className="h-4 w-4 text-warning animate-spin" />
              <p className="text-2xl font-bold text-warning">{buildingCount}</p>
            </div>
            <p className="text-sm text-muted-foreground">Building</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{deployCount}</p>
            <p className="text-sm text-muted-foreground">Deployments</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <Button onClick={onNewProject} className="bg-orange-gradient hover:opacity-90 text-white gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Import Project</span>
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map((srv) => {
          const mapped = mapStatus(srv.status);
          const status = statusConfig[mapped] || statusConfig.ready;
          const StatusIcon = status.icon;
          const domain = srv.custom_domain || (srv.subdomain ? `${srv.subdomain}.saasvala.com` : null);

          return (
            <Card
              key={srv.id}
              className="glass-card-hover cursor-pointer group"
              onClick={() => onSelectProject(srv.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                      {typeIcons[srv.server_type || ''] || <Server className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {srv.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        <span>{srv.git_branch || 'main'}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem>View Deployments</DropdownMenuItem>
                      <DropdownMenuItem>Manage Domains</DropdownMenuItem>
                      <DropdownMenuItem>View Logs</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete Project</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status & Domain */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn(status.bgColor, status.color, status.borderColor)}>
                      <StatusIcon className={cn('h-3 w-3 mr-1', status.animate && 'animate-spin')} />
                      {status.label}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {project.branch}
                    </Badge>
                  </div>

                  {domain && (
                    <a
                      href={`https://${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-secondary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(srv.last_deploy_at)}
                      </div>
                      <span className="truncate ml-2 max-w-[150px]">{srv.last_deploy_message || '-'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Project Card */}
        <Card
          className="glass-card border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onNewProject}
        >
          <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Import Project</h3>
            <p className="text-sm text-muted-foreground">
              Connect your Git repository
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
