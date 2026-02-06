import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Share2, 
  Download,
  ArrowLeft,
  PanelLeft,
  MoreVertical,
  Trash2,
  Copy,
  History,
  Search,
  Keyboard,
  Plus,
  FolderCode
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { ModelSelector } from './ModelSelector';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ChatHeaderProps {
  title: string;
  onExport?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onOpenHistory?: () => void;
  onClearChat?: () => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

// Demo projects - in real app this would come from state/database
const demoProjects: Project[] = [
  { id: '1', name: 'PHP Project', color: 'bg-blue-500' },
  { id: '2', name: 'React App', color: 'bg-green-500' },
  { id: '3', name: 'Node API', color: 'bg-purple-500' },
];

export function ChatHeader({ 
  title, 
  onExport, 
  onToggleSidebar, 
  sidebarOpen, 
  onOpenHistory, 
  onClearChat, 
  onOpenSearch, 
  onOpenShortcuts,
  selectedModel = 'google/gemini-3-flash-preview',
  onModelChange,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const [activeProjectId, setActiveProjectId] = useState<string>('1');
  const [projects, setProjects] = useState<Project[]>(demoProjects);

  const handleAddProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Project ${projects.length + 1}`,
      color: ['bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500'][projects.length % 4],
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2">
        {!sidebarOpen && onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-3">
          <img 
            src="/vala-ai-logo.jpg" 
            alt="VALA AI" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground">
                VALA AI
              </h1>
              {onModelChange && (
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Project Icons */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          {projects.map((project) => (
            <Tooltip key={project.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveProjectId(project.id)}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all",
                    activeProjectId === project.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-bold",
                    project.color
                  )}>
                    <FolderCode className="h-4 w-4" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {project.name}
              </TooltipContent>
            </Tooltip>
          ))}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddProject}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Add Project
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenHistory}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="View History"
        >
          <History className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Chat
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Copy className="h-4 w-4" />
              Copy All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onClearChat}>
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={onOpenShortcuts}>
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted">Ctrl+/</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
