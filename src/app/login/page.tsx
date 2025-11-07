
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
import { addUser, findUserByEmail, findUserByMobileOrPan } from "@/lib/data";
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
  const [mobile, setMobile] = React.useState("");
  const [pan, setPan] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("Manager");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // This effect will sign the user out when they navigate to the login page.
  React.useEffect(() => {
    if (auth) {
      auth.signOut();
    }
  }, [auth]);
  
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
      if (!name || !email || !password || !mobile || !pan) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Please fill in all fields." });
        setIsProcessing(false);
        return;
      }
      try {
        const existingUserByEmail = await findUserByEmail(db, email);
        if (existingUserByEmail) {
           toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
           setIsProcessing(false);
           return;
        }

        const existingUserByMobileOrPan = await findUserByMobileOrPan(db, mobile, pan);
        if (existingUserByMobileOrPan) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: "User already exists with this mobile or PAN." });
            setIsProcessing(false);
            return;
        }

        // We create the user in Auth, but sign them out immediately.
        // They need to be approved before they can log in.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await addUser(db, { id: firebaseUser.uid, name, email, role: selectedRole, status: 'Pending', mobile, pan });
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
    } else { // SIGN IN (All Roles)
      try {
        // Step 1: Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Step 2: Fetch user profile from Firestore
        const userProfile = await findUserByEmail(db, firebaseUser.email!);

        // Step 3: Validate Profile, Role, and Status
        if (!userProfile) {
            await auth.signOut();
            toast({ variant: "destructive", title: "Sign In Failed", description: "User profile not found." });
            setIsProcessing(false);
            return;
        }

        if (userProfile.role !== selectedRole) {
            await auth.signOut();
            toast({ variant: "destructive", title: "Sign In Failed", description: "Incorrect role selected for this account." });
            setIsProcessing(false);
            return;
        }

        if (userProfile.status !== 'Approved') {
            const isPending = userProfile.status === 'Pending';
            const description = isPending
                ? "This account is pending approval." 
                : "This account has been rejected.";
            await auth.signOut();
            toast({ variant: "destructive", title: "Sign In Failed", description });
            setIsProcessing(false);
            if (isPending) {
                router.push('/pending-approval');
            }
            return;
        }
        
        // Step 4: All checks passed, redirect to the dashboard.
        router.push(`/dashboard?role=${userProfile.role}&name=${encodeURIComponent(userProfile.name)}`);
        
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid email or password." });
         setIsProcessing(false);
      }
    }
  };

  React.useEffect(() => {
    // If user is already logged in (e.g. from a previous session or by using the back button), redirect them.
    // This is now safe inside a useEffect.
    if (authUser) {
      router.push(`/dashboard?role=Manager&name=Temp`); // A default redirect, can be improved.
    }
  }, [authUser, router]);

  // While checking auth state on initial load, show a loader.
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
            {isSigningUp && selectedRole !== 'Admin' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="+91-9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan">PAN / Legal ID</Label>
                  <Input id="pan" value={pan} onChange={(e) => setPan(e.target.value)} required />
                </div>
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
            <div className="text-sm w-full text-center">
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
