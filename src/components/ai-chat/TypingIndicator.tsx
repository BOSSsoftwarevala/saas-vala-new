 import { motion } from 'framer-motion';
 import { Sparkles } from 'lucide-react';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 
 interface TypingIndicatorProps {
   isVisible: boolean;
 }
 
 export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
   if (!isVisible) return null;
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -10 }}
       className="py-6 px-4 md:px-6 bg-muted/10"
     >
       <div className="max-w-3xl mx-auto flex gap-4">
         {/* Avatar */}
         <Avatar className="h-9 w-9 shrink-0 mt-0.5 ring-2 ring-offset-2 ring-offset-background ring-primary/30">
           <AvatarFallback className="bg-gradient-to-br from-primary/20 to-orange-500/20 text-primary">
             <Sparkles className="h-4 w-4" />
           </AvatarFallback>
         </Avatar>
 
         {/* Content */}
         <div className="flex-1 min-w-0 space-y-2">
           <div className="flex items-center gap-2">
             <span className="text-sm font-semibold text-primary">SaaS VALA AI</span>
             <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
               typing...
             </span>
           </div>
 
           {/* Animated Dots */}
           <div className="flex items-center gap-1.5 h-8">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className="w-2.5 h-2.5 rounded-full bg-primary/60"
                 animate={{
                   y: [0, -8, 0],
                   opacity: [0.4, 1, 0.4],
                   scale: [0.9, 1.1, 0.9],
                 }}
                 transition={{
                   duration: 0.8,
                   repeat: Infinity,
                   delay: i * 0.15,
                   ease: "easeInOut",
                 }}
               />
             ))}
             <motion.span
               className="ml-2 text-sm text-muted-foreground"
               animate={{ opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 1.5, repeat: Infinity }}
             >
               Generating response...
             </motion.span>
           </div>
         </div>
       </div>
     </motion.div>
   );
 }