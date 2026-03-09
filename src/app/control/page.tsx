
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

function ControlPanelContent() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get('s');
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl);
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  // Ensure user is signed in anonymously to interact with Firestore
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Generate a random session ID if none exists
  useEffect(() => {
    if (!sessionId) {
      const newId = Math.random().toString(36).substring(2, 9);
      setSessionId(newId);
      // Update URL without refresh to allow sharing
      const url = new URL(window.location.href);
      url.searchParams.set('s', newId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [sessionId]);

  const { state, updateState, resetState, initializeSession, isLoading, sessionExists } = useRemoteState(sessionId);
  const [localTimer, setLocalTimer] = useState<string>('00:00');

  // Initialize session in Firestore if it doesn't exist yet
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
      description: "Paste this link into the display device's browser.",
    });
  };

  const progress = ((state.answeredIndices.length + state.skippedIndices.length) / TOTAL_QUESTIONS) * 100;

  if (isLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col max-w-lg mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary font-headline">Controller</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Question {state.currentQuestionIndex + 1} / {TOTAL_QUESTIONS}</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Connect Display Device">
                <Share2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Display Panel</DialogTitle>
                <DialogDescription>
                  Scan the QR code or share the link with the display device.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="p-4 bg-white rounded-xl shadow-inner border">
                  {displayUrl && (
                    <QRCodeSVG 
                      value={displayUrl} 
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md border text-xs font-mono break-all">
                    <span className="flex-1 opacity-70 truncate">{displayUrl}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyShareLink}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open Display Here
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={resetState} title="Reset All">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between pt-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-green-500" /> {state.answeredIndices.length} Answered
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CircleX className="w-3 h-3 text-orange-400" /> {state.skippedIndices.length} Skipped
            </div>
        </div>
      </div>

      <Card className="p-6 flex flex-col items-center justify-center space-y-4 shadow-md bg-white">
        <div className="bg-primary/5 p-4 rounded-full">
            <Clock className={`w-12 h-12 text-primary ${state.status === 'TIMER' ? 'animate-pulse' : ''}`} />
        </div>
        <div className="text-5xl font-mono font-bold tracking-tight text-foreground">
          {state.status === 'TIMER' ? localTimer : '01:30'}
        </div>
        <Button 
          onClick={handleStartTimer} 
          className="w-full h-14 text-lg font-bold gap-2"
          disabled={state.status === 'TIMER' || state.status === 'NEXT_PROMPT'}
        >
          <Play className="fill-current" /> Start Timer
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
          <Button
            key={opt}
            onClick={() => handleSelectOption(opt)}
            className={`h-24 text-3xl font-black rounded-xl shadow-lg transition-transform active:scale-95 option-${opt.toLowerCase()}`}
            disabled={state.status === 'NEXT_PROMPT'}
          >
            {opt}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={handleSkip} 
          className="h-16 text-lg font-semibold gap-2 border-2"
          disabled={state.status === 'NEXT_PROMPT'}
        >
          <SkipForward className="w-5 h-5" /> Skip
        </Button>
        <Button 
          variant="default" 
          onClick={moveToNextAvailable} 
          className="h-16 text-lg font-semibold bg-accent hover:bg-accent/90 gap-2 shadow-md"
          disabled={state.status === 'NEXT_PROMPT'}
        >
          Next Question <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1" />
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full gap-2 border">
            <QrCode className="w-4 h-4" /> Show Connection QR
          </Button>
        </DialogTrigger>
        <DialogContent>
           <DialogHeader>
                <DialogTitle>Display Connection</DialogTitle>
                <DialogDescription>
                  Scan this QR code with the display device (TV/Monitor/Laptop).
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="p-6 bg-white rounded-2xl shadow-xl border-4 border-primary/20">
                   {displayUrl && (
                    <QRCodeSVG 
                      value={displayUrl} 
                      size={250}
                      level="H"
                    />
                  )}
                </div>
                <p className="mt-6 text-sm font-bold text-center text-muted-foreground uppercase tracking-widest">
                  Session ID: {sessionId}
                </p>
              </div>
        </DialogContent>
      </Dialog>
      
      <p className="text-center text-[10px] text-muted-foreground italic mt-2">
        Sync Active (Firestore): Status {state.status} | Session: {sessionId}
      </p>
    </div>
  );
}

export default function ControlPanel() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <ControlPanelContent />
    </Suspense>
  );
}
