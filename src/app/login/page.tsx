
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
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";


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
  const [isLoading, setIsLoading] = React.useState(true); // Start loading to handle redirect
  
  const isManagerOrExecutive = selectedRole === 'Manager' || selectedRole === 'Executive';

  React.useEffect(() => {
    if (!auth || !db) return;

    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User has just been redirected from Google Sign-In. Keep loading.
          const firebaseUser = result.user;
          if (!firebaseUser.email) {
            toast({ variant: "destructive", title: "Sign In Failed", description: "Your Google account does not have an email address." });
            await auth.signOut();
            setIsLoading(false);
            return;
          }

          const existingUser = await findUserByEmail(db, firebaseUser.email);
          if (existingUser) {
            if (existingUser.status === 'Approved') {
              router.push(`/dashboard?role=${existingUser.role}&name=${encodeURIComponent(existingUser.name)}`);
            } else {
              // User exists but is not approved.
              await auth.signOut();
              router.push('/pending-approval');
            }
          } else {
            // New user via Google. Create them and send to pending.
            const newUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email,
              role: selectedRole === 'Admin' ? 'Manager' : selectedRole,
              status: 'Pending' as const,
            };
            await addUser(db, newUser);
            await auth.signOut();
            router.push('/pending-approval');
          }
        } else {
            // No redirect result, so stop loading and show the form.
            setIsLoading(false);
        }
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Google Sign In Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
        });
        setIsLoading(false);
      });
  }, [auth, db, router, selectedRole, toast]);


  const handleAdminSignIn = async () => {
    setIsLoading(true);
    if (!db || !auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
        setIsLoading(false);
        return;
    }

    const adminEmail = 'admin@nxtwave.co.in';
    const adminPassword = '12345678';

    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      router.push(`/dashboard?role=Admin&name=Admin`);
    } catch (error: any) {
       if (error.code === 'auth/user-not-found') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            await addUser(db, { id: userCredential.user.uid, name: 'Admin', email: adminEmail, role: 'Admin', status: 'Approved' });
            router.push(`/dashboard?role=Admin&name=Admin`);
        } catch (createError: any) {
            toast({
                variant: "destructive",
                title: "Admin Creation Failed",
                description: createError.message || "Could not create initial admin user.",
            });
        }
       } else if (error.code === 'auth/invalid-credential') {
         toast({
          variant: "destructive",
          title: "Admin Sign In Failed",
          description: "Invalid admin credentials. Please check the password.",
        });
       } else {
         toast({
            variant: "destructive",
            title: "Admin Sign In Failed",
            description: error.message || "An unexpected error occurred.",
          });
       }
    } finally {
      // Don't set loading to false here on success, as the router push will unmount the component
      if (!router.asPath.startsWith('/dashboard')) {
        setIsLoading(false);
      }
    }
  };


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
      await handleAdminSignIn();
      return;
    }

    if (isSigningUp) {
      if (!name || !email || !password) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Please fill in all fields." });
        setIsLoading(false);
        return;
      }
      try {
        const existingUser = await findUserByEmail(db, email);
        if (existingUser) {
           toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
           setIsLoading(false);
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
         setIsLoading(false);
      }
    } else { // Sign In
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = await findUserByEmail(db, userCredential.user.email!);
        
        if (user) {
          if (user.status === 'Approved') {
            router.push(`/dashboard?role=${user.role}&name=${encodeURIComponent(user.name)}`);
          } else if (user.status === 'Pending') {
             await auth.signOut();
             router.push('/pending-approval');
          } else {
             await auth.signOut();
             toast({ variant: "destructive", title: "Sign In Failed", description: "Your account has been rejected or is in an unknown state." });
             setIsLoading(false);
          }
        } else {
             await auth.signOut();
            toast({ variant: "destructive", title: "User Not Found", description: "Your account details were not found. Please sign up." });
            setIsLoading(false);
        }
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid credentials or account not approved." });
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
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin" />
              <p className="ml-2">Please wait...</p>
            </div>
          ) : (
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

              {isManagerOrExecutive && (
                <>
                  <Button onClick={handleAuthAction} className="w-full" disabled={isLoading}>
                    {isSigningUp ? "Sign Up" : "Sign In"}
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

                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    <Chrome className="mr-2 h-4 w-4" />
                    Sign in with Google
                  </Button>
                </>
              )}

              {selectedRole === 'Admin' && (
                <Button onClick={handleAuthAction} className="w-full" disabled={isLoading}>
                  Sign In
                </Button>
              )}
            </>
          )}

        </CardContent>
        {!isLoading && isManagerOrExecutive && (
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

    