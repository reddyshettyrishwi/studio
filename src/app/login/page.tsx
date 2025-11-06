
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
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";


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
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isManagerOrExecutive = selectedRole === 'Manager' || selectedRole === 'Executive';

  const handleAdminSignIn = async () => {
    if (!db || !auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Firebase is not ready." });
        setIsLoading(false);
        return;
    }

    if (email !== 'admin@nxtwave.co.in' || password !== '12345678') {
        toast({ variant: "destructive", title: "Admin Sign In Failed", description: "Invalid admin credentials." });
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = await findUserByEmail(db, email);
      if (user?.role === 'Admin') {
        router.push(`/dashboard?role=Admin&name=Admin%20User`);
      } else {
         await auth.signOut();
        toast({
          variant: "destructive",
          title: "Admin Sign In Failed",
          description: "This account does not have admin privileges.",
        });
      }
    } catch (error: any) {
       if (error.code === 'auth/user-not-found') {
        // If admin user doesn't exist, create it
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await addUser(db, { id: userCredential.user.uid, name: 'Admin User', email, role: 'Admin', status: 'Approved' });
            router.push(`/dashboard?role=Admin&name=Admin%20User`);
        } catch (createError: any) {
            toast({
                variant: "destructive",
                title: "Admin Creation Failed",
                description: createError.message || "Could not create admin user.",
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
      setIsLoading(false);
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
      } finally {
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
             await auth.signOut();
            router.push('/pending-approval');
          }
        } else {
             await auth.signOut();
            throw new Error("User data not found in database. Please sign up first.");
        }
      } catch (error: any) {
         toast({ variant: "destructive", title: "Sign In Failed", description: error.message || "Invalid credentials or account not approved." });
      } finally {
         setIsLoading(false);
      }
    }
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
