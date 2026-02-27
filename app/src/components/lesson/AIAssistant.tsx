'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIAssistantProps {
  code: string;
  lessonContext: string;
  lessonContent: string;
}

export function AIAssistant({ code, lessonContext, lessonContent }: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hint');
  const [output, setOutput] = useState<{ type: string; content: string } | null>(null);

  const handleAction = async (type: 'hint' | 'review' | 'notes') => {
    setLoading(true);
    // Clear previous output if switching actions, allows re-running
    if (output?.type !== type) setOutput(null);
    
    try {
      let endpoint = '';
      let body = {};

      switch (type) {
        case 'hint':
          endpoint = '/api/ai/hint';
          body = { code, lessonContext };
          break;
        case 'review':
          endpoint = '/api/ai/review';
          body = { code, lessonContext };
          break;
        case 'notes':
          endpoint = '/api/ai/notes';
          body = { lessonContent };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      let content = '';
      if (type === 'hint') content = data.hint;
      if (type === 'review') content = data.message;
      if (type === 'notes') content = data.notes;

      setOutput({ type, content });
    } catch (err) {
      console.error(err);
      setOutput({ type: 'error', content: 'Failed to get a response from the AI. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-l border-[#2E2E36]">
      <div className="p-4 border-b border-[#2E2E36]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#9945FF]" />
            AI Assistant
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setActiveTab('hint'); handleAction('hint'); }}
                className={cn("text-xs border-[#2E2E36]", activeTab === 'hint' && "bg-[#9945FF]/10 text-[#9945FF] border-[#9945FF]")}
            >
                <Lightbulb className="mr-2 h-3 w-3" /> Hint
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setActiveTab('review'); handleAction('review'); }}
                className={cn("text-xs border-[#2E2E36]", activeTab === 'review' && "bg-[#9945FF]/10 text-[#9945FF] border-[#9945FF]")}
            >
                <CheckCircle className="mr-2 h-3 w-3" /> Review
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setActiveTab('notes'); handleAction('notes'); }}
                className={cn("text-xs border-[#2E2E36]", activeTab === 'notes' && "bg-[#9945FF]/10 text-[#9945FF] border-[#9945FF]")}
            >
                <FileText className="mr-2 h-3 w-3" /> Notes
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow px-4 pb-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-xs">Thinking...</span>
            </div>
        ) : output ? (
            <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{output.content}</ReactMarkdown>
            </div>
        ) : (
            <div className="text-center py-10 text-gray-600 text-sm">
                Select an option above to get help from the AI.
            </div>
        )}
      </ScrollArea>
    </div>
  );
}
