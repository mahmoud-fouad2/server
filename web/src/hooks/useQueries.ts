import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// --- Dashboard Stats ---
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.analytics.getDashboard();
      return res;
    },
  });
};

// --- Business Info ---
export const useBusinessInfo = () => {
  return useQuery({
    queryKey: ['business-info'],
    queryFn: async () => {
      const res = await api.business.get();
      return res;
    },
  });
};

// --- Tickets ---
export const useTickets = () => {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.ticket.list();
      return res;
    },
  });
};

// --- Unread Messages ---
export const useUnreadMessages = () => {
  return useQuery({
    queryKey: ['unread-messages'],
    queryFn: async () => {
      // Assuming there is an endpoint for this, or we filter conversations
      const res = await api.chat.conversations({ status: 'active' });
      // Mock calculation if API doesn't return count directly
      return (res as { unreadCount: number }[]).filter((c) => c.unreadCount > 0).length;
    },
    // Refetch every minute for "near" real-time if socket fails
    refetchInterval: 60000, 
  });
};

// --- Knowledge Base ---
export const useKnowledgeBase = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: async () => {
      const res = await api.knowledge.list();
      return res;
    },
  });

  const reindexMutation = useMutation({
    mutationFn: async () => {
      return await api.knowledge.reindex();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });

  return {
    ...query,
    entries: query.data || [],
    reindex: reindexMutation.mutateAsync,
    isReindexing: reindexMutation.isPending,
  };
};
