
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Chrome } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSignIn = (level: UserRole) => {
    if (password === "123456") {
      router.push(`/?role=${level}`);
    } else {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "The password you entered is incorrect. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="bg-primary/20 text-primary p-2 rounded-lg">
          <Megaphone className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-headline font-semibold text-foreground">
          InfluenceWise
        </h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => handleSignIn("Level 1")}>Level 1</Button>
            <Button variant="outline" onClick={() => handleSignIn("Level 2")}>Level 2</Button>
            <Button variant="outline" onClick={() => handleSignIn("Level 3")}>Level 3</Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <div className="relative w-full">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>
          <Button variant="outline" className="w-full">
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
