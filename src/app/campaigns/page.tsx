
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
import {
  logCampaign as logCampaignToDb,
  updateCampaignStatus,
  completeCampaign as completeCampaignInDb,
} from "@/lib/data";
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
import CompleteCampaignDialog, {
  CompleteCampaignFormValues,
} from "@/components/complete-campaign-dialog";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useAuth } from "@/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ViewingAsIndicator from "@/components/viewing-as-indicator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

const STATUS_METADATA: Record<ApprovalStatus, { label: string; dotClass: string }> = {
  Approved: { label: "Approved", dotClass: "bg-emerald-400" },
  Pending: { label: "Pending", dotClass: "bg-amber-400" },
  Rejected: { label: "Rejected", dotClass: "bg-red-500" },
  Completed: { label: "Completed", dotClass: "bg-sky-400" },
};

const MANAGER_STATUS_CHOICES: ApprovalStatus[] = ["Approved", "Pending", "Rejected"];

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
  const meta = STATUS_METADATA[status] ?? { label: status, dotClass: "bg-muted-foreground/60" };

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
      <span>{meta.label}</span>
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden />
    </span>
  );
};

function CampaignsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [influencers, setInfluencers] = React.useState<Influencer[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogCampaignOpen, setLogCampaignOpen] = React.useState(false);
  const [userName, setUserName] = React.useState<string>("User");
  const [role, setRole] = React.useState<"manager" | "executive">("manager");
    const isExecutive = role === "executive";
    const isManager = role === "manager";
    const canManageCampaigns = role === "executive" || role === "manager";

  React.useEffect(() => {
    if (!searchParams) return;
    const nextRoleParam = (searchParams.get('role') || 'manager').toLowerCase();
    const nextRole = nextRoleParam === 'executive' ? 'executive' : 'manager';
    setRole(prev => (prev === nextRole ? prev : nextRole));

    const nextName = searchParams.get('name') || 'User';
    setUserName(prev => (prev === nextName ? prev : nextName));
  }, [searchParams]);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({ name: userName, role });
    return params.toString();
  }, [role, userName]);

  const dashboardHref = React.useMemo(() => `/dashboard?${queryString}`, [queryString]);
  const [isCompletionDialogOpen, setCompletionDialogOpen] = React.useState(false);
  const [completionCampaignId, setCompletionCampaignId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.replace('/');
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
        const completionDetails = data.completionDetails
          ? {
              ...data.completionDetails,
              reportedAt:
                data.completionDetails.reportedAt instanceof Timestamp
                  ? data.completionDetails.reportedAt.toDate().toISOString()
                  : data.completionDetails.reportedAt,
            }
          : undefined;
        return {
          id: doc.id,
          ...data,
          date,
          completionDetails,
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

  const completionCampaign = React.useMemo(() => {
    if (!completionCampaignId) return null;
    return campaigns.find(campaign => campaign.id === completionCampaignId) ?? null;
  }, [campaigns, completionCampaignId]);

  const getInfluencerById = (id?: string) => {
    if (!id) return undefined;
    return influencers.find(influencer => influencer.id === id);
  }
  
  const logCampaign = (newCampaign: Omit<Campaign, 'id' | 'approvalStatus'>) => {
    if (!db || !canManageCampaigns) return;
    logCampaignToDb(db, {
      ...newCampaign,
      approvalStatus: 'Pending',
    });
  };

  const handleLogout = () => {
    auth?.signOut();
    router.push('/');
  }

  const handleStatusChange = (campaignId: string, status: ApprovalStatus) => {
    if (!db || !isManager) return;
    const current = campaigns.find(campaign => campaign.id === campaignId);
    if (current?.approvalStatus === status) return;
    updateCampaignStatus(db, campaignId, status);
  };

  const handleCompletionSubmit = (values: CompleteCampaignFormValues) => {
    if (!db || !canManageCampaigns || !completionCampaign) return;
    completeCampaignInDb(db, completionCampaign.id, {
      expectedReach: values.expectedReach,
      outcomes: values.outcomes,
      reportedBy: authUser?.uid ?? "unknown",
      reportedByName: userName,
    });
    setCompletionDialogOpen(false);
    setCompletionCampaignId(null);
  };

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
                <SidebarMenuButton isActive size="lg">
                  <Megaphone />
                  Campaigns
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/messaging?${queryString}`} className="w-full">
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-3xl font-headline font-bold tracking-tight">Campaigns</h2>
          </div>
          <ViewingAsIndicator role={role} className="self-start md:self-auto" />
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
                    {canManageCampaigns && (
            <Button onClick={() => setLogCampaignOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          )}
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
                    {canManageCampaigns && <TableHead>Completion</TableHead>}
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
                          {isManager ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-2 border-border/70 bg-muted/40"
                                >
                                  <span>{STATUS_METADATA[campaign.approvalStatus]?.label ?? campaign.approvalStatus}</span>
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      STATUS_METADATA[campaign.approvalStatus]?.dotClass ?? "bg-muted-foreground/60"
                                    }`}
                                    aria-hidden
                                  />
                                  <ChevronDown className="h-3 w-3 opacity-70" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Update status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {MANAGER_STATUS_CHOICES.map(option => {
                                  const meta = STATUS_METADATA[option] ?? { label: option, dotClass: "bg-muted-foreground/60" };
                                  const isActive = campaign.approvalStatus === option;
                                  return (
                                    <DropdownMenuItem
                                      key={option}
                                      onClick={() => handleStatusChange(campaign.id, option)}
                                      className="flex items-center justify-between gap-4"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden />
                                        <span>{meta.label}</span>
                                      </span>
                                      {isActive && <Check className="h-4 w-4 text-primary" />}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <StatusBadge status={campaign.approvalStatus} />
                          )}
                        </TableCell>
                        {canManageCampaigns && (
                          <TableCell>
                            {campaign.approvalStatus === "Completed" && campaign.completionDetails ? (
                              <div className="space-y-1 text-sm">
                                <div className="font-medium">
                                  Expected reach: {campaign.completionDetails.expectedReach.toLocaleString("en-IN")}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {campaign.completionDetails.outcomes}
                                </p>
                                {campaign.completionDetails.reportedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Logged {format(parseISO(campaign.completionDetails.reportedAt), "dd MMM yyyy")}
                                  </p>
                                )}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0"
                                  onClick={() => {
                                    setCompletionCampaignId(campaign.id);
                                    setCompletionDialogOpen(true);
                                  }}
                                >
                                  Update details
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setCompletionCampaignId(campaign.id);
                                  setCompletionDialogOpen(true);
                                }}
                                disabled={campaign.approvalStatus !== "Approved"}
                                title={
                                  campaign.approvalStatus !== "Approved"
                                    ? "Approve the campaign before logging completion."
                                    : undefined
                                }
                              >
                                Log completion
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
        </main>
      </SidebarInset>
           {canManageCampaigns && (
             <LogCampaignDialog
                isOpen={isLogCampaignOpen}
                onClose={() => setLogCampaignOpen(false)}
                onLogCampaign={logCampaign}
                influencers={influencers}
              />
           )}
           {canManageCampaigns && (
             <CompleteCampaignDialog
               campaign={completionCampaign}
               isOpen={isCompletionDialogOpen}
               onClose={() => {
                 setCompletionDialogOpen(false);
                 setCompletionCampaignId(null);
               }}
               onSubmit={handleCompletionSubmit}
             />
           )}
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
