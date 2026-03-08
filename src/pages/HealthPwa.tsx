import { useState, useEffect } from 'react';
import { SectionSlider } from '@/components/marketplace/SectionSlider';
import { SectionHeader } from '@/components/marketplace/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Star, ExternalLink, Download, KeyRound, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const HEALTHCARE_PRODUCTS = [
  {
    id: 'health-pwa-1', name: 'Practo Healthcare Clone',
    repo: 'https://github.com/saasvala/practo-healthcare-clone-software',
    price: 5, old_price: 10, rating: 4.9,
    description: 'Complete healthcare platform for patient management, appointments, and EHR.',
    features: ['Patient Management', 'Appointment Scheduling', 'EHR System', 'Billing & Invoices', 'Lab Reports', 'Doctor Dashboard'],
  },
  {
    id: 'health-pwa-2', name: 'HealthifyMe Clone',
    repo: 'https://github.com/saasvala/healthifyme-clone-software',
    price: 5, old_price: 10, rating: 4.9,
    description: 'Health and fitness platform with diet planning, tracking, and analytics.',
    features: ['Fitness Tracking', 'Diet Planner', 'Health Analytics', 'Workout Plans', 'Mobile App'],
  },
  {
    id: 'health-pwa-3', name: 'MyChart EHR Clone',
    repo: 'https://github.com/saasvala/mychart-ehr-clone-software',
    price: 5, old_price: 10, rating: 4.9,
    description: 'Electronic health record system with patient portal and telemedicine.',
    features: ['Patient Portal', 'Lab Reports', 'Appointment Scheduler', 'Telemedicine', 'Billing Dashboard'],
  },
  {
    id: 'health-pwa-4', name: 'MedPlus Clinic Management Clone',
    repo: 'https://github.com/saasvala/medplus-clinic-clone-software',
    price: 5, old_price: 10, rating: 4.9,
    description: 'Clinic management software for patient records, billing, and appointments.',
    features: ['Clinic Management', 'Patient Records', 'Billing & Invoices', 'Appointment System', 'Doctor Dashboard'],
  },
  {
    id: 'health-pwa-5', name: 'Zocdoc Appointment Clone',
    repo: 'https://github.com/saasvala/zocdoc-appointment-clone-software',
    price: 5, old_price: 10, rating: 4.9,
    description: 'Doctor booking and appointment scheduling platform with patient reviews.',
    features: ['Doctor Booking', 'Appointment Scheduling', 'Patient Reviews', 'Reminders', 'Mobile Dashboard'],
  },
];

const VALID_KEYS = ['HEALTH-PWA-2026-001', 'HEALTH-PWA-2026-002', 'HEALTH-PWA-2026-003', 'HEALTH-APK-2026-001'];

const STORAGE_PREFIX = 'health-pwa';

