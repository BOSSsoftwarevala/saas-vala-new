import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Plus,
  Trash2,
  Globe,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SecurityControlPanelProps {
  serverId?: string;
  serverName?: string;
  onLogAction: (action: string, details: Record<string, unknown>) => void;
}

export function SecurityControlPanel({
  serverId,
  serverName,
  onLogAction,
}: SecurityControlPanelProps) {
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([
    '192.168.1.1',
    '10.0.0.1',
    '172.16.0.1',
  ]);
  const [newIp, setNewIp] = useState('');
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [server2FA, setServer2FA] = useState(false);

  const portAccess = [
    { port: 22, protocol: 'SSH', status: 'restricted' },
    { port: 80, protocol: 'HTTP', status: 'open' },
    { port: 443, protocol: 'HTTPS', status: 'open' },
    { port: 3306, protocol: 'MySQL', status: 'restricted' },
    { port: 5432, protocol: 'PostgreSQL', status: 'restricted' },
  ];

  const handleAddIp = () => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIp)) {
      toast.error('Invalid IP address format');
      return;
    }
    if (ipWhitelist.includes(newIp)) {
      toast.error('IP already in whitelist');
      return;
    }
    setIpWhitelist([...ipWhitelist, newIp]);
    onLogAction('IP_WHITELIST_ADD', { ip: newIp, server_id: serverId });
    toast.success(`IP ${newIp} added to whitelist`);
    setNewIp('');
  };

  const handleRemoveIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter((i) => i !== ip));
    onLogAction('IP_WHITELIST_REMOVE', { ip, server_id: serverId });
    toast.success(`IP ${ip} removed from whitelist`);
  };

  const handleFirewallToggle = (enabled: boolean) => {
    setFirewallEnabled(enabled);
    onLogAction(enabled ? 'FIREWALL_ENABLED' : 'FIREWALL_DISABLED', { server_id: serverId });
    toast.success(`Firewall ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handle2FAToggle = (enabled: boolean) => {
    setServer2FA(enabled);
    onLogAction(enabled ? 'SERVER_2FA_ENABLED' : 'SERVER_2FA_DISABLED', { server_id: serverId });
    toast.success(`Server 2FA ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-6">
      {/* Security Status Header */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Security Control</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {serverName ? `Managing: ${serverName}` : 'Server access control'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/20 text-success border-success/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Protected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IP Whitelist */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan" />
              <CardTitle className="text-sm">IP Whitelist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="bg-muted/50 border-border"
              />
              <Button onClick={handleAddIp} size="sm" className="bg-orange-gradient hover:opacity-90 text-white gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ipWhitelist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No IPs whitelisted</p>
              ) : (
                ipWhitelist.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono text-foreground">{ip}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveIp(ip)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Firewall & 2FA */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm">Firewall & Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Firewall Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {firewallEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-success" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Firewall Status</p>
                  <p className="text-xs text-muted-foreground">
                    {firewallEnabled ? 'Active protection enabled' : 'Protection disabled'}
                  </p>
                </div>
              </div>
              <Switch checked={firewallEnabled} onCheckedChange={handleFirewallToggle} />
            </div>

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Key className={cn('h-5 w-5', server2FA ? 'text-success' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium text-foreground">Server 2FA</p>
                  <p className="text-xs text-muted-foreground">
                    {server2FA ? 'Two-factor authentication enabled' : 'Additional verification disabled'}
                  </p>
                </div>
              </div>
              <Switch checked={server2FA} onCheckedChange={handle2FAToggle} />
            </div>

            {/* Warning if disabled */}
            {!firewallEnabled && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">
                  Firewall is disabled. Your server is at risk.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Port Access (Read Only) */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Port Access</CardTitle>
            </div>
            <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">
              Read Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {portAccess.map((port) => (
              <div
                key={port.port}
                className={cn(
                  'p-3 rounded-lg text-center',
                  port.status === 'open' ? 'bg-success/10' : 'bg-warning/10'
                )}
              >
                <p className="text-lg font-bold text-foreground">{port.port}</p>
                <p className="text-xs text-muted-foreground">{port.protocol}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1 text-[10px]',
                    port.status === 'open'
                      ? 'bg-success/20 text-success border-success/30'
                      : 'bg-warning/20 text-warning border-warning/30'
                  )}
                >
                  {port.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
