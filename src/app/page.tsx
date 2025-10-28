"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Filter,
  Globe,
  Instagram,
  LayoutGrid,
  List,
  Megaphone,
  Plus,
  Search,
  Users,
  Youtube,
  Twitter
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
import { Separator } from "@/components/ui/separator";
import AddInfluencerDialog from "@/components/add-influencer-dialog";
import LogCampaignDialog from "@/components/log-campaign-dialog";
import { format, isPast } from "date-fns";

const platformIcons: Record<Platform, React.ReactNode> = {
  YouTube: <Youtube className="h-4 w-4 text-red-500" />,
  Instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  Twitter: <Twitter className="h-4 w-4 text-sky-500" />,
  TikTok: <Globe className="h-4 w-4" />,
};

const maskSensitiveData = (data: string, role: UserRole) => {
  if (role === 'Associate') {
    return '••••••••••';
  }
  return data;
};

export default function DashboardPage() {
  const [influencers, setInfluencers] = React.useState<Influencer[]>(initialInfluencers);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [userRole, setUserRole] = React.useState<UserRole>("Manager");

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
  const [isLogCampaignOpen, setLogCampaignOpen] = React.useState(false);

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
        influencer.handle.toLowerCase().includes(searchQuery.toLowerCase());

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

  const logCampaign = (newCampaign: Omit<Campaign, 'id'>) => {
    const campaignToAdd: Campaign = {
      ...newCampaign,
      id: `camp-${Date.now()}`
    };
    setCampaigns(prev => [campaignToAdd, ...prev]);
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
              <SidebarMenuButton isActive>
                <Users />
                Influencers
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Megaphone />
                Campaigns
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="max-h-screen overflow-auto">
        <main className="p-4 md:p-6">
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
                          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50"/>
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

                    <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                        <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'table' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('table')}>
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <Button onClick={() => setLogCampaignOpen(true)} variant="outline"><Megaphone className="mr-2"/>Log Campaign</Button>
                        <Button onClick={() => setAddInfluencerOpen(true)}><Plus className="mr-2"/>Add Influencer</Button>
                    </div>
                </div>
            </div>
             <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                <div className="text-sm text-muted-foreground">
                    {filteredInfluencers.length} influencers found.
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Viewing as:</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {userRole}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem checked={userRole === 'Associate'} onCheckedChange={() => setUserRole('Associate')}>Associate</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={userRole === 'Manager'} onCheckedChange={() => setUserRole('Manager')}>Manager</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={userRole === 'Head'} onCheckedChange={() => setUserRole('Head')}>Head</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
             </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredInfluencers.map(influencer => (
                        <Card key={influencer.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={influencer.avatar} alt={influencer.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="font-headline text-lg">{influencer.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">@{influencer.handle}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    {platformIcons[influencer.platform]}
                                    <Badge variant="secondary">{influencer.category}</Badge>
                                    <Badge variant="outline">{influencer.region}</Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                  <p><strong className="font-medium">Last Price Paid:</strong> ${influencer.lastPricePaid.toLocaleString()}</p>
                                  <p><strong className="font-medium">Avg. Views:</strong> {influencer.averageViews.toLocaleString()}</p>
                                  <div className="flex items-center">
                                    <strong className="font-medium mr-1">Last Promo:</strong> {format(new Date(influencer.lastPromotionDate), 'dd MMM yyyy')}
                                    {isDataOutdated(influencer.lastPromotionDate) && <Badge variant="destructive" className="ml-2">Outdated</Badge>}
                                  </div>
                                  <p><strong className="font-medium">Email:</strong> {maskSensitiveData(influencer.email, userRole)}</p>
                                  <p><strong className="font-medium">Mobile:</strong> {maskSensitiveData(influencer.mobile, userRole)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Last Price Paid</TableHead>
                                <TableHead>Avg. Views</TableHead>
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
                                    <TableCell>{platformIcons[influencer.platform]} {influencer.platform}</TableCell>
                                    <TableCell><Badge variant="secondary">{influencer.category}</Badge></TableCell>
                                    <TableCell>${influencer.lastPricePaid.toLocaleString()}</TableCell>
                                    <TableCell>{influencer.averageViews.toLocaleString()}</TableCell>
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
                <Button onClick={() => setLogCampaignOpen(true)} size="icon" className="h-14 w-14 rounded-full shadow-lg"><Megaphone className="h-6 w-6"/></Button>
                <Button onClick={() => setAddInfluencerOpen(true)} size="icon" className="h-14 w-14 rounded-full shadow-lg"><Plus className="h-6 w-6"/></Button>
            </div>
            
            <AddInfluencerDialog
              isOpen={isAddInfluencerOpen}
              onClose={() => setAddInfluencerOpen(false)}
              onAddInfluencer={addInfluencer}
            />
            
            <LogCampaignDialog
              isOpen={isLogCampaignOpen}
              onClose={() => setLogCampaignOpen(false)}
              onLogCampaign={logCampaign}
              influencers={influencers}
            />

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
