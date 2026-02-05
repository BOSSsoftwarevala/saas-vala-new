 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Button } from '@/components/ui/button';
 import { 
  GitCompare, ChevronDown, ChevronUp, Copy, Check,
  Minus, Plus
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 interface DiffLine {
   type: 'add' | 'remove' | 'context';
   content: string;
   lineNumber: {
     old?: number;
     new?: number;
   };
 }
 
 interface CodeDiffViewProps {
   originalCode: string;
   modifiedCode: string;
   filename?: string;
   language?: string;
 }
 
 function computeDiff(original: string, modified: string): DiffLine[] {
   const originalLines = original.split('\n');
   const modifiedLines = modified.split('\n');
   const diff: DiffLine[] = [];
   
   let oldLineNum = 1;
   let newLineNum = 1;
   
   // Simple line-by-line diff (for demo - real app would use proper diff algorithm)
   const maxLen = Math.max(originalLines.length, modifiedLines.length);
   
   for (let i = 0; i < maxLen; i++) {
     const oldLine = originalLines[i];
     const newLine = modifiedLines[i];
     
     if (oldLine === newLine) {
       diff.push({
         type: 'context',
         content: oldLine || '',
         lineNumber: { old: oldLineNum++, new: newLineNum++ },
       });
     } else {
       if (oldLine !== undefined) {
         diff.push({
           type: 'remove',
           content: oldLine,
           lineNumber: { old: oldLineNum++ },
         });
       }
       if (newLine !== undefined) {
         diff.push({
           type: 'add',
           content: newLine,
           lineNumber: { new: newLineNum++ },
         });
       }
     }
   }
   
   return diff;
 }
 
 export function CodeDiffView({ originalCode, modifiedCode, filename, language }: CodeDiffViewProps) {
   const [isExpanded, setIsExpanded] = useState(true);
   const [copied, setCopied] = useState(false);
   
   const diff = computeDiff(originalCode, modifiedCode);
   const additions = diff.filter(d => d.type === 'add').length;
   const deletions = diff.filter(d => d.type === 'remove').length;
 
   const handleCopyNew = async () => {
     await navigator.clipboard.writeText(modifiedCode);
     setCopied(true);
     toast.success('Modified code copied');
     setTimeout(() => setCopied(false), 2000);
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="my-4 rounded-xl overflow-hidden bg-background border border-border group"
     >
       {/* Header */}
       <div 
         className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border cursor-pointer"
         onClick={() => setIsExpanded(!isExpanded)}
       >
         <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
             <GitCompare className="h-4 w-4 text-primary" />
           </div>
           <div>
             <div className="flex items-center gap-2">
               {filename && (
                 <span className="text-sm font-medium text-foreground">{filename}</span>
               )}
               {language && (
                 <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                   {language}
                 </span>
               )}
             </div>
             <div className="flex items-center gap-3 mt-1">
               <span className="flex items-center gap-1 text-xs text-green-500">
                 <Plus className="h-3 w-3" />
                 {additions} additions
               </span>
               <span className="flex items-center gap-1 text-xs text-red-500">
                 <Minus className="h-3 w-3" />
                 {deletions} deletions
               </span>
             </div>
           </div>
         </div>
         
         <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="sm"
             onClick={(e) => {
               e.stopPropagation();
               handleCopyNew();
             }}
             className="h-8 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
           >
             {copied ? (
               <Check className="h-4 w-4 text-success" />
             ) : (
               <Copy className="h-4 w-4" />
             )}
           </Button>
           {isExpanded ? (
             <ChevronUp className="h-4 w-4 text-muted-foreground" />
           ) : (
             <ChevronDown className="h-4 w-4 text-muted-foreground" />
           )}
         </div>
       </div>
 
       {/* Diff Content */}
       <AnimatePresence>
         {isExpanded && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="overflow-hidden"
           >
             <div className="overflow-x-auto">
               <table className="w-full text-sm font-mono">
                 <tbody>
                   {diff.map((line, index) => (
                     <tr 
                       key={index}
                       className={cn(
                         "border-b border-border/30 last:border-0",
                         line.type === 'add' && "bg-green-500/10",
                         line.type === 'remove' && "bg-red-500/10"
                       )}
                     >
                       {/* Old Line Number */}
                       <td className="w-12 text-right px-2 py-1 text-muted-foreground/50 select-none border-r border-border/30">
                         {line.lineNumber.old || ''}
                       </td>
                       {/* New Line Number */}
                       <td className="w-12 text-right px-2 py-1 text-muted-foreground/50 select-none border-r border-border/30">
                         {line.lineNumber.new || ''}
                       </td>
                       {/* Type Indicator */}
                       <td className="w-6 text-center py-1 select-none">
                         {line.type === 'add' && <Plus className="h-3 w-3 text-green-500 mx-auto" />}
                         {line.type === 'remove' && <Minus className="h-3 w-3 text-red-500 mx-auto" />}
                       </td>
                       {/* Content */}
                       <td className="px-3 py-1 whitespace-pre">
                         <span className={cn(
                           line.type === 'add' && "text-green-500",
                           line.type === 'remove' && "text-red-500",
                           line.type === 'context' && "text-foreground/80"
                         )}>
                           {line.content || ' '}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </motion.div>
   );
 }
 
 // Demo component to show diff in chat
 export function DiffExample() {
   const original = `function hello() {
   console.log("Hello");
   return true;
 }`;
 
   const modified = `function hello(name) {
   console.log(\`Hello, \${name}!\`);
   // Added validation
   if (!name) return false;
   return true;
 }`;
 
   return (
     <CodeDiffView
       originalCode={original}
       modifiedCode={modified}
       filename="hello.js"
       language="JavaScript"
     />
   );
 }