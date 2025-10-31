import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Briefcase, Building2, Linkedin, User, Calendar } from "lucide-react";

interface ContactCardProps {
  profile: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    job_title?: string;
    linkedin_url?: string;
    avatar_url?: string;
    date_of_birth?: string;
  };
}

export const ContactCard = ({ profile }: ContactCardProps) => {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className="w-[600px] h-[340px] bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-2xl shadow-2xl border border-border/50 p-8 flex flex-col"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header avec avatar */}
      <div className="flex items-start gap-6 mb-6">
        <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-xl">
          <AvatarImage src={profile.avatar_url} alt={fullName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-primary text-2xl font-bold">
            {initials || <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {fullName || 'Utilisateur'}
          </h2>
          {profile.job_title && (
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Briefcase className="h-4 w-4" />
              <p className="text-lg font-medium">{profile.job_title}</p>
            </div>
          )}
          {profile.company_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <p className="text-lg font-medium">{profile.company_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

      {/* Coordonnées */}
      <div className="grid grid-cols-1 gap-4">
        {profile.email && (
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/30">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
              <p className="text-sm font-semibold text-foreground truncate">{profile.email}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {profile.phone && (
            <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/30">
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Téléphone</p>
                <p className="text-sm font-semibold text-foreground truncate">{profile.phone}</p>
              </div>
            </div>
          )}
          
          {profile.linkedin_url && (
            <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/30">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Linkedin className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">LinkedIn</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.linkedin_url.replace('https://', '').replace('http://', '')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Calendar className="h-3 w-3" />
          <p>Carte de contact partagée</p>
        </div>
      </div>
    </div>
  );
};
