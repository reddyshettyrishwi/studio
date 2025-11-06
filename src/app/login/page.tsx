
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
import { Megaphone, Loader2 } from "lucide-react";
import { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addUser, findUserByEmail } from "@/lib/data";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();

  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("Manager");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Effect to handle redirection AFTER Firebase has determined the auth state
  React.useEffect(() => {
    if (isUserLoading) {
      // Still checking auth state, do nothing
      return;
    }
    if (authUser && db) { // User is logged in
        findUserByEmail(db, authUser.email!).then(user => {
            if (user) {
                 if (user.status === 'Approved') {
                    router.push(`/dashboard?role=${user.role}&name=${encodeURIComponent(user.name)}`);
                } else if (user.status === 'Pending') {
                    router.push('/pending-approval');
                }
                // If rejected, they will just stay on login page after sign in fails.
            }
        });
    }
    // If no authUser, just stay on the login page.
  }, [isUserLoading, authUser, router, db]);


  const handleAdminSignIn = async () => {
    setIsProcessing(true);
    if (!db || !auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
        setIsProcessing(false);
        return;
    }

    const adminEmail = 'admin@nxtwave.co.in';
    const adminPassword = '12345678';

    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      // Let the useEffect handle the redirect
    } catch (error: any) {
       if (error.code === 'auth/user-not-found') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            await addUser(db, { id: userCredential.user.uid, name: 'Admin', email: adminEmail, role: 'Admin', status: 'Approved' });
            // Let the useEffect handle the redirect
        } catch (createError: any) {
            toast({
                variant: "destructive",
                title: "Admin Creation Failed",
                description: createError.message || "Could not create initial admin user.",
            });
             setIsProcessing(false);
        }
       } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
         toast({
          variant: "destructive",
          title: "Admin Sign In Failed",
          description: "Invalid admin credentials. Please check the password.",
        });
         setIsProcessing(false);
       } else {
         toast({
            variant: "destructive",
            title: "Admin Sign In Failed",
            description: error.message || "An unexpected error occurred.",
          });
          setIsProcessing(false);
       }
    }
  };


  const handleAuthAction = async () => {
    if (!db || !auth) {
      toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
      return;
    }

    setIsProcessing(true);

    if (selectedRole === 'Admin') {
      await handleAdminSignIn();
      return;
    }

    if (isSigningUp) {
      if (!name || !email || !password) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Please fill in all fields." });
        setIsProcessing(false);
        return;
      }
      try {
        const existingUser = await findUserByEmail(db, email);
        if (existingUser) {
           toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
           setIsProcessing(false);
           return;
        }

        // We don't sign in the user here, just create the user record request
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await addUser(db, { id: firebaseUser.uid, name, email, role: selectedRole, status: 'Pending' });
        
        // After creating the user, we sign them out immediately.
        // They need to wait for approval.
        await auth.signOut();
        
        router.push('/pending-approval');

      } catch (error: any) {
         if (error.code === 'auth/email-already-in-use') {
             toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
         } else {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "An error occurred during sign up." });
         }
         setIsProcessing(false);
      }
    } else { // Sign In
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Let the useEffect handle the logic after sign-in.
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid credentials or account not approved." });
         setIsProcessing(false);
      }
    }
  };

  // This is the main loading gate. It shows a full-screen loader while Firebase is initializing.
  if (isUserLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  // Only render the login form if the user is not loading and not authenticated.
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
          {(selectedRole !== 'Admin' || !isSigningUp) && (
            <>
              {isSigningUp && selectedRole !== 'Admin' && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              {(selectedRole !== 'Admin') && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </>
              )}
            </>
          )}

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
          <Button onClick={handleAuthAction} className="w-full" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin" /> : (isSigningUp && selectedRole !== 'Admin' ? "Sign Up" : "Sign In")}
          </Button>
        </CardContent>
        {selectedRole !== 'Admin' && (
           <CardFooter>
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

    