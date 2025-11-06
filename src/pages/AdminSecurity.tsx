import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Ban, Activity, Users, Lock, Unlock, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  blocked_until: string | null;
  permanent: boolean;
  failed_attempts: number;
}

interface RateLimit {
  id: string;
  identifier: string;
  identifier_type: string;
  action_type: string;
  attempts: number;
  window_start: string;
  blocked_until: string | null;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  attempted_at: string;
  ip_address: string;
  user_agent: string;
  failure_reason: string | null;
  captcha_verified: boolean;
}

interface Fingerprint {
  id: string;
  fingerprint_hash: string;
  user_id: string;
  ip_address: string;
  times_seen: number;
  last_seen_at: string;
  created_at: string;
}

interface SecurityStats {
  totalBlockedIPs: number;
  activeRateLimits: number;
  failedLoginLast24h: number;
  suspiciousFingerprints: number;
}

interface ChartData {
  date: string;
  successful: number;
  failed: number;
  blocked: number;
}

const AdminSecurity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [stats, setStats] = useState<SecurityStats>({
    totalBlockedIPs: 0,
    activeRateLimits: 0,
    failedLoginLast24h: 0,
    suspiciousFingerprints: 0
  });
  
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Vous devez être administrateur pour accéder à cette page.",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadSecurityData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityData = async () => {
    await Promise.all([
      loadBlockedIPs(),
      loadRateLimits(),
      loadLoginAttempts(),
      loadFingerprints(),
      loadStats(),
      loadChartData()
    ]);
  };

  const loadChartData = async () => {
    const data: ChartData[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dateStr = date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
      
      const [successfulAttempts, failedAttempts, blockedIPs] = await Promise.all([
        supabase
          .from('login_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('success', true)
          .gte('attempted_at', date.toISOString())
          .lt('attempted_at', nextDate.toISOString()),
        supabase
          .from('login_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('success', false)
          .gte('attempted_at', date.toISOString())
          .lt('attempted_at', nextDate.toISOString()),
        supabase
          .from('blocked_ips')
          .select('id', { count: 'exact', head: true })
          .gte('blocked_at', date.toISOString())
          .lt('blocked_at', nextDate.toISOString())
      ]);
      
      data.push({
        date: dateStr,
        successful: successfulAttempts.count || 0,
        failed: failedAttempts.count || 0,
        blocked: blockedIPs.count || 0
      });
    }
    
    setChartData(data);
  };

  const loadStats = async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [blockedCount, rateLimitCount, failedLoginCount, fingerprintCount] = await Promise.all([
      supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
      supabase.from('rate_limits').select('id', { count: 'exact', head: true })
        .not('blocked_until', 'is', null)
        .gte('blocked_until', now.toISOString()),
      supabase.from('login_attempts').select('id', { count: 'exact', head: true })
        .eq('success', false)
        .gte('attempted_at', yesterday.toISOString()),
      supabase.from('device_fingerprints').select('fingerprint_hash', { count: 'exact', head: true })
        .gte('times_seen', 3)
    ]);

    setStats({
      totalBlockedIPs: blockedCount.count || 0,
      activeRateLimits: rateLimitCount.count || 0,
      failedLoginLast24h: failedLoginCount.count || 0,
      suspiciousFingerprints: fingerprintCount.count || 0
    });
  };

  const loadBlockedIPs = async () => {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .order('blocked_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading blocked IPs:', error);
      return;
    }

    setBlockedIPs((data || []) as BlockedIP[]);
  };

  const loadRateLimits = async () => {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .order('window_start', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading rate limits:', error);
      return;
    }

    setRateLimits(data || []);
  };

  const loadLoginAttempts = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .gte('attempted_at', yesterday.toISOString())
      .order('attempted_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading login attempts:', error);
      return;
    }

    setLoginAttempts(data || []);
  };

  const loadFingerprints = async () => {
    const { data, error } = await supabase
      .from('device_fingerprints')
      .select('*')
      .gte('times_seen', 2)
      .order('times_seen', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading fingerprints:', error);
      return;
    }

    setFingerprints((data || []) as Fingerprint[]);
  };

  const unblockIP = async (id: string, ipAddress: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "IP débloquée",
        description: `L'adresse IP ${ipAddress} a été débloquée avec succès.`,
      });

      await loadSecurityData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Surveillance de sécurité</h1>
          <p className="text-muted-foreground">
            Moniteur en temps réel des tentatives de connexion et activités suspectes
          </p>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tentatives de Connexion (7 jours)
              </CardTitle>
              <CardDescription>
                Évolution des connexions réussies vs échouées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  successful: {
                    label: "Réussies",
                    color: "hsl(var(--chart-1))",
                  },
                  failed: {
                    label: "Échouées",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Réussies"
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Échouées"
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Blocages d'IP (7 jours)
              </CardTitle>
              <CardDescription>
                Nombre de nouvelles IPs bloquées par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  blocked: {
                    label: "IPs Bloquées",
                    color: "hsl(var(--destructive))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar 
                    dataKey="blocked" 
                    fill="hsl(var(--destructive))" 
                    name="IPs Bloquées"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                IPs Bloquées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.totalBlockedIPs}</div>
              <p className="text-xs text-muted-foreground mt-1">Adresses actuellement bloquées</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Rate Limits Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.activeRateLimits}</div>
              <p className="text-xs text-muted-foreground mt-1">Utilisateurs temporairement limités</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Échecs 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats.failedLoginLast24h}</div>
              <p className="text-xs text-muted-foreground mt-1">Tentatives échouées récentes</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Empreintes Suspectes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{stats.suspiciousFingerprints}</div>
              <p className="text-xs text-muted-foreground mt-1">Comptes multiples potentiels</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour les différentes sections */}
        <Tabs defaultValue="blocked" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="blocked">IPs Bloquées</TabsTrigger>
            <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
            <TabsTrigger value="attempts">Tentatives</TabsTrigger>
            <TabsTrigger value="fingerprints">Empreintes</TabsTrigger>
          </TabsList>

          {/* IPs Bloquées */}
          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <CardTitle>Adresses IP Bloquées</CardTitle>
                <CardDescription>
                  Liste des IPs bloquées pour activité suspecte
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockedIPs.length === 0 ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Aucune IP bloquée actuellement. Excellent travail de sécurité!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Adresse IP</TableHead>
                          <TableHead>Raison</TableHead>
                          <TableHead>Tentatives</TableHead>
                          <TableHead>Bloquée le</TableHead>
                          <TableHead>Expire le</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedIPs.map((ip) => (
                          <TableRow key={ip.id}>
                            <TableCell className="font-mono">{ip.ip_address}</TableCell>
                            <TableCell>{ip.reason}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{ip.failed_attempts}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(ip.blocked_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ip.blocked_until ? (
                                <span className="text-orange-500">{formatDate(ip.blocked_until)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {ip.permanent ? (
                                <Badge variant="destructive">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Permanent
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Temporaire</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unblockIP(ip.id, ip.ip_address)}
                              >
                                <Unlock className="h-3 w-3 mr-1" />
                                Débloquer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Limits */}
          <TabsContent value="ratelimits">
            <Card>
              <CardHeader>
                <CardTitle>Limitations de Débit Actives</CardTitle>
                <CardDescription>
                  Utilisateurs et IPs avec des tentatives excessives
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rateLimits.length === 0 ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Aucun rate limit actif. Tous les utilisateurs respectent les limites.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Identifiant</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Tentatives</TableHead>
                          <TableHead>Début fenêtre</TableHead>
                          <TableHead>Bloqué jusqu'à</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rateLimits.map((limit) => (
                          <TableRow key={limit.id}>
                            <TableCell className="font-mono text-sm">{limit.identifier}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{limit.identifier_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{limit.action_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={limit.attempts >= 5 ? "destructive" : "secondary"}>
                                {limit.attempts}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(limit.window_start)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {limit.blocked_until ? (
                                <span className="text-destructive font-medium">
                                  {formatDate(limit.blocked_until)}
                                </span>
                              ) : (
                                <span className="text-green-500">Actif</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tentatives de connexion */}
          <TabsContent value="attempts">
            <Card>
              <CardHeader>
                <CardTitle>Tentatives de Connexion (24h)</CardTitle>
                <CardDescription>
                  Historique des tentatives de connexion réussies et échouées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date/Heure</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>CAPTCHA</TableHead>
                        <TableHead>Raison</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginAttempts.slice(0, 50).map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{attempt.email}</TableCell>
                          <TableCell>
                            {attempt.success ? (
                              <Badge variant="default" className="bg-green-500">Réussi</Badge>
                            ) : (
                              <Badge variant="destructive">Échec</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(attempt.attempted_at)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{attempt.ip_address}</TableCell>
                          <TableCell>
                            {attempt.captcha_verified ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">✓</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500">✗</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {attempt.failure_reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Empreintes digitales */}
          <TabsContent value="fingerprints">
            <Card>
              <CardHeader>
                <CardTitle>Empreintes Digitales Suspectes</CardTitle>
                <CardDescription>
                  Détection de comptes multiples via empreinte du navigateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fingerprints.length === 0 ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Aucune empreinte suspecte détectée.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hash</TableHead>
                          <TableHead>IP Actuelle</TableHead>
                          <TableHead>Vues</TableHead>
                          <TableHead>Première vue</TableHead>
                          <TableHead>Dernière vue</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fingerprints.map((fp) => (
                          <TableRow key={fp.id}>
                            <TableCell className="font-mono text-xs">{fp.fingerprint_hash.substring(0, 16)}...</TableCell>
                            <TableCell className="font-mono text-sm">{fp.ip_address}</TableCell>
                            <TableCell>
                              <Badge variant={fp.times_seen > 5 ? "destructive" : "secondary"}>
                                {fp.times_seen}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(fp.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(fp.last_seen_at)}
                            </TableCell>
                            <TableCell>
                              {fp.times_seen > 3 ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Suspect
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Normal</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSecurity;
