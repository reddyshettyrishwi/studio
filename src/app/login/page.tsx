
"use client";

export const dynamic = "force-dynamic";

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
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { normalizeDepartment } from "@/lib/options";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pendingRole, setPendingRole] = React.useState<"manager" | "executive" | null>(null);

  const handleGoogleSignIn = async () => {
    if (!db || !auth) {
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Firebase is not ready.",
      });
      return;
    }

    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      const userProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "Anonymous User",
        email: firebaseUser.email!,
        avatar: firebaseUser.photoURL || undefined,
      };

      upsertUser(db, userProfile);

      const roleDocRef = doc(db, "userRoles", firebaseUser.uid);
      const roleDoc = await getDoc(roleDocRef);
      const rawRole = roleDoc.exists() ? String(roleDoc.data()?.role ?? "") : "";
      const rawDepartment = roleDoc.exists() ? (roleDoc.data()?.department as string | undefined) : undefined;
      const normalizedRole = rawRole.toLowerCase();
      const normalizedDepartment = normalizeDepartment(rawDepartment);

      if (normalizedRole !== "manager" && normalizedRole !== "executive") {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access denied. Role not assigned.",
          description: "Contact an administrator to assign a role to your account.",
        });
        return;
      }

      if (normalizedRole === "manager" && !normalizedDepartment) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Department not assigned.",
          description: "Ask an administrator to assign your department before signing in.",
        });
        return;
      }

      const params = new URLSearchParams({
        name: userProfile.name,
        role: normalizedRole,
      });

      setPendingRole(normalizedRole === "manager" || normalizedRole === "executive" ? normalizedRole : null);

      if (normalizedRole === "manager" && normalizedDepartment) {
        params.set("department", normalizedDepartment);
      }

      router.push(`/dashboard?${params.toString()}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "An error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    let isActive = true;
    const enforceRole = async () => {
      if (!authUser || !db || !auth) {
        return;
      }

      try {
        const roleDocRef = doc(db, "userRoles", authUser.uid);
        const roleDoc = await getDoc(roleDocRef);
        const rawRole = roleDoc.exists() ? String(roleDoc.data()?.role ?? "") : "";
        const rawDepartment = roleDoc.exists() ? (roleDoc.data()?.department as string | undefined) : undefined;
        const normalizedRole = rawRole.toLowerCase();
        const normalizedDepartment = normalizeDepartment(rawDepartment);

        if (normalizedRole !== "manager" && normalizedRole !== "executive") {
          await signOut(auth);
          if (isActive) {
            toast({
              variant: "destructive",
              title: "Access denied. Role not assigned.",
              description: "Contact an administrator to assign a role to your account.",
            });
          }
          return;
        }

        if (normalizedRole === "manager" && !normalizedDepartment) {
          if (isActive) {
            setIsProcessing(false);
          }
          await signOut(auth);
          if (isActive) {
            toast({
              variant: "destructive",
              title: "Department not assigned.",
              description: "Ask an administrator to assign your department before signing in.",
            });
          }
          return;
        }

        if (isActive) {
          setPendingRole(normalizedRole === "manager" || normalizedRole === "executive" ? normalizedRole : null);
          const params = new URLSearchParams({
            name: authUser.displayName || "User",
            role: normalizedRole,
          });
          if (normalizedRole === "manager" && normalizedDepartment) {
            params.set("department", normalizedDepartment);
          }
          router.push(`/dashboard?${params.toString()}`);
        }
      } catch (error) {
        console.error("Role enforcement failed", error);
        await signOut(auth);
        if (isActive) {
          toast({
            variant: "destructive",
            title: "Access denied. Role not assigned.",
            description: "We could not verify your role.",
          });
        }
      }
    };

    if (!isUserLoading && authUser) {
      enforceRole();
    }

    return () => {
      isActive = false;
    };
  }, [authUser, isUserLoading, db, auth, router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="bg-primary/20 text-primary p-2 rounded-lg">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="text-left">
          <h1 className="text-xl font-headline font-semibold text-foreground">
            Nxthub
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll tailor the workspace once we confirm your role.
          </p>
        </div>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign In to Nxthub</CardTitle>
          <CardDescription>
            Sign in with your Google account and we&apos;ll route you to your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn} disabled={isProcessing}>
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingRole ? `Preparing your ${pendingRole} workspace...` : "Preparing your workspace..."}
              </span>
            ) : (
              <>
                <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
