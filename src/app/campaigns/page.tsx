
"use client";

import * as React from "react";
import Link from "next/link";
import {
  LogOut,
  Megaphone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Campaign, Influencer } from "@/lib/types";
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
import { format } from "date-fns";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

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
                <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">InfluenceWise</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" className="w-full">
                <SidebarMenuButton>
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/campaigns" className="w-full">
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
                    <Button><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
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
                          {campaign.approved ? (
                            <Badge>Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
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
    </SidebarProvider>
  );
}
