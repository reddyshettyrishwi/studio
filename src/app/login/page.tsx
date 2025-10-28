
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [selectedLevel, setSelectedLevel] = React.useState<UserRole>("Level 1");
  const router = useRouter();

  const handleSignIn = () => {
    // In a real app, you'd set context/state here.
    // For now, we'll use query params for simplicity.
    router.push(`/?role=${selectedLevel}`);
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
          <CardTitle className="text-2xl font-headline">Select Your Role</CardTitle>
          <CardDescription>
            Choose your access level to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RadioGroup
            defaultValue="Level 1"
            className="grid gap-4"
            onValueChange={(value: UserRole) => setSelectedLevel(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Level 1" id="level-1" />
              <Label htmlFor="level-1" className="cursor-pointer">Level 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Level 2" id="level-2" />
              <Label htmlFor="level-2" className="cursor-pointer">Level 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Level 3" id="level-3" />
              <Label htmlFor="level-3" className="cursor-pointer">Level 3</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button className="w-full" onClick={handleSignIn}>Sign in as {selectedLevel}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
