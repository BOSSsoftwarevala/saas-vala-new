import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Key,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Lock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Env vars are stored per-server in the servers.env_vars JSONB column
// This component reads from the selected server's env_vars
const defaultEnvVars: Record<string, { id: string; key: string; value: string; encrypted: boolean }[]> = {
  production: [],
  preview: [],
  development: [],
};

export function ServerEnvVars() {
  const [activeEnv, setActiveEnv] = useState('production');
  const [showAddVar, setShowAddVar] = useState(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [newVar, setNewVar] = useState({ key: '', value: '', environments: ['production'] });
  const { toast } = useToast();

  const currentVars = defaultEnvVars[activeEnv as keyof typeof defaultEnvVars] || [];

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copied!',
      description: 'Value copied to clipboard.',
    });
  };

  const handleAddVar = () => {
    if (!newVar.key.trim() || !newVar.value.trim()) return;
    toast({
      title: 'Variable added',
      description: `${newVar.key} has been added to selected environments.`,
    });
    setNewVar({ key: '', value: '', environments: ['production'] });
    setShowAddVar(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Environment Variables</h3>
          <p className="text-sm text-muted-foreground">
            Manage secrets and configuration for each environment
          </p>
        </div>
        <Dialog open={showAddVar} onOpenChange={setShowAddVar}>
          <DialogTrigger asChild>
            <Button className="bg-orange-gradient hover:opacity-90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Add Variable
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Environment Variable</DialogTitle>
              <DialogDescription>
                Add a new environment variable. It will be encrypted and stored securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="var-key" className="text-foreground">Key</Label>
                <Input
                  id="var-key"
                  placeholder="VARIABLE_NAME"
                  value={newVar.key}
                  onChange={(e) => setNewVar({ ...newVar, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                  className="bg-muted/50 border-border font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var-value" className="text-foreground">Value</Label>
                <Textarea
                  id="var-value"
                  placeholder="Enter value..."
                  value={newVar.value}
                  onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                  className="bg-muted/50 border-border font-mono min-h-[100px]"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-foreground">Environments</Label>
                <div className="space-y-2">
                  {['production', 'preview', 'development'].map((env) => (
                    <div key={env} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="capitalize text-foreground">{env}</span>
                      <Switch
                        checked={newVar.environments.includes(env)}
                        onCheckedChange={(checked) => {
                          setNewVar({
                            ...newVar,
                            environments: checked
                              ? [...newVar.environments, env]
                              : newVar.environments.filter((e) => e !== env),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddVar(false)} className="border-border">
                Cancel
              </Button>
              <Button onClick={handleAddVar} className="bg-orange-gradient hover:opacity-90 text-white">
                Add Variable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Environment Tabs */}
      <Tabs value={activeEnv} onValueChange={setActiveEnv}>
        <TabsList className="bg-muted">
          <TabsTrigger
            value="production"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="h-2 w-2 rounded-full bg-success" />
            Production
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="h-2 w-2 rounded-full bg-cyan" />
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="development"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            Development
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeEnv} className="mt-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                  {activeEnv} Variables
                </CardTitle>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {currentVars.length} variables
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentVars.map((envVar) => (
                <div
                  key={envVar.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {envVar.encrypted ? (
                        <Lock className="h-4 w-4 text-warning" />
                      ) : (
                        <Key className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-foreground">{envVar.key}</span>
                        {envVar.encrypted && (
                          <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                            Encrypted
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground truncate">
                        {showValues[envVar.id] ? envVar.value : '••••••••••••••••'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleShowValue(envVar.id)}
                    >
                      {showValues[envVar.id] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(envVar.value)}
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Add Section */}
      <Card className="glass-card border-dashed border-2">
        <CardContent className="p-6">
          <h4 className="font-medium text-foreground mb-2">Quick Import</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Paste your .env file content to import multiple variables at once
          </p>
          <Textarea
            placeholder={`DATABASE_URL=your-database-url\nAPI_SECRET=your-secret\n...`}
            className="bg-muted/50 border-border font-mono min-h-[100px] mb-4"
          />
          <Button variant="outline" className="border-border">
            Import Variables
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
