import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Users,
  Clock,
  Zap,
  Eye,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function ServerAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ deployments: 0, products: 0, servers: 0, aiRequests: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: deploys },
        { count: products },
        { count: servers },
        { count: aiReqs },
      ] = await Promise.all([
        supabase.from('deployments').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('servers').select('*', { count: 'exact', head: true }),
        supabase.from('ai_requests').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        deployments: deploys || 0,
        products: products || 0,
        servers: servers || 0,
        aiRequests: aiReqs || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Deployments', value: stats.deployments.toLocaleString(), icon: Zap },
    { title: 'Products', value: stats.products.toLocaleString(), icon: Eye },
    { title: 'Servers', value: stats.servers.toLocaleString(), icon: Users },
    { title: 'AI Requests', value: stats.aiRequests.toLocaleString(), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Monitor performance and visitor insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="glass-card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="vitals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Audience
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Traffic Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Analytics data from database</p>
                  <p className="text-xs text-muted-foreground">{stats.deployments} deployments · {stats.products} products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Core Web Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Web Vitals monitoring — connect Google Search Console for live data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Connect analytics service to view audience data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
