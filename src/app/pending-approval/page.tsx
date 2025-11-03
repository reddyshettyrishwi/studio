
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="absolute top-8 left-8 flex items-center gap-2">
            <div className="bg-primary/20 text-primary p-2 rounded-lg">
            <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-headline font-semibold text-foreground">
            InfluenceWise
            </h1>
        </div>
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-headline">Registration Submitted</CardTitle>
                <CardDescription>
                    Thank you for signing up! Your account is currently pending approval from an administrator. Please check back in 24 hours to see if your account has been approved.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/login" className="text-sm text-primary hover:underline">
                    Return to Login
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}
