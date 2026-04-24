"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, ShieldOff, MapPin, Clock, Wifi } from "lucide-react";
import { toast } from "sonner";
import { SpinnerCircular } from "spinners-react";

interface UserSessionData {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedBy: { name: string } | null;
}

interface SessionsDialogProps {
  userId: number;
  userName: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Navigateur inconnu';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return ua.slice(0, 40);
}

export const SessionsDialog: React.FC<SessionsDialogProps> = ({ userId, userName }) => {
  const [sessions, setSessions] = useState<UserSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions?userId=${userId}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setSessions(data.sessions);
    } catch {
      toast.error("Impossible de charger les sessions");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchSessions();
  }, [open, fetchSessions]);

  const handleRevoke = async (sessionId: number) => {
    setRevoking(sessionId);
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Session révoquée");
      await fetchSessions();
    } catch {
      toast.error("Impossible de révoquer la session");
    } finally {
      setRevoking(null);
    }
  };

  const activeSessions = sessions.filter((s) => !s.isRevoked && new Date(s.expiresAt) > new Date());
  const inactiveSessions = sessions.filter((s) => s.isRevoked || new Date(s.expiresAt) <= new Date());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full">
          Gérer les sessions
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Sessions — {userName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <SpinnerCircular size={36} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune session enregistrée</p>
        ) : (
          <div className="space-y-4">
            {activeSessions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Sessions actives ({activeSessions.length})
                </p>
                <div className="space-y-2">
                  {activeSessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onRevoke={handleRevoke}
                      isRevoking={revoking === s.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveSessions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Historique ({inactiveSessions.length})
                </p>
                <div className="space-y-2">
                  {inactiveSessions.map((s) => (
                    <SessionCard key={s.id} session={s} onRevoke={handleRevoke} isRevoking={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: UserSessionData;
  onRevoke: (id: number) => void;
  isRevoking: boolean;
}) {
  const isExpired = new Date(session.expiresAt) <= new Date();
  const isActive = !session.isRevoked && !isExpired;

  return (
    <div className="rounded-lg border p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{parseUserAgent(session.userAgent)}</span>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="text-[0.6rem]">
          {session.isRevoked ? 'Révoquée' : isExpired ? 'Expirée' : 'Active'}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{session.ipAddress || 'IP inconnue'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Connexion: {formatDate(session.loginAt)}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Dernière activité: {formatDate(session.lastActiveAt)}</span>
      </div>
      {session.isRevoked && session.revokedBy && (
        <p className="text-xs text-destructive">
          Révoquée par {session.revokedBy.name} le {formatDate(session.revokedAt!)}
        </p>
      )}
      {isActive && (
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs w-full mt-1"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
        >
          <ShieldOff className="h-3.5 w-3.5 mr-1" />
          {isRevoking ? 'Révocation...' : 'Révoquer la session'}
        </Button>
      )}
    </div>
  );
}
