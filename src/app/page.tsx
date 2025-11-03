
"use client";

import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed w-full z-20 top-0">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Megaphone className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-headline font-semibold text-foreground">NxtHub</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            <Button>Login</Button>
          </Link>
           <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            <Button variant="outline">Sign Up</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40 border-y bg-gradient-radial-spread">
          <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  Welcome to NxtHub: The Future of Influence
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                  NxtHub is revolutionizing the creator economy by providing a unified platform for brands and influencers to connect, collaborate, and create campaigns that resonate with audiences worldwide.
                </p>
                <div className="space-x-4 mt-6">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background/50 px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
               <div className="flex justify-center">
                 <div className="w-[400px] h-[400px] bg-primary/10 rounded-full flex items-center justify-center relative shadow-glow-primary">
                    <Megaphone className="h-48 w-48 text-primary opacity-50" />
                 </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container space-y-12 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">How NxtHub Changes the World</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover the tools and features that make NxtHub the most powerful influencer marketing platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <div className="grid gap-1 p-4 rounded-lg border bg-card/50">
                <h3 className="text-lg font-bold">Unified Data</h3>
                <p className="text-sm text-muted-foreground">
                  Access a centralized repository of verified, always up-to-date influencer data. No more scattered spreadsheets.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card/50">
                <h3 className="text-lg font-bold">Seamless Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Manage campaigns, approvals, and communication all in one place, streamlining your workflow.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card/50">
                <h3 className="text-lg font-bold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Leverage artificial intelligence to detect duplicate profiles and prevent pricing anomalies, ensuring fair and efficient campaigns.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 NxtHub. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
