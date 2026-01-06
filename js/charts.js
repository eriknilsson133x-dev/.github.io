// js/charts.js
import { defaultKeywords } from './chartsConfig.js';

export { defaultKeywords };

export function renderCharts(log, storage) {
  setTimeout(() => {
    renderVolumeChart(log, storage);
    renderProgressChart(log, storage);
  }, 100);
}

function renderVolumeChart(log, storage) {
  const ctx = document.getElementById('volumeChart');
  if (!ctx || !storage) return;

  const categories = { finger: 0, pull: 0, board: 0, climbing: 0 };
  const cutoff     = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const keywords = storage.get('chartKeywords') || defaultKeywords;

  log.forEach(entry => {
    if (new Date(entry.date).getTime() < cutoff) return;
    // skip non-workout notes (no workoutId)
    const wid = entry.workoutId || '';
    if (typeof wid !== 'string') return;
    const name = (entry.workoutName || '').toLowerCase();
    let matched = false;
    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(w => name.includes(w.toLowerCase()))) {
        categories[cat]++;
        matched = true;
        break;
      }
    }
    if (!matched) categories.climbing++;
  });

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Finger Training', 'Pull-ups', 'Board Climbing', 'Climbing'],
      datasets: [{
        data: [categories.finger, categories.pull, categories.board, categories.climbing],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#f3f4f6' } }
      }
    }
  });
}

function renderProgressChart(log, storage) {
  const ctx   = document.getElementById('progressChart');
  if (!ctx || !storage) return;

  const keywords = storage.get('chartKeywords') || defaultKeywords;
  const progressFilters = storage.get('progressFilters') || { pull: true, finger: true };
  const includedWorkouts = storage.get('includedWorkouts') || [];
  const includedLower = includedWorkouts.map(n => (n || '').toLowerCase().trim());
  const cutoff       = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const dataByWorkout = {};

  log.forEach(entry => {
    if (new Date(entry.date).getTime() < cutoff) return;
    const wid = entry.workoutId;
    if (!wid) return;
    const name = entry.workoutName || '';

    // classify using same keyword logic as the pie chart, but only for pull/finger
    let matchedCategory = null;
    for (const cat of ['pull', 'finger']) {
      const words = keywords[cat] || [];
      if (words.some(w => name.toLowerCase().includes(w.toLowerCase()))) {
        matchedCategory = cat;
        break;
      }
    }

    if (!matchedCategory) return;
    if (!progressFilters[matchedCategory]) return; // respect user checkbox
    if (!includedLower.includes((name || '').toLowerCase().trim())) return; // exclude unchecked workouts

    if (!dataByWorkout[wid]) {
      dataByWorkout[wid] = { dateValues: {}, name: entry.workoutName };
    }

    const dateStr = new Date(entry.date).toLocaleDateString();
    const val = entry.bestValue || 0;
    if (!dataByWorkout[wid].dateValues[dateStr] || val > dataByWorkout[wid].dateValues[dateStr]) {
      dataByWorkout[wid].dateValues[dateStr] = val;
    }
  });

  // Convert to arrays, sorted by date
  Object.keys(dataByWorkout).forEach(wid => {
    const dv = dataByWorkout[wid].dateValues;
    const sortedDates = Object.keys(dv).sort((a, b) => new Date(a) - new Date(b));
    dataByWorkout[wid].dates = sortedDates;
    dataByWorkout[wid].values = sortedDates.map(d => dv[d]);
  });

  const datasets = Object.keys(dataByWorkout).map((id, i) => ({
    label: dataByWorkout[id].name,
    data: dataByWorkout[id].values,
    borderColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
    fill: false
  }));

  const allDates = [...new Set(Object.values(dataByWorkout).flatMap(d => d.dates))].sort();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: allDates,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: { color: '#f3f4f6' },
          grid: { color: '#374151' }
        },
        x: {
          ticks: { color: '#f3f4f6' },
          grid: { color: '#374151' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f3f4f6' } }
      }
    }
  });
}
