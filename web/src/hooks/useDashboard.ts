// ==========================================
// Dashboard Custom Hooks
// Centralized state management and data fetching for Dashboard
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type {
  DashboardStats,
  Business,
  Conversation,
  AgentHandoff,
  TeamMember,
  KnowledgeEntry,
  Ticket,
  CrmLead,
} from '@/types/dashboard';

// ==========================================
// useDashboardStats - Fetch and manage dashboard statistics
// ==========================================
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Try business stats first, fallback to admin analytics if needed
      try {
        const data = await api.business.stats();
        setStats(data as DashboardStats);
      } catch {
        // Fallback logic if business stats fail (e.g. for admin view)
        const data = await api.admin.getAnalyticsOverview();
        setStats(data as DashboardStats);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard stats:', err);
      const message = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ==========================================
// useBusiness - Fetch business details (Enhanced)
// ==========================================
export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.business.get();
      setBusiness(data as Business);
    } catch (err: unknown) {
      console.error('Failed to fetch business:', err);
      const message = err instanceof Error ? err.message : 'Failed to load business details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusiness = useCallback(async (updates: Partial<Business>) => {
    try {
      await api.business.update(updates);
      await fetchBusiness();
    } catch (err: unknown) {
      console.error('Failed to update business:', err);
      throw err;
    }
  }, [fetchBusiness]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return { business, loading, error, refetch: fetchBusiness, updateBusiness };
}

// ==========================================
// useConversations - Manage conversations list
// ==========================================
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.chat.conversations();
      setConversations(data as Conversation[]);
    } catch (err: unknown) {
      console.error('Failed to fetch conversations:', err);
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

// ==========================================
// useHandoffRequests - Manage live agent handoff requests
// ==========================================
export function useHandoffRequests() {
  const [requests, setRequests] = useState<AgentHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.chat.handoverRequests();
      setRequests(data as AgentHandoff[]);
    } catch (err: unknown) {
      console.error('Failed to fetch handoff requests:', err);
      const message = err instanceof Error ? err.message : 'Failed to load handoff requests';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (id: string) => {
    try {
      await api.chat.acceptHandover(id);
      await fetchRequests();
    } catch (err: unknown) {
      console.error('Failed to accept handoff:', err);
      throw err;
    }
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests, acceptRequest };
}

// ==========================================
// useTeam - Manage team members
// ==========================================
export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.team.list();
      setTeam(data as TeamMember[]);
    } catch (err: unknown) {
      console.error('Failed to fetch team:', err);
      const message = err instanceof Error ? err.message : 'Failed to load team members';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (memberData: Partial<TeamMember>) => {
    try {
      await api.team.add(memberData);
      await fetchTeam();
    } catch (err: unknown) {
      console.error('Failed to add team member:', err);
      throw err;
    }
  }, [fetchTeam]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await api.team.delete(id);
      await fetchTeam();
    } catch (err: unknown) {
      console.error('Failed to remove team member:', err);
      throw err;
    }
  }, [fetchTeam]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { team, loading, error, refetch: fetchTeam, addMember, removeMember };
}

// ==========================================
// useKnowledge - Manage knowledge base
// ==========================================
export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.knowledge.list();
      setEntries(data as KnowledgeEntry[]);
    } catch (err: unknown) {
      console.error('Failed to fetch knowledge entries:', err);
      const message = err instanceof Error ? err.message : 'Failed to load knowledge base';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entryData: Partial<KnowledgeEntry>) => {
    try {
      await api.knowledge.create(entryData);
      await fetchEntries();
    } catch (err: unknown) {
      console.error('Failed to create entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await api.knowledge.delete(id);
      await fetchEntries();
    } catch (err: unknown) {
      console.error('Failed to delete entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const reindex = useCallback(async () => {
    try {
      await api.knowledge.reindex();
      await fetchEntries();
    } catch (err: unknown) {
      console.error('Failed to reindex:', err);
      throw err;
    }
  }, [fetchEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, loading, error, refetch: fetchEntries, createEntry, deleteEntry, reindex };
}

// ==========================================
// useTickets - Manage support tickets
// ==========================================
export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.ticket.list();
      setTickets(data as Ticket[]);
    } catch (err: unknown) {
      console.error('Failed to fetch tickets:', err);
      const message = err instanceof Error ? err.message : 'Failed to load tickets';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (ticketData: Partial<Ticket>) => {
    try {
      await api.ticket.create(ticketData);
      await fetchTickets();
    } catch (err: unknown) {
      console.error('Failed to create ticket:', err);
      throw err;
    }
  }, [fetchTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets, createTicket };
}

// ==========================================
// useCRM - Manage CRM leads
// ==========================================
export function useCRM() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.crm.getLeads();
      setLeads(data as CrmLead[]);
    } catch (err: unknown) {
      console.error('Failed to fetch leads:', err);
      const message = err instanceof Error ? err.message : 'Failed to load CRM leads';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (leadData: Partial<CrmLead>) => {
    try {
      await api.crm.createLead(leadData);
      await fetchLeads();
    } catch (err: unknown) {
      console.error('Failed to create lead:', err);
      throw err;
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: string, updates: Partial<CrmLead>) => {
    try {
      await api.crm.updateLead(id, updates);
      await fetchLeads();
    } catch (err: unknown) {
      console.error('Failed to update lead:', err);
      throw err;
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads, createLead, updateLead };
}
