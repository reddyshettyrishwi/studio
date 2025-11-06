
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
import { Megaphone, Loader2, Chrome } from "lucide-react";
import { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addUser, findUserByEmail } from "@/lib/data";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";


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
  const [isProcessing, setIsProcessing] = React.useState(true); // Start in a processing state

  const isManagerOrExecutive = selectedRole === 'Manager' || selectedRole === 'Executive';

  // Always sign out when the login page is visited.
  React.useEffect(() => {
    if (auth) {
      auth.signOut();
    }
  }, [auth]);

  // Effect to handle redirection AFTER Firebase has determined the auth state
  React.useEffect(() => {
    if (isUserLoading) {
      // Still checking auth state, do nothing
      return;
    }
    
    setIsProcessing(true); // Start processing when auth state is known

    if (authUser && db) { // User is definitively logged in
        findUserByEmail(db, authUser.email!).then(user => {
            if (user) {
                 if (user.status === 'Approved') {
                    router.push(`/dashboard?role=${user.role}&name=${encodeURIComponent(user.name)}`);
                } else {
                    auth.signOut(); // Sign out user if not approved
                    router.push('/pending-approval');
                }
            }
        });
    } else if (auth && db) { // User is not logged in, check for redirect result
        getRedirectResult(auth)
          .then(async (result) => {
            if (result) {
              const firebaseUser = result.user;
              if (!firebaseUser.email) {
                toast({ variant: "destructive", title: "Sign In Failed", description: "Your Google account does not have an email address." });
                await auth.signOut();
                setIsProcessing(false);
                return;
              }

              const existingUser = await findUserByEmail(db, firebaseUser.email);
              if (!existingUser) {
                // This is a new user signing up with Google
                const newUser = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'New User',
                  email: firebaseUser.email,
                  role: 'Manager' as const,
                  status: 'Pending' as const,
                };
                await addUser(db, newUser);
                await auth.signOut();
                router.push('/pending-approval');
              }
              // If user exists, the onAuthStateChanged/useUser hook will handle redirection on the next render cycle.
              // We don't set processing to false here, as the page will re-render with an authUser.
            } else {
              // No redirect result, user is genuinely at the login page
              setIsProcessing(false);
            }
          })
          .catch((error) => {
            toast({
              variant: "destructive",
              title: "Google Sign In Failed",
              description: error.message || "An unexpected error occurred during sign-in.",
            });
            setIsProcessing(false);
          });
    } else {
        // Services aren't ready yet, stay in processing state
        setIsProcessing(true);
    }
  }, [isUserLoading, authUser, router, db, auth, toast]);


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

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await addUser(db, { id: firebaseUser.uid, name, email, role: selectedRole, status: 'Pending' });
        
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

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
      return;
    }
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    // This will navigate away from the page, no need to set isProcessing to false here.
    await signInWithRedirect(auth, provider);
  };

  // This is the main loading gate. It shows a full-screen loader while Firebase is initializing
  // or if we are in the middle of a redirect/login process.
  if (isProcessing || isUserLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2">Please wait...</p>
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
              <>
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
                    <RadioGroupItem value="Executive" id="executive" className="peer sr
-only" />
                    <Label
                      htmlFor="executive"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Executive
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isManagerOrExecutive && (
                <>
                  <Button onClick={handleAuthAction} className="w-full" disabled={isProcessing}>
                    {isProcessing && !isSigningUp ? <Loader2 className="animate-spin" /> : (isSigningUp ? "Sign Up" : "Sign In")}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}>
                    <Chrome className="mr-2 h-4 w-4" />
                    Sign in with Google
                  </Button>
                </>
              )}

              {selectedRole === 'Admin' && (
                <Button onClick={handleAuthAction} className="w-full" disabled={isProcessing}>
                   {isProcessing ? <Loader2 className="animate-spin" /> : "Sign In"}
                </Button>
              )}
            </>
        </CardContent>
        {isManagerOrExecutive && (
           <CardFooter className="flex-col gap-4">
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

    