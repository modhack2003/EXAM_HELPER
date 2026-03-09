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
import { cn } from '@/lib/utils';
import { TOTAL_QUESTIONS } from '@/lib/types';

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
      <div className="fixed inset-0 flex flex-col items-center justify-center space-y-6 bg-background p-12 text-center page-transition">
        <WifiOff className="w-24 h-24 text-muted-foreground opacity-20" />
        <h1 className="text-4xl font-black uppercase tracking-tight">No Active Session</h1>
        <p className="text-xl text-muted-foreground max-w-md">Please use the connection link or scan the QR code from the control panel.</p>
      </div>
    );
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Syncing Connection...</p>
      </div>
    );
  }

  if (!sessionExists) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center space-y-6 bg-background p-12 text-center page-transition">
          <WifiOff className="w-24 h-24 text-destructive opacity-40 animate-pulse" />
          <h1 className="text-4xl font-black uppercase text-destructive">Session Not Found</h1>
          <p className="text-xl text-muted-foreground">The ID <span className="font-mono bg-muted px-2 py-1 rounded">{sessionId}</span> is inactive or expired.</p>
        </div>
      );
  }

  const renderContent = () => {
    switch (state.status) {
      case 'IDLE':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-12 page-transition">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse-slow" />
                <Clock className="w-56 h-56 text-primary relative z-10 drop-shadow-2xl" />
            </div>
            <div className="text-center space-y-6 z-10">
              <h2 className="text-[10rem] font-black tracking-tighter text-foreground leading-none">01:30</h2>
              <p className="text-4xl font-bold text-muted-foreground uppercase tracking-[0.4em]">Ready for Question {state.currentQuestionIndex + 1}</p>
            </div>
          </div>
        );

      case 'TIMER':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-12 page-transition">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-[120px] rounded-full scale-150 animate-pulse" />
                <Clock className="w-48 h-48 text-primary relative z-10 animate-bounce-slow" />
            </div>
            <div className="text-center space-y-4 z-10">
              <h2 className="text-[18rem] font-black tracking-tighter text-foreground tabular-nums leading-none drop-shadow-xl">
                {localTimer}
              </h2>
              <div className="px-12 py-4 bg-accent/10 rounded-full border border-accent/20 backdrop-blur-sm animate-pulse">
                <p className="text-5xl font-black text-accent uppercase tracking-[0.5em]">Time is Ticking!</p>
              </div>
            </div>
          </div>
        );

      case 'SELECTED':
        return (
          <div className={cn(
            "flex flex-col items-center justify-center h-full w-full page-transition transition-colors duration-1000",
            `option-${state.selectedOption?.toLowerCase()}`
          )}>
            <div className="bg-white/10 backdrop-blur-2xl p-24 rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col items-center space-y-12 border border-white/20 scale-110">
              <h2 className="text-[30rem] font-black leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                {state.selectedOption}
              </h2>
              <div className="flex items-center gap-6 bg-white/20 px-12 py-6 rounded-full border border-white/30 shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
                <span className="text-5xl font-black text-white uppercase tracking-[0.3em]">Selection Final</span>
              </div>
            </div>
          </div>
        );

      case 'NEXT_PROMPT':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-16 page-transition bg-accent text-white w-full">
            <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full scale-150 animate-pulse" />
                <ArrowRightCircle className="w-72 h-72 animate-bounce relative z-10" />
            </div>
            <div className="text-center space-y-4">
                <h2 className="text-[12rem] font-black uppercase tracking-tighter leading-none">Next Round</h2>
                <p className="text-5xl font-bold opacity-80 uppercase tracking-widest">Preparing Question {state.currentQuestionIndex + 2}...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="fixed inset-0 bg-background overflow-hidden select-none touch-none">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        
        {/* System HUD */}
        <div className="absolute top-12 left-12 flex items-center gap-4 opacity-40">
            <div className="p-3 bg-muted rounded-2xl">
                <MonitorCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-[0.3em]">Live Node</span>
                <span className="text-sm font-bold opacity-60">Session {sessionId}</span>
            </div>
        </div>
        
        <div className="absolute top-12 right-12 flex items-center gap-6 opacity-60">
            <div className="flex flex-col items-end">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Completion</span>
                <span className="text-5xl font-black text-primary">{state.currentQuestionIndex + 1}<span className="text-2xl text-muted-foreground opacity-50 font-bold ml-1">/ {TOTAL_QUESTIONS}</span></span>
            </div>
        </div>

        {/* Dynamic Content */}
        <div className="h-full w-full">
            {renderContent()}
        </div>
        
        {/* Visual Footer */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
            <div className="flex items-center gap-3 px-6 py-2 bg-muted/50 rounded-full border backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.8em] translate-x-[0.4em]">RemoteDisplayLink Protocol Active</p>
            </div>
        </div>
    </main>
  );
}

export default function DisplayPanel() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <DisplayPanelContent />
    </Suspense>
  );
}