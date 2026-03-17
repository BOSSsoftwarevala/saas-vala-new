import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ✅ STEP 1: Ensure DB field mapping is complete & consistent
export interface MarketplaceProduct {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  status: 'upcoming' | 'live' | 'bestseller' | 'draft';
  price: number;
  features?: Array<{ icon?: string; text: string }>;
  techStack?: string[];
  category?: string;
  businessType?: string;
  gitRepoUrl?: string;
  apkUrl?: string;
  demoUrl?: string;
  demoLogin?: string;
  demoPassword?: string;
  demoEnabled?: boolean;
  featured?: boolean;
  trending?: boolean;
  isAvailable?: boolean;
  discount_percent?: number;
  rating?: number;
  tags?: string[];
  apk_enabled?: boolean;
  license_enabled?: boolean;
  slug?: string;
  description?: string;
}

// ✅ STEP 2: Stock images fallback
const stockImages = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
];

// ✅ STEP 3: Default features
const defaultFeatures = [
  { icon: 'CheckCircle2', text: 'Premium Features' },
  { icon: 'CheckCircle2', text: 'Full Support' },
  { icon: 'CheckCircle2', text: '30-Day Updates' },
  { icon: 'CheckCircle2', text: 'Source Code' },
];

// ✅ STEP 4: Default tech stack
const defaultTechStack = ['React', 'Node.js', 'PostgreSQL'];

// ✅ STEP 5: Format product name (safe & clean)
function formatProductName(name: string): string {
  return (name || '').substring(0, 50).toUpperCase();
}

// ✅ STEP 6: Intelligent priority scoring (no jitter)
function getProductPriorityScore(product: MarketplaceProduct): number {
  const repoUrl = (product.gitRepoUrl || '').toLowerCase();
  const demoUrl = (product.demoUrl || '').toLowerCase();

  const hasLiveDemo = Boolean(demoUrl && demoUrl.startsWith('http') && !demoUrl.includes('github.com'));
  const hasRealRepo = repoUrl.includes('github.com/saasvala/') || repoUrl.includes('github.com/softwarevala/');
  const hasAnyRepo = Boolean(repoUrl);
  const isLive = product.status === 'live' || product.status === 'bestseller';
  const isAvailable = product.isAvailable !== false;

  return (
    (hasLiveDemo ? 500 : 0) +
    (hasRealRepo ? 300 : 0) +
    (!hasRealRepo && hasAnyRepo ? 120 : 0) +
    (isLive ? 80 : 0) +
    (isAvailable ? 40 : 0) +
    (product.featured ? 15 : 0) +
    (product.trending ? 10 : 0)
  );
}

