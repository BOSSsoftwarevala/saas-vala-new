import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  AlertTriangle,
  Check,
  LogOut,
  Clock,
  Shield,
  Key,
  Rocket,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'invalid_key' | 'unauthorized_deploy' | 'firewall_block' | 'server_offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  server_name?: string;
  acknowledged: boolean;
  created_at: string;
}

export function LiveSecurityAlertPanel() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [time, setTime] = useState(new Date());

  // Mock alerts for demo
  const mockAlerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'failed_login',
      severity: 'high',
      title: 'Multiple Failed Login Attempts',
      description: '5 failed attempts from IP 192.168.1.100',
      ip_address: '192.168.1.100',
      acknowledged: false,
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: '2',
      type: 'firewall_block',
      severity: 'medium',
      title: 'Firewall Block Event',
      description: 'Blocked suspicious request from 10.0.0.50',
      ip_address: '10.0.0.50',
      acknowledged: false,
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '3',
      type: 'invalid_key',
      severity: 'low',
      title: 'Invalid License Key Used',
      description: 'Attempted use of expired key XXXX-XXXX',
      acknowledged: true,
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
  ];

  useEffect(() => {
    setAlerts(mockAlerts);
    const interval = setInterval(() => setTime(new Date()), 3000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return Key;
      case 'invalid_key':
        return Key;
      case 'unauthorized_deploy':
        return Rocket;
      case 'firewall_block':
        return Shield;
      case 'server_offline':
        return Server;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: 'text-destructive', bg: 'bg-destructive/20', border: 'border-destructive/30' };
      case 'high':
        return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' };
      case 'medium':
        return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
      case 'low':
        return { color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-muted/30' };
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-muted/30' };
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    toast.success('Alert acknowledged');
  };

  const handleForceLogout = (alertId: string) => {
    toast.success('User force logged out');
    handleAcknowledge(alertId);
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="hidden xl:block w-80 shrink-0 space-y-4">
      {/* Header Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-medium text-foreground">Security Alerts</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={cn(
                unacknowledgedCount > 0
                  ? 'bg-destructive/20 text-destructive border-destructive/30'
                  : 'bg-success/20 text-success border-success/30'
              )}
            >
              {unacknowledgedCount > 0 ? `${unacknowledgedCount} Active` : 'All Clear'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Auto-refresh every 3s</p>
        </CardContent>
      </Card>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center">
              <Shield className="h-10 w-10 text-success mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No security alerts</p>
              <p className="text-xs text-muted-foreground/70">System is secure</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const severity = getSeverityConfig(alert.severity);

            return (
              <Card
                key={alert.id}
                className={cn(
                  'glass-card transition-all',
                  !alert.acknowledged && 'border-l-2',
                  !alert.acknowledged && severity.border.replace('border-', 'border-l-')
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', severity.bg)}>
                      <Icon className={cn('h-4 w-4', severity.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                        {alert.acknowledged && (
                          <Check className="h-3 w-3 text-success shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(alert.created_at), 'HH:mm:ss')}</span>
                    <Badge variant="outline" className={cn('text-[10px]', severity.bg, severity.color, severity.border)}>
                      {alert.severity}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {!alert.acknowledged && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <Check className="h-3 w-3" />
                        Acknowledge
                      </Button>
                      {alert.type === 'failed_login' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleForceLogout(alert.id)}
                        >
                          <LogOut className="h-3 w-3" />
                          Force Logout
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Status Footer */}
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">
          Last checked: {format(time, 'HH:mm:ss')}
        </p>
      </div>
    </div>
  );
}
