import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  path: string;
  status: 'uploading' | 'processing' | 'analyzing' | 'ready' | 'error';
  progress: number;
  analysis?: string;
  error?: string;
}

interface UseLargeFileUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  onUploadComplete?: (file: UploadedFile) => void;
  onAnalysisComplete?: (file: UploadedFile, analysis: string) => void;
}

export function useLargeFileUpload({
  bucket = 'source-code',
  maxSizeMB = 500,
  onUploadComplete,
  onAnalysisComplete,
}: UseLargeFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      return null;
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login to upload files');
      return null;
    }

    const fileId = crypto.randomUUID();
    const filePath = `${user.id}/${fileId}-${file.name}`;
    
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      path: filePath,
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [...prev, uploadedFile]);
    setIsUploading(true);

    try {
      // Simulate progress for UX (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileId && f.status === 'uploading' && f.progress < 90) {
            return { ...f, progress: f.progress + Math.random() * 15 };
          }
          return f;
        }));
      }, 500);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        updateFile(fileId, { status: 'error', error: uploadError.message });
        toast.error(`Upload failed: ${uploadError.message}`);
        return null;
      }

      updateFile(fileId, { status: 'processing', progress: 100 });
      toast.success(`${file.name} uploaded successfully`);

      const completedFile = { ...uploadedFile, status: 'ready' as const, progress: 100 };
      onUploadComplete?.(completedFile);

      return completedFile;

    } catch (error: any) {
      console.error('Upload error:', error);
      updateFile(fileId, { status: 'error', error: error.message });
      toast.error(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [bucket, maxSizeMB, onUploadComplete, updateFile]);

  const analyzeFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    updateFile(fileId, { status: 'analyzing' });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { filePath: file.path }
      });

      if (error) {
        console.error('Analysis error:', error);
        updateFile(fileId, { status: 'error', error: error.message });
        toast.error('Analysis failed');
        return;
      }

      const analysis = data?.analysis || 'No analysis available';
      updateFile(fileId, { status: 'ready', analysis });
      
      const updatedFile = { ...file, status: 'ready' as const, analysis };
      onAnalysisComplete?.(updatedFile, analysis);
      
      toast.success('AI analysis complete!');

    } catch (error: any) {
      console.error('Analysis error:', error);
      updateFile(fileId, { status: 'error', error: error.message });
      toast.error('Analysis failed');
    }
  }, [files, updateFile, onAnalysisComplete]);

  const uploadAndAnalyze = useCallback(async (file: File) => {
    const uploaded = await uploadFile(file);
    if (uploaded) {
      await analyzeFile(uploaded.id);
    }
  }, [uploadFile, analyzeFile]);

  const removeFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      // Delete from storage
      await supabase.storage.from(bucket).remove([file.path]);
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files, bucket]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return {
    files,
    isUploading,
    uploadFile,
    uploadAndAnalyze,
    analyzeFile,
    removeFile,
    formatSize,
  };
}
