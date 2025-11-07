
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
        const existingUserByMobileOrPan = await findUserByMobileOrPan(db, mobile, pan);
        if (existingUserByMobileOrPan) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: "User already exists with this Mobile or PAN." });
            setIsProcessing(false);
            return;
        }

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
      } finally {
        setIsProcessing(false);
      }
    } else { // SIGN IN (All Roles)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // At this point, Firebase auth was successful. Now check our database.
        const userProfile = await findUserByEmail(db, firebaseUser.email!);

        if (!userProfile) {
            await auth.signOut();
            toast({ variant: "destructive", title: "Sign In Failed", description: "User profile not found in database." });
        } else if (userProfile.role !== selectedRole) {
            await auth.signOut();
            toast({ variant: "destructive", title: "Sign In Failed", description: "Incorrect role selected for this account." });
        } else if (userProfile.status !== 'Approved') {
            await auth.signOut();
            if (userProfile.status === 'Pending') {
                toast({ variant: "destructive", title: "Sign In Failed", description: "This account is pending approval." });
                router.push('/pending-approval');
            } else { // Rejected
                 toast({ variant: "destructive", title: "Sign In Failed", description: "This account has been rejected." });
            }
        } else {
            // Success! Navigate to the correct page.
            if (userProfile.role === 'Admin') {
                router.push(`/admin/approvals?role=${userProfile.role}&name=${encodeURIComponent(userProfile.name)}`);
            } else {
                router.push(`/dashboard?role=${userProfile.role}&name=${encodeURIComponent(userProfile.name)}`);
            }
        }
      } catch (error: any) {
         // This catch block now specifically handles errors from signInWithEmailAndPassword (e.g., wrong password, user not found)
         toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid email or password." });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  React.useEffect(() => {
    // If user is already logged in (e.g. from a previous session or by using the back button), redirect them.
    if (!isUserLoading && authUser && db) {
        findUserByEmail(db, authUser.email!).then(userProfile => {
            if (userProfile && userProfile.status === 'Approved') {
                 if (userProfile.role === 'Admin') {
                    router.push(`/admin/approvals?role=${userProfile.role}&name=${encodeURIComponent(userProfile.name)}`);
                } else {
                    router.push(`/dashboard?role=${userProfile.role}&name=${encodeURIComponent(userProfile.name)}`);
                }
            }
        });
    }
  }, [authUser, isUserLoading, router, db]);

  // While checking auth state on initial load, show a loader.
  if (isUserLoading) {
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
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="+91-9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="pan">PAN / Legal ID</Label>
                  <Input id="pan" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value)} required />
                </div>
              </>
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
