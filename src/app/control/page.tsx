"use client";

import { useRemoteState } from '@/hooks/use-remote-state';
import { 
  TOTAL_QUESTIONS, 
  TIMER_DURATION_MS, 
  NEXT_PROMPT_DURATION_MS
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Play, 
  SkipForward, 
  ChevronRight, 
  RefreshCcw,
  Clock,
  CheckCircle,
  CircleX,
  Share2,
  Loader2,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone
} from 'lucide-react';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

function ConnectionCard({ displayUrl, copyShareLink }: { displayUrl: string, copyShareLink: () => void }) {
  return (
    <Card className="p-4 sm:p-6 border-2 border-primary/20 bg-primary/5 rounded-[2rem] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-xl">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-primary">Connect Display</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
          onClick={copyShareLink}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="bg-white p-2 rounded-2xl shadow-sm border-2 border-primary/10 shrink-0">
          {displayUrl ? (
            <QRCodeSVG value={displayUrl} size={80} level="H" marginSize={1} className="sm:w-[100px] sm:h-[100px]" />
          ) : (
            <div className="w-[80px] h-[80px] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
            Scan to sync audience screen
          </p>
          <Button variant="default" size="sm" className="w-full h-9 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl" asChild>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" /> Preview
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ControlPanelContent() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get('s');
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl);
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    if (!sessionId) {
      const newId = Math.random().toString(36).substring(2, 9);
      setSessionId(newId);
      const url = new URL(window.location.href);
      url.searchParams.set('s', newId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [sessionId]);

  const { state, updateState, resetState, initializeSession, isLoading, sessionExists } = useRemoteState(sessionId);
  const [localTimer, setLocalTimer] = useState<string>('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.timerEndAt && state.status === 'TIMER') {
        const remaining = Math.max(0, state.timerEndAt - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLocalTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        
        if (remaining <= 0) {
            updateState({ status: 'IDLE', timerEndAt: null });
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state.timerEndAt, state.status, updateState]);

  const handleStartTimer = () => {
    updateState({
      status: 'TIMER',
      timerEndAt: Date.now() + TIMER_DURATION_MS,
      selectedOption: null
    });
  };

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    updateState({
      status: 'SELECTED',
      selectedOption: option,
      timerEndAt: null,
      answeredIndices: Array.from(new Set([...state.answeredIndices, state.currentQuestionIndex]))
    });
  };

  const handleSkip = () => {
    updateState({
      skippedIndices: Array.from(new Set([...state.skippedIndices, state.currentQuestionIndex])),
      status: 'IDLE',
      timerEndAt: null,
      selectedOption: null
    });
    moveToNextAvailable();
  };

  const moveToNextAvailable = () => {
    updateState({ status: 'NEXT_PROMPT', timerEndAt: null });
    
    setTimeout(() => {
        let nextIndex = (state.currentQuestionIndex + 1) % TOTAL_QUESTIONS;
        updateState({
            currentQuestionIndex: nextIndex,
            status: 'TIMER', 
            timerEndAt: Date.now() + TIMER_DURATION_MS,
            selectedOption: null
        });
    }, NEXT_PROMPT_DURATION_MS);
  };

  const displayUrl = useMemo(() => {
    if (typeof window === 'undefined' || !sessionId) return '';
    return `${window.location.origin}/display?s=${sessionId}`;
  }, [sessionId]);

  const copyShareLink = () => {
    if (!displayUrl) return;
    navigator.clipboard.writeText(displayUrl);
    toast({
      title: "Link Copied!",
      description: "Direct display URL copied to clipboard.",
    });
  };

  const progress = ((state.answeredIndices.length + state.skippedIndices.length) / TOTAL_QUESTIONS) * 100;

  if (isLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto page-transition pb-safe overflow-x-hidden">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b">
        <div>
          <h1 className="text-lg font-black text-primary flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Remote
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Q{state.currentQuestionIndex + 1} of {TOTAL_QUESTIONS}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary/5 text-primary" onClick={copyShareLink}>
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-destructive/5 text-destructive" onClick={resetState}>
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 sm:space-y-8">
        <ConnectionCard displayUrl={displayUrl} copyShareLink={copyShareLink} />

        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progress</span>
            <span className="text-sm font-black text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-secondary" />
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <CheckCircle className="w-3 h-3 text-green-500" /> 
                <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">{state.answeredIndices.length} OK</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                <CircleX className="w-3 h-3 text-orange-400" /> 
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">{state.skippedIndices.length} Skip</span>
            </div>
          </div>
        </section>

        <Card className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-4 sm:space-y-5 shadow-xl border-2 rounded-[2.5rem] overflow-hidden relative group transition-all active:scale-[0.98]">
          <div className={cn(
            "absolute inset-0 bg-primary/5 transition-opacity",
            state.status === 'TIMER' ? 'opacity-100' : 'opacity-0'
          )} />
          <div className="bg-primary/10 p-4 sm:p-5 rounded-3xl relative z-10">
              <Clock className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 text-primary transition-all",
                state.status === 'TIMER' ? 'animate-pulse scale-110' : ''
              )} />
          </div>
          <div className="text-5xl sm:text-6xl font-mono font-black tracking-tighter text-foreground relative z-10 tabular-nums">
            {state.status === 'TIMER' ? localTimer : '01:30'}
          </div>
          <Button 
            onClick={handleStartTimer} 
            className="w-full h-14 sm:h-16 text-lg font-black gap-2 rounded-2xl relative z-10 shadow-lg active:scale-95 transition-all"
            disabled={state.status === 'TIMER' || state.status === 'NEXT_PROMPT'}
          >
            {state.status === 'TIMER' ? 'Active...' : <><Play className="fill-current w-5 h-5" /> Start Timer</>}
          </Button>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <Button
              key={opt}
              onClick={() => handleSelectOption(opt)}
              className={cn(
                "h-20 sm:h-24 text-3xl sm:text-4xl font-black rounded-3xl shadow-lg transition-all active:scale-90",
                `option-${opt.toLowerCase()}`,
                state.selectedOption === opt ? "ring-[6px] ring-primary ring-offset-4" : "opacity-95"
              )}
              disabled={state.status === 'NEXT_PROMPT'}
            >
              {opt}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
          <Button 
            variant="outline" 
            onClick={handleSkip} 
            className="h-14 sm:h-16 text-xs sm:text-sm font-black uppercase tracking-widest gap-2 border-2 rounded-2xl active:scale-95 transition-all"
            disabled={state.status === 'NEXT_PROMPT'}
          >
            <SkipForward className="w-4 h-4" /> Skip
          </Button>
          <Button 
            variant="default" 
            onClick={moveToNextAvailable} 
            className="h-14 sm:h-16 text-xs sm:text-sm font-black uppercase tracking-widest bg-accent hover:bg-accent/90 gap-2 shadow-lg rounded-2xl active:scale-95 transition-all"
            disabled={state.status === 'NEXT_PROMPT'}
          >
            Next <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </main>

      <footer className="px-6 py-8 border-t bg-muted/20 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-white border px-4 py-2 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ID: {sessionId}
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center font-bold px-6 leading-relaxed">
          Sync with your audience screen for real-time updates.
        </p>
      </footer>
    </div>
  );
}

export default function ControlPanel() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-background p-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Syncing Services</p>
      </div>
    }>
      <ControlPanelContent />
    </Suspense>
  );
}