function getActivated(): boolean { return localStorage.getItem(`${STORAGE_PREFIX}-activated`) === 'true'; }
function setActivated(v: boolean) { localStorage.setItem(`${STORAGE_PREFIX}-activated`, v ? 'true' : 'false'); }
function getWishlist(): string[] { try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}-wishlist`) || '[]'); } catch { return []; } }
function saveWishlist(ids: string[]) { localStorage.setItem(`${STORAGE_PREFIX}-wishlist`, JSON.stringify(ids)); }

export default function HealthPwa() {
  const [activated, setActivatedState] = useState(getActivated);
  const [wishlist, setWishlistState] = useState<string[]>(getWishlist);
  const [showActivation, setShowActivation] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}-products`, JSON.stringify(HEALTHCARE_PRODUCTS)); }, []);

  const toggleWishlist = (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlistState(next); saveWishlist(next);
    toast.success(next.includes(id) ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleBuy = () => {
    if (activated) { toast.success('Already activated! Use Master Copy to download.'); return; }
    setShowActivation(true);
  };

  const handleActivate = () => {
    if (VALID_KEYS.includes(keyInput.trim().toUpperCase())) {
      setActivatedState(true); setActivated(true); setShowActivation(false); setKeyInput('');
      toast.success('🎉 License activated! All 5 Healthcare software demos unlocked.');
    } else { toast.error('Invalid license key.'); }
  };

  const handleMasterDownload = () => {
    if (!activated) { toast.error('Activate license first.'); setShowActivation(true); return; }
    const blob = new Blob([JSON.stringify({
      bundle: 'SaaS VALA Healthcare Master Copy', version: '2026.1', activated: true,
      products: HEALTHCARE_PRODUCTS.map(p => ({ name: p.name, repo: p.repo, features: p.features })),
      generatedAt: new Date().toISOString(),
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'saas-vala-healthcare-master-copy.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Master Copy downloaded!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">SaaS VALA</h1>
          <p className="text-xs text-muted-foreground">Healthcare & Medical — Offline PWA</p>
        </div>
        <div className="flex items-center gap-2">
          {activated ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"><ShieldCheck className="h-3 w-3" /> Licensed</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowActivation(true)} className="gap-1 text-xs"><KeyRound className="h-3 w-3" /> Activate</Button>
          )}
        </div>
      </header>

      <main className="py-6 space-y-6">
        {!activated && (
          <div className="mx-4 md:mx-8 p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Activate to unlock all 5 Healthcare Software Demos</p>
                <p className="text-xs text-muted-foreground">Enter license key: HEALTH-PWA-2026-001</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowActivation(true)} className="gap-1"><KeyRound className="h-3 w-3" /> Enter Key</Button>
          </div>
        )}

        {activated && (
          <div className="mx-4 md:mx-8 p-4 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold text-sm">Master Copy Ready — All 5 Healthcare Software Unlocked</p>
                <p className="text-xs text-muted-foreground">Download the complete offline bundle</p>
              </div>
            </div>
            <Button size="sm" onClick={handleMasterDownload} className="gap-1 bg-green-600 hover:bg-green-700 text-white"><Download className="h-3 w-3" /> Download Master Copy</Button>
          </div>
        )}

        <SectionHeader icon="🏥" title="Healthcare & Medical Services" subtitle="Top 5 Healthcare Software Clones — Offline Ready." badge="ROW 06" badgeVariant="hot" totalCount={5} />
        <SectionSlider>
          {HEALTHCARE_PRODUCTS.map((product, i) => (
            <div key={product.id} className="min-w-[280px] max-w-[320px] flex-shrink-0 group">
              <Card className="relative overflow-hidden border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                <div className="absolute top-2 left-2 z-10"><Badge className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5">#{i + 1}</Badge></div>
                <div className="absolute top-2 right-2 z-10"><Badge className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 animate-pulse">LIVE DEMO</Badge></div>
                <button onClick={() => toggleWishlist(product.id)} className="absolute top-10 right-2 z-10">
                  <Heart className={cn('h-4 w-4 transition-colors', wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400')} />
                </button>
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-3xl">🏥</div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-primary border-primary/30">Healthcare</Badge>
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 uppercase tracking-tight">{product.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 4).map(f => (<Badge key={f} variant="secondary" className="text-[8px] px-1.5 py-0 font-medium">{f}</Badge>))}
                    {product.features.length > 4 && <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-medium">+{product.features.length - 4}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">${product.old_price}</span>
                    <span className="text-lg font-black text-primary">${product.price}</span>
                    <Badge className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0">90% OFF</Badge>
                  </div>
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /><span className="text-xs font-semibold">{product.rating}</span></div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => window.open(product.repo, '_blank')}><ExternalLink className="h-3 w-3" /> DEMO</Button>
                    <Button size="sm" className="flex-1 text-xs gap-1" onClick={handleBuy}>
                      {activated ? <CheckCircle2 className="h-3 w-3" /> : <KeyRound className="h-3 w-3" />}
                      {activated ? 'UNLOCKED' : `BUY $${product.price}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </SectionSlider>
      </main>

      <Dialog open={showActivation} onOpenChange={setShowActivation}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> License Key Activation</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Enter your license key to unlock all 5 Healthcare software demos offline.</p>
            <Input placeholder="HEALTH-PWA-2026-001" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleActivate()} className="font-mono text-center tracking-widest" />
            <Button onClick={handleActivate} className="w-full gap-2"><ShieldCheck className="h-4 w-4" /> Activate License</Button>
            <p className="text-[10px] text-center text-muted-foreground">Keys are validated offline. No internet required.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
