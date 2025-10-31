import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Eye, MousePointerClick, Unlock, Heart, TrendingUp, MapPin, Calendar, Users, Star, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BusinessStatisticsProps {
  userId: string;
}

const COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', 'hsl(var(--accent))', '#8b5cf6', '#f59e0b', '#10b981'];

export const BusinessStatistics = ({ userId }: BusinessStatisticsProps) => {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [userId, timeRange, selectedBusiness]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user businesses
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id, title, views_count, created_at')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      setBusinesses(businessData || []);

      // Build query for analytics
      let query = supabase
        .from('business_analytics')
        .select('*')
        .in('business_id', (businessData || []).map(b => b.id));

      // Filter by time range
      if (timeRange !== 'all') {
        const daysAgo = parseInt(timeRange);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - daysAgo);
        query = query.gte('created_at', dateFrom.toISOString());
      }

      // Filter by specific business
      if (selectedBusiness !== 'all') {
        query = query.eq('business_id', selectedBusiness);
      }

      const { data: analyticsData } = await query.order('created_at', { ascending: true });
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall stats from business_analytics table
  const totalViews = analytics.filter(a => a.event_type === 'view').length;
  const totalClicks = analytics.filter(a => a.event_type === 'click').length;
  const totalUnlocks = analytics.filter(a => a.event_type === 'contact_unlock').length;
  const totalFavorites = analytics.filter(a => a.event_type === 'favorite').length;
  const totalLeads = analytics.filter(a => a.event_type === 'lead').length;

  // Add views from businesses.views_count for historical data
  const historicalViews = businesses.reduce((sum, b) => sum + (b.views_count || 0), 0);
  const totalViewsWithHistorical = totalViews + historicalViews;

  // Calculate featured views (views from featured businesses)
  const featuredBusinessIds = businesses.filter(b => b.featured).map(b => b.id);
  const featuredViews = analytics.filter(a => 
    a.event_type === 'view' && featuredBusinessIds.includes(a.business_id)
  ).length;

  // Calculate conversion rate
  const conversionRate = totalViewsWithHistorical > 0 ? ((totalUnlocks / totalViewsWithHistorical) * 100).toFixed(2) : '0';

  // Group analytics by event type
  const eventTypeData = [
    { name: 'Vues', value: totalViews, color: COLORS[0] },
    { name: 'Clics', value: totalClicks, color: COLORS[1] },
    { name: 'Déverrouillages', value: totalUnlocks, color: COLORS[2] },
    { name: 'Favoris', value: totalFavorites, color: COLORS[3] },
    { name: 'Leads', value: totalLeads, color: COLORS[4] }
  ].filter(item => item.value > 0);

  // Group by date for timeline
  const timelineData = analytics.reduce((acc: any[], curr) => {
    const date = new Date(curr.created_at).toLocaleDateString('fr-CA');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing[curr.event_type] = (existing[curr.event_type] || 0) + 1;
      existing.total = (existing.total || 0) + 1;
    } else {
      acc.push({
        date,
        [curr.event_type]: 1,
        total: 1
      });
    }
    return acc;
  }, []);

  // Group by city
  const cityData = analytics
    .filter(a => a.city)
    .reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.city);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: curr.city, value: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Group by region
  const regionData = analytics
    .filter(a => a.region)
    .reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.region);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: curr.region, value: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Performance by business
  const businessPerformance = businesses.map(business => {
    const businessAnalytics = analytics.filter(a => a.business_id === business.id);
    return {
      name: business.title.length > 30 ? business.title.substring(0, 30) + '...' : business.title,
      vues: businessAnalytics.filter(a => a.event_type === 'view').length,
      déverrouillages: businessAnalytics.filter(a => a.event_type === 'contact_unlock').length,
      favoris: businessAnalytics.filter(a => a.event_type === 'favorite').length,
      leads: businessAnalytics.filter(a => a.event_type === 'lead').length
    };
  }).sort((a, b) => b.vues - a.vues);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement des statistiques...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Aucune statistique disponible</p>
        <p className="text-sm text-muted-foreground">Créez votre première annonce pour commencer à suivre vos performances</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Mes statistiques</h2>
          <p className="text-sm text-muted-foreground">Analysez les performances de vos annonces</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Toutes les annonces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les annonces</SelectItem>
              {businesses.map(business => (
                <SelectItem key={business.id} value={business.id}>
                  {business.title.length > 30 ? business.title.substring(0, 30) + '...' : business.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="all">Depuis le début</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Total des vues
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nombre total de fois où vos annonces ont été consultées par des visiteurs</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{totalViewsWithHistorical.toLocaleString()}</h3>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Vues en vedette
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nombre de vues provenant de vos annonces mises en avant (featured)</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{featuredViews.toLocaleString()}</h3>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Déverrouillages
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nombre de fois où vos coordonnées ont été débloquées par des acheteurs intéressés</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{totalUnlocks.toLocaleString()}</h3>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Favoris
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nombre de fois où vos annonces ont été ajoutées aux favoris par des visiteurs</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{totalFavorites.toLocaleString()}</h3>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Leads
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nombre de personnes uniques qui vous ont écrit un premier message</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{totalLeads.toLocaleString()}</h3>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Taux de conversion
                  <UITooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Pourcentage de visiteurs ayant déverrouillé vos coordonnées (déverrouillages ÷ vues totales)</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">{conversionRate}%</h3>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="timeline">Évolution</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="geography">Géographie</TabsTrigger>
              <TabsTrigger value="events">Événements</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Évolution dans le temps
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Visualisez la progression de vos statistiques au fil du temps</p>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="view" stackId="1" stroke="hsl(var(--secondary))" fill="url(#colorTotal)" name="Vues" />
                    <Area type="monotone" dataKey="contact_unlock" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Déverrouillages" />
                    <Area type="monotone" dataKey="favorite" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} name="Favoris" />
                    <Area type="monotone" dataKey="lead" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Leads" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible pour cette période
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance par annonce
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Comparez les performances de chacune de vos annonces</p>
                {businessPerformance.length > 0 && businessPerformance.some(b => b.vues > 0) ? (
                  <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={businessPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={120} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="vues" fill="hsl(var(--secondary))" name="Vues" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="déverrouillages" fill="hsl(var(--primary))" name="Déverrouillages" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="favoris" fill="hsl(var(--accent))" name="Favoris" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="leads" fill="#8b5cf6" name="Leads" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée de performance disponible
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="geography" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Analyse géographique
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Découvrez d'où proviennent vos visiteurs</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Top villes</h4>
                    {cityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} name="Visites" />
                      </BarChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Aucune donnée géographique disponible
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Top régions</h4>
                    {regionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      </PieChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Aucune donnée de région disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5" />
                  Répartition des événements
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Analysez les types d'interactions avec vos annonces</p>
                {eventTypeData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={eventTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {eventTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center space-y-4">
                      {eventTypeData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-2xl font-bold">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Aucun événement enregistré
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};