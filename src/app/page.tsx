
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {
  Filter,
  Globe,
  Instagram,
  LayoutGrid,
  List,
  LogOut,
  Megaphone,
  Plus,
  Search,
  Users,
  Youtube,
  CheckCircle,
  Home,
} from "lucide-react";
import { Influencer, Campaign, UserRole, Platform } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";

const platformIcons: Record<Platform, React.ReactNode> = {
  YouTube: <Youtube className="h-4 w-4 text-red-500" />,
  Instagram: <Instagram className="h-4 w-4 text-pink-500" />,
};

const maskSensitiveData = (data: string, role: UserRole) => {
  if (role === 'Level 1') {
    return '••••••••••';
  }
  return data;
};

function Influencers() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) || "Level 2";

  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);

  const [filters, setFilters] = React.useState<{
    category: Set<string>;
    region: Set<string>;
    language: Set<string>;
  }>({
    category: new Set(),
    region: new Set(),
    language: new Set(),
  });
  
  const [isAddInfluencerOpen, setAddInfluencerOpen] = React.useState(false);

  const categories = React.useMemo(() => [...new Set(initialInfluencers.map(i => i.category))], []);
  const regions = React.useMemo(() => [...new Set(initialInfluencers.map(i => i.region))], []);
  const languages = React.useMemo(() => [...new Set(initialInfluencers.map(i => i.language))], []);

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

  const filteredInfluencers = React.useMemo(() => {
    return influencers.filter(influencer => {
      const searchMatch =
        searchQuery === "" ||
        influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        influencer.platforms.some(p => p.handle.toLowerCase().includes(searchQuery.toLowerCase()));

      const categoryMatch = filters.category.size === 0 || filters.category.has(influencer.category);
      const regionMatch = filters.region.size === 0 || filters.region.has(influencer.region);
      const languageMatch = filters.language.size === 0 || filters.language.has(influencer.language);

      return searchMatch && categoryMatch && regionMatch && languageMatch;
    });
  }, [influencers, searchQuery, filters]);

  const addInfluencer = (newInfluencer: Omit<Influencer, 'id' | 'avatar'>) => {
    const influencerToAdd: Influencer = {
      ...newInfluencer,
      id: `inf-${Date.now()}`,
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`
    };
    setInfluencers(prev => [influencerToAdd, ...prev]);
  };
  
  const isDataOutdated = (dateString: string) => {
    const date = new Date(dateString);
    // e.g. outdated if older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return isPast(date) && date < sixMonthsAgo;
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
              <Link href={`/dashboard?role=${userRole}`} className="w-full">
                <SidebarMenuButton>
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/?role=${userRole}`} className="w-full">
                <SidebarMenuButton isActive>
                  <Users />
                  Influencers
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href={`/campaigns?role=${userRole}`} className="w-full">
                <SidebarMenuButton>
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
        <main className="p-4 md:p-6 relative">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h2 className="text-3xl font-headline font-bold tracking-tight">Influencers</h2>
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto justify-start">
                          <Filter className="mr-2 h-4 w-4"/>
                          Filters
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {categories.map(cat => (
                            <DropdownMenuCheckboxItem key={cat} checked={filters.category.has(cat)} onCheckedChange={() => handleFilterChange('category', cat)}>{cat}</DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuLabel>Region</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {regions.map(reg => (
                            <DropdownMenuCheckboxItem key={reg} checked={filters.region.has(reg)} onCheckedChange={() => handleFilterChange('region', reg)}>{reg}</DropdownMenuCheckboxItem>
                        ))}
                         <DropdownMenuLabel>Language</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {languages.map(lang => (
                            <DropdownMenuCheckboxItem key={lang} checked={filters.language.has(lang)} onCheckedChange={() => handleFilterChange('language', lang)}>{lang}</DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 bg-secondary/50 backdrop-blur-sm p-1 rounded-md">
                        <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'table' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('table')}>
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <Button onClick={() => setAddInfluencerOpen(true)}><Plus className="mr-2"/>Add Influencer</Button>
                    </div>
                </div>
            </div>
             <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="text-sm text-muted-foreground">
                    {filteredInfluencers.length} influencers found.
                </div>
             </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredInfluencers.map(influencer => (
                  <Dialog key={influencer.id}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer transition-all hover:shadow-glow-primary">
                        <CardHeader>
                          <div className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person portrait" />
                              <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="font-headline text-lg">{influencer.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{influencer.platforms.map(p => `@${p.handle}`).join(', ')}</p>
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
                                       <span>@{p.handle}</span>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        </div>
                      </DialogHeader>
                        <div className="pt-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                <Badge variant="secondary">{influencer.category}</Badge>
                                <Badge variant="outline">{influencer.region}</Badge>
                                <Badge variant="outline">{influencer.language}</Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              {influencer.platforms.map(p => (
                                <div key={p.platform}>
                                  <p className="font-bold flex items-center gap-2">{platformIcons[p.platform]} {p.channelName}</p>
                                  <p><strong className="font-semibold">Link:</strong> <a href={p.channelLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{p.channelLink}</a></p>
                                  <p><strong className="font-semibold">Avg. Views:</strong> {p.averageViews.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><strong className="font-bold">Last Price Paid:</strong> ${influencer.lastPricePaid.toLocaleString()}</p>
                              <div className="flex items-center">
                                <strong className="font-bold mr-1">Last Promo:</strong> {format(new Date(influencer.lastPromotionDate), 'dd MMM yyyy')}
                                {isDataOutdated(influencer.lastPromotionDate) && <Badge variant="destructive" className="ml-2">Outdated</Badge>}
                              </div>
                              <p><strong className="font-bold">Email:</strong> {maskSensitiveData(influencer.email, userRole)}</p>
                              <p><strong className="font-bold">Mobile:</strong> {maskSensitiveData(influencer.mobile, userRole)}</p>
                            </div>
                        </div>
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
                                                        <a href={p.channelLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">@{p.handle} ({p.averageViews.toLocaleString()} avg views)</a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{influencer.category}</Badge></TableCell>
                                    <TableCell>${influencer.lastPricePaid.toLocaleString()}</TableCell>
                                    <TableCell>{maskSensitiveData(influencer.email, userRole)}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        {format(new Date(influencer.lastPromotionDate), 'dd MMM yyyy')}
                                        {isDataOutdated(influencer.lastPromotionDate) && <Badge variant="destructive" className="ml-2">Outdated</Badge>}
                                      </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <div className="fixed bottom-4 right-4 flex md:hidden flex-col gap-2">
                <Button onClick={() => setAddInfluencerOpen(true)} size="icon" className="h-14 w-14 rounded-full shadow-lg"><Plus className="h-6 w-6"/></Button>
            </div>
            
            <AddInfluencerDialog
              isOpen={isAddInfluencerOpen}
              onClose={() => setAddInfluencerOpen(false)}
              onAddInfluencer={addInfluencer}
            />

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Wrap the main component in a Suspense boundary
export default function InfluencersPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Influencers />
    </React.Suspense>
  );
}
