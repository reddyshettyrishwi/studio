
"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tight max-w-3xl">
          The Smart Hub for Influencer Marketing
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Unify your influencer data, streamline campaigns, and access AI-powered insights—all in one place.
        </p>

    <Link href="/role-selection">
            <Button size="lg" className="mt-4">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </Link>
      </div>
    </div>
  );
}
