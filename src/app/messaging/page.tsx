
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import {
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  Users,
  UserRound,
  CheckCircle,
} from "lucide-react";
import { UserRole } from "@/lib/types";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function MessagingContent() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) || "Manager";
  const initialName = searchParams.get('name') || "Jane Doe";

  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);
  const [userName, setUserName] = React.useState<string>(initialName);
  
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
              <Link href={`/influencers?role=${userRole}&name=${userName}`} className="w-full">
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
                <SidebarMenuButton isActive size="lg">
                  <MessageSquare />
                  Messaging
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            {userRole === 'Admin' && (
              <SidebarMenuItem>
                <Link href={`/admin/approvals?role=${userRole}&name=${userName}`} className="w-full">
                  <SidebarMenuButton size="lg">
                    <CheckCircle />
                    Approvals
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
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
                    <h2 className="text-3xl font-headline font-bold tracking-tight">Messaging</h2>
                </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">The messaging feature is under construction. Check back soon!</p>
              </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MessagingPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <MessagingContent />
    </React.Suspense>
  );
}