// ✅ STEP 7: Stable prioritization (consistent ordering)
function prioritizeProducts(products: MarketplaceProduct[]): MarketplaceProduct[] {
  return products
    .map((product, index) => ({ product, index, score: getProductPriorityScore(product) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product);
}

// ✅ STEP 8: Complete DB → Object mapping
export function mapDbProduct(product: any, index: number): MarketplaceProduct {
  const features = Array.isArray(product.features) && product.features.length > 0
    ? product.features.slice(0, 4).map((f: any) =>
        typeof f === 'string' ? { icon: 'CheckCircle2', text: f } : f
      )
    : defaultFeatures;

  const isAvailable = product.status === 'active' && product.deploy_status !== 'failed';

  return {
    id: product.id,
    title: formatProductName(product.name || product.slug || 'Software Product'),
    subtitle: product.short_description || product.description?.substring(0, 80) || 'Professional Software Solution',
    image: product.thumbnail_url || stockImages[index % stockImages.length],
    status: product.status === 'draft' ? 'draft' : product.trending ? 'bestseller' : 'live',
    price: Number(product.price) || 5,
    features,
    techStack: defaultTechStack,
    category: product.business_type || 'Software',
    businessType: product.business_type || '',
    gitRepoUrl: product.git_repo_url,
    apkUrl: product.apk_url || undefined,
    demoUrl: product.demo_url || undefined,
    demoLogin: product.demo_login || undefined,
    demoPassword: product.demo_password || undefined,
    demoEnabled: Boolean(product.demo_enabled),
    featured: Boolean(product.featured),
    trending: Boolean(product.trending),
    isAvailable,
    discount_percent: Number(product.discount_percent) || 0,
    rating: Number(product.rating) || 4.5,
    tags: product.tags || [],
    apk_enabled: product.apk_enabled !== false,
    license_enabled: product.license_enabled !== false,
    slug: product.slug,
    description: product.description,
  };
}

// ✅ STEP 9: Main hook with controlled realtime sync (NO SPAM)
export function useMarketplaceProducts() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  // ✅ STEP 10: Debounce timeout for realtime changes (prevent flicker)
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // ✅ STEP 11: Track last fetch time (prevent duplicate fetches)
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN_MS = 1000; // Min 1s between fetches

  // ✅ STEP 12: Optimized fetch with error handling
  const fetchProducts = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN_MS) {
      console.log('⏱️ Fetch cooldown active, skipping');
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from('products')
      .select(
        'id, name, slug, description, short_description, price, status, features, thumbnail_url, git_repo_url, marketplace_visible, apk_url, demo_url, demo_login, demo_password, demo_enabled, featured, trending, business_type, deploy_status, discount_percent, rating, tags, apk_enabled, license_enabled'
      )
      .eq('marketplace_visible', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (dbError) {
      console.error('❌ Failed to fetch marketplace products:', dbError);
      setError(dbError.message);
      setProducts([]);
    } else {
      // ✅ STEP 13: Stable mapping & prioritization
      const mapped = (data || []).map((p, i) => mapDbProduct(p, i));
      const prioritized = prioritizeProducts(mapped);
      setProducts(prioritized);
      console.log(`✅ Loaded ${prioritized.length} products`);
    }
    setLoading(false);
  }, []);

  // ✅ STEP 14: Realtime subscription with debounce
  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Subscribe to realtime changes
    subscriptionRef.current = supabase
      .channel('marketplace-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'marketplace_visible=eq.true',
        },
        () => {
          // ✅ STEP 15: Debounce rapid changes (500ms) - prevents spam
          if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
          }
          refetchTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Product change detected, refetching...');
            fetchProducts();
          }, 500);
        }
      )
      .subscribe();

    // ✅ STEP 16: Cleanup subscriptions & timeouts
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [fetchProducts]);

  // ✅ STEP 17: Split into stable category rows (no jitter)
  const dbRow1 = products.slice(0, 30);
  const remaining = products.slice(30);
  const allRows = [dbRow1];
  if (remaining.length > 0) {
    for (let i = 0; i < remaining.length; i += 30) {
      allRows.push(remaining.slice(i, i + 30));
    }
  }

  // ✅ STEP 18: Category-specific filtering (stable)
  const getByCategory = (cats: string[]) =>
    prioritizeProducts(
      products.filter(p => {
        const bt = (p.businessType || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return cats.some(c => bt.includes(c) || cat.includes(c));
      })
    );

  return {
    products,
    allRows: allRows.filter(r => r.length > 0),
    loading,
    error,
    totalCount: products.length,
    getByCategory,
  };
}

// ✅ STEP 19: Lightweight category-specific hook
export function useProductsByCategory(categories: string[]) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchByCategory = async () => {
      setLoading(true);
      setError(null);

      const categoryFilters = categories.map(
        cat => `business_type.ilike.%${cat}%,category.ilike.%${cat}%`
      );

      const { data, error: dbError } = await supabase
        .from('products')
        .select(
          'id, name, slug, description, short_description, price, status, features, thumbnail_url, git_repo_url, marketplace_visible, apk_url, demo_url, demo_login, demo_password, demo_enabled, featured, trending, business_type, deploy_status, discount_percent, rating, tags, apk_enabled, license_enabled'
        )
        .eq('marketplace_visible', true)
        .or(categoryFilters.join(','))
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbError) {
        console.error('❌ Failed to fetch products by category:', dbError);
        setError(dbError.message);
        setProducts([]);
      } else {
        const mapped = (data || []).map((p, i) => mapDbProduct(p, i));
        setProducts(prioritizeProducts(mapped));
      }
      setLoading(false);
    };

    fetchByCategory();
  }, [categories.join(',')]);

  return {
    products,
    loading,
    error,
    totalCount: products.length,
  };
}
