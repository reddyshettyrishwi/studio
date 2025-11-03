
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  Users,
  UserRound,
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
  SidebarSeparator,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";

function AdminApprovalsContent() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) || "Admin";
  const initialName = searchParams.get('name') || "Admin User";
  const db = useFirestore();

  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = React.useState<PendingUser[]>([]);
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);
  const [userName, setUserName] = React.useState<string>(initialName);
  
  React.useEffect(() => {
    if (!db) return;
    const unsub = getPendingUsers(db, (users) => {
      setPendingUsers(users);
    });
    return () => unsub();
  }, [db]);

  if (userRole !== 'Admin') {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to view this page.</p>
                    <Link href="/login">
                        <Button className="mt-4">Return to Login</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  const handleApproval = async (userId: string, approve: boolean) => {
    if (!db) return;
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;

    if (approve) {
      await approveUser(db, userId);
    } else {
      await rejectUser(db, userId);
    }

    toast({
        title: `User ${approve ? 'Approved' : 'Rejected'}`,
        description: `${user.name}'s account has been ${approve ? 'approved' : 'rejected'}.`,
    });
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
            <div className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                   <AvatarFallback className="bg-primary/20 text-primary">
                    <UserRound className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userRole}</p>
                </div>
              </div>
            </div>
            <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={`/dashboard?role=${userRole}&name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/?role=${userRole}&name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/campaigns?role=${userRole}&name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Megaphone />
                  Campaigns
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/messaging?role=${userRole}&name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <MessageSquare />
                  Messaging
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href={`/admin/approvals?role=${userRole}&name=${userName}`} className="w-full">
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
