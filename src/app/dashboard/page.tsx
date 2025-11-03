
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  Users,
  UserRound,
} from "lucide-react";
import { Influencer, Campaign, UserRole, ApprovalStatus } from "@/lib/types";
import { influencers as initialInfluencers, campaigns as initialCampaigns } from "@/lib/data";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
  const variant = {
    Approved: "success",
    Pending: "warning",
    Rejected: "destructive",
    Completed: "completed",
  }[status] as "success" | "warning" | "destructive" | "completed" | "default" | "secondary" | "outline" | null | undefined;

  return (
    <Badge variant={variant} className="flex items-center gap-2">
      {status}
    </Badge>
  );
};

function DashboardContent() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) || "Level 2";
  const initialName = searchParams.get('name') || "Jane Doe";


  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);
  const [userName, setUserName] = React.useState<string>(initialName);
  
  // Analytics data
  const totalInfluencers = influencers.length;
  const totalCampaigns = campaigns.length;
  const approvedCampaigns = campaigns.filter(c => c.approvalStatus === 'Approved').length;

  const recentCampaigns = React.useMemo(() => {
    return campaigns
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [campaigns]);

  const getInfluencerById = (id: string) => {
    return influencers.find(influencer => influencer.id === id);
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
                <SidebarMenuButton isActive size="lg">
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
                    <h2 className="text-3xl font-headline font-bold tracking-tight">Dashboard</h2>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Viewing as:</span>
                    <Badge variant="outline">{userRole}</Badge>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInfluencers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCampaigns}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Campaigns</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedCampaigns}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaign Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCampaigns.map(campaign => {
                      const influencer = getInfluencerById(campaign.influencerId);
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            {influencer ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person face" />
                                  <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>{influencer.name}</div>
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell><Badge variant="outline">{campaign.department}</Badge></TableCell>
                          <TableCell>{format(new Date(campaign.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <StatusBadge status={campaign.approvalStatus} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}

    