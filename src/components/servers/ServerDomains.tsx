import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Globe,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DomainRow {
  id: string;
  domain_name: string;
  domain_type: string;
  status: string | null;
  ssl_status: string | null;
  is_primary: boolean | null;
  dns_verified: boolean | null;
}

const statusConfig = {
  active: {
    icon: CheckCircle2,
    label: 'Active',
    color: 'text-success',
    bgColor: 'bg-success/20',
    borderColor: 'border-success/30',
  },
  pending: {
    icon: Clock,
    label: 'Pending DNS',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    borderColor: 'border-warning/30',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    borderColor: 'border-destructive/30',
  },
};

export function ServerDomains() {
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomains = async () => {
      const { data } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });
      setDomains((data as DomainRow[]) || []);
      setLoading(false);
    };
    fetchDomains();
  }, []);

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    toast({
      title: 'Domain added',
      description: `${newDomain} has been added. Configure DNS to complete setup.`,
    });
    setNewDomain('');
    setShowAddDomain(false);
  };

  const productionDomains = domains.filter((d) => d.domain_type === 'production' || d.domain_type === 'custom');
  const previewDomains = domains.filter((d) => d.domain_type === 'preview' || d.domain_type === 'subdomain');

  const mapStatus = (d: DomainRow) => {
    if (d.status === 'active' || d.dns_verified) return 'active';
    if (d.status === 'pending') return 'pending';
    return 'error';
  };

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
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Custom Domains</h3>
          <p className="text-sm text-muted-foreground">
            Connect custom domains to your deployments
          </p>
        </div>
        <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
          <DialogTrigger asChild>
            <Button className="bg-orange-gradient hover:opacity-90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Custom Domain</DialogTitle>
              <DialogDescription>
                Enter your domain name. You'll need to configure DNS records after adding.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-foreground">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">DNS Configuration Required</p>
                <p className="text-xs text-muted-foreground">
                  After adding, you'll need to add these DNS records:
                </p>
                <div className="text-xs font-mono bg-background/50 p-2 rounded">
                  <div>A @ 185.158.133.1</div>
                  <div>CNAME www saas-vala.app</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDomain(false)} className="border-border">
                Cancel
              </Button>
              <Button onClick={handleAddDomain} className="bg-orange-gradient hover:opacity-90 text-white">
                Add Domain
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {domains.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            No domains configured yet. Add your first custom domain.
          </CardContent>
        </Card>
      )}

      {/* Production Domains */}
      {productionDomains.length > 0 && <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground">
              Production Domains
            </CardTitle>
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              {productionDomains.length} domains
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {productionDomains.map((d) => {
            const s = mapStatus(d);
            const status = statusConfig[s as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${d.domain_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {d.domain_name}
                      </a>
                      {d.is_primary && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {d.ssl_status === 'active' && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-success" />
                          SSL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(status.bgColor, status.color, status.borderColor)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>}

      {/* Preview Domains */}
      {previewDomains.length > 0 && <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground">
              Preview Domains
            </CardTitle>
            <Badge variant="outline" className="bg-cyan/20 text-cyan border-cyan/30">
              {previewDomains.length} domains
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {previewDomains.map((d) => {
            const s = mapStatus(d);
            const status = statusConfig[s as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <a
                      href={`https://${d.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {d.domain_name}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {d.ssl_status === 'active' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-success" />
                          SSL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning">
                          <Clock className="h-3 w-3" />
                          SSL Provisioning
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(status.bgColor, status.color, status.borderColor)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  {s === 'pending' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>}

      {/* DNS Help */}
      <Card className="glass-card border-border">
        <CardContent className="p-6">
          <h4 className="font-medium text-foreground mb-2">Need help with DNS?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Point your domain's A record to <code className="bg-muted px-1.5 py-0.5 rounded text-primary">185.158.133.1</code> and
            add a CNAME for www pointing to <code className="bg-muted px-1.5 py-0.5 rounded text-primary">saas-vala.app</code>
          </p>
          <Button variant="outline" className="border-border gap-2">
            View DNS Guide
            <ExternalLink className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
