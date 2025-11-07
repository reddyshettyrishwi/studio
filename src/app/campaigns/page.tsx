
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
} from "lucide-react";
import { Campaign, Influencer, ApprovalStatus } from "@/lib/types";
import { logCampaign as logCampaignToDb, updateCampaignStatus } from "@/lib/data";
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
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import LogCampaignDialog from "@/components/log-campaign-dialog";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useAuth } from "@/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

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

function CampaignsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialName = searchParams.get('name') || "User";

  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [influencers, setInfluencers] = React.useState<Influencer[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogCampaignOpen, setLogCampaignOpen] = React.useState(false);
  const [userName, setUserName] = React.useState<string>(initialName);

  React.useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, isUserLoading, router]);


  React.useEffect(() => {
    if (!db || !authUser) return;
    const unsubCampaigns = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date instanceof Timestamp
          ? data.date.toDate().toISOString()
          : data.date;
        return {
          id: doc.id,
          ...data,
          date,
        } as Campaign;
      });
      setCampaigns(fetchedCampaigns);
    },
    (error) => {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: 'campaigns',
      });
      errorEmitter.emit('permission-error', contextualError);
    });

    const unsubInfluencers = onSnapshot(collection(db, "influencers"), (snapshot) => {
      const fetchedInfluencers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Influencer));
      setInfluencers(fetchedInfluencers);
    },
    (error) => {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: 'influencers',
        });
        errorEmitter.emit('permission-error', contextualError);
    });

    return () => {
      unsubCampaigns();
      unsubInfluencers();
    };
  }, [db, authUser]);


  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

  const getInfluencerById = (id?: string) => {
    if (!id) return undefined;
    return influencers.find(influencer => influencer.id === id);
  }
  
  const logCampaign = (newCampaign: Omit<Campaign, 'id' | 'approvalStatus'>) => {
    if (!db) return;
    logCampaignToDb(db, {
      ...newCampaign,
      approvalStatus: 'Pending',
    });
  };

  const handleLogout = () => {
    auth?.signOut();
    router.push('/login');
  }

  if (isUserLoading || !authUser) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>
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
              <Link href={`/dashboard?name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/influencers?name=${userName}`} className="w-full">
                <SidebarMenuButton size="lg">
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/campaigns?name=${userName}`} className="w-full">
                <SidebarMenuButton isActive size="lg">
                  <Megaphone />
                  Campaigns
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/messaging?name=${userName}`} className="w-full">
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
                    <SidebarMenuButton size="lg" onClick={handleLogout}>
                        <LogOut />
                        Log Out
                    </SidebarMenuButton>
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
                        <TableCell>{format(parseISO(campaign.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">{campaign.deliverables}</TableCell>
                        <TableCell>
                            <StatusBadge status={campaign.approvalStatus} />
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
