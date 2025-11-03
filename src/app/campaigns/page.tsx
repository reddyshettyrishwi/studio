
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Users,
  Home,
  UserRound,
  CheckCircle,
} from "lucide-react";
import { Campaign, Influencer, ApprovalStatus, UserRole } from "@/lib/types";
import { campaigns as initialCampaigns, influencers as initialInfluencers } from "@/lib/data";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import LogCampaignDialog from "@/components/log-campaign-dialog";

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

const StatusCircle = ({ status }: { status: ApprovalStatus }) => {
  const color = {
    Approved: "bg-green-500/70",
    Pending: "bg-yellow-500/70",
    Rejected: "bg-red-500/70",
    Completed: "bg-blue-500/70",
  }[status];
  return <div className={`h-2.5 w-2.5 rounded-full ${color}`} />;
};

function CampaignsContent() {
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || "Manager";
  const initialName = searchParams.get('name') || "Jane Doe";


  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogCampaignOpen, setLogCampaignOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);
  const [userName, setUserName] = React.useState<string>(initialName);


  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

  const getInfluencerById = (id: string) => {
    return influencers.find(influencer => influencer.id === id);
  }
  
  const logCampaign = (newCampaign: Omit<Campaign, 'id' | 'approvalStatus'>) => {
    const campaignToAdd: Campaign = {
      ...newCampaign,
      id: `camp-${Date.now()}`,
      approvalStatus: 'Pending',
    };
    setCampaigns(prev => [campaignToAdd, ...prev]);
  };

  const handleStatusChange = (campaignId: string, newStatus: ApprovalStatus) => {
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(c =>
        c.id === campaignId ? { ...c, approvalStatus: newStatus } : c
      )
    );
  };

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
                <SidebarMenuButton isActive size="lg">
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
        <main className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h2 className="text-3xl font-headline font-bold tracking-tight">Campaigns</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by campaign name..." 
                            className="pl-9 w-full md:w-64" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setLogCampaignOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
                </div>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Deliverables</TableHead>
                    <TableHead>Approval Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map(campaign => {
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
                        <TableCell>₹{campaign.pricePaid.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{format(new Date(campaign.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">{campaign.deliverables}</TableCell>
                        <TableCell>
                           {userRole === 'Manager' ? (
                            <Select
                              value={campaign.approvalStatus}
                              onValueChange={(newStatus: ApprovalStatus) => handleStatusChange(campaign.id, newStatus)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    {campaign.approvalStatus}
                                    <StatusCircle status={campaign.approvalStatus} />
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Approved">
                                  <div className="flex items-center gap-2">
                                    Approved <StatusCircle status="Approved" />
                                  </div>
                                </SelectItem>
                                <SelectItem value="Pending">
                                   <div className="flex items-center gap-2">
                                    Pending <StatusCircle status="Pending" />
                                  </div>
                                </SelectItem>
                                <SelectItem value="Rejected">
                                   <div className="flex items-center gap-2">
                                    Rejected <StatusCircle status="Rejected" />
                                  </div>
                                </SelectItem>
                                <SelectItem value="Completed">
                                   <div className="flex items-center gap-2">
                                    Completed <StatusCircle status="Completed" />
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <StatusBadge status={campaign.approvalStatus} />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
        </main>
      </SidebarInset>
       <LogCampaignDialog
          isOpen={isLogCampaignOpen}
          onClose={() => setLogCampaignOpen(false)}
          onLogCampaign={logCampaign}
          influencers={influencers}
        />
    </SidebarProvider>
  );
}

export default function CampaignsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <CampaignsContent />
    </React.Suspense>
  );
}
