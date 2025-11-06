
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {
  LogOut,
  CheckCircle,
} from "lucide-react";
import { UserRole, PendingUser } from "@/lib/types";
import { approveUser, rejectUser, getPendingUsers } from "@/lib/data";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";

function AdminApprovalsContent() {
  const searchParams = useSearchParams()
  const router = useRouter();
  const db = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = React.useState<PendingUser[]>([]);
  
  // This effect redirects if the user is not an admin
  React.useEffect(() => {
    if (!isUserLoading && authUser?.email !== 'admin@nxtwave.co.in') {
      router.push('/login');
    }
  }, [authUser, isUserLoading, router]);

  React.useEffect(() => {
    if (!db || authUser?.email !== 'admin@nxtwave.co.in') return;
    
    // The query for pending users is now allowed by security rules
    const unsub = getPendingUsers(db, (users) => {
      setPendingUsers(users);
    });

    return () => unsub();
  }, [db, authUser]);

  if (isUserLoading || authUser?.email !== 'admin@nxtwave.co.in') {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
           <p>Loading...</p>
        </div>
    );
  }

  const handleApproval = async (userId: string, approve: boolean) => {
    if (!db) return;
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;

    if (approve) {
      await approveUser(db, userId);
      toast({
          title: `User Approved`,
          description: `${user.name}'s account has been approved.`,
      });
    } else {
      await rejectUser(db, userId);
       toast({
          title: `User Rejected`,
          description: `${user.name}'s account has been rejected.`,
          variant: "destructive"
      });
    }
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2">
            <div className="bg-primary/20 text-primary p-2 rounded-lg">
                <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-headline font-semibold">InfluenceWise</h1>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
              <Link href={`/admin/approvals`} className="w-full">
                <SidebarMenuButton isActive size="lg">
                  <CheckCircle />
                  Approvals
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/login" className="w-full">
                        <SidebarMenuButton size="lg">
                            <LogOut />
                            Log Out
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="max-h-screen overflow-auto">
        <main className="p-4 md:p-6 relative">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h2 className="text-3xl font-headline font-bold tracking-tight">User Approvals</h2>
                </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Pending Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                  {pendingUsers.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {pendingUsers.map(user => (
                          <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                              <TableCell className="space-x-2">
                                  <Button size="sm" onClick={() => handleApproval(user.id, true)}>Approve</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleApproval(user.id, false)}>Reject</Button>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                  ) : (
                      <p className="text-muted-foreground pt-4">No pending user registrations.</p>
                  )}
              </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminApprovalsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AdminApprovalsContent />
    </React.Suspense>
  );
}
