 import { useState, useEffect } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Loader2, Code2, Sparkles } from 'lucide-react';
 
 // Subscribe to global activity state
 let isWorking = false;
 let workingListeners: Set<(working: boolean) => void> = new Set();
 
 export const setGlobalWorking = (working: boolean) => {
   isWorking = working;
   workingListeners.forEach(fn => fn(working));
 };
 
 export const getGlobalWorking = () => isWorking;
 
 export function WorkingDeveloperIndicator() {
   const [working, setWorking] = useState(false);
 
   useEffect(() => {
     const listener = (w: boolean) => setWorking(w);
     workingListeners.add(listener);
     listener(isWorking);
     return () => { workingListeners.delete(listener); };
   }, []);
 
   return (
     <AnimatePresence>
       {working && (
         <motion.div
           initial={{ opacity: 0, scale: 0.8, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.8, y: 20 }}
           className="fixed bottom-6 left-6 z-[100]"
         >
           <div className="relative">
             {/* Glowing backdrop */}
             <motion.div
               className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl"
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
             />
             
             {/* Main card */}
             <div className="relative bg-card/95 backdrop-blur-xl border border-primary/40 rounded-2xl p-4 shadow-2xl shadow-primary/20">
               <div className="flex items-center gap-3">
                 {/* Animated developer icon */}
                 <motion.div
                   className="relative w-12 h-12 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-xl flex items-center justify-center"
                   animate={{ rotate: [0, 5, -5, 0] }}
                   transition={{ duration: 0.5, repeat: Infinity }}
                 >
                   <motion.div
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 0.8, repeat: Infinity }}
                   >
                     <Code2 className="h-6 w-6 text-primary" />
                   </motion.div>
                   
                   {/* Sparkle effects */}
                   <motion.div
                     className="absolute -top-1 -right-1"
                     animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                   >
                     <Sparkles className="h-3 w-3 text-yellow-400" />
                   </motion.div>
                 </motion.div>
                 
                 {/* Text content */}
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <motion.span
                       className="text-sm font-semibold text-primary"
                       animate={{ opacity: [1, 0.7, 1] }}
                       transition={{ duration: 1, repeat: Infinity }}
                     >
                       Developer Working
                     </motion.span>
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                     >
                       <Loader2 className="h-3 w-3 text-primary" />
                     </motion.div>
                   </div>
                   <div className="flex items-center gap-1">
                     {/* Typing animation dots */}
                     {[0, 1, 2].map((i) => (
                       <motion.div
                         key={i}
                         className="w-1.5 h-1.5 bg-primary rounded-full"
                         animate={{ y: [0, -4, 0] }}
                         transition={{ 
                           duration: 0.6, 
                           repeat: Infinity, 
                           delay: i * 0.15 
                         }}
                       />
                     ))}
                     <span className="text-xs text-muted-foreground ml-2">
                       Processing tasks...
                     </span>
                   </div>
                 </div>
               </div>
               
               {/* Progress bar at bottom */}
               <motion.div
                 className="mt-3 h-1 bg-muted rounded-full overflow-hidden"
               >
                 <motion.div
                   className="h-full bg-gradient-to-r from-primary to-orange-500"
                   initial={{ x: '-100%' }}
                   animate={{ x: '100%' }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                 />
               </motion.div>
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }