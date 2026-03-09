"use client";

import { useRemoteState } from '@/hooks/use-remote-state';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Clock, 
    CheckCircle, 
    ArrowRightCircle, 
    MonitorCheck,
    Loader2,
    WifiOff,
    Monitor,
    ChevronRight
} from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { cn } from '@/lib/utils';
import { TOTAL_QUESTIONS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function DisplayPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('s');
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const [manualId, setManualId] = useState('');

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

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      router.push(`/display?s=${manualId.trim()}`);
    }
  };

  if (!sessionId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center space-y-8 bg-background p-6 text-center page-transition overflow-y-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse-slow" />
          <Monitor className="w-16 h-16 sm:w-24 sm:h-24 text-primary relative z-10" />
        </div>
        
        <div className="space-y-2 z-10">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">Display Panel</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto font-medium px-4">
            Waiting for a session. Enter the session ID manually below to connect.
          </p>
        </div>

        <Card className="w-full max-w-xs sm:max-w-sm p-6 border-2 shadow-2xl rounded-[2rem] z-10">
          <form onSubmit={handleManualConnect} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-left ml-1">
                Manual Session ID
              </label>
              <Input 
                placeholder="e.g. abc1234" 
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="h-12 sm:h-14 text-lg font-black tracking-widest rounded-xl text-center uppercase border-2 focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm gap-2">
              Connect Display <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>

        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
          RemoteDisplayLink Protocol
        </p>
      </div>
    );
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-primary" />
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Syncing Connection...</p>
      </div>
    );
  }

  if (!sessionExists) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center space-y-6 bg-background p-12 text-center page-transition">
          <WifiOff className="w-16 h-16 sm:w-24 sm:h-24 text-destructive opacity-40 animate-pulse" />
          <h1 className="text-2xl sm:text-4xl font-black uppercase text-destructive">Session Not Found</h1>
          <p className="text-base sm:text-xl text-muted-foreground">The ID <span className="font-mono bg-muted px-2 py-1 rounded">{sessionId}</span> is inactive.</p>
          <Button variant="outline" onClick={() => router.push('/display')} className="mt-4 rounded-xl border-2 font-black uppercase tracking-widest">
            Try Another ID
          </Button>
        </div>
      );
  }

  const renderContent = () => {
    switch (state.status) {
      case 'IDLE':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 sm:space-y-12 px-6 page-transition text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-150 animate-pulse-slow" />
                <Clock className="w-32 h-32 sm:w-56 sm:h-56 text-primary relative z-10 drop-shadow-2xl" />
            </div>
            <div className="space-y-4 sm:space-y-6 z-10">
              <h2 className="text-7xl sm:text-9xl md:text-[10rem] font-black tracking-tighter text-foreground leading-none">01:30</h2>
              <p className="text-xl sm:text-4xl font-bold text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.4em]">Ready: Q{state.currentQuestionIndex + 1}</p>
            </div>
          </div>
        );

      case 'TIMER':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 sm:space-y-12 px-4 page-transition">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-[100px] rounded-full scale-150 animate-pulse" />
                <Clock className="w-24 h-24 sm:w-48 sm:h-48 text-primary relative z-10 animate-bounce-slow" />
            </div>
            <div className="text-center space-y-4 z-10">
              <h2 className="text-8xl sm:text-[12rem] md:text-[18rem] font-black tracking-tighter text-foreground tabular-nums leading-none drop-shadow-xl">
                {localTimer}
              </h2>
              <div className="px-6 sm:px-12 py-3 sm:py-4 bg-accent/10 rounded-full border border-accent/20 backdrop-blur-sm animate-pulse">
                <p className="text-lg sm:text-5xl font-black text-accent uppercase tracking-[0.3em] sm:tracking-[0.5em]">Time is Ticking!</p>
              </div>
            </div>
          </div>
        );

      case 'SELECTED':
        return (
          <div className={cn(
            "flex flex-col items-center justify-center h-full w-full page-transition transition-colors duration-1000 p-6",
            `option-${state.selectedOption?.toLowerCase()}`
          )}>
            <div className="bg-white/10 backdrop-blur-2xl p-12 sm:p-24 rounded-[3rem] sm:rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col items-center space-y-8 sm:space-y-12 border border-white/20 scale-100 sm:scale-110">
              <h2 className="text-[12rem] sm:text-[20rem] md:text-[30rem] font-black leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                {state.selectedOption}
              </h2>
              <div className="flex items-center gap-3 sm:gap-6 bg-white/20 px-6 sm:px-12 py-3 sm:py-6 rounded-full border border-white/30 shadow-lg">
                <CheckCircle className="w-6 h-6 sm:w-12 sm:h-12 text-white" />
                <span className="text-lg sm:text-5xl font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">Selection Final</span>
              </div>
            </div>
          </div>
        );

      case 'NEXT_PROMPT':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 sm:space-y-16 px-6 page-transition bg-accent text-white w-full text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                <ArrowRightCircle className="w-32 h-32 sm:w-72 sm:h-72 animate-bounce relative z-10" />
            </div>
            <div className="space-y-4">
                <h2 className="text-6xl sm:text-[8rem] md:text-[12rem] font-black uppercase tracking-tighter leading-none">Next Round</h2>
                <p className="text-lg sm:text-5xl font-bold opacity-80 uppercase tracking-widest">Preparing Q{state.currentQuestionIndex + 2}...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="fixed inset-0 bg-background overflow-hidden select-none touch-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        
        <div className="absolute top-6 sm:top-12 left-6 sm:left-12 flex items-center gap-3 sm:gap-4 opacity-40">
            <div className="p-2 sm:p-3 bg-muted rounded-xl sm:rounded-2xl">
                <MonitorCheck className="w-4 h-4 sm:w-8 sm:h-8" />
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] sm:text-xs font-black uppercase tracking-[0.3em]">Live Node</span>
                <span className="text-[10px] sm:text-sm font-bold opacity-60">ID: {sessionId}</span>
            </div>
        </div>
        
        <div className="absolute top-6 sm:top-12 right-6 sm:right-12 flex items-center gap-3 sm:gap-6 opacity-60">
            <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Round</span>
                <span className="text-2xl sm:text-5xl font-black text-primary">{state.currentQuestionIndex + 1}<span className="text-xs sm:text-2xl text-muted-foreground opacity-50 font-bold ml-1">/ {TOTAL_QUESTIONS}</span></span>
            </div>
        </div>

        <div className="h-full w-full">
            {renderContent()}
        </div>
        
        <div className="absolute bottom-6 sm:bottom-12 left-0 right-0 flex justify-center opacity-30">
            <div className="flex items-center gap-2 px-4 py-1.5 sm:py-2 bg-muted/50 rounded-full border backdrop-blur-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] translate-x-[0.2em] sm:translate-x-[0.4em]">Protocol Active</p>
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
