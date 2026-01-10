// js/workouts.js
export const WORKOUT_TYPES = [
  { value: 'duration',  label: 'Duration only' },
  { value: 'reps',      label: 'Reps only' },
  { value: 'repeaters', label: 'Repeaters (7s on / 3s off)' }
];

export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function validateWorkout(w) {
  if (!w.name?.trim()) return 'Name required';
  if (!w.tool) return 'Tool required';
  if (!w.sets || w.sets < 1) return 'Sets ≥ 1';
  if (!w.type) return 'Type required';

  if ((w.type === 'duration' || w.type === 'both') && (!w.duration || w.duration <= 0)) return 'Duration > 0';
  if ((w.type === 'reps' || w.type === 'both') && (!w.reps || w.reps <= 0)) return 'Reps > 0';
  if (w.type === 'repeaters' && (!w.repeaterCount || w.repeaterCount < 1)) return 'Repeater cycles ≥ 1';
  if (w.type !== 'reps' && (w.rest == null || w.rest < 0)) return 'Rest ≥ 0';
  return null;
}

export function getWorkoutSummary(w) {
  let s = `${w.sets} sets`;
  if (w.tool === 'Finger block' && w.leftRightMode) {
    const effectiveRest = Math.max(0, (w.rest || 120) - 5 - (w.duration || 30));
    s += ` × ${w.duration || 30}s per hand (5s switch) / ${effectiveRest}s rest`;
  } else if (w.type === 'duration') s += ` × ${w.duration}s`;
  else if (w.type === 'reps') s += ` × ${w.reps} reps`;
  else if (w.type === 'both') s += ` × ${w.reps} reps × ${w.duration}s`;
  else if (w.type === 'repeaters') s += ` × ${w.repeaterCount} cycles (7s/3s)`;
  if (w.hasWeight) s += ' + weight';
  if (!(w.tool === 'Finger block' && w.leftRightMode)) s += ` / ${w.rest}s rest`;
  return s;
}

export function setupFormListeners() {
  requestAnimationFrame(() => {
    const form = document.getElementById('workout-form');
    if (!form) return;

    form.addEventListener('submit', e => e.preventDefault());

    form.querySelectorAll('input[name="type"]').forEach(radio => {
      radio.addEventListener('change', e => {
        e.stopPropagation();
        const t = e.target.value;
        document.getElementById('duration-input').style.display = (t === 'duration' || t === 'both') ? 'block' : 'none';
        document.getElementById('reps-input').style.display    = (t === 'reps'    || t === 'both') ? 'block' : 'none';
        document.getElementById('repeaters-input').style.display = (t === 'repeaters') ? 'block' : 'none';
        // hide rest when 'reps' only and make it not required
        try {
          const restWrap = document.getElementById('rest-input');
          const restInput = form.querySelector('input[name="rest"]');
          if (restWrap) restWrap.style.display = (t === 'reps') ? 'none' : 'block';
          if (restInput) restInput.required = !(t === 'reps');
        } catch (err) { /* ignore */ }
        // auto-enable Track added weight for reps-only
        try {
          const hasWeight = form.querySelector('input[name="hasWeight"]');
          const weightInputs = document.getElementById('weight-inputs');
          if (t === 'reps') {
            if (hasWeight && !hasWeight.checked) {
              hasWeight.checked = true;
              if (weightInputs) weightInputs.style.display = 'block';
            }
          }
        } catch (err) { /* ignore */ }
      });
    });

    const cb = form.querySelector('input[name="hasWeight"]');
    if (cb) {
      cb.addEventListener('change', e => {
        e.stopPropagation();
        document.getElementById('weight-inputs').style.display = e.target.checked ? 'block' : 'none';
      });
    }

    const toolSelect = form.querySelector('select[name="tool"]');
    if (toolSelect) {
      toolSelect.addEventListener('change', e => {
        e.stopPropagation();
        const tool = e.target.value;
        document.getElementById('fingerBlockMode').style.display = (tool === 'Finger block') ? 'block' : 'none';
        // show depth input for Hangboard or Finger block
        try {
          const depthWrap = document.getElementById('depth-inputs');
          if (depthWrap) depthWrap.style.display = (tool === 'Finger block' || tool === 'Hangboard') ? 'block' : 'none';
        } catch (err) { /* ignore */ }
      });
    }
  });
}
