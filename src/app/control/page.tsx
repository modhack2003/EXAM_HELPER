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
  DialogDescription,
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
  QrCode
} from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

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
    if (!isLoading && !sessionExists && sessionId && user) {
      initializeSession();
    }
  }, [isLoading, sessionExists, sessionId, user, initializeSession]);

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

  const displayUrl = typeof window !== 'undefined' ? `${window.location.origin}/display?s=${sessionId}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(displayUrl);
    toast({
      title: "Link Copied!",
      description: "Paste this into the display device browser.",
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
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto page-transition">
      {/* Fixed Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b">
        <div>
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Controller
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Q{state.currentQuestionIndex + 1} of {TOTAL_QUESTIONS}</p>
        </div>
        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Share2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle>Connect Device</DialogTitle>
                <DialogDescription>Scan to join the session</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 py-2">
                <div className="p-4 bg-white rounded-2xl shadow-xl border">
                  {displayUrl && <QRCodeSVG value={displayUrl} size={180} level="H" />}
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border text-[10px] font-mono">
                    <span className="flex-1 truncate opacity-70">{displayUrl}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyShareLink}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full h-11 text-sm gap-2" asChild>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 h-4" /> Open on this device
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={resetState}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Progress Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Session Progress</span>
            <span className="text-sm font-black text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5 bg-secondary" />
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                <CheckCircle className="w-3 h-3 text-green-500" /> 
                <span className="text-[10px] font-bold text-green-700">{state.answeredIndices.length} Answered</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-full border border-orange-100">
                <CircleX className="w-3 h-3 text-orange-400" /> 
                <span className="text-[10px] font-bold text-orange-700">{state.skippedIndices.length} Skipped</span>
            </div>
          </div>
        </section>

        {/* Timer Control */}
        <Card className="p-6 flex flex-col items-center justify-center space-y-4 shadow-sm border-2 overflow-hidden relative group">
          <div className={cn(
            "absolute inset-0 bg-primary/5 transition-opacity",
            state.status === 'TIMER' ? 'opacity-100' : 'opacity-0'
          )} />
          <div className="bg-primary/10 p-4 rounded-full relative z-10">
              <Clock className={cn(
                "w-10 h-10 text-primary transition-all",
                state.status === 'TIMER' ? 'animate-pulse scale-110' : ''
              )} />
          </div>
          <div className="text-5xl font-mono font-black tracking-tight text-foreground relative z-10">
            {state.status === 'TIMER' ? localTimer : '01:30'}
          </div>
          <Button 
            onClick={handleStartTimer} 
            className="w-full h-14 text-lg font-black gap-2 rounded-xl relative z-10 shadow-lg active:scale-[0.98] transition-all"
            disabled={state.status === 'TIMER' || state.status === 'NEXT_PROMPT'}
          >
            {state.status === 'TIMER' ? 'Timer Active' : <><Play className="fill-current w-5 h-5" /> Start Timer</>}
          </Button>
        </Card>

        {/* Option Selection Grid */}
        <div className="grid grid-cols-2 gap-4">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <Button
              key={opt}
              onClick={() => handleSelectOption(opt)}
              className={cn(
                "h-20 text-3xl font-black rounded-2xl shadow-md transition-all active:scale-90",
                `option-${opt.toLowerCase()}`,
                state.selectedOption === opt ? "ring-4 ring-primary ring-offset-2" : "opacity-90 hover:opacity-100"
              )}
              disabled={state.status === 'NEXT_PROMPT'}
            >
              {opt}
            </Button>
          ))}
        </div>

        {/* Secondary Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={handleSkip} 
            className="h-14 text-sm font-bold gap-2 border-2 rounded-xl active:scale-95 transition-all"
            disabled={state.status === 'NEXT_PROMPT'}
          >
            <SkipForward className="w-4 h-4" /> Skip
          </Button>
          <Button 
            variant="default" 
            onClick={moveToNextAvailable} 
            className="h-14 text-sm font-bold bg-accent hover:bg-accent/90 gap-2 shadow-lg rounded-xl active:scale-95 transition-all"
            disabled={state.status === 'NEXT_PROMPT'}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="px-6 py-4 border-t bg-muted/30">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Active Session: {sessionId}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-black tracking-widest text-primary">
                <QrCode className="w-3 h-3 mr-1" /> Re-scan QR
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-sm rounded-2xl">
              <div className="flex flex-col items-center justify-center py-6 space-y-6">
                <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-primary/20">
                  {displayUrl && <QRCodeSVG value={displayUrl} size={240} level="H" />}
                </div>
                <p className="text-xs font-black text-center text-muted-foreground uppercase tracking-[0.3em]">
                  Scan to Connect Display
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </footer>
    </div>
  );
}

import { Smartphone } from 'lucide-react';

export default function ControlPanel() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Controller...</p>
      </div>
    }>
      <ControlPanelContent />
    </Suspense>
  );
}
