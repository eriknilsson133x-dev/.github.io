// js/supabase.js
// Lightweight Supabase client wrapper (no auth). Uses the public anon key.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://yyqrwtorqnfgbpkfyywa.supabase.co';
// Public key provided by user — replace with env var in production
const SUPABASE_KEY = 'sb_publishable_DG8t-WBBEICs4HCknvROIg_9kJF3HL1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchCloudWorkouts() {
  const { data, error } = await supabase.from('workouts').select('*');
  if (error) throw error;
  return data || [];
}

export async function upsertCloudWorkout(workout) {
  const payload = {
    id: workout.id,
    data: workout,
    updated: Date.now()
  };
  const { error } = await supabase.from('workouts').upsert(payload);
  if (error) throw error;
  return true;
}

export async function deleteCloudWorkout(id) {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchCloudBackups() {
  const { data, error } = await supabase.from('backups').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data || [];
}

// Plans
export async function fetchCloudPlans() {
  const { data, error } = await supabase.from('plans').select('*');
  if (error) throw error;
  return data || [];
}

export async function upsertCloudPlan(plan) {
  const payload = {
    id: plan.id || 'user-plan',
    data: plan.data || plan,
    updated: plan.updated || Date.now()
  };
  // return the upserted row(s) so callers can inspect results
  const { data, error } = await supabase.from('plans').upsert(payload).select('*');
  if (error) throw error;
  return data || [];
}

export async function deleteCloudPlan(id) {
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// Logs
export async function fetchCloudLogs() {
  const { data, error } = await supabase.from('logs').select('*').order('updated', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertCloudLog(log) {
  const payload = {
    id: log.id || crypto.randomUUID(),
    data: log,
    updated: log.updated || Date.now()
  };
  const { error } = await supabase.from('logs').upsert(payload);
  if (error) throw error;
  return true;
}

export async function deleteCloudLog(id) {
  const { error } = await supabase.from('logs').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export default supabase;
