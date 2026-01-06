// js/storage.js
export class Storage {
  constructor() {
    this.defaults = {
      plan: {},
      log: [],
      prs: {},
      userWorkouts: [],
      activities: ['stretching','rest','recovery'],
      autoSyncAfterWorkout: true
    };
  }

  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (this.defaults[key] || null);
  }

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  clear(key) {
    localStorage.removeItem(key);
  }

  getUserWorkouts() {
    return this.get('userWorkouts');
  }

  saveUserWorkout(workout) {
    const workouts = this.getUserWorkouts();
    const index = workouts.findIndex(w => w.id === workout.id);
    
    if (index >= 0) {
      workouts[index] = workout;
    } else {
      workouts.push(workout);
    }
    
    this.set('userWorkouts', workouts);
  }

  deleteUserWorkout(id) {
    const workouts = this.getUserWorkouts().filter(w => w.id !== id);
    this.set('userWorkouts', workouts);
  }

  export() {
    return {
      plan: this.get('plan'),
      log: this.get('log'),
      prs: this.get('prs'),
      userWorkouts: this.get('userWorkouts')
    };
  }

  import(data) {
    if (data.plan) this.set('plan', data.plan);
    if (data.log) this.set('log', data.log);
    if (data.prs) this.set('prs', data.prs);
    if (data.userWorkouts) this.set('userWorkouts', data.userWorkouts);
  }

  // Cloud sync helpers (Supabase). Dynamically import `js/supabase.js` so the app can run without cloud keys.
  async syncWorkoutsToCloud() {
    try {
      const mod = await import('./supabase.js');
      const workouts = this.get('userWorkouts') || [];
      for (const w of workouts) {
        if (!w.id) w.id = crypto.randomUUID();
        await mod.upsertCloudWorkout(w);
      }
      return true;
    } catch (err) {
      console.error('syncWorkoutsToCloud failed', err);
      return false;
    }
  }

  async fetchWorkoutsFromCloud() {
    try {
      const mod = await import('./supabase.js');
      const rows = await mod.fetchCloudWorkouts();
      // rows expected shape: { id, data, updated }
      const workouts = (rows || []).map(r => (r.data ? r.data : r));
      this.set('userWorkouts', workouts);
      // notify UI that workouts changed
      try { window.dispatchEvent(new CustomEvent('storage:workoutsUpdated', { detail: { source: 'cloud' } })); } catch (e) { /* ignore */ }
      return workouts;
    } catch (err) {
      console.error('fetchWorkoutsFromCloud failed', err);
      return null;
    }
  }

  // Plan sync
  async syncPlanToCloud() {
    try {
      const mod = await import('./supabase.js');
      const plan = this.get('plan') || {};
      const planRecurring = this.get('planRecurring') || {};
      const planCompleted = this.get('planCompleted') || {};
      const planNotes = this.get('planNotes') || {};
      const activities = this.get('activities') || [];
      const payload = {
        id: 'user-plan',
        data: { plan, planRecurring, planCompleted, planNotes, activities },
        updated: Date.now()
      };
      const res = await mod.upsertCloudPlan(payload);
      if (!res || (Array.isArray(res) && res.length === 0)) {
        console.error('syncPlanToCloud: upsert returned empty result', res);
        return false;
      }
      console.debug('syncPlanToCloud: upsert result', res);
      // Ensure recurring workouts referenced by the plan are also uploaded
      try {
        const recurringIds = Object.values(planRecurring).flat().filter(Boolean);
        const uniqIds = Array.from(new Set(recurringIds));
        const workouts = this.get('userWorkouts') || [];
        for (const id of uniqIds) {
          const w = workouts.find(x => x.id === id);
          if (w) {
            try { await mod.upsertCloudWorkout(w); } catch (e) { console.warn('failed to upsert recurring workout', id, e); }
          }
        }
      } catch (e) { console.warn('syncPlanToCloud: failed to sync recurring workouts', e); }

      return true;
    } catch (err) {
      console.error('syncPlanToCloud failed', err);
      return false;
    }
  }

  async fetchPlanFromCloud() {
    try {
      const mod = await import('./supabase.js');
      const rows = await mod.fetchCloudPlans();
      console.debug('fetchPlanFromCloud: rows from server', rows);
      if (!rows || !rows.length) return null;
      // prefer id 'user-plan' if present
      const row = rows.find(r => r.id === 'user-plan') || rows[0];
      const planData = row.data ? row.data : row;
      console.debug('fetchPlanFromCloud: chosen plan', row);
      // planData may contain multiple keys (plan, planRecurring, planCompleted, planNotes)
      if (planData && typeof planData === 'object' && planData.plan) {
        this.set('plan', planData.plan || {});
        if (planData.planRecurring) this.set('planRecurring', planData.planRecurring);
        if (planData.planCompleted) this.set('planCompleted', planData.planCompleted);
        if (planData.planNotes) this.set('planNotes', planData.planNotes);
        if (planData.activities) this.set('activities', planData.activities);
      } else {
        // older shape: the row data is the plan itself
        this.set('plan', planData || {});
      }
      // notify UI that plan changed
      try { window.dispatchEvent(new CustomEvent('storage:planUpdated', { detail: { source: 'cloud' } })); } catch (e) { /* ignore */ }
      return plan;
    } catch (err) {
      console.error('fetchPlanFromCloud failed', err);
      return null;
    }
  }

  // Logs sync
  async syncLogsToCloud() {
    try {
      const mod = await import('./supabase.js');
      const logs = this.get('log') || [];
      for (const l of logs) {
        if (!l.id) l.id = crypto.randomUUID();
        await mod.upsertCloudLog(l);
      }
      return true;
    } catch (err) {
      console.error('syncLogsToCloud failed', err);
      return false;
    }
  }

  async fetchLogsFromCloud() {
    try {
      const mod = await import('./supabase.js');
      const rows = await mod.fetchCloudLogs();
      const logs = (rows || []).map(r => (r.data ? r.data : r));
      this.set('log', logs);
      // notify UI that logs changed
      try { window.dispatchEvent(new CustomEvent('storage:logsUpdated', { detail: { source: 'cloud' } })); } catch (e) { /* ignore */ }
      return logs;
    } catch (err) {
      console.error('fetchLogsFromCloud failed', err);
      return null;
    }
  }

  // Orchestrators
  async syncAllToCloud() {
    const results = { workouts: false, plan: false, logs: false };
    try {
      results.workouts = await this.syncWorkoutsToCloud();
    } catch (e) { console.error('syncAll: workouts failed', e); }
    try {
      results.plan = await this.syncPlanToCloud();
    } catch (e) { console.error('syncAll: plan failed', e); }
    try {
      results.logs = await this.syncLogsToCloud();
    } catch (e) { console.error('syncAll: logs failed', e); }
    return results;
  }

  async fetchAllFromCloud() {
    const results = { workouts: null, plan: null, logs: null };
    try {
      results.workouts = await this.fetchWorkoutsFromCloud();
    } catch (e) { console.error('fetchAll: workouts failed', e); }
    try {
      results.plan = await this.fetchPlanFromCloud();
    } catch (e) { console.error('fetchAll: plan failed', e); }
    try {
      results.logs = await this.fetchLogsFromCloud();
    } catch (e) { console.error('fetchAll: logs failed', e); }
    // notify UI that a full fetch completed
    try { window.dispatchEvent(new CustomEvent('storage:allUpdated', { detail: { source: 'cloud', results } })); } catch (e) { /* ignore */ }
    return results;
  }
}
