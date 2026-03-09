
"use client";

import { useRemoteState } from '@/hooks/use-remote-state';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    Clock, 
    CheckCircle, 
    ArrowRightCircle, 
    MonitorCheck,
    Loader2,
    WifiOff
} from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

function DisplayPanelContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('s');
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const { state, isLoading, sessionExists } = useRemoteState(sessionId);
  const [localTimer, setLocalTimer] = useState<string>('01:30');

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.timerEndAt && state.status === 'TIMER') {
        const remaining = Math.max(0, state.timerEndAt - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLocalTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state.timerEndAt, state.status]);

  if (!sessionId) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center space-y-4 bg-background p-8 text-center">
        <WifiOff className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">No Session ID</h1>
        <p className="text-muted-foreground">Please scan the QR code or use the link provided by the controller.</p>
      </div>
    );
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionExists) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center space-y-4 bg-background p-8 text-center">
          <WifiOff className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="text-muted-foreground">The session ID "{sessionId}" does not exist or has expired.</p>
        </div>
      );
  }

  const renderContent = () => {
    switch (state.status) {
      case 'IDLE':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                <Clock className="w-48 h-48 text-primary relative z-10" />
            </div>
            <div className="text-center space-y-4 z-10">
              <h2 className="text-8xl font-black tracking-tight text-foreground font-headline">01:30</h2>
              <p className="text-3xl font-medium text-muted-foreground uppercase tracking-[0.2em]">Ready for Question {state.currentQuestionIndex + 1}</p>
            </div>
          </div>
        );

      case 'TIMER':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse-slow" />
                <Clock className="w-48 h-48 text-primary relative z-10 animate-bounce-slow" />
            </div>
            <div className="text-center space-y-4 z-10">
              <h2 className="text-[15rem] font-black tracking-tighter text-foreground font-headline tabular-nums leading-none">
                {localTimer}
              </h2>
              <p className="text-4xl font-bold text-accent animate-pulse uppercase tracking-[0.3em]">Time is Ticking!</p>
            </div>
          </div>
        );

      case 'SELECTED':
        return (
          <div className={`flex flex-col items-center justify-center h-full w-full animate-fade-in option-${state.selectedOption?.toLowerCase()}`}>
            <div className="bg-white/10 backdrop-blur-md p-20 rounded-[4rem] shadow-2xl flex flex-col items-center space-y-12 border border-white/20">
              <h2 className="text-[25rem] font-black leading-none text-white drop-shadow-2xl">
                {state.selectedOption}
              </h2>
              <div className="flex items-center gap-4 bg-white/20 px-8 py-4 rounded-full">
                <CheckCircle className="w-10 h-10 text-white" />
                <span className="text-4xl font-bold text-white uppercase tracking-widest">Option Recorded</span>
              </div>
            </div>
          </div>
        );

      case 'NEXT_PROMPT':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-12 animate-fade-in bg-accent text-white w-full">
            <ArrowRightCircle className="w-64 h-64 animate-bounce" />
            <h2 className="text-9xl font-black uppercase tracking-tighter">Next Question</h2>
            <p className="text-4xl font-medium opacity-80">Preparing question {state.currentQuestionIndex + 2}...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="fixed inset-0 bg-background overflow-hidden select-none">
        <div className="absolute top-8 left-8 flex items-center gap-3 opacity-30">
            <MonitorCheck className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Display Node Active</span>
        </div>
        
        <div className="absolute top-8 right-8 flex items-center gap-4 opacity-50">
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold">Progress</span>
                <span className="text-2xl font-black">{state.currentQuestionIndex + 1}/{125}</span>
            </div>
        </div>

        <div className="h-full w-full">
            {renderContent()}
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-20">
            <p className="text-sm font-bold uppercase tracking-[0.5em]">Session ID: {sessionId}</p>
        </div>
    </main>
  );
}

export default function DisplayPanel() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>}>
      <DisplayPanelContent />
    </Suspense>
  );
}
