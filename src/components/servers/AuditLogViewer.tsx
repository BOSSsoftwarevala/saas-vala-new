import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data as unknown as AuditLog[]);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'all' || log.entity_type === moduleFilter;
    return matchesSearch && matchesAction && matchesModule;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueModules = [...new Set(logs.map((l) => l.entity_type))];

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleDownload = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Module', 'Entity ID', 'IP Address'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
          log.performed_by || '',
          log.action,
          log.entity_type,
          log.entity_id,
          log.ip_address || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getResultBadge = (action: string) => {
    const failActions = ['failed', 'error', 'denied', 'blocked'];
    const isFail = failActions.some((f) => action.toLowerCase().includes(f));
    return isFail ? (
      <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
        <XCircle className="h-3 w-3" />
        Fail
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Activity & Audit Logs</CardTitle>
              <p className="text-xs text-muted-foreground">{filteredLogs.length} records</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {uniqueModules.map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">User</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Module</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Result</TableHead>
                <TableHead className="text-muted-foreground text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Clock className="h-6 w-6 text-muted-foreground animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading logs...</p>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="text-sm text-foreground">
                      {log.created_at ? format(new Date(log.created_at), 'MMM dd, HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[120px]">
                      {log.performed_by?.slice(0, 8) || 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/20 text-foreground border-muted/30">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {log.entity_type}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{getResultBadge(log.action)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetail(log)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-md glass-card border-border">
          <SheetHeader>
            <SheetTitle>Log Details</SheetTitle>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm text-foreground">
                    {selectedLog.created_at ? format(new Date(selectedLog.created_at), 'PPpp') : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-sm text-foreground font-medium">{selectedLog.action}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Module</p>
                  <p className="text-sm text-foreground">{selectedLog.entity_type}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Entity ID</p>
                  <p className="text-sm text-foreground font-mono">{selectedLog.entity_id}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Performed By</p>
                  <p className="text-sm text-foreground font-mono">{selectedLog.performed_by || 'System'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="text-sm text-foreground">{selectedLog.ip_address || '-'}</p>
                </div>
                {selectedLog.details && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Details</p>
                    <pre className="text-xs text-foreground font-mono bg-background/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
