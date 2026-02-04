import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Product } from '@/hooks/useProducts';

interface CategoryOption {
  id: string;
  name: string;
  parent_id: string | null;
}

interface ProductSlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: () => void;
}

export function ProductSlidePanel({ open, onOpenChange, product, onSave }: ProductSlidePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [masterCategories, setMasterCategories] = useState<CategoryOption[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryOption[]>([]);
  const [microCategories, setMicroCategories] = useState<CategoryOption[]>([]);
  const [nanoCategories, setNanoCategories] = useState<CategoryOption[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    business_type: 'software',
    master_category: '',
    sub_category: '',
    micro_category: '',
    nano_category: '',
    visibility: 'public',
    status: 'draft' as 'draft' | 'active' | 'suspended' | 'archived',
  });

  // Load master categories
  useEffect(() => {
    const loadMasterCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('level', 'master')
        .eq('is_active', true)
        .order('name');
      setMasterCategories((data || []) as CategoryOption[]);
    };
    loadMasterCategories();
  }, []);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        short_description: product.short_description || '',
        business_type: product.business_type || 'software',
        master_category: '',
        sub_category: '',
        micro_category: '',
        nano_category: product.category_id || '',
        visibility: product.visibility || 'public',
        status: product.status,
      });
    } else {
      setFormData({
        name: '',
        short_description: '',
        business_type: 'software',
        master_category: '',
        sub_category: '',
        micro_category: '',
        nano_category: '',
        visibility: 'public',
        status: 'draft',
      });
    }
  }, [product, open]);

  // Load dependent categories
  useEffect(() => {
    if (formData.master_category) {
      const load = async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('level', 'sub')
          .eq('parent_id', formData.master_category)
          .eq('is_active', true);
        setSubCategories((data || []) as CategoryOption[]);
      };
      load();
    } else {
      setSubCategories([]);
      setMicroCategories([]);
      setNanoCategories([]);
    }
  }, [formData.master_category]);

  useEffect(() => {
    if (formData.sub_category) {
      const load = async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('level', 'micro')
          .eq('parent_id', formData.sub_category)
          .eq('is_active', true);
        setMicroCategories((data || []) as CategoryOption[]);
      };
      load();
    } else {
      setMicroCategories([]);
      setNanoCategories([]);
    }
  }, [formData.sub_category]);

  useEffect(() => {
    if (formData.micro_category) {
      const load = async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('level', 'nano')
          .eq('parent_id', formData.micro_category)
          .eq('is_active', true);
        setNanoCategories((data || []) as CategoryOption[]);
      };
      load();
    } else {
      setNanoCategories([]);
    }
  }, [formData.micro_category]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const category_id = formData.nano_category || formData.micro_category || formData.sub_category || formData.master_category || null;

      if (product) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            slug,
            short_description: formData.short_description || null,
            business_type: formData.business_type,
            category_id,
            visibility: formData.visibility,
            status: formData.status,
          })
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            slug,
            short_description: formData.short_description || null,
            business_type: formData.business_type,
            category_id,
            visibility: formData.visibility,
            status: formData.status,
            created_by: userData.user?.id,
          } as any);

        if (error) throw error;
        toast.success('Product created');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {product ? 'Edit Product' : 'Add New Product'}
          </SheetTitle>
          <SheetDescription>
            {product ? 'Update product details below' : 'Fill in the product information'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input
              placeholder="Enterprise CRM"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label>Short Description</Label>
            <Textarea
              placeholder="Brief product description..."
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label>Business Type</Label>
            <Select
              value={formData.business_type}
              onValueChange={(v) => setFormData({ ...formData, business_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="mobile">Mobile App</SelectItem>
                <SelectItem value="web">Web App</SelectItem>
                <SelectItem value="api">API Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Selector (4 Level) */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">Category Hierarchy</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Master</Label>
                <Select
                  value={formData.master_category}
                  onValueChange={(v) => setFormData({ ...formData, master_category: v, sub_category: '', micro_category: '', nano_category: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sub</Label>
                <Select
                  value={formData.sub_category}
                  onValueChange={(v) => setFormData({ ...formData, sub_category: v, micro_category: '', nano_category: '' })}
                  disabled={!formData.master_category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Micro</Label>
                <Select
                  value={formData.micro_category}
                  onValueChange={(v) => setFormData({ ...formData, micro_category: v, nano_category: '' })}
                  disabled={!formData.sub_category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {microCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nano</Label>
                <Select
                  value={formData.nano_category}
                  onValueChange={(v) => setFormData({ ...formData, nano_category: v })}
                  disabled={!formData.micro_category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {nanoCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Icon Upload */}
          <div className="space-y-2">
            <Label>Product Icon</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Icon upload coming soon')}>
                Upload Icon
              </Button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Visibility</Label>
              <p className="text-xs text-muted-foreground">Make product visible to resellers</p>
            </div>
            <Switch
              checked={formData.visibility === 'public'}
              onCheckedChange={(checked) => setFormData({ ...formData, visibility: checked ? 'public' : 'private' })}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
