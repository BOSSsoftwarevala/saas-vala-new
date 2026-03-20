import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Rocket, RotateCcw, History, CheckCircle2, XCircle, Loader2,
  ExternalLink, Clock, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type DeployStatus = 'idle' | 'building' | 'deploying' | 'success' | 'failed';

interface DeployResult {
  project_name: string;
  deploy_url: string;
  vercel_url?: string;
  custom_domain?: string;
  deployment_id?: string;
  status?: string;
}

interface RecentDeploy {
  id: string;
  url: string;
  state: string;
  created: number;
}

export function ProjectDeploy() {
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [lastResult, setLastResult] = useState<DeployResult | null>(null);
  const [recentDeploys, setRecentDeploys] = useState<RecentDeploy[]>([]);
  const [liveUrl, setLiveUrl] = useState('');

  // Fetch recent deployments on mount
  useEffect(() => {
    checkVercelHealth();
  }, []);

  const checkVercelHealth = async () => {
    try {
      const { data } = await supabase.functions.invoke('factory-deploy', {
        body: { action: 'health' },
      });
      if (!data?.success) {
        toast.error('Vercel not connected');
      }
    } catch {
      // silent
    }
  };

  const handleDeploy = async () => {
    if (!repoUrl) {
      toast.error('GitHub repo URL daalo pehle');
      return;
    }

    setStatus('building');
    setProgress(10);

    try {
      setProgress(30);
      
      // Real API call to factory-deploy
      const { data, error } = await supabase.functions.invoke('factory-deploy', {
        body: {
          action: 'auto-subdomain',
          repo_url: repoUrl,
          app_name: appName || undefined,
          domain_suffix: 'saasvala.com',
        },
      });

      setProgress(70);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deploy failed');

      setProgress(90);

      // Auto DNS via Cloudflare
      try {
        await supabase.functions.invoke('factory-deploy', {
          body: {
            action: 'cloudflare-dns',
            subdomain: data.project_name,
            domain: 'saasvala.com',
          },
        });
      } catch {
        // DNS is optional, don't fail deploy
      }

      setProgress(100);
      setStatus('success');
      setLastResult(data);
      setLiveUrl(data.deploy_url || `https://${data.custom_domain}`);

      toast.success(`✅ Deployed! ${data.custom_domain || data.deploy_url}`);

      // Fetch recent deploys
      fetchRecentDeploys(data.project_name);

    } catch (err: any) {
      setStatus('failed');
      setProgress(0);
      toast.error(`Deploy failed: ${err.message}`);
    }
  };

  const fetchRecentDeploys = async (projectName: string) => {
    try {
      const { data } = await supabase.functions.invoke('factory-deploy', {
        body: { action: 'logs', app_name: projectName },
      });
      if (data?.deployments) {
        setRecentDeploys(data.deployments);
      }
    } catch {
      // silent
    }
  };

  const handleRedeploy = async () => {
    if (!lastResult?.project_name) {
      toast.error('Pehle ek deploy karo');
      return;
    }
    setStatus('building');
    setProgress(10);

    try {
      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (!repoMatch) throw new Error('Invalid repo URL');

      const { data, error } = await supabase.functions.invoke('factory-deploy', {
        body: {
          action: 'deploy',
          repo_url: repoUrl,
          app_name: lastResult.project_name,
        },
      });

      setProgress(100);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Redeploy failed');

      setStatus('success');
      toast.success('✅ Redeployed successfully!');
      fetchRecentDeploys(lastResult.project_name);
    } catch (err: any) {
      setStatus('failed');
      setProgress(0);
      toast.error(`Redeploy failed: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!lastResult?.project_name) return;
    
    try {
      const { data } = await supabase.functions.invoke('factory-deploy', {
        body: { action: 'delete', app_name: lastResult.project_name },
      });
      if (data?.success) {
        toast.success('Project deleted from Vercel');
        setLastResult(null);
        setLiveUrl('');
        setStatus('idle');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyUrl = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success('URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isDeploying = status === 'building' || status === 'deploying';

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Project Deployment</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Real Vercel deploy • Auto subdomain • Cloudflare DNS
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              status === 'success' && 'bg-success/20 text-success border-success/30',
              status === 'failed' && 'bg-destructive/20 text-destructive border-destructive/30',
              isDeploying && 'bg-warning/20 text-warning border-warning/30',
              status === 'idle' && 'bg-muted text-muted-foreground border-border'
            )}
          >
            {status === 'success' && <><CheckCircle2 className="h-3 w-3 mr-1" /> Live</>}
            {status === 'failed' && <><XCircle className="h-3 w-3 mr-1" /> Failed</>}
            {isDeploying && <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Deploying...</>}
            {status === 'idle' && <><Clock className="h-3 w-3 mr-1" /> Ready</>}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="space-y-3">
          <Input
            placeholder="https://github.com/saasvala/repo-name"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="bg-background/50"
            disabled={isDeploying}
          />
          <Input
            placeholder="Custom app name (optional)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="bg-background/50"
            disabled={isDeploying}
          />
        </div>

        {/* Live URL */}
        {liveUrl && (
          <div className="glass-card rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Your Live URL</p>
                <p className="text-sm font-medium text-foreground truncate">{liveUrl}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="border-border gap-2" onClick={copyUrl}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button variant="outline" size="sm" className="border-border gap-2" asChild>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">Visit</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isDeploying && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {progress < 30 ? 'Creating Vercel project...' : 
                 progress < 70 ? 'Setting up subdomain...' :
                 progress < 90 ? 'Configuring DNS...' : 'Finalizing...'}
              </span>
              <span className="text-foreground font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <Button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-orange-gradient hover:opacity-90 text-white gap-2 h-11 sm:h-12"
          >
            {isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Deploy Now
          </Button>
          <Button 
            variant="outline" 
            className="border-border gap-2 h-11 sm:h-12"
            onClick={handleRedeploy}
            disabled={isDeploying || !lastResult}
          >
            <RotateCcw className="h-4 w-4" />
            Redeploy
          </Button>
          <Button 
            variant="outline" 
            className="border-border gap-2 h-11 sm:h-12 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeploying || !lastResult}
          >
            <History className="h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Recent Deployments from Vercel API */}
        {recentDeploys.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Recent Deployments (Live)</p>
            <div className="space-y-2">
              {recentDeploys.map((deploy) => (
                <div 
                  key={deploy.id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={cn(
                      'h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0',
                      deploy.state === 'READY' && 'bg-success/20',
                      deploy.state === 'ERROR' && 'bg-destructive/20',
                      !['READY', 'ERROR'].includes(deploy.state) && 'bg-warning/20'
                    )}>
                      {deploy.state === 'READY' && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success" />}
                      {deploy.state === 'ERROR' && <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />}
                      {!['READY', 'ERROR'].includes(deploy.state) && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-warning animate-spin" />}
                    </div>
                    <div className="min-w-0">
                      <a href={deploy.url} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm font-medium text-foreground truncate hover:underline block">
                        {deploy.url}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deploy.created).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs shrink-0',
                      deploy.state === 'READY' && 'bg-success/20 text-success border-success/30',
                      deploy.state === 'ERROR' && 'bg-destructive/20 text-destructive border-destructive/30',
                    )}
                  >
                    {deploy.state}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
