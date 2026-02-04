import { useEffect, useState, useRef } from 'react';
import {
  Package,
  CheckCircle,
  FileText,
  Ban,
  Link2,
  PlayCircle,
  Download,
  Shield,
  Key,
  Clock,
  Server,
  AlertTriangle,
  Plus,
  Eye,
  Pause,
  Edit,
  Check,
  Trash2,
  RotateCcw,
  Upload,
  Settings,
  Bell,
  RefreshCw,
  FileSearch,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface KPIBox {
  id: string;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  action1: { label: string; icon: React.ComponentType<{ className?: string }>; action: string };
  action2: { label: string; icon: React.ComponentType<{ className?: string }>; action: string };
}

interface ProductKPIBoxesProps {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  suspendedProducts: number;
  totalDemos: number;
  liveDemos: number;
  totalApks: number;
  stableApks: number;
  licensesIssued: number;
  expiringLicenses: number;
  serverDeployments: number;
  productErrors: number;
  onAction: (action: string) => void;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;
    
    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return count;
}

function AnimatedCount({ value }: { value: number }) {
  const count = useAnimatedCounter(value, 800);
  return <>{count}</>;
}

export function ProductKPIBoxes({
  totalProducts,
  activeProducts,
  draftProducts,
  suspendedProducts,
  totalDemos,
  liveDemos,
  totalApks,
  stableApks,
  licensesIssued,
  expiringLicenses,
  serverDeployments,
  productErrors,
  onAction,
}: ProductKPIBoxesProps) {
  const kpiBoxes: KPIBox[] = [
    {
      id: 'total',
      title: 'Total Products',
      count: totalProducts,
      icon: Package,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      action1: { label: 'View List', icon: Eye, action: 'view_all' },
      action2: { label: 'Add Product', icon: Plus, action: 'add_product' },
    },
    {
      id: 'active',
      title: 'Active Products',
      count: activeProducts,
      icon: CheckCircle,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
      action1: { label: 'Suspend', icon: Pause, action: 'bulk_suspend' },
      action2: { label: 'Edit', icon: Edit, action: 'edit_active' },
    },
    {
      id: 'draft',
      title: 'Draft Products',
      count: draftProducts,
      icon: FileText,
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10',
      action1: { label: 'Approve', icon: Check, action: 'approve_drafts' },
      action2: { label: 'Delete', icon: Trash2, action: 'delete_drafts' },
    },
    {
      id: 'suspended',
      title: 'Suspended Products',
      count: suspendedProducts,
      icon: Ban,
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/10',
      action1: { label: 'Activate', icon: CheckCircle, action: 'activate_suspended' },
      action2: { label: 'View Reason', icon: FileSearch, action: 'view_suspend_reason' },
    },
    {
      id: 'demos_total',
      title: 'Total Demos',
      count: totalDemos,
      icon: Link2,
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-500/10',
      action1: { label: 'Add Demo', icon: Plus, action: 'add_demo' },
      action2: { label: 'View All', icon: Eye, action: 'view_demos' },
    },
    {
      id: 'demos_live',
      title: 'Live Demos',
      count: liveDemos,
      icon: PlayCircle,
      colorClass: 'text-cyan-500',
      bgClass: 'bg-cyan-500/10',
      action1: { label: 'Stop', icon: Pause, action: 'stop_demos' },
      action2: { label: 'Open', icon: Eye, action: 'open_demos' },
    },
    {
      id: 'apks_total',
      title: 'Total APKs',
      count: totalApks,
      icon: Download,
      colorClass: 'text-purple-500',
      bgClass: 'bg-purple-500/10',
      action1: { label: 'Upload APK', icon: Upload, action: 'upload_apk' },
      action2: { label: 'Manage Versions', icon: Settings, action: 'manage_versions' },
    },
    {
      id: 'apks_stable',
      title: 'Stable APKs',
      count: stableApks,
      icon: Shield,
      colorClass: 'text-emerald-500',
      bgClass: 'bg-emerald-500/10',
      action1: { label: 'Mark Unstable', icon: AlertTriangle, action: 'mark_unstable' },
      action2: { label: 'Rollback', icon: RotateCcw, action: 'rollback_apk' },
    },
    {
      id: 'licenses',
      title: 'Licenses Issued',
      count: licensesIssued,
      icon: Key,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10',
      action1: { label: 'View', icon: Eye, action: 'view_licenses' },
      action2: { label: 'Block', icon: Ban, action: 'block_license' },
    },
    {
      id: 'licenses_expiring',
      title: 'Expiring Licenses',
      count: expiringLicenses,
      icon: Clock,
      colorClass: expiringLicenses > 0 ? 'text-destructive' : 'text-success',
      bgClass: expiringLicenses > 0 ? 'bg-destructive/10' : 'bg-success/10',
      action1: { label: 'Renew', icon: RefreshCw, action: 'renew_licenses' },
      action2: { label: 'Notify', icon: Bell, action: 'notify_expiring' },
    },
    {
      id: 'servers',
      title: 'Server Deployments',
      count: serverDeployments,
      icon: Server,
      colorClass: 'text-indigo-500',
      bgClass: 'bg-indigo-500/10',
      action1: { label: 'Redeploy', icon: RefreshCw, action: 'redeploy_server' },
      action2: { label: 'Logs', icon: FileText, action: 'view_logs' },
    },
    {
      id: 'errors',
      title: 'Product Errors',
      count: productErrors,
      icon: AlertTriangle,
      colorClass: productErrors > 0 ? 'text-destructive' : 'text-success',
      bgClass: productErrors > 0 ? 'bg-destructive/10' : 'bg-success/10',
      action1: { label: 'Fix via AI', icon: Zap, action: 'fix_with_ai' },
      action2: { label: 'View Report', icon: FileSearch, action: 'view_error_report' },
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {kpiBoxes.map((box) => {
        const Icon = box.icon;
        const Action1Icon = box.action1.icon;
        const Action2Icon = box.action2.icon;

        return (
          <div
            key={box.id}
            className={cn(
              'glass-card rounded-xl p-4 transition-all duration-300',
              'hover:shadow-lg hover:scale-[1.02]',
              box.count > 0 && box.id.includes('error') && 'ring-1 ring-destructive/50'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{box.title}</p>
                <p className={cn('text-2xl font-bold mt-0.5', box.colorClass)}>
                  <AnimatedCount value={box.count} />
                </p>
              </div>
              <div className={cn('p-2 rounded-lg shrink-0', box.bgClass)}>
                <Icon className={cn('h-4 w-4', box.colorClass)} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs px-2 hover:bg-muted"
                onClick={() => onAction(box.action1.action)}
              >
                <Action1Icon className="h-3 w-3 mr-1" />
                {box.action1.label}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs px-2 hover:bg-muted"
                onClick={() => onAction(box.action2.action)}
              >
                <Action2Icon className="h-3 w-3 mr-1" />
                {box.action2.label}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
