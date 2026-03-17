import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Package, Search, Plus, Edit2, Trash2, Eye, EyeOff,
  ExternalLink, Download, Star, Image as ImageIcon, Link2, Loader2,
  Layout, Megaphone, RefreshCw, CheckCircle2, XCircle, Tag, Ticket,
  BarChart3, ShoppingCart, Key, Smartphone, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───
interface Product {
  id: string; name: string; slug: string; description: string | null;
  short_description: string | null; price: number; status: string;
  thumbnail_url: string | null; git_repo_url: string | null;
  demo_url: string | null; demo_login: string | null; demo_password: string | null;
  demo_enabled: boolean; apk_url: string | null; featured: boolean;
  trending: boolean; marketplace_visible: boolean; business_type: string | null;
  created_at: string; discount_percent: number; rating: number;
  tags: string[]; apk_enabled: boolean; license_enabled: boolean;
}

interface Banner {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  badge: string | null; badge_color: string | null; offer_text: string | null;
  coupon_code: string | null; link_url: string | null; sort_order: number;
  is_active: boolean; start_date: string | null; end_date: string | null;
}

interface Coupon {
  id: string; code: string; description: string | null;
  discount_type: string; discount_value: number; min_order: number;
  max_uses: number; used_count: number; is_active: boolean;
  start_date: string | null; end_date: string | null;
}

interface Ticker {
  id: string; text: string; sort_order: number; is_active: boolean;
}

const PAGE_SIZE = 25;

