import Link from 'next/link';
import { Monitor, Smartphone, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-primary font-headline">
            RemoteDisplayLink
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect your devices for interactive presentations and quizzes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/control" className="group">
            <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="mt-4">Control Panel</CardTitle>
                <CardDescription>
                  The remote control for presenters to manage questions and timers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Best for smartphones and tablets.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/display" className="group">
            <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-accent">
              <CardHeader>
                <div className="mx-auto bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                  <Monitor className="w-10 h-10 text-accent" />
                </div>
                <CardTitle className="mt-4">Display Panel</CardTitle>
                <CardDescription>
                  The visual interface for the audience showing the active state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Best for large monitors or TVs.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="pt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Setup: Open this page on two separate devices to start.
            </p>
        </div>
      </div>
    </main>
  );
}