import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PresenceUser {
  userId: string;
  name: string;
  currentPage: string;
  lastSeen: string;
}

export const usePresence = () => {
  const { user, orgId, orgName } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id || !orgId) return;

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
    const channel = supabase.channel(`presence:org:${orgId}`, {
      config: { presence: { key: user.id } }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.entries(state).forEach(([userId, presences]: [string, any]) => {
          if (userId === user.id) return; // Don't show self
          const p = presences[0];
          if (p) {
            users.push({
              userId,
              name: p.name || 'Someone',
              currentPage: p.currentPage || '/',
              lastSeen: p.lastSeen || new Date().toISOString(),
            });
          }
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: userName,
            currentPage: window.location.pathname,
            lastSeen: new Date().toISOString(),
          });
        }
      });

    // Update presence on route change
    const updatePage = () => {
      channel.track({
        name: userName,
        currentPage: window.location.pathname,
        lastSeen: new Date().toISOString(),
      });
    };
    window.addEventListener('popstate', updatePage);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('popstate', updatePage);
    };
  }, [user?.id, orgId]);

  return { onlineUsers };
};
