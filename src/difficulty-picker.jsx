import React, { useState } from 'react';
export const DIFFICULTIES = [
  { id: 'simple', icon: '🌱', name: 'Simple' },
  { id: 'medium', icon: '🌟', name: 'Medium' },
  { id: 'hard', icon: '🚀', name: 'Hard' },
];
const IDS = DIFFICULTIES.map(d => d.id);
export function normalizeDifficulty(v) { return IDS.includes(v) ? v : 'simple'; }
const KEY = 'shivani-difficulty';
export function useDifficulty() {
  const [difficulty, setDifficultyState] = useState(() => {
    try { return normalizeDifficulty(localStorage.getItem(KEY)); } catch { return 'simple'; }
  });
  const setDifficulty = d => {
    const v = normalizeDifficulty(d);
    setDifficultyState(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };
  return [difficulty, setDifficulty];
}
export function DifficultyPicker({ value, onChange }) {
  return (
    <div className="difficulty-picker" role="group" aria-label="Choose difficulty">
      <span className="difficulty-picker-label">Difficulty</span>
      {DIFFICULTIES.map(d => (
        <button key={d.id} type="button" className={d.id === value ? 'on' : ''}
          aria-pressed={d.id === value} onClick={() => onChange(d.id)}>
          <span aria-hidden="true">{d.icon}</span> {d.name}
        </button>
      ))}
    </div>
  );
}
