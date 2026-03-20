import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  duration: string;
}

const levelConfig = {
  info: { icon: Info, color: 'text-cyan', bgColor: 'bg-cyan/20' },
  warn: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/20' },
  error: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20' },
  success: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/20' },
};

export function ServerLogs() {
  const [activeTab, setActiveTab] = useState('runtime');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buildLogEntries, setBuildLogEntries] = useState<{id: string; timestamp: string; message: string; status: string}[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      // Fetch deployment logs as runtime logs
      const { data: dlogs } = await supabase
        .from('deployment_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (dlogs && dlogs.length > 0) {
        setLogs(dlogs.map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp || new Date().toISOString(),
          level: l.log_level || 'info',
          message: l.message,
          source: 'deployment',
          duration: '-',
        })));
      }

      // Fetch latest deployment build logs
      const { data: deploys } = await supabase
        .from('deployments')
        .select('build_logs, created_at')
        .not('build_logs', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (deploys && deploys.length > 0 && deploys[0].build_logs) {
        const lines = deploys[0].build_logs.split('\n').filter(Boolean);
        setBuildLogEntries(lines.map((line: string, i: number) => ({
          id: `b-${i}`,
          timestamp: `00:${String(i).padStart(2, '0')}`,
          message: line,
          status: i === lines.length - 1 ? 'success' : 'done',
        })));
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Logs</h3>
          <p className="text-sm text-muted-foreground">
            Real-time runtime and build logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isLive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={cn(
              'gap-2',
              isLive ? 'bg-success hover:bg-success/90 text-white' : 'border-border'
            )}
          >
            {isLive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" className="border-border gap-2">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="runtime" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Runtime Logs
          </TabsTrigger>
          <TabsTrigger value="build" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Build Logs
          </TabsTrigger>
          <TabsTrigger value="edge" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Edge Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="runtime" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50 border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No runtime logs available. Logs appear after deployments.
            </div>
          )}
          {/* Logs */}
          <Card className="glass-card">
            <ScrollArea className="h-[500px]" ref={scrollRef}>
              <div className="font-mono text-sm">
                {filteredLogs.map((log) => {
                  const config = levelConfig[log.level as keyof typeof levelConfig];
                  const Icon = config.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-2 hover:bg-muted/30 border-b border-border/50"
                    >
                      <div className={cn('h-5 w-5 rounded flex items-center justify-center shrink-0', config.bgColor)}>
                        <Icon className={cn('h-3 w-3', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {log.source}
                          </Badge>
                          {log.duration !== '-' && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.duration}
                            </span>
                          )}
                        </div>
                        <p className={cn('mt-1', config.color)}>{log.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="build" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">
                  Latest Build - Production
                </CardTitle>
                {buildLogEntries.length > 0 && (
                  <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                    {buildLogEntries.length} steps
                  </Badge>
                )}
              </div>
            </CardHeader>
            <ScrollArea className="h-[400px]">
              <div className="font-mono text-sm px-4 pb-4">
                {buildLogEntries.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No build logs available</p>
                )}
                {buildLogEntries.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs text-muted-foreground w-12">{log.timestamp}</span>
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-success" />
                    )}
                    <span className={cn(
                      log.status === 'success' ? 'text-success' : 'text-foreground'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="edge" className="mt-6">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium text-foreground mb-2">Edge Function Logs</h4>
              <p className="text-sm text-muted-foreground mb-4">
                View real-time logs from your edge functions across all regions
              </p>
              <Button variant="outline" className="border-border">
                View Edge Logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
