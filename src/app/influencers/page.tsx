
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  Filter,
  Instagram,
  LayoutGrid,
  List,
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Users,
  Youtube,
  Home,
  UserRound,
  Trash2,
  PenLine,
} from "lucide-react";
import { Influencer, Platform } from "@/lib/types";
import { CATEGORY_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/options";
import { addInfluencer as addInfluencerToDb, deleteInfluencer, updateInfluencer as updateInfluencerInDb } from "@/lib/data";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AddInfluencerDialog from "@/components/add-influencer-dialog";
import { format, isPast } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useAuth } from "@/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ViewingAsIndicator from "@/components/viewing-as-indicator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


const platformIcons: Record<Platform, React.ReactNode> = {
  YouTube: <Youtube className="h-4 w-4 text-red-500" />,
  Instagram: <Instagram className="h-4 w-4 text-pink-500" />,
};

const formatHandle = (handle: string) => handle.replace(/^@+/u, "");

function InfluencersContent() {
  const searchParams = useSearchParams()
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const [initialInfluencers, setInitialInfluencers] = React.useState<Influencer[]>([]);
  const [influencers, setInfluencers] = React.useState<Influencer[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = React.useState<"all" | "mine">("all");
  const [userName, setUserName] = React.useState<string>("User");
  const [role, setRole] = React.useState<"manager" | "executive">("manager");
  const isExecutive = role === "executive";
  const canManageInfluencers = role === "executive" || role === "manager";
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [influencerBeingEdited, setInfluencerBeingEdited] = React.useState<Influencer | null>(null);

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


  const [filters, setFilters] = React.useState<{
    category: Set<string>;
    language: Set<string>;
  }>({
    category: new Set(),
    language: new Set(),
  });
  const [categoryFilterSearch, setCategoryFilterSearch] = React.useState("");
  const [languageFilterSearch, setLanguageFilterSearch] = React.useState("");
  
  const [isAddInfluencerOpen, setAddInfluencerOpen] = React.useState(false);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = React.useState<Influencer | null>(null);

  React.useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.replace('/');
    }
  }, [authUser, isUserLoading, router]);

  React.useEffect(() => {
    if (!db || !authUser) return;
    const unsub = onSnapshot(collection(db, "influencers"), (snapshot) => {
      const fetchedInfluencers = snapshot.docs.map(doc => {
        const data = doc.data();
        const lastPromotionDate = data.lastPromotionDate instanceof Timestamp
          ? data.lastPromotionDate.toDate().toISOString()
          : data.lastPromotionDate;

        // Handle legacy records that stored a single `language` string.
        const normalizedLanguages = Array.isArray(data.languages)
          ? data.languages
          : typeof data.language === "string"
            ? [data.language]
            : [];

        const {
          language: _deprecatedLanguage,
          languages: _languages,
          createdById,
          createdByName,
          ...rest
        } = data;

        return {
          id: doc.id,
          ...rest,
          createdById: typeof createdById === "string" ? createdById : "",
          createdByName: typeof createdByName === "string" ? createdByName : undefined,
          languages: normalizedLanguages,
          lastPromotionDate,
        } as Influencer;
      });
      setInfluencers(fetchedInfluencers);
      setInitialInfluencers(fetchedInfluencers);
    },
    (error) => {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: 'influencers',
      });
      errorEmitter.emit('permission-error', contextualError);
    });
    return () => unsub();
  }, [db, authUser]);


  const categories = React.useMemo(() => {
    const defaults = [...CATEGORY_OPTIONS];
    const extras = initialInfluencers
      .map((influencer) => influencer.category)
      .filter(
        (category): category is string =>
          Boolean(category) && !defaults.includes(category)
      );
    const uniqueExtras = Array.from(new Set(extras));
    return [...defaults, ...uniqueExtras];
  }, [initialInfluencers]);

  const languages = React.useMemo(() => {
    const defaults = [...LANGUAGE_OPTIONS];
    const extras = initialInfluencers
      .flatMap((influencer) => influencer.languages ?? [])
      .filter((language) => !defaults.includes(language));
    const uniqueExtras = Array.from(new Set(extras));
    return [...defaults, ...uniqueExtras];
  }, [initialInfluencers]);

  const filteredCategoryOptions = React.useMemo(() => {
    const query = categoryFilterSearch.trim().toLowerCase();
    return categories.filter((category) =>
      query ? category.toLowerCase().includes(query) : true
    );
  }, [categories, categoryFilterSearch]);

  const filteredLanguageOptions = React.useMemo(() => {
    const query = languageFilterSearch.trim().toLowerCase();
    return languages.filter((language) =>
      query ? language.toLowerCase().includes(query) : true
    );
  }, [languages, languageFilterSearch]);

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const userId = authUser?.uid ?? "";
  const userDisplayName = authUser?.displayName ?? authUser?.email ?? undefined;

  const filteredInfluencers = React.useMemo(() => {
    return influencers.filter(influencer => {
      if (activeTab === "mine" && influencer.createdById !== userId) {
        return false;
      }

      const normalizedQuery = searchQuery.trim().toLowerCase();
      const handleQuery = normalizedQuery.replace(/^@+/u, "");
      const searchMatch =
        normalizedQuery === "" ||
        influencer.name.toLowerCase().includes(normalizedQuery) ||
        influencer.platforms.some((p) =>
          formatHandle(p.handle).toLowerCase().includes(handleQuery)
        );

      const categoryMatch = filters.category.size === 0 || filters.category.has(influencer.category);
      const languageMatch =
        filters.language.size === 0 ||
        (influencer.languages ?? []).some((lang) => filters.language.has(lang));

      return searchMatch && categoryMatch && languageMatch;
    });
  }, [influencers, searchQuery, filters, activeTab, userId]);

  const addInfluencer = async (newInfluencer: Omit<Influencer, "id" | "avatar">) => {
    if (!db || !canManageInfluencers) return;
     try {
      await addInfluencerToDb(db, newInfluencer);
      toast({
        title: "Success!",
        description: `${newInfluencer.name} has been added to the repository.`,
      });
      setAddInfluencerOpen(false);
    } catch (error: any) {
      toast({
        title: "Duplicate Found",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const updateInfluencer = async (influencerId: string, updatedInfluencer: Omit<Influencer, "id" | "avatar">) => {
    if (!db || !canManageInfluencers) return;
    try {
      await updateInfluencerInDb(db, influencerId, updatedInfluencer);
      toast({
        title: "Influencer Updated",
        description: `${updatedInfluencer.name} has been updated successfully.`,
      });
      setEditDialogOpen(false);
      setInfluencerBeingEdited(null);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message ?? "We couldn't update this influencer. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteInfluencer = async () => {
    if (!db || !selectedInfluencer) return;
    
    deleteInfluencer(db, selectedInfluencer.id);
    
    toast({
        title: "Influencer Deleted",
        description: `${selectedInfluencer.name} has been removed from the repository.`,
    });
    setConfirmDeleteOpen(false);
    setSelectedInfluencer(null);
  };

  const isDataOutdated = (dateString: string) => {
    const date = new Date(dateString);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return isPast(date) && date < sixMonthsAgo;
  };
  
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
                <SidebarMenuButton isActive size="lg">
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
        <main className="p-4 md:p-6 relative">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-3xl font-headline font-bold tracking-tight">Influencers</h2>
          </div>
          <ViewingAsIndicator role={role} className="self-start md:self-auto" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or handle..." 
              className="pl-9 w-full md:w-64" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
                    
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                setCategoryFilterSearch("");
                setLanguageFilterSearch("");
              }
            }}
          >
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto justify-start">
              <Filter className="mr-2 h-4 w-4"/>
              Filters
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 pb-2">
              <Input
                value={categoryFilterSearch}
                onChange={(event) => setCategoryFilterSearch(event.target.value)}
                placeholder="Search categories..."
              />
            </div>
            {filteredCategoryOptions.length ? (
              filteredCategoryOptions.map(cat => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={filters.category.has(cat)}
                  onCheckedChange={() => handleFilterChange('category', cat)}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>
            )}
             <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 pb-2">
              <Input
                value={languageFilterSearch}
                onChange={(event) => setLanguageFilterSearch(event.target.value)}
                placeholder="Search languages..."
              />
            </div>
            {filteredLanguageOptions.length ? (
              filteredLanguageOptions.map(lang => (
                <DropdownMenuCheckboxItem
                  key={lang}
                  checked={filters.language.has(lang)}
                  onCheckedChange={() => handleFilterChange('language', lang)}
                >
                  {lang}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>
            )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "all" | "mine")}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-2 w-full md:w-auto">
              <TabsTrigger value="all">All Influencers</TabsTrigger>
              <TabsTrigger value="mine">My Influencers</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1 bg-secondary/50 backdrop-blur-sm p-1 rounded-md">
            <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-5 w-5"/>
            </Button>
            <Button variant={viewMode === 'table' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('table')}>
              <List className="h-5 w-5"/>
            </Button>
          </div>

                    {canManageInfluencers && (
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={() => setAddInfluencerOpen(true)}><Plus className="mr-2"/>Add Influencer</Button>
            </div>
          )}
        </div>
      </div>
             <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="text-sm text-muted-foreground">
                    {filteredInfluencers.length} influencers found.
                </div>
             </div>

            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredInfluencers.map(influencer => (
                    <Dialog key={influencer.id} onOpenChange={(open) => { if (!open) setSelectedInfluencer(null)}}>
                        <DialogTrigger asChild>
                        <Card className="cursor-pointer transition-all hover:shadow-glow-primary" onClick={() => setSelectedInfluencer(influencer)}>
                            <CardHeader>
                            <div className="flex flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person portrait" />
                                <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <CardTitle className="font-headline text-lg">{influencer.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{influencer.platforms.map(p => `@${formatHandle(p.handle)}`).join(', ')}</p>
                                </div>
                            </div>
                            </CardHeader>
                        </Card>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg bg-card/80 backdrop-blur-sm">
                        <DialogHeader>
                            <div className="flex flex-row items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <DialogTitle className="font-headline text-2xl">{influencer.name}</DialogTitle>
                                    <div className="flex items-center gap-2 flex-wrap">
                                    {influencer.platforms.map(p => (
                                        <div key={p.platform} className="flex items-center gap-1 text-sm text-muted-foreground">
                                        {platformIcons[p.platform]}
                                        <span>@{formatHandle(p.handle)}</span>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>
                            <div className="pt-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                    <Badge variant="secondary">{influencer.category}</Badge>
                                    {(influencer.languages ?? []).length ? (
                                      (influencer.languages ?? []).map((lang) => (
                                        <Badge key={lang} variant="outline">{lang}</Badge>
                                      ))
                                    ) : (
                                      <Badge variant="outline">N/A</Badge>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                {influencer.platforms.map(p => (
                                    <div key={p.platform}>
                                    <p className="font-bold flex items-center gap-2">{platformIcons[p.platform]} {p.channelName}</p>
                                    </div>
                                ))}
                                </div>
                                <div className="space-y-2 text-sm">
                                <p><strong className="font-bold">Last Price Paid:</strong> {influencer.lastPricePaid ? `₹${influencer.lastPricePaid.toLocaleString('en-IN')}` : 'N/A'}</p>
                                <div className="flex items-center">
                                    <strong className="font-bold mr-1">Last Promo:</strong> {format(new Date(influencer.lastPromotionDate), 'dd MMM yyyy')}
                                    {isDataOutdated(influencer.lastPromotionDate) && <Badge variant="destructive" className="ml-2">Outdated</Badge>}
                                </div>
                                <p><strong className="font-bold">Email:</strong> {influencer.email}</p>
                                <p><strong className="font-bold">Mobile:</strong> {influencer.mobile}</p>
                                </div>
                            </div>
                             <DialogFooter className="justify-between">
                                {activeTab === "mine" && influencer.createdById === userId ? (
                                  <>
                                    <DialogClose asChild>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setInfluencerBeingEdited(influencer);
                                          setEditDialogOpen(true);
                                        }}
                                      >
                                        <PenLine className="mr-2 h-4 w-4" />
                                        Edit
                                      </Button>
                                    </DialogClose>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="rounded-full"
                                        onClick={() => setSelectedInfluencer(influencer)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </>
                                ) : null}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    ))}
                </div>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Channels</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Last Price Paid</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Last Promo</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInfluencers.map(influencer => (
                                <TableRow key={influencer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person face" />
                                                    <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium">{influencer.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                {influencer.platforms.map(p => (
                                                    <div key={p.platform} className="flex items-center gap-2">
                                                        {platformIcons[p.platform]}
                                                        <div>
                                                            <div className="font-medium">{p.channelName}</div>
                                                            <span className="text-xs text-muted-foreground">@{formatHandle(p.handle)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">{influencer.category}</Badge>
                                            {(influencer.languages ?? []).length ? (
                                              (influencer.languages ?? []).map((lang) => (
                                                <Badge key={lang} variant="outline">{lang}</Badge>
                                              ))
                                            ) : (
                                              <Badge variant="outline">N/A</Badge>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>{influencer.lastPricePaid ? `₹${influencer.lastPricePaid.toLocaleString('en-IN')}` : 'N/A'}</TableCell>
                                        <TableCell>{influencer.email}</TableCell>
                                        <TableCell>
                                        <div className="flex items-center">
                                            {format(new Date(influencer.lastPromotionDate), 'dd MMM yyyy')}
                                            {isDataOutdated(influencer.lastPromotionDate) && <Badge variant="destructive" className="ml-2">Outdated</Badge>}
                                        </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            {activeTab === "mine" && influencer.createdById === userId ? (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setInfluencerBeingEdited(influencer);
                                                    setEditDialogOpen(true);
                                                  }}
                                                >
                                                  <PenLine className="mr-1 h-4 w-4" /> Edit
                                                </Button>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedInfluencer(influencer)}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                              </>
                                            ) : null}
                                          </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        influencer <span className="font-bold">{selectedInfluencer?.name}</span> and remove their data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedInfluencer(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteInfluencer}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            {canManageInfluencers && (
              <div className="fixed bottom-4 right-4 flex md:hidden flex-col gap-2">
                  <Button onClick={() => setAddInfluencerOpen(true)} size="icon" className="h-14 w-14 rounded-full shadow-lg"><Plus className="h-6 w-6"/></Button>
              </div>
            )}
            
            {canManageInfluencers && (
              <AddInfluencerDialog
                isOpen={isAddInfluencerOpen}
                onClose={() => setAddInfluencerOpen(false)}
                currentUser={{ id: userId, name: userDisplayName }}
                onAddInfluencer={addInfluencer}
              />
            )}

            {canManageInfluencers && influencerBeingEdited && (
              <AddInfluencerDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                  setEditDialogOpen(false);
                  setInfluencerBeingEdited(null);
                }}
                currentUser={{ id: userId, name: userDisplayName }}
                onAddInfluencer={addInfluencer}
                mode="edit"
                initialInfluencer={influencerBeingEdited}
                onUpdateInfluencer={updateInfluencer}
              />
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function InfluencersPage() {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <InfluencersContent />
      </React.Suspense>
    );
  }
