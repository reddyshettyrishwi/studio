
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
import { Megaphone, Chrome, Loader2 } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addUser, findUserByEmail } from "@/lib/data";
import { useAuth, useFirestore } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// Function to extract a display name from an email address
const extractNameFromEmail = (email: string): string => {
    if (!email || !email.includes('@')) {
        return "User";
    }
    const namePart = email.split('@')[0];
    // Remove numbers, dots, underscores, or hyphens and capitalize parts
    const cleanedName = namePart
        .replace(/[0-9._-]/g, ' ')
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single one
        .trim();
    
    if (!cleanedName) return "User";

    return cleanedName
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("Manager");
  const [isLoading, setIsLoading] = React.useState(true);


  React.useEffect(() => {
    if (!auth || !db) return;

    // This handles the redirect result from Google Sign-In
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setIsLoading(true);
          const googleUser = result.user;
          const existingUser = await findUserByEmail(db, googleUser.email!);

          if (existingUser) {
            if (existingUser.status === 'Approved') {
              router.push(`/dashboard?role=${existingUser.role}&name=${encodeURIComponent(existingUser.name)}`);
            } else {
              router.push('/pending-approval');
            }
          } else {
            // User doesn't exist, create a new document
            const newUser = {
                id: googleUser.uid,
                name: googleUser.displayName || extractNameFromEmail(googleUser.email!),
                email: googleUser.email!,
                role: 'Manager', // Default role for new Google sign-ups
                status: 'Pending' as const,
            };
            await addUser(db, newUser);
            router.push('/pending-approval');
          }
        } else if (auth.currentUser) {
          // User is already signed in, check their status and redirect
          setIsLoading(true);
          const user = await findUserByEmail(db, auth.currentUser.email!);
          if (user && user.status === 'Approved') {
            router.push(`/dashboard?role=${user.role}&name=${encodeURIComponent(user.name)}`);
          } else {
            // User exists but isn't approved, or DB entry is missing.
            // Let them stay on the login page or send to pending.
             if (user && user.status === 'Pending') {
                 router.push('/pending-approval');
             } else {
                setIsLoading(false);
             }
          }
        } else {
           setIsLoading(false);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Sign-In May Have Failed",
          description: "If you are in a preview environment, please run the project locally and log in from localhost for the best experience.",
        });
        setIsLoading(false);
      }
    };

    handleRedirect();

  }, [auth, db, router, toast]);


  const handleAuthAction = async () => {
    if (!db || !auth) {
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Firebase is not ready. Please try again in a moment.",
      });
      return;
    }

    setIsLoading(true);

    if (selectedRole === 'Admin') {
      if (email === 'admin@nxtwave.co.in' && password === '12345678') {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const displayName = extractNameFromEmail(email);
            router.push(`/dashboard?role=${selectedRole}&name=${encodeURIComponent(displayName)}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                 try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await addUser(db, { id: userCredential.user.uid, name: 'Admin User', email: email, role: 'Admin', status: 'Approved' });
                    const displayName = extractNameFromEmail(email);
                    router.push(`/dashboard?role=${selectedRole}&name=${encodeURIComponent(displayName)}`);
                } catch(e: any) {
                     toast({
                        variant: "destructive",
                        title: "Admin Sign Up Failed",
                        description: e.message || "Could not create admin user.",
                    });
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Admin Sign In Failed",
                    description: error.message || "An unexpected error occurred.",
                });
            }
        } finally {
            setIsLoading(false);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Admin Sign In Failed",
          description: "Invalid credentials for Admin sign in.",
        });
        setIsLoading(false);
      }
      return;
    }

    if (isSigningUp) {
      if (!name || !email || !password) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Please fill in all fields." });
        setIsLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        await addUser(db, { id: firebaseUser.uid, name, email, role: selectedRole, status: 'Pending' });
        router.push('/pending-approval');
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "An error occurred during sign up." });
         setIsLoading(false);
      }
    } else { // Sign In
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = await findUserByEmail(db, userCredential.user.email!);
        if (user) {
          if (user.status === 'Approved') {
            router.push(`/dashboard?role=${user.role}&name=${encodeURIComponent(user.name)}`);
          } else {
            router.push('/pending-approval');
          }
        } else {
            throw new Error("User data not found in database.");
        }
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: error.message || "Invalid credentials." });
         setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
        return;
    }
    
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };
  
  const isManagerOrExecutive = selectedRole === 'Manager' || selectedRole === 'Executive';

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
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
            {selectedRole === 'Admin' ? 'Admin Sign In' : (isSigningUp ? "Create Account" : "Sign In")}
          </CardTitle>
          <CardDescription>
            {selectedRole === 'Admin' ? 'Enter admin credentials to access the dashboard.' : (isSigningUp
              ? "Enter your details to create a new account."
              : "Enter your credentials to access the dashboard.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isSigningUp && isManagerOrExecutive && (
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>


          <div className="grid gap-2">
            <Label>Select Role</Label>
            <RadioGroup
              defaultValue="Manager"
              className="grid grid-cols-3 gap-4"
              value={selectedRole}
              onValueChange={(value: UserRole) => setSelectedRole(value)}
            >
              <div>
                <RadioGroupItem value="Admin" id="admin" className="peer sr-only" />
                <Label
                  htmlFor="admin"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Admin
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Manager" id="manager" className="peer sr-only" />
                <Label
                  htmlFor="manager"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Manager
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Executive" id="executive" className="peer sr-only" />
                <Label
                  htmlFor="executive"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Executive
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button onClick={handleAuthAction} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : (selectedRole === 'Admin' ? 'Sign In' : (isSigningUp ? "Sign Up" : "Sign In"))}
          </Button>
        </CardContent>
        {isManagerOrExecutive && (
           <CardFooter className="flex-col gap-4">
              <div className="relative w-full">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">
                  OR
                  </span>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
                  Sign in with Google
              </Button>
               <div className="text-sm">
                <button
                  onClick={() => setIsSigningUp(!isSigningUp)}
                  className="font-medium text-primary hover:underline"
                >
                  {isSigningUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

    
    