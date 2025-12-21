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
  WidgetConfig,
  Subscription,
  ChartDataPoint,
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
      const data = await api.analytics.dashboard();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Failed to load statistics');
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
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
      setError(err.message || 'Failed to load conversations');
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
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to fetch handoff requests:', err);
      setError(err.message || 'Failed to load handoff requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (id: string) => {
    try {
      await api.chat.acceptHandover(id);
      await fetchRequests();
    } catch (err: any) {
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
      setTeam(data);
    } catch (err: any) {
      console.error('Failed to fetch team:', err);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (memberData: Partial<TeamMember>) => {
    try {
      await api.team.create(memberData);
      await fetchTeam();
    } catch (err: any) {
      console.error('Failed to add team member:', err);
      throw err;
    }
  }, [fetchTeam]);

  const updateMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    try {
      await api.team.update(id, updates);
      await fetchTeam();
    } catch (err: any) {
      console.error('Failed to update team member:', err);
      throw err;
    }
  }, [fetchTeam]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await api.team.delete(id);
      await fetchTeam();
    } catch (err: any) {
      console.error('Failed to remove team member:', err);
      throw err;
    }
  }, [fetchTeam]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { team, loading, error, refetch: fetchTeam, addMember, updateMember, removeMember };
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
      setEntries(data);
    } catch (err: any) {
      console.error('Failed to fetch knowledge entries:', err);
      setError(err.message || 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entryData: Partial<KnowledgeEntry>) => {
    try {
      await api.knowledge.create(entryData);
      await fetchEntries();
    } catch (err: any) {
      console.error('Failed to create entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await api.knowledge.delete(id);
      await fetchEntries();
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const reindex = useCallback(async () => {
    try {
      await api.knowledge.reindex();
      await fetchEntries();
    } catch (err: any) {
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
      const data = await api.tickets.list();
      setTickets(data);
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (ticketData: Partial<Ticket>) => {
    try {
      await api.tickets.create(ticketData);
      await fetchTickets();
    } catch (err: any) {
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
      const data = await api.crm.leads();
      setLeads(data);
    } catch (err: any) {
      console.error('Failed to fetch leads:', err);
      setError(err.message || 'Failed to load CRM leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (leadData: Partial<CrmLead>) => {
    try {
      await api.crm.createLead(leadData);
      await fetchLeads();
    } catch (err: any) {
      console.error('Failed to create lead:', err);
      throw err;
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: string, updates: Partial<CrmLead>) => {
    try {
      await api.crm.updateLead(id, updates);
      await fetchLeads();
    } catch (err: any) {
      console.error('Failed to update lead:', err);
      throw err;
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads, createLead, updateLead };
}

// ==========================================
// useBusiness - Manage business settings
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
      setBusiness(data);
    } catch (err: any) {
      console.error('Failed to fetch business:', err);
      setError(err.message || 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusiness = useCallback(async (updates: Partial<Business>) => {
    try {
      await api.business.update(updates);
      await fetchBusiness();
    } catch (err: any) {
      console.error('Failed to update business:', err);
      throw err;
    }
  }, [fetchBusiness]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return { business, loading, error, refetch: fetchBusiness, updateBusiness };
}
