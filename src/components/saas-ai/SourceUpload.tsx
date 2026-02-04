import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileArchive, 
  FileCode, 
  CheckCircle2, 
  Loader2,
  X,
  FileText,
  Sparkles,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLargeFileUpload } from '@/hooks/useLargeFileUpload';

interface SourceUploadProps {
  onUploadComplete?: (file: any) => void;
  onAnalysisComplete?: (file: any, analysis: string) => void;
}

export function SourceUpload({ onUploadComplete, onAnalysisComplete }: SourceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const { 
    files, 
    isUploading, 
    uploadAndAnalyze, 
    removeFile, 
    formatSize 
  } = useLargeFileUpload({
    maxSizeMB: 500, // 500MB max
    onUploadComplete,
    onAnalysisComplete,
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => uploadAndAnalyze(file));
  }, [uploadAndAnalyze]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => uploadAndAnalyze(file));
    e.target.value = ''; // Reset input
  }, [uploadAndAnalyze]);

  const getTypeIcon = (name: string) => {
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return FileArchive;
    if (name.endsWith('.php') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py')) return FileCode;
    return FileText;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Source Code Upload</CardTitle>
            <CardDescription className="text-xs">
              ZIP • PHP • JS • TS • Python | Up to 500MB
            </CardDescription>
          </div>
          {isUploading && (
            <Badge variant="outline" className="bg-primary/10 text-primary ml-auto">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Uploading...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'h-14 w-14 rounded-2xl flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Upload className={cn(
                'h-7 w-7 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Drop your source code here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".zip,.php,.js,.jsx,.ts,.tsx,.html,.css"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'absolute' }}
            />
            <label>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                Browse Files
              </Button>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".zip,.php,.js,.jsx,.ts,.tsx,.html,.css"
                multiple
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Uploaded Files</p>
            {files.map((file) => {
              const TypeIcon = getTypeIcon(file.name);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatSize(file.size)}
                      </Badge>
                    </div>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {Math.round(file.progress)}%
                        </p>
                      </div>
                    )}
                    
                    {file.status === 'processing' && (
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin text-secondary" />
                        <p className="text-xs text-secondary">
                          Preparing for analysis...
                        </p>
                      </div>
                    )}

                    {file.status === 'analyzing' && (
                      <div className="flex items-center gap-2 mt-1">
                        <Brain className="h-3 w-3 animate-pulse text-primary" />
                        <p className="text-xs text-primary">
                          AI analyzing code...
                        </p>
                      </div>
                    )}
                    
                    {file.status === 'ready' && (
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        <p className="text-xs text-success">
                          {file.analysis ? 'Analysis complete' : 'Ready for analysis'}
                        </p>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="flex items-center gap-2 mt-1">
                        <X className="h-3 w-3 text-destructive" />
                        <p className="text-xs text-destructive">
                          {file.error || 'Upload failed'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
