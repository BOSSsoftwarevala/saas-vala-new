import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Terminal,
  Search,
  Copy,
  Check,
  Rocket,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DeploymentLog {
  id: string;
  deployment_id: string | null;
  message: string;
  log_level: string | null;
  timestamp: string | null;
}

export function DeploymentLogViewer() {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [liveStream, setLiveStream] = useState(true);
  const [activeTab, setActiveTab] = useState('deployment');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Mock logs for demo
  const mockLogs: DeploymentLog[] = [
    { id: '1', deployment_id: 'd1', message: '[2026-02-04 12:00:01] Starting deployment...', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '2', deployment_id: 'd1', message: '[2026-02-04 12:00:02] Cloning repository from GitHub...', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '3', deployment_id: 'd1', message: '[2026-02-04 12:00:05] Installing dependencies...', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '4', deployment_id: 'd1', message: '[2026-02-04 12:00:15] npm install completed (10s)', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '5', deployment_id: 'd1', message: '[2026-02-04 12:00:16] Running build command...', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '6', deployment_id: 'd1', message: '[2026-02-04 12:00:25] Build completed successfully', log_level: 'success', timestamp: new Date().toISOString() },
    { id: '7', deployment_id: 'd1', message: '[2026-02-04 12:00:26] Deploying to production...', log_level: 'info', timestamp: new Date().toISOString() },
    { id: '8', deployment_id: 'd1', message: '[2026-02-04 12:00:30] Deployment complete! 🚀', log_level: 'success', timestamp: new Date().toISOString() },
  ];

  const errorLogs: DeploymentLog[] = [
    { id: 'e1', deployment_id: 'd2', message: '[ERROR] TypeError: Cannot read property of undefined', log_level: 'error', timestamp: new Date().toISOString() },
    { id: 'e2', deployment_id: 'd2', message: '[ERROR] at Object.<anonymous> (src/index.js:15:7)', log_level: 'error', timestamp: new Date().toISOString() },
    { id: 'e3', deployment_id: 'd2', message: '[WARN] Deprecation warning: punycode module is deprecated', log_level: 'warn', timestamp: new Date().toISOString() },
  ];

  const restartLogs: DeploymentLog[] = [
    { id: 'r1', deployment_id: null, message: '[2026-02-04 11:45:00] Server unresponsive - initiating restart', log_level: 'warn', timestamp: new Date().toISOString() },
    { id: 'r2', deployment_id: null, message: '[2026-02-04 11:45:05] Graceful shutdown initiated', log_level: 'info', timestamp: new Date().toISOString() },
    { id: 'r3', deployment_id: null, message: '[2026-02-04 11:45:10] Server restarted successfully', log_level: 'success', timestamp: new Date().toISOString() },
  ];

  useEffect(() => {
    // Simulate fetching logs
    setLoading(true);
    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (liveStream && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, liveStream]);

  const getLogsByTab = () => {
    switch (activeTab) {
      case 'deployment':
        return mockLogs;
      case 'error':
        return errorLogs;
      case 'restart':
        return restartLogs;
      default:
        return mockLogs;
    }
  };

  const filteredLogs = getLogsByTab().filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLogLevelColor = (level: string | null) => {
    switch (level) {
      case 'error':
        return 'text-destructive';
      case 'warn':
        return 'text-warning';
      case 'success':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleCopyLogs = () => {
    const logText = filteredLogs.map((l) => l.message).join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    toast.success('Logs copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Deployment & Error Logs</CardTitle>
              <p className="text-xs text-muted-foreground">
                {liveStream ? 'Live streaming' : 'Paused'} • {filteredLogs.length} entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLiveStream(!liveStream)}
              className={cn('gap-1', liveStream && 'border-success/50 text-success')}
            >
              {liveStream ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {liveStream ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLogs} className="gap-1">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deployment" className="gap-1.5">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Deployment</span>
            </TabsTrigger>
            <TabsTrigger value="error" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Errors</span>
            </TabsTrigger>
            <TabsTrigger value="restart" className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restart</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border font-mono text-sm"
          />
        </div>

        {/* Log Viewer */}
        <div
          ref={logContainerRef}
          className="h-80 overflow-y-auto rounded-lg bg-background/80 border border-border p-4 font-mono text-xs space-y-1"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Terminal className="h-6 w-6 text-muted-foreground animate-pulse" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Terminal className="h-8 w-8 mb-2 opacity-50" />
              <p>No logs found</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  'py-0.5 hover:bg-muted/30 rounded px-1',
                  getLogLevelColor(log.log_level)
                )}
              >
                <span className="text-muted-foreground mr-2">{String(index + 1).padStart(3, '0')}</span>
                {log.message}
              </div>
            ))
          )}
          
          {liveStream && (
            <div className="flex items-center gap-2 text-success animate-pulse pt-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Listening for new logs...
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Info</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Success</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Error</span>
          </div>
        </div>

        {/* Notice */}
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Logs are read-only and cannot be edited or deleted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
