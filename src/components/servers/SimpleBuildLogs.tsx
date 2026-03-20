import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  FileText, CheckCircle2, XCircle, RefreshCw, Clock, AlertCircle, Loader2, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  created: number;
  meta?: Record<string, string>;
}

export function SimpleBuildLogs() {
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  const fetchLogs = async (name?: string) => {
    const target = name || projectName;
    if (!target) {
      toast.error('Project name daalo');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('factory-deploy', {
        body: { action: 'logs', app_name: target },
      });
      if (error) throw error;
      if (data?.deployments) {
        setDeployments(data.deployments);
        if (data.deployments.length === 0) {
          toast.info('No deployments found');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'READY': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'BUILDING': case 'INITIALIZING': return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      case 'CANCELED': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const overallStatus = deployments.length > 0 
    ? (deployments[0]?.state === 'READY' ? 'success' : deployments[0]?.state === 'ERROR' ? 'failed' : 'building')
    : 'idle';

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Build Logs</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Real Vercel deployment history
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              overallStatus === 'success' && 'bg-success/20 text-success border-success/30',
              overallStatus === 'failed' && 'bg-destructive/20 text-destructive border-destructive/30',
              overallStatus === 'building' && 'bg-warning/20 text-warning border-warning/30',
              overallStatus === 'idle' && 'bg-muted text-muted-foreground border-border'
            )}
          >
            {overallStatus === 'success' && <><CheckCircle2 className="h-3 w-3 mr-1" /> Latest: Success</>}
            {overallStatus === 'failed' && <><XCircle className="h-3 w-3 mr-1" /> Latest: Failed</>}
            {overallStatus === 'building' && <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Building</>}
            {overallStatus === 'idle' && <><Clock className="h-3 w-3 mr-1" /> No data</>}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Project name (e.g. kirana-lite)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-background/50"
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          />
          <Button
            variant="outline"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Deployment List */}
        <ScrollArea className="h-[300px] sm:h-[350px]">
          <div className="space-y-2 pr-4">
            {deployments.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Project name enter karke search karo — real Vercel logs aayenge
              </div>
            )}
            {deployments.map((deploy) => (
              <div 
                key={deploy.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  deploy.state === 'ERROR' ? 'bg-destructive/10' : 'bg-muted/30'
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {getStatusIcon(deploy.state)}
                </div>
                <div className="flex-1 min-w-0">
                  <a 
                    href={deploy.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      'text-sm font-medium hover:underline block truncate',
                      deploy.state === 'ERROR' ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {deploy.url}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(deploy.created).toLocaleString()} • {deploy.state}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs shrink-0',
                    deploy.state === 'READY' && 'bg-success/20 text-success border-success/30',
                    deploy.state === 'ERROR' && 'bg-destructive/20 text-destructive border-destructive/30',
                    deploy.state === 'BUILDING' && 'bg-warning/20 text-warning border-warning/30',
                  )}
                >
                  {deploy.state}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
