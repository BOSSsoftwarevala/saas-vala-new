import { NavLink, useLocation } from 'react-router-dom';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Key,
  Server,
  MessageSquare,
  Cpu,
  Wallet,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Store,
  FileText,
  Activity,
  Bot,
  Zap,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import saasValaLogo from '@/assets/saas-vala-logo.jpg';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: 'Marketplace', icon: Store, href: '/' },
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Products', icon: Package, href: '/products' },
  { title: 'Resellers', icon: Users, href: '/resellers', adminOnly: true },
  { title: 'Marketplace Admin', icon: Store, href: '/admin/marketplace', adminOnly: true },
  { title: 'Marketplace View', icon: Store, href: '/', adminOnly: true },
  { title: 'Keys', icon: Key, href: '/keys' },
  { title: 'Servers', icon: Server, href: '/servers' },
  { title: 'SaaS AI', icon: Cpu, href: '/saas-ai-dashboard' },
  { title: 'VALA Builder', icon: Zap, href: '/vala-builder' },
  { title: 'AI Chat', icon: MessageSquare, href: '/ai-chat' },
  { title: 'AI APIs', icon: MessageSquare, href: '/ai-apis', adminOnly: true },
  { title: 'Auto-Pilot', icon: Bot, href: '/automation', adminOnly: true },
  { title: 'APK Pipeline', icon: Smartphone, href: '/apk-pipeline', adminOnly: true },
  { title: 'Wallet', icon: Wallet, href: '/wallet' },
  { title: 'SEO & Leads', icon: TrendingUp, href: '/seo-leads' },
  { title: 'Audit Logs', icon: FileText, href: '/audit-logs', adminOnly: true },
  { title: 'System Health', icon: Activity, href: '/system-health', adminOnly: true },
  { title: 'Settings', icon: Settings, href: '/settings', adminOnly: true },
];
...
            if (collapsed) {
              return (
                <Tooltip key={`${item.href}-${item.title}`} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={`${item.href}-${item.title}`}>{linkContent}</div>;
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border/50 p-2">
          {/* Logout button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={signOut}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  'text-white/70 hover:bg-red-500/15 hover:text-red-400'
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Logout</span>}
              </motion.button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                Logout
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              'mt-2 w-full justify-center text-white/70 hover:bg-white/10 hover:text-white',
              collapsed && 'px-0'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          {/* Powered by */}
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-xs text-white/40"
              >
                Powered by{' '}
                <span className="font-semibold text-gradient-primary">SoftwareVala™</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}