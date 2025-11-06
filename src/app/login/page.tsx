
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

  // This effect will sign the user out when they navigate to the login page.
  React.useEffect(() => {
    if (auth) {
      auth.signOut();
    }
  }, [auth]);

  // This effect will automatically redirect a logged-in user.
  React.useEffect(() => {
    if (isUserLoading || !authUser || !db) return; // Wait until loading is done and we have a user

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
  }, [isUserLoading, authUser, router, db]);

  // When a role is changed, 'Admin' can't sign up.
  React.useEffect(() => {
    if (selectedRole === 'Admin') {
      setIsSigningUp(false);
    }
  }, [selectedRole]);


  const handleAuthAction = async () => {
    if (!db || !auth) {
      toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
      return;
    }

    setIsProcessing(true);

    if (isSigningUp && selectedRole !== 'Admin') { // SIGN UP (Managers & Executives)
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
        
        // Don't sign out here, let the main useEffect handle redirection.
        
        // Manually trigger a check that will lead to redirection
         findUserByEmail(db, firebaseUser.email!).then(user => {
            if (user && user.status === 'Pending') {
                 router.push('/pending-approval');
            }
        });

      } catch (error: any) {
         if (error.code === 'auth/email-already-in-use') {
             toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
         } else {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "An error occurred during sign up." });
         }
         setIsProcessing(false);
      }
    } else { // SIGN IN (All Roles)
      try {
        // Special admin creation logic
        if (selectedRole === 'Admin' && email === 'admin@nxtwave.co.in') {
          try {
            await signInWithEmailAndPassword(auth, email, password)
          } catch(error: any) {
             if (error.code === 'auth/user-not-found') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await addUser(db, { id: userCredential.user.uid, name: 'Admin', email, role: 'Admin', status: 'Approved' });
             } else {
               throw error; // Re-throw other sign-in errors
             }
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        // Let the main useEffect handle the logic after successful sign-in.
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid credentials or account not approved." });
         setIsProcessing(false);
      }
    }
  };

  // The login page should only be shown when the user is not logged in.
  // While checking, it shows a loader. If the user is logged in, the other effect will redirect them.
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
            {isSigningUp && selectedRole !== 'Admin' ? "Create Account" : "Sign In"}
          </CardTitle>
          <CardDescription>
            {isSigningUp  && selectedRole !== 'Admin'
              ? "Enter your details to create a new account."
              : "Enter your credentials to access the dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {isSigningUp && selectedRole !== 'Admin' && (
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
