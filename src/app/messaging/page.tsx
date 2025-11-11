
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
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import ViewingAsIndicator from "@/components/viewing-as-indicator";

function MessagingContent() {
  const searchParams = useSearchParams()
  const router = useRouter();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const [role, setRole] = React.useState<"manager" | "executive">("manager");
  const [userName, setUserName] = React.useState<string>("User");

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({ name: userName, role });
    return params.toString();
  }, [role, userName]);

  const dashboardHref = React.useMemo(() => `/dashboard?${queryString}`, [queryString]);

  React.useEffect(() => {
    if (!searchParams) return;
    const nextRoleParam = (searchParams.get('role') || 'manager').toLowerCase();
    const nextRole = nextRoleParam === 'executive' ? 'executive' : 'manager';
    setRole(prev => (prev === nextRole ? prev : nextRole));

    const nextName = searchParams.get('name') || 'User';
    setUserName(prev => (prev === nextName ? prev : nextName));
  }, [searchParams]);
  
  React.useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.replace('/');
    }
  }, [authUser, isUserLoading, router]);

  const handleLogout = () => {
    auth?.signOut();
    router.push('/');
  }

  if (isUserLoading || !authUser) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href={dashboardHref} className="flex items-center gap-2" prefetch={false}>
            <div className="bg-primary/20 text-primary p-2 rounded-lg">
                <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-headline font-semibold">Nxthub</h1>
          </Link>
        </SidebarHeader>

        <SidebarContent>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                   <AvatarImage src={authUser.photoURL || ''} alt={userName} />
                   <AvatarFallback className="bg-primary/20 text-primary">
                    <UserRound className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{userName}</p>
                  <p className="text-sm text-muted-foreground">{authUser.email}</p>
                </div>
              </div>
            </div>
            <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={dashboardHref} className="w-full">
                <SidebarMenuButton size="lg">
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/influencers?${queryString}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/campaigns?${queryString}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Megaphone />
                  Campaigns
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/messaging?${queryString}`} className="w-full">
                <SidebarMenuButton isActive size="lg">
                  <MessageSquare />
                  Messaging
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" onClick={handleLogout}>
                        <LogOut />
                        Log Out
                    </SidebarMenuButton>
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
        <ViewingAsIndicator role={role} className="self-start md:self-auto" />
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
