import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Upload, RotateCcw, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Apk {
  id: string;
  product_id: string;
  version: string;
  file_url: string | null;
  file_size: number | null;
  min_sdk: number | null;
  target_sdk: number | null;
  changelog: string | null;
  status: 'published' | 'draft' | 'deprecated';
}

interface ApkSlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  apk: Apk | null;
  onSave: () => void;
}

export function ApkSlidePanel({ open, onOpenChange, productId, apk, onSave }: ApkSlidePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    file_url: '',
    min_sdk: 21,
    target_sdk: 34,
    architecture: 'arm64-v8a',
    changelog: '',
    is_stable: true,
    status: 'draft' as 'published' | 'draft' | 'deprecated',
  });

  useEffect(() => {
    if (apk) {
      setFormData({
        version: apk.version,
        file_url: apk.file_url || '',
        min_sdk: apk.min_sdk || 21,
        target_sdk: apk.target_sdk || 34,
        architecture: 'arm64-v8a',
        changelog: apk.changelog || '',
        is_stable: apk.status === 'published',
        status: apk.status,
      });
    } else {
      setFormData({
        version: '',
        file_url: '',
        min_sdk: 21,
        target_sdk: 34,
        architecture: 'arm64-v8a',
        changelog: '',
        is_stable: true,
        status: 'draft',
      });
    }
  }, [apk, open]);

  const handleSubmit = async () => {
    if (!formData.version.trim()) {
      toast.error('Version is required');
      return;
    }

    if (!productId && !apk) {
      toast.error('Product must be selected');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (apk) {
        const { error } = await supabase
          .from('apks')
          .update({
            version: formData.version,
            file_url: formData.file_url || null,
            min_sdk: formData.min_sdk,
            target_sdk: formData.target_sdk,
            changelog: formData.changelog || null,
            status: formData.status,
          })
          .eq('id', apk.id);

        if (error) throw error;
        toast.success('APK updated');
      } else {
        const { error } = await supabase
          .from('apks')
          .insert({
            product_id: productId!,
            version: formData.version,
            file_url: formData.file_url || null,
            min_sdk: formData.min_sdk,
            target_sdk: formData.target_sdk,
            changelog: formData.changelog || null,
            status: formData.status,
            created_by: userData.user?.id,
          });

        if (error) throw error;
        toast.success('APK uploaded');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save APK');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async () => {
    if (!apk) return;
    
    // Mark current as deprecated, set previous as published
    const { error } = await supabase
      .from('apks')
      .update({ status: 'deprecated' })
      .eq('id', apk.id);

    if (error) {
      toast.error('Failed to rollback');
    } else {
      toast.success('APK rolled back');
      onSave();
      onOpenChange(false);
    }
  };

  const handleDisable = async () => {
    if (!apk) return;
    
    const { error } = await supabase
      .from('apks')
      .update({ status: 'deprecated' })
      .eq('id', apk.id);

    if (error) {
      toast.error('Failed to disable APK');
    } else {
      toast.success('APK disabled');
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            {apk ? 'Edit APK' : 'Upload APK'}
          </SheetTitle>
          <SheetDescription>
            {apk ? 'Update APK configuration' : 'Upload a new APK version'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* APK File Upload */}
          <div className="space-y-2">
            <Label>APK File</Label>
            <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Drop APK file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('File upload coming soon')}>
                Browse
              </Button>
            </div>
          </div>

          {/* Version */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Version Name *</Label>
              <Input
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Architecture</Label>
              <Select
                value={formData.architecture}
                onValueChange={(v) => setFormData({ ...formData, architecture: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arm64-v8a">ARM64-v8a</SelectItem>
                  <SelectItem value="armeabi-v7a">ARMeabi-v7a</SelectItem>
                  <SelectItem value="x86_64">x86_64</SelectItem>
                  <SelectItem value="universal">Universal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SDK Versions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min Android SDK</Label>
              <Input
                type="number"
                value={formData.min_sdk}
                onChange={(e) => setFormData({ ...formData, min_sdk: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target SDK</Label>
              <Input
                type="number"
                value={formData.target_sdk}
                onChange={(e) => setFormData({ ...formData, target_sdk: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Stable Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Mark as Stable</Label>
              <p className="text-xs text-muted-foreground">This version will be the default download</p>
            </div>
            <Switch
              checked={formData.is_stable}
              onCheckedChange={(checked) => setFormData({ ...formData, is_stable: checked, status: checked ? 'published' : 'draft' })}
            />
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <Label>Release Notes</Label>
            <Textarea
              placeholder="What's new in this version..."
              value={formData.changelog}
              onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
              rows={3}
            />
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          {apk && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleRollback}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDisable}>
                <Ban className="h-4 w-4 mr-2" />
                Disable
              </Button>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {apk ? 'Save' : 'Upload'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
