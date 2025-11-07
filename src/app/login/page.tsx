
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Megaphone, Loader2, Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { upsertUser } from "@/lib/data";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleGoogleSignIn = async () => {
    if (!db || !auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
        return;
    }

    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;

        const userProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Anonymous User',
            email: firebaseUser.email!,
            avatar: firebaseUser.photoURL || undefined
        };

        // Create or update the user's profile in Firestore
        upsertUser(db, userProfile);
        
        // Redirect to dashboard
        router.push(`/dashboard?name=${encodeURIComponent(userProfile.name)}`);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message || "An error occurred." });
    } finally {
        setIsProcessing(false);
    }
  }

  React.useEffect(() => {
    if (!isUserLoading && authUser) {
        router.push(`/dashboard?name=${encodeURIComponent(authUser.displayName || 'User')}`);
    }
  }, [authUser, isUserLoading, router]);

  if (isUserLoading || authUser) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

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
          <CardTitle className="text-2xl font-headline">
            Sign In
          </CardTitle>
          <CardDescription>
            Sign in with your Google account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : <><Chrome className="mr-2 h-4 w-4" /> Sign in with Google</>}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
