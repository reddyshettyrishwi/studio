
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LogOut,
  Megaphone,
  Plus,
  Search,
  Users,
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
import { cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
  const variant = {
    Approved: "success",
    Pending: "warning",
    Rejected: "destructive",
  }[status] as "success" | "warning" | "destructive" | "default" | "secondary" | "outline" | null | undefined;

  return <Badge variant={variant}>{status}</Badge>;
};

const statusColors: Record<ApprovalStatus, string> = {
  Approved: "text-success-foreground bg-success hover:bg-success/80",
  Pending: "text-warning-foreground bg-warning hover:bg-warning/80",
  Rejected: "text-destructive-foreground bg-destructive hover:bg-destructive/80",
};

function Campaigns() {
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) | "Level 2";

  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogCampaignOpen, setLogCampaignOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);

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
                <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">InfluenceWise</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={`/?role=${userRole}`} className="w-full">
                <SidebarMenuButton>
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/campaigns?role=${userRole}`} className="w-full">
                <SidebarMenuButton isActive>
                  <Megaphone />
                  Campaigns
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/login" className="w-full">
                        <SidebarMenuButton>
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
                    <TableHead>Price Paid</TableHead>
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
                        <TableCell>${campaign.pricePaid.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(campaign.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">{campaign.deliverables}</TableCell>
                        <TableCell>
                          {userRole === 'Level 2' ? (
                            <Select
                              value={campaign.approvalStatus}
                              onValueChange={(newStatus: ApprovalStatus) => handleStatusChange(campaign.id, newStatus)}
                            >
                              <SelectTrigger className={cn("w-[120px]", statusColors[campaign.approvalStatus])}>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Approved" className="text-success-foreground bg-success/50 focus:bg-success/80 focus:text-success-foreground">Approved</SelectItem>
                                <SelectItem value="Pending" className="text-warning-foreground bg-warning/50 focus:bg-warning/80 focus:text-warning-foreground">Pending</SelectItem>
                                <SelectItem value="Rejected" className="text-destructive-foreground bg-destructive/50 focus:bg-destructive/80 focus:text-destructive-foreground">Rejected</SelectItem>
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

// Wrap the main component in a Suspense boundary
export default function CampaignsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Campaigns />
    </React.Suspense>
  );
}
