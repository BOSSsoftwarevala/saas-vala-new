import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link2, RotateCcw, Ban, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Demo {
  id: string;
  name: string;
  product_id: string;
  url: string | null;
  credentials: { login_id?: string; login_password?: string } | null;
  status: 'active' | 'expired' | 'disabled';
}

interface DemoSlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  demo: Demo | null;
  onSave: () => void;
}

export function DemoSlidePanel({ open, onOpenChange, productId, demo, onSave }: DemoSlidePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    demo_type: 'web' as 'web' | 'apk' | 'video' | 'image',
    url: '',
    login_id: '',
    login_password: '',
    status: 'active' as 'active' | 'expired' | 'disabled',
  });

  useEffect(() => {
    if (demo) {
      setFormData({
        name: demo.name,
        demo_type: 'web',
        url: demo.url || '',
        login_id: (demo.credentials as any)?.login_id || '',
        login_password: (demo.credentials as any)?.login_password || '',
        status: demo.status,
      });
    } else {
      setFormData({
        name: '',
        demo_type: 'web',
        url: '',
        login_id: '',
        login_password: '',
        status: 'active',
      });
    }
  }, [demo, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Demo name is required');
      return;
    }

    if (!productId && !demo) {
      toast.error('Product must be selected');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const credentials = {
        login_id: formData.login_id,
        login_password: formData.login_password,
      };

      if (demo) {
        const { error } = await supabase
          .from('demos')
          .update({
            name: formData.name,
            url: formData.url || null,
            credentials,
            status: formData.status,
          })
          .eq('id', demo.id);

        if (error) throw error;
        toast.success('Demo updated');
      } else {
        const { error } = await supabase
          .from('demos')
          .insert({
            name: formData.name,
            product_id: productId!,
            url: formData.url || null,
            credentials,
            status: formData.status,
            created_by: userData.user?.id,
          });

        if (error) throw error;
        toast.success('Demo created');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save demo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCredentials = () => {
    setFormData({
      ...formData,
      login_id: `demo_${Date.now()}`,
      login_password: Math.random().toString(36).slice(-8),
    });
    toast.success('New credentials generated');
  };

  const handleDisable = async () => {
    if (!demo) return;
    
    const { error } = await supabase
      .from('demos')
      .update({ status: 'disabled' })
      .eq('id', demo.id);

    if (error) {
      toast.error('Failed to disable demo');
    } else {
      toast.success('Demo disabled');
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" />
            {demo ? 'Edit Demo' : 'Add Demo'}
          </SheetTitle>
          <SheetDescription>
            {demo ? 'Update demo configuration' : 'Create a new demo for this product'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Demo Name */}
          <div className="space-y-2">
            <Label>Demo Name *</Label>
            <Input
              placeholder="Main Web Demo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Demo Type */}
          <div className="space-y-2">
            <Label>Demo Type</Label>
            <Select
              value={formData.demo_type}
              onValueChange={(v) => setFormData({ ...formData, demo_type: v as typeof formData.demo_type })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Web Demo</SelectItem>
                <SelectItem value="apk">APK Demo</SelectItem>
                <SelectItem value="video">Video Demo</SelectItem>
                <SelectItem value="image">Image Demo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Demo URL */}
          <div className="space-y-2">
            <Label>Demo URL</Label>
            <Input
              placeholder="https://demo.example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          {/* Credentials */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Login Credentials</Label>
              <Button variant="ghost" size="sm" onClick={handleResetCredentials}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Login ID</Label>
              <Input
                placeholder="demo_user"
                value={formData.login_id}
                onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input
                placeholder="••••••••"
                value={formData.login_password}
                onChange={(e) => setFormData({ ...formData, login_password: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          {demo && (
            <Button variant="destructive" className="w-full" onClick={handleDisable}>
              <Ban className="h-4 w-4 mr-2" />
              Disable Demo
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {demo ? 'Save' : 'Add Demo'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
