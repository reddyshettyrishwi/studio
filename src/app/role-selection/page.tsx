"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, UserRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const roles = [
  {
    key: "manager",
    title: "Manager",
    description: "Coordinate teams, approve campaigns, and keep influencer operations aligned.",
  icon: <Briefcase className="h-10 w-10 text-primary" />,
    highlights: ["View high-level analytics", "Approve influencer spend", "Oversee campaign health"],
  },
  {
    key: "executive",
    title: "Executive",
    description: "Log campaign activity, update influencer records, and collaborate with your team.",
  icon: <UserRound className="h-10 w-10 text-primary" />,
    highlights: ["Submit campaign updates", "Flag data inconsistencies", "Collaborate with managers"],
  },
] as const;

export default function RoleSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6">
      <div className="max-w-5xl w-full space-y-10 text-center">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Choose Your Workspace
          </p>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            Select the role that matches how you work in Nxthub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We tailor the experience to highlight the tools and insights you need most. Pick the role that best fits your responsibilities today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.key} className="flex flex-col border border-primary/20 shadow-sm transition hover:shadow-lg">
              <CardHeader className="space-y-3">
                <div className="flex justify-center">{role.icon}</div>
                <CardTitle className="text-2xl font-headline">{role.title}</CardTitle>
                <CardDescription className="text-base">{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  {role.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/login?role=${role.key}`}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
