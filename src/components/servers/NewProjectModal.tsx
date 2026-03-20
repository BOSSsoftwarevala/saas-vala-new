import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Github,
  ArrowRight,
  Search,
  Clock,
  Check,
  ChevronRight,
  Folder,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CatalogRepo {
  id: string;
  repo_name: string;
  repo_url: string | null;
  language: string | null;
  updated_at: string | null;
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-500',
  'Node.js': 'bg-green-500',
  Python: 'bg-yellow-600',
  Java: 'bg-red-500',
};

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const [repos, setRepos] = useState<CatalogRepo[]>([]);
  const [repoLoading, setRepoLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchRepos = async () => {
      setRepoLoading(true);
      const { data } = await supabase
        .from('source_code_catalog')
        .select('id, repo_name, repo_url, language, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
      setRepos((data as CatalogRepo[]) || []);
      setRepoLoading(false);
    };
    fetchRepos();
  }, [open]);

  const filteredRepos = repos.filter((repo) =>
    repo.repo_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const timeAgo = (ts: string | null) => {
    if (!ts) return '-';
    const diff = Date.now() - new Date(ts).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      toast({
        title: 'Project imported!',
        description: `${projectName || selectedRepo} is now being deployed.`,
      });
      setIsImporting(false);
      onOpenChange(false);
      // Reset state
      setStep('select');
      setSelectedRepo(null);
      setSearchQuery('');
      setProjectName('');
    }, 2000);
  };

  const handleSelectRepo = (repoId: string) => {
    setSelectedRepo(repoId);
    const repo = repos.find((r) => r.id === repoId);
    if (repo) {
      setProjectName(repo.repo_name);
    }
    setStep('configure');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-xl">
            {step === 'select' ? 'Import Project' : 'Configure Project'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Import a Git repository or start from a template'
              : 'Configure your project settings before importing'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <Tabs defaultValue="import" className="mt-4">
            <TabsList className="bg-muted w-full">
              <TabsTrigger value="import" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Import Repository
              </TabsTrigger>
              <TabsTrigger value="template" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Start from Template
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 border-primary text-primary">
                  <Github className="h-4 w-4" />
                  GitHub ({repos.length} repos)
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>

              {/* Repository List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {repoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredRepos.map((repo) => (
                  <Card
                    key={repo.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200',
                      selectedRepo === repo.id
                        ? 'border-primary bg-primary/5'
                        : 'glass-card-hover'
                    )}
                    onClick={() => handleSelectRepo(repo.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Folder className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{repo.repo_name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">{repo.repo_url || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {repo.language && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={cn('h-3 w-3 rounded-full', languageColors[repo.language] || 'bg-gray-500')} />
                            {repo.language}
                          </div>}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeAgo(repo.updated_at)}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="template" className="mt-4">
              <div className="p-8 text-center text-muted-foreground">
                <p>Templates coming soon. Import from GitHub for now.</p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select')}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              ← Back
            </Button>

            {/* Selected repo info */}
            {selectedRepo && (
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <Github className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {repos.find((r) => r.id === selectedRepo)?.repo_name}
                </span>
                <Check className="h-4 w-4 text-success ml-auto" />
              </div>
            )}

            {/* Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-foreground">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-muted/50 border-border"
                  placeholder="my-awesome-project"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Framework Detection</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <span className="text-lg">▲</span>
                  <span className="font-medium text-foreground">Next.js</span>
                  <Badge variant="outline" className="ml-auto bg-success/20 text-success border-success/30">
                    Auto-detected
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Root Directory</Label>
                <Input
                  value="./"
                  className="bg-muted/50 border-border font-mono"
                  disabled
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!projectName || isImporting}
                className="bg-orange-gradient hover:opacity-90 text-white gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Deploy
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