export default function MarketplaceAdmin() {
  // ─── Products ───
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  // ─── Banners ───
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  // ─── Tickers ───
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [tickersLoading, setTickersLoading] = useState(true);
  const [editTicker, setEditTicker] = useState<Ticker | null>(null);

  // ─── Coupons ───
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  // ─── Dashboard Stats ───
  const [stats, setStats] = useState({ total: 0, visible: 0, featured: 0, withDemo: 0, withApk: 0, pipeline: 0 });

  // ═══ FETCH ═══
  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products')
      .select('id, name, slug, description, short_description, price, status, thumbnail_url, git_repo_url, demo_url, demo_login, demo_password, demo_enabled, apk_url, featured, trending, marketplace_visible, business_type, created_at, discount_percent, rating, tags, apk_enabled, license_enabled')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (search.trim()) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,business_type.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) toast.error('Failed to load products');
    else setProducts((data || []) as Product[]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: total } = await supabase.from('products').select('id', { count: 'exact', head: true });
    const { count: visible } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('marketplace_visible', true);
    const { count: featured } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('featured', true);
    const { count: withDemo } = await supabase.from('products').select('id', { count: 'exact', head: true }).not('demo_url', 'is', null);
    const { count: withApk } = await supabase.from('products').select('id', { count: 'exact', head: true }).not('apk_url', 'is', null);
    const { count: pipeline } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'draft');
    setStats({ total: total || 0, visible: visible || 0, featured: featured || 0, withDemo: withDemo || 0, withApk: withApk || 0, pipeline: pipeline || 0 });
  };

  const fetchBanners = async () => {
    setBannersLoading(true);
    const { data } = await supabase.from('marketplace_banners').select('*').order('sort_order');
    setBanners((data || []) as Banner[]);
    setBannersLoading(false);
  };

  const fetchTickers = async () => {
    setTickersLoading(true);
    const { data } = await supabase.from('marketplace_tickers').select('*').order('sort_order');
    setTickers((data || []) as Ticker[]);
    setTickersLoading(false);
  };

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    const { data } = await supabase.from('marketplace_coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data || []) as Coupon[]);
    setCouponsLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);
  useEffect(() => { fetchStats(); fetchBanners(); fetchTickers(); fetchCoupons(); }, []);

  // ═══ PRODUCT CRUD ═══
  const handleSaveProduct = async () => {
    if (!editProduct) return;
    setSaving(true);
    const { error } = await supabase.from('products').update({
      name: editProduct.name, short_description: editProduct.short_description,
      price: editProduct.price, status: editProduct.status as any,
      thumbnail_url: editProduct.thumbnail_url, git_repo_url: editProduct.git_repo_url,
      demo_url: editProduct.demo_url, demo_login: editProduct.demo_login,
      demo_password: editProduct.demo_password, demo_enabled: editProduct.demo_enabled,
      apk_url: editProduct.apk_url, featured: editProduct.featured,
      trending: editProduct.trending, marketplace_visible: editProduct.marketplace_visible,
      business_type: editProduct.business_type, discount_percent: editProduct.discount_percent,
      rating: editProduct.rating, tags: editProduct.tags,
      apk_enabled: editProduct.apk_enabled, license_enabled: editProduct.license_enabled,
    }).eq('id', editProduct.id);
    if (error) toast.error('Save failed');
    else { toast.success('Product saved!'); setEditProduct(null); fetchProducts(); fetchStats(); }
    setSaving(false);
  };

  const toggleVisibility = async (p: Product) => {
    await supabase.from('products').update({ marketplace_visible: !p.marketplace_visible }).eq('id', p.id);
    toast.success(p.marketplace_visible ? 'Hidden from marketplace' : 'Visible on marketplace');
    fetchProducts(); fetchStats();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Product deleted'); fetchProducts(); fetchStats();
  };

  // ═══ BULK OPS ═══
  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedIds(s);
  };
  const selectAll = () => {
    setSelectedIds(selectedIds.size === products.length ? new Set() : new Set(products.map(p => p.id)));
  };
  const runBulk = async (action: string) => {
    if (selectedIds.size === 0) { toast.error('Select products first'); return; }
    setBulkRunning(true);
    const ids = Array.from(selectedIds);
    let update: any = {};
    if (action === 'show') update = { marketplace_visible: true };
    else if (action === 'hide') update = { marketplace_visible: false };
    else if (action === 'feature') update = { featured: true };
    else if (action === 'unfeature') update = { featured: false };
    else if (action === 'trending') update = { trending: true };
    else if (action === 'price5') update = { price: 5 };
    else if (action === 'enableApk') update = { apk_enabled: true };
    else if (action === 'disableApk') update = { apk_enabled: false };
    else if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} products?`)) { setBulkRunning(false); return; }
      for (const id of ids) await supabase.from('products').delete().eq('id', id);
      toast.success(`Deleted ${ids.length}`); setSelectedIds(new Set()); fetchProducts(); fetchStats(); setBulkRunning(false); return;
    }
    for (const id of ids) await supabase.from('products').update(update).eq('id', id);
    toast.success(`Updated ${ids.length} products`);
    setSelectedIds(new Set()); fetchProducts(); fetchStats(); setBulkRunning(false);
  };

  // ═══ BANNER CRUD ═══
  const saveBanner = async () => {
    if (!editBanner) return;
    setSaving(true);
    const payload = { title: editBanner.title, subtitle: editBanner.subtitle, image_url: editBanner.image_url, badge: editBanner.badge, badge_color: editBanner.badge_color, offer_text: editBanner.offer_text, coupon_code: editBanner.coupon_code, link_url: editBanner.link_url, sort_order: editBanner.sort_order, is_active: editBanner.is_active, start_date: editBanner.start_date || null, end_date: editBanner.end_date || null };
    if (editBanner.id.startsWith('new-')) {
      const { error } = await supabase.from('marketplace_banners').insert(payload);
      if (error) toast.error('Failed to create banner'); else toast.success('Banner created!');
    } else {
      const { error } = await supabase.from('marketplace_banners').update(payload).eq('id', editBanner.id);
      if (error) toast.error('Failed to update banner'); else toast.success('Banner updated!');
    }
    setEditBanner(null); fetchBanners(); setSaving(false);
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('marketplace_banners').delete().eq('id', id);
    toast.success('Banner deleted'); fetchBanners();
  };

  const toggleBannerActive = async (b: Banner) => {
    await supabase.from('marketplace_banners').update({ is_active: !b.is_active }).eq('id', b.id);
    fetchBanners();
  };

  // ═══ TICKER CRUD ═══
  const saveTicker = async () => {
    if (!editTicker) return;
    setSaving(true);
    if (editTicker.id.startsWith('new-')) {
      const { error } = await supabase.from('marketplace_tickers').insert({ text: editTicker.text, sort_order: editTicker.sort_order, is_active: editTicker.is_active });
      if (error) toast.error('Failed'); else toast.success('Ticker created!');
    } else {
      const { error } = await supabase.from('marketplace_tickers').update({ text: editTicker.text, sort_order: editTicker.sort_order, is_active: editTicker.is_active }).eq('id', editTicker.id);
      if (error) toast.error('Failed'); else toast.success('Ticker updated!');
    }
    setEditTicker(null); fetchTickers(); setSaving(false);
  };

  const deleteTicker = async (id: string) => {
    await supabase.from('marketplace_tickers').delete().eq('id', id);
    toast.success('Deleted'); fetchTickers();
  };

  // ═══ COUPON CRUD ═══
  const saveCoupon = async () => {
    if (!editCoupon) return;
    setSaving(true);
    const payload = { code: editCoupon.code, description: editCoupon.description, discount_type: editCoupon.discount_type, discount_value: editCoupon.discount_value, min_order: editCoupon.min_order, max_uses: editCoupon.max_uses, is_active: editCoupon.is_active, start_date: editCoupon.start_date || null, end_date: editCoupon.end_date || null };
    if (editCoupon.id.startsWith('new-')) {
      const { error } = await supabase.from('marketplace_coupons').insert(payload);
      if (error) toast.error('Failed: ' + error.message); else toast.success('Coupon created!');
    } else {
      const { error } = await supabase.from('marketplace_coupons').update(payload).eq('id', editCoupon.id);
      if (error) toast.error('Failed'); else toast.success('Coupon updated!');
    }
    setEditCoupon(null); fetchCoupons(); setSaving(false);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('marketplace_coupons').delete().eq('id', id);
    toast.success('Deleted'); fetchCoupons();
  };

  // ═══ FIELD HELPER ═══
  const Field = ({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">{icon}{label}</label>
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Marketplace Control Center
            </h1>
            <p className="text-xs text-muted-foreground">Full admin control — products, banners, coupons, APK & more</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { fetchProducts(); fetchStats(); fetchBanners(); fetchTickers(); fetchCoupons(); }} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
            <Button size="sm" onClick={() => window.location.href = '/admin/add-product'} className="gap-1">
              <Plus className="h-3 w-3" /> Add Product
            </Button>
          </div>
        </div>

        {/* ─── DASHBOARD STATS ─── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: stats.total, icon: Package, color: 'text-foreground' },
            { label: 'Live', value: stats.visible, icon: Eye, color: 'text-emerald-500' },
            { label: 'Featured', value: stats.featured, icon: Star, color: 'text-yellow-500' },
            { label: 'With Demo', value: stats.withDemo, icon: ExternalLink, color: 'text-blue-500' },
            { label: 'With APK', value: stats.withApk, icon: Download, color: 'text-purple-500' },
            { label: 'Pipeline', value: stats.pipeline, icon: Loader2, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border p-2 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <s.icon className={cn('h-3 w-3', s.color)} />
              </div>
              <p className={cn('text-lg font-black', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="products" className="text-[10px] gap-1"><Package className="h-3 w-3" /> Products</TabsTrigger>
            <TabsTrigger value="banners" className="text-[10px] gap-1"><Layout className="h-3 w-3" /> Banners</TabsTrigger>
            <TabsTrigger value="tickers" className="text-[10px] gap-1"><Megaphone className="h-3 w-3" /> Tickers</TabsTrigger>
            <TabsTrigger value="coupons" className="text-[10px] gap-1"><Ticket className="h-3 w-3" /> Coupons</TabsTrigger>
            <TabsTrigger value="bulk" className="text-[10px] gap-1"><RefreshCw className="h-3 w-3" /> Bulk</TabsTrigger>
          </TabsList>

          {/* ═══════════ PRODUCTS TAB ═══════════ */}
          <TabsContent value="products" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search by name, slug, category..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9 text-sm" />
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="p-2 text-left w-8"><input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={selectAll} /></th>
                      <th className="p-2 text-left font-semibold text-muted-foreground">Product</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground">Price</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground hidden md:table-cell">Rating</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground hidden sm:table-cell">Status</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground hidden md:table-cell">APK</th>
                      <th className="p-2 text-right font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border"><td colSpan={7} className="p-2"><Skeleton className="h-7 w-full" /></td></tr>
                    )) : products.length === 0 ? (
                      <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">No products found</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/10">
                        <td className="p-2"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-3 w-3 text-muted-foreground" /></div>}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate max-w-[160px]">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.business_type || '—'}</p>
                            </div>
                            {p.featured && <Star className="h-3 w-3 text-yellow-500 shrink-0 fill-yellow-500" />}
                            {p.trending && <Megaphone className="h-3 w-3 text-purple-500 shrink-0" />}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <span className="font-bold text-primary">${p.price}</span>
                          {p.discount_percent > 0 && <Badge className="ml-1 text-[8px] bg-red-500/10 text-red-400">{p.discount_percent}%</Badge>}
                        </td>
                        <td className="p-2 text-center hidden md:table-cell">
                          <span className="text-yellow-400 text-[10px] font-bold">⭐ {p.rating || 4.5}</span>
                        </td>
                        <td className="p-2 text-center hidden sm:table-cell">
                          <Badge className={cn('text-[9px]', p.marketplace_visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                            {p.marketplace_visible ? 'LIVE' : 'HIDDEN'}
                          </Badge>
                        </td>
                        <td className="p-2 text-center hidden md:table-cell">
                          {p.apk_url ? <Badge className="text-[9px] bg-purple-500/10 text-purple-400">APK ✓</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditProduct(p)} title="Edit"><Edit2 className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleVisibility(p)} title={p.marketplace_visible ? 'Hide' : 'Show'}>{p.marketplace_visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteProduct(p.id)} title="Delete"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Page {page + 1}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={products.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════ BANNERS TAB ═══════════ */}
          <TabsContent value="banners" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Layout className="h-4 w-4 text-primary" /> Hero Banner Slides</h2>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setEditBanner({ id: 'new-' + Date.now(), title: '', subtitle: '', image_url: '', badge: '', badge_color: 'from-blue-500 to-indigo-500', offer_text: '', coupon_code: '', link_url: '', sort_order: banners.length + 1, is_active: true, start_date: null, end_date: null })}>
                <Plus className="h-3 w-3" /> Add Banner
              </Button>
            </div>
            {bannersLoading ? <Skeleton className="h-20 w-full" /> : banners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No banners. Add your first hero slide!</p>
            ) : (
              <div className="grid gap-2">
                {banners.map((b, i) => (
                  <div key={b.id} className={cn('rounded-lg border p-3 flex items-center gap-3', b.is_active ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20')}>
                    <span className="text-lg font-black text-muted-foreground w-6 text-center">{i + 1}</span>
                    {b.image_url && <img src={b.image_url} alt="" className="h-12 w-20 rounded object-cover hidden sm:block" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{b.subtitle}</p>
                      {b.offer_text && <Badge className="text-[8px] mt-0.5 bg-red-500/10 text-red-400">{b.offer_text}</Badge>}
                      {b.coupon_code && <Badge className="text-[8px] mt-0.5 ml-1 bg-amber-500/10 text-amber-400">CODE: {b.coupon_code}</Badge>}
                    </div>
                    {b.badge && <Badge className={cn('text-[9px] bg-gradient-to-r text-white', b.badge_color)}>{b.badge}</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleBannerActive(b)}>
                      {b.is_active ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBanner(b)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBanner(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">💡 Banners auto-update on the marketplace homepage instantly after saving.</p>
          </TabsContent>

          {/* ═══════════ TICKERS TAB ═══════════ */}
          <TabsContent value="tickers" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Offer Ticker</h2>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setEditTicker({ id: 'new-' + Date.now(), text: '', sort_order: tickers.length + 1, is_active: true })}>
                <Plus className="h-3 w-3" /> Add Ticker
              </Button>
            </div>
            {tickersLoading ? <Skeleton className="h-10 w-full" /> : (
              <div className="grid gap-1.5">
                {tickers.map(t => (
                  <div key={t.id} className={cn('rounded-lg border p-2.5 flex items-center gap-3', t.is_active ? 'border-border' : 'border-border bg-muted/20 opacity-50')}>
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{t.sort_order}</span>
                    <p className="flex-1 text-sm text-foreground truncate">{t.text}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditTicker(t)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTicker(t.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══════════ COUPONS TAB ═══════════ */}
          <TabsContent value="coupons" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" /> Coupon Manager</h2>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setEditCoupon({ id: 'new-' + Date.now(), code: '', description: '', discount_type: 'percent', discount_value: 10, min_order: 0, max_uses: 100, used_count: 0, is_active: true, start_date: null, end_date: null })}>
                <Plus className="h-3 w-3" /> Add Coupon
              </Button>
            </div>
            {couponsLoading ? <Skeleton className="h-10 w-full" /> : coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No coupons yet.</p>
            ) : (
              <div className="grid gap-2">
                {coupons.map(c => (
                  <div key={c.id} className={cn('rounded-lg border p-3 flex items-center gap-3', c.is_active ? 'border-border' : 'border-border opacity-50')}>
                    <code className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded">{c.code}</code>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{c.description || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`} · Used: {c.used_count}/{c.max_uses}</p>
                    </div>
                    <Badge className={cn('text-[9px]', c.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>{c.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditCoupon(c)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══════════ BULK OPS TAB ═══════════ */}
          <TabsContent value="bulk" className="space-y-3 mt-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" /> Bulk Operations</h2>
            <p className="text-xs text-muted-foreground">Select products in Products tab first. Selected: <strong className="text-primary">{selectedIds.size}</strong></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { action: 'show', label: 'Show All', icon: Eye, color: 'text-emerald-500' },
                { action: 'hide', label: 'Hide All', icon: EyeOff, color: 'text-muted-foreground' },
                { action: 'feature', label: 'Set Featured', icon: Star, color: 'text-yellow-500' },
                { action: 'unfeature', label: 'Unfeature', icon: Star, color: 'text-muted-foreground' },
                { action: 'trending', label: 'Set Trending', icon: Megaphone, color: 'text-purple-500' },
                { action: 'price5', label: 'Price → $5', icon: Tag, color: 'text-primary' },
                { action: 'enableApk', label: 'Enable APK', icon: Smartphone, color: 'text-green-500' },
                { action: 'disableApk', label: 'Disable APK', icon: Smartphone, color: 'text-muted-foreground' },
                { action: 'delete', label: 'Delete Selected', icon: Trash2, color: 'text-destructive' },
              ].map(({ action, label, icon: Icon, color }) => (
                <Button key={action} variant="outline" size="sm" className={cn('h-10 text-xs gap-1.5 justify-start', color)} disabled={bulkRunning || selectedIds.size === 0} onClick={() => runBulk(action)}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Button>
              ))}
            </div>
            {bulkRunning && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Processing...</div>}
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ EDIT PRODUCT DIALOG ═══ */}
      {editProduct && (
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2"><Edit2 className="h-4 w-4 text-primary" /> Edit Product</DialogTitle>
              <DialogDescription className="text-xs">{editProduct.slug}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Name"><Input value={editProduct.name || ''} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} className="h-9 text-sm" /></Field>
              <Field label="Description"><Textarea value={editProduct.short_description || ''} onChange={e => setEditProduct({ ...editProduct, short_description: e.target.value })} className="text-sm min-h-[60px]" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Price ($)"><Input type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} className="h-9 text-sm" /></Field>
                <Field label="Discount %"><Input type="number" value={editProduct.discount_percent} onChange={e => setEditProduct({ ...editProduct, discount_percent: Number(e.target.value) })} className="h-9 text-sm" /></Field>
                <Field label="Rating"><Input type="number" step="0.1" value={editProduct.rating} onChange={e => setEditProduct({ ...editProduct, rating: Number(e.target.value) })} className="h-9 text-sm" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Category"><Input value={editProduct.business_type || ''} onChange={e => setEditProduct({ ...editProduct, business_type: e.target.value })} className="h-9 text-sm" /></Field>
                <Field label="Status">
                  <Select value={editProduct.status} onValueChange={v => setEditProduct({ ...editProduct, status: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Live)</SelectItem>
                      <SelectItem value="draft">Draft (Pipeline)</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Tags (comma separated)"><Input value={(editProduct.tags || []).join(', ')} onChange={e => setEditProduct({ ...editProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="h-9 text-sm" placeholder="pos, retail, billing" /></Field>
              <Field label="Thumbnail URL" icon={<ImageIcon className="h-3 w-3" />}><Input value={editProduct.thumbnail_url || ''} onChange={e => setEditProduct({ ...editProduct, thumbnail_url: e.target.value })} className="h-9 text-sm" placeholder="https://..." /></Field>
              <Field label="Git Repo URL" icon={<Link2 className="h-3 w-3" />}><Input value={editProduct.git_repo_url || ''} onChange={e => setEditProduct({ ...editProduct, git_repo_url: e.target.value })} className="h-9 text-sm" /></Field>
              <Field label="Demo URL" icon={<ExternalLink className="h-3 w-3" />}><Input value={editProduct.demo_url || ''} onChange={e => setEditProduct({ ...editProduct, demo_url: e.target.value })} className="h-9 text-sm" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Demo Login"><Input value={editProduct.demo_login || ''} onChange={e => setEditProduct({ ...editProduct, demo_login: e.target.value })} className="h-9 text-sm" /></Field>
                <Field label="Demo Password"><Input value={editProduct.demo_password || ''} onChange={e => setEditProduct({ ...editProduct, demo_password: e.target.value })} className="h-9 text-sm" /></Field>
              </div>
              <Field label="APK URL" icon={<Download className="h-3 w-3" />}><Input value={editProduct.apk_url || ''} onChange={e => setEditProduct({ ...editProduct, apk_url: e.target.value })} className="h-9 text-sm" /></Field>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'marketplace_visible', label: 'Visible' },
                  { key: 'featured', label: 'Featured' },
                  { key: 'trending', label: 'Trending' },
                  { key: 'demo_enabled', label: 'Demo On' },
                  { key: 'apk_enabled', label: 'APK On' },
                  { key: 'license_enabled', label: 'License On' },
                ].map(t => (
                  <button key={t.key} onClick={() => setEditProduct({ ...editProduct, [t.key]: !(editProduct as any)[t.key] })}
                    className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors', (editProduct as any)[t.key] ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border')}>
                    {(editProduct as any)[t.key] ? '✓' : '○'} {t.label}
                  </button>
                ))}
              </div>
              <Button className="w-full h-10 text-sm" onClick={handleSaveProduct} disabled={saving}>
                {saving ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Saving...</> : 'Save Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ EDIT BANNER DIALOG ═══ */}
      {editBanner && (
        <Dialog open={!!editBanner} onOpenChange={() => setEditBanner(null)}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">{editBanner.id.startsWith('new-') ? 'Add' : 'Edit'} Banner</DialogTitle>
              <DialogDescription className="text-xs">Hero slide content & scheduling</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Title"><Input value={editBanner.title} onChange={e => setEditBanner({ ...editBanner, title: e.target.value })} className="h-9 text-sm" /></Field>
              <Field label="Subtitle"><Input value={editBanner.subtitle || ''} onChange={e => setEditBanner({ ...editBanner, subtitle: e.target.value })} className="h-9 text-sm" /></Field>
              <Field label="Image URL"><Input value={editBanner.image_url || ''} onChange={e => setEditBanner({ ...editBanner, image_url: e.target.value })} className="h-9 text-sm" placeholder="https://..." /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Badge Text"><Input value={editBanner.badge || ''} onChange={e => setEditBanner({ ...editBanner, badge: e.target.value })} className="h-9 text-sm" /></Field>
                <Field label="Badge Color"><Input value={editBanner.badge_color || ''} onChange={e => setEditBanner({ ...editBanner, badge_color: e.target.value })} className="h-9 text-sm" placeholder="from-red-500 to-orange-500" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Offer Text"><Input value={editBanner.offer_text || ''} onChange={e => setEditBanner({ ...editBanner, offer_text: e.target.value })} className="h-9 text-sm" placeholder="20% OFF" /></Field>
                <Field label="Coupon Code"><Input value={editBanner.coupon_code || ''} onChange={e => setEditBanner({ ...editBanner, coupon_code: e.target.value })} className="h-9 text-sm" placeholder="FESTIVAL2026" /></Field>
              </div>
              <Field label="Link URL"><Input value={editBanner.link_url || ''} onChange={e => setEditBanner({ ...editBanner, link_url: e.target.value })} className="h-9 text-sm" placeholder="https://..." /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start Date"><Input type="datetime-local" value={editBanner.start_date?.slice(0, 16) || ''} onChange={e => setEditBanner({ ...editBanner, start_date: e.target.value || null })} className="h-9 text-sm" /></Field>
                <Field label="End Date"><Input type="datetime-local" value={editBanner.end_date?.slice(0, 16) || ''} onChange={e => setEditBanner({ ...editBanner, end_date: e.target.value || null })} className="h-9 text-sm" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Sort Order"><Input type="number" value={editBanner.sort_order} onChange={e => setEditBanner({ ...editBanner, sort_order: Number(e.target.value) })} className="h-9 text-sm" /></Field>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={editBanner.is_active} onCheckedChange={v => setEditBanner({ ...editBanner, is_active: v })} />
                  <span className="text-xs text-muted-foreground">{editBanner.is_active ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
              <Button className="w-full h-10 text-sm" onClick={saveBanner} disabled={saving}>
                {saving ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Saving...</> : 'Save Banner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ EDIT TICKER DIALOG ═══ */}
      {editTicker && (
        <Dialog open={!!editTicker} onOpenChange={() => setEditTicker(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">{editTicker.id.startsWith('new-') ? 'Add' : 'Edit'} Ticker</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Text"><Input value={editTicker.text} onChange={e => setEditTicker({ ...editTicker, text: e.target.value })} className="h-9 text-sm" placeholder="🔥 Sale text here..." /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Order"><Input type="number" value={editTicker.sort_order} onChange={e => setEditTicker({ ...editTicker, sort_order: Number(e.target.value) })} className="h-9 text-sm" /></Field>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={editTicker.is_active} onCheckedChange={v => setEditTicker({ ...editTicker, is_active: v })} />
                  <span className="text-xs">{editTicker.is_active ? 'Active' : 'Off'}</span>
                </div>
              </div>
              <Button className="w-full h-10 text-sm" onClick={saveTicker} disabled={saving}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ EDIT COUPON DIALOG ═══ */}
      {editCoupon && (
        <Dialog open={!!editCoupon} onOpenChange={() => setEditCoupon(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">{editCoupon.id.startsWith('new-') ? 'Add' : 'Edit'} Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Coupon Code"><Input value={editCoupon.code} onChange={e => setEditCoupon({ ...editCoupon, code: e.target.value.toUpperCase() })} className="h-9 text-sm font-mono" placeholder="FESTIVAL2026" /></Field>
              <Field label="Description"><Input value={editCoupon.description || ''} onChange={e => setEditCoupon({ ...editCoupon, description: e.target.value })} className="h-9 text-sm" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Type">
                  <Select value={editCoupon.discount_type} onValueChange={v => setEditCoupon({ ...editCoupon, discount_type: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent %</SelectItem>
                      <SelectItem value="fixed">Fixed $</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Value"><Input type="number" value={editCoupon.discount_value} onChange={e => setEditCoupon({ ...editCoupon, discount_value: Number(e.target.value) })} className="h-9 text-sm" /></Field>
                <Field label="Max Uses"><Input type="number" value={editCoupon.max_uses} onChange={e => setEditCoupon({ ...editCoupon, max_uses: Number(e.target.value) })} className="h-9 text-sm" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start"><Input type="datetime-local" value={editCoupon.start_date?.slice(0, 16) || ''} onChange={e => setEditCoupon({ ...editCoupon, start_date: e.target.value || null })} className="h-9 text-sm" /></Field>
                <Field label="End"><Input type="datetime-local" value={editCoupon.end_date?.slice(0, 16) || ''} onChange={e => setEditCoupon({ ...editCoupon, end_date: e.target.value || null })} className="h-9 text-sm" /></Field>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editCoupon.is_active} onCheckedChange={v => setEditCoupon({ ...editCoupon, is_active: v })} />
                <span className="text-xs">{editCoupon.is_active ? 'Active' : 'Disabled'}</span>
              </div>
              <Button className="w-full h-10 text-sm" onClick={saveCoupon} disabled={saving}>Save Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
