import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  GitCommit,
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DeploymentRow {
  id: string;
  status: string | null;
  branch: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  deployed_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  build_logs: string | null;
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
  canceled: {
    icon: XCircle,
    label: 'Canceled',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted-foreground/30',
  },
};

const envConfig = {
  Production: 'bg-primary/20 text-primary border-primary/30',
  Preview: 'bg-cyan/20 text-cyan border-cyan/30',
};

export function ServerDeployments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeployments = async () => {
      const { data } = await supabase
        .from('deployments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setDeployments((data as DeploymentRow[]) || []);
      setLoading(false);
    };
    fetchDeployments();
  }, []);

  const mapStatus = (s: string | null) => {
    if (s === 'success') return 'ready';
    if (s === 'building') return 'building';
    if (s === 'failed') return 'error';
    return s || 'canceled';
  };

  const timeAgo = (ts: string | null) => {
    if (!ts) return '-';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const filteredDeployments = deployments.filter(
    (d) => {
      const q = searchQuery.toLowerCase();
      return (d.commit_message || '').toLowerCase().includes(q) ||
        (d.branch || '').toLowerCase().includes(q) ||
        (d.commit_sha || '').toLowerCase().includes(q);
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border gap-2">
            <RotateCcw className="h-4 w-4" />
            Redeploy
          </Button>
        </div>
      </div>

      {/* Deployments List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="divide-y divide-border">
            {filteredDeployments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No deployments found</div>
            )}
            {filteredDeployments.map((dep) => {
              const mappedStatus = mapStatus(dep.status);
              const status = statusConfig[mappedStatus] || statusConfig.canceled;
              const StatusIcon = status.icon;
              const isExpanded = selectedDeployment === dep.id;
              const env = dep.branch === 'main' ? 'Production' : 'Preview';
              const duration = dep.duration_seconds ? `${dep.duration_seconds}s` : '...';

              return (
                <div
                  key={dep.id}
                  className={cn(
                    'p-4 hover:bg-muted/30 cursor-pointer transition-colors',
                    isExpanded && 'bg-muted/30'
                  )}
                  onClick={() => setSelectedDeployment(isExpanded ? null : dep.id)}
                >
                  {/* Main Row */}
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', status.bgColor)}>
                      <StatusIcon className={cn('h-5 w-5', status.color, status.animate && 'animate-spin')} />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">
                          {dep.commit_message || 'No commit message'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {dep.branch || 'main'}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitCommit className="h-3 w-3" />
                          {dep.commit_sha ? dep.commit_sha.slice(0, 7) : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={envConfig[env as keyof typeof envConfig]}>
                        {env}
                      </Badge>
                      <div className="text-right text-sm hidden sm:block">
                        <div className="text-muted-foreground">{timeAgo(dep.created_at)}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {duration}
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-90'
                      )} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Status</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn(status.bgColor, status.color, status.borderColor)}>
                                <StatusIcon className={cn('h-3 w-3 mr-1', status.animate && 'animate-spin')} />
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                          {dep.status === 'failed' && dep.build_logs && (
                            <div>
                              <span className="text-xs text-muted-foreground">Error</span>
                              <p className="text-sm text-destructive mt-1">{dep.build_logs}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-muted-foreground">Build Duration</span>
                            <p className="text-sm text-foreground mt-1">{duration}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-start justify-end">
                          {dep.deployed_url && (
                            <Button variant="outline" size="sm" className="gap-2 border-border" asChild>
                              <a href={dep.deployed_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                                Visit
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-2 border-border">
                            <Eye className="h-3 w-3" />
                            View Logs
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 border-border">
                            <RotateCcw className="h-3 w-3" />
                            Redeploy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
