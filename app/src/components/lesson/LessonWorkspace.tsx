import { useState } from 'react';
import dynamic from 'next/dynamic';
import { EditorSkeleton } from '@/components/editor/EditorSkeleton';
// Lazy load CodeEditor
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor').then(mod => mod.CodeEditor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
import { Button } from '@/components/ui/button';
import { runCode, ExecutionResult } from '@/lib/runner';
import { Play, Loader2, CheckCircle, XCircle, Sparkles, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAssistant } from './AIAssistant';
import { MarkdownRenderer } from './MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonWorkspaceProps {
  initialCode: string;
  testCode: string;
  onSuccess?: () => void;
  lessonTitle?: string;
  lessonContent?: string;
  xpReward?: number;
}

export function LessonWorkspace({ initialCode, testCode, onSuccess, lessonTitle = "", lessonContent = "", xpReward = 0 }: LessonWorkspaceProps) {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const result = await runCode(code, testCode);
      setOutput(result);
      
      const allPassed = result.tests && result.tests.length > 0 && result.tests.every(t => t.passed);
      if (allPassed && onSuccess) {
          onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0A0A0F] relative">
       {/* Toolbar */}
       <div className="flex items-center justify-between border-b border-[#2E2E36] bg-[#0A0A0F] p-4 flex-none z-20 relative">
         <div className="flex items-center gap-4">
             <div className="text-sm font-bold text-gray-200 truncate max-w-[200px]">{lessonTitle}</div>
             {xpReward > 0 && (
                 <div className="text-xs font-bold text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded border border-[#14F195]/20">
                     +{xpReward} XP
                 </div>
             )}
         </div>

         <div className="flex gap-2">
           <Button 
             variant="ghost"
             size="sm"
             onClick={() => setShowInstructions(!showInstructions)}
             className={cn("mr-2", showInstructions ? "text-white bg-[#1E1E24]" : "text-gray-400 hover:text-white")}
           >
             <BookOpen className="mr-2 h-4 w-4" />
             Instructions
           </Button>

           <Button 
             variant={showAI ? "secondary" : "ghost"}
             size="sm"
             onClick={() => setShowAI(!showAI)}
             className={cn("mr-2", showAI ? "bg-[#9945FF]/10 text-[#9945FF]" : "text-gray-400 hover:text-white")}
           >
             <Sparkles className="mr-2 h-4 w-4" />
             AI Helper
           </Button>
           <Button 
             variant="default" 
             size="sm" 
             onClick={handleRun} 
             disabled={isRunning}
             className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-[0_0_15px_rgba(22,163,74,0.4)]"
            >
             {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
             Run Code
           </Button>
         </div>
       </div>

       {/* Editor & Content Container */}
       <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
         
         {/* Instructions Panel (Slide-over) */}
         <AnimatePresence>
            {showInstructions && (
                <motion.div 
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 bg-[#0A0A0F]/95 backdrop-blur-xl border-r border-[#2E2E36] z-10 overflow-y-auto p-6 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Challenge Instructions</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowInstructions(false)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </div>
                    <MarkdownRenderer content={lessonContent} />
                </motion.div>
            )}
         </AnimatePresence>

         {/* Editor */}
         <div className={cn("border-r border-[#2E2E36] transition-all duration-300", showAI ? "w-full md:w-1/3" : "w-full md:w-1/2")}>
            <CodeEditor 
                code={code} 
                onChange={(val) => setCode(val || '')} 
                language="typescript" 
            />
         </div>

         {/* Output Panel */}
         <div className={cn("flex flex-col bg-[#0F0F14] transition-all duration-300", showAI ? "w-full md:w-1/3" : "w-full md:w-1/2")}>
            {/* Console Tabs/Header */}
            <div className="flex-none border-b border-[#2E2E36] px-4 py-2 flex items-center justify-between bg-[#1E1E24]">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Console</div>
                {output && (
                    <div className={cn("text-xs font-bold px-2 py-0.5 rounded", output.error ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                        {output.error ? "Execution Failed" : "Execution Success"}
                    </div>
                )}
            </div>
            
            <div className="flex-grow overflow-auto p-4 font-mono text-sm text-gray-300 custom-scrollbar">
                {output?.logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0 break-all">{log}</div>
                ))}
                {!output && <div className="text-gray-600 italic mt-10 text-center">Hit "Run Code" to execute your solution...</div>}
                
                {output?.error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 font-bold text-xs whitespace-pre-wrap">
                        {output.error}
                    </div>
                )}
            </div>

            {/* Test Results */}
             <div className="flex-none border-t border-[#2E2E36] bg-[#0A0A0F] p-0">
                <div className="px-4 py-2 border-b border-[#2E2E36] text-xs font-semibold uppercase tracking-wider text-gray-500">Test Cases</div>
                <div className="max-h-[150px] overflow-y-auto custom-scrollbar p-2">
                    {output?.tests?.map((test, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className={cn(
                                "flex items-center gap-3 p-3 mb-2 rounded-lg text-sm border", 
                                test.passed 
                                    ? "bg-green-500/5 border-green-500/20 text-green-400" 
                                    : "bg-red-500/5 border-red-500/20 text-red-400"
                            )}
                        >
                            {test.passed ? <CheckCircle className="h-5 w-5 shrink-0 text-green-500" /> : <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                            <span className="font-medium">{test.message}</span>
                        </motion.div>
                    ))}
                    {!output?.tests && <div className="p-4 text-gray-600 text-xs text-center">No tests run yet.</div>}
                </div>
            </div>
         </div>

         {/* AI Panel (Overlay/Slide-in on mobile, Sidebar on desktop) */}
         <AnimatePresence>
            {showAI && (
                <motion.div 
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute right-0 top-0 bottom-0 w-full md:w-1/3 bg-[#0A0A0F] border-l border-[#2E2E36] z-10 shadow-2xl"
                >
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-[#2E2E36]">
                            <div className="flex items-center gap-2 text-[#9945FF] font-bold">
                                <Sparkles className="h-4 w-4" /> AI Assistant
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowAI(false)} className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-grow overflow-hidden">
                             <AIAssistant 
                                code={code} 
                                lessonContext={lessonTitle}
                                lessonContent={lessonContent}
                             />
                        </div>
                    </div>
                </motion.div>
            )}
         </AnimatePresence>
       </div>
    </div>
  );
}
