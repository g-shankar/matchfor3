import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, Waves } from 'lucide-react';
import { ding } from './chime.js';
import { prefersReducedMotion } from './three-fx/three-lazy.js';
import { ISLANDS, islandById, makeQuestions, PRAISE, tickMarksFor, markLabelRows } from './number-line-voyage-engine.js';
import Confetti3D from './three-fx/Confetti3D.jsx';
import Star3D from './three-fx/Star3D.jsx';

/* Crisp, readable SVG number lines. Stage semantics: 0 = bounds only,
 * then layers reveal in order: [bounds, mid?, marks, jump0, jump1, ...].
 * Quiz visuals pass stage={Infinity} to show the finished line. */
function NumberLineSVG({ spec, stage = Infinity }) {
  const W = 760, H = 196, L = 48, R = 712, Y = 112;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const markerId = `nlv-arr-${uid}`;
  const wrapRef = useRef(null);
  const x = v => L + ((v - spec.min) / (spec.max - spec.min)) * (R - L);
  const layers = ['bounds'];
  if (spec.mid != null) layers.push('mid');
  layers.push('marks');
  (spec.jumps || []).forEach((_, i) => layers.push(`j${i}`));
  const shown = new Set(layers.slice(0, stage === Infinity ? layers.length : stage + 1));
  const showMid = shown.has('mid'), showMarks = shown.has('marks');
  const jumpCount = [...shown].filter(l => l[0] === 'j').length;

  // On phones the line is wider than the screen (horizontal scroll). Keep the
  // action in view: scroll the wrap so the shown marks / jump landings / mid
  // are centered instead of leaving them off-screen to the right.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const focus = [];
    if (showMid && spec.mid != null) focus.push(spec.mid);
    if (showMarks) (spec.marks || []).forEach(m => focus.push(m.value));
    (spec.jumps || []).slice(0, jumpCount).forEach(jm => { focus.push(jm[0]); focus.push(jm[1]); });
    (spec.candidates || []).forEach(c => focus.push(c.value));
    const scrollW = wrap.scrollWidth - wrap.clientWidth;
    if (scrollW <= 0) return;
    // With nothing to focus on (bounds-only lines), start at the left edge so
    // the axis minimum is always visible. Otherwise center the focus span.
    const left = focus.length
      ? (() => {
        const midVal = (Math.min(...focus) + Math.max(...focus)) / 2;
        const scale = wrap.scrollWidth / W;
        return Math.max(0, Math.min(scrollW, x(midVal) * scale - wrap.clientWidth / 2));
      })()
      : 0;
    wrap.scrollTo({ left, behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, stage, spec.min, spec.max, showMid, showMarks, jumpCount]);

  // Ticks snap to multiples of step; every major tick is labeled (see engine).
  const { ticks } = tickMarksFor(spec);
  const tickEls = ticks.map((t, i) => (
    <g key={i}>
      <line x1={x(t.v)} y1={Y - (t.major ? 14 : 8)} x2={x(t.v)} y2={Y + (t.major ? 14 : 8)}
        stroke="#4b6157" strokeWidth={t.major ? 3 : 2} />
      {t.major && (
        <text x={x(t.v)} y={Y + 40} textAnchor="middle" fontSize={19} fontWeight={700} fill="#4b6157">{t.label}</text>
      )}
    </g>
  ));

  // Midpoint bar: when a mark dot sits almost on top of it (e.g. rounding 548
  // vs the 550 mid bar), draw the bar on top of the dot with a white halo so
  // the dot no longer swallows it.
  const midX = spec.mid != null ? x(spec.mid) : null;
  const midHitsMark = showMid && showMarks && midX != null
    && (spec.marks || []).some(m => Math.abs(x(m.value) - midX) < 15);
  const midGroup = showMid && spec.mid != null && (
    <g>
      {midHitsMark && (
        <line x1={midX} y1={Y - 20} x2={midX} y2={Y + 20} stroke="#ffffff" strokeWidth={12} />
      )}
      <line x1={midX} y1={Y - 20} x2={midX} y2={Y + 20} stroke="#cc3b37" strokeWidth={5} />
      <text x={midX} y={Y + 62} textAnchor="middle" fontSize={20} fontWeight={900} fill="#cc3b37">{spec.mid}</text>
    </g>
  );

  // Stagger mark labels that would otherwise collide (e.g. compare 444/444).
  const marks = spec.marks || [];
  const markOrder = marks.map((_, i) => i).sort((a, b) => x(marks[a].value) - x(marks[b].value));
  const markRows = {};
  if (markOrder.length > 1) {
    const rows = markLabelRows(
      markOrder.map(i => x(marks[i].value)),
      markOrder.map(i => String(marks[i].label).length * 20 * 0.62),
    );
    markOrder.forEach((mi, k) => { markRows[mi] = Math.min(rows[k], 2); });
  }

  // Stagger plot candidate letters that sit too close together.
  const cands = spec.candidates || [];
  const candOrder = cands.map((_, i) => i).sort((a, b) => x(cands[a].value) - x(cands[b].value));
  const candRows = {};
  if (candOrder.length > 1) {
    const rows = markLabelRows(
      candOrder.map(i => x(cands[i].value)),
      candOrder.map(i => String(cands[i].label).length * 20 * 0.62),
      8,
    );
    candOrder.forEach((ci, k) => { candRows[ci] = Math.min(rows[k], 2); });
  }

  return (
    <div className="nlv-line-wrap" ref={wrapRef}>
    <svg className="nlv-line" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Number line from ${spec.min} to ${spec.max}`}>
      <defs>
        <marker id={markerId} markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
          <path d="M0 0L9 4.5L0 9z" fill="#4b6157" />
        </marker>
      </defs>
      <line x1={L - 14} y1={Y} x2={R + 14} y2={Y} stroke="#4b6157" strokeWidth={4}
        markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
      {tickEls}
      {!midHitsMark && midGroup}
      {showMarks && marks.map((m, i) => {
        const r = markRows[i] || 0;
        return m.star ? (
          <g key={i}>
            <text x={x(m.value)} y={Y - 30} textAnchor="middle" fontSize={30}>⭐</text>
            <text x={x(m.value)} y={Y - 58 - r * 26} textAnchor="middle" fontSize={21} fontWeight={900} fill="#8a5a00"
              stroke="#ffffff" strokeWidth={5} paintOrder="stroke">{m.label}</text>
          </g>
        ) : (
          <g key={i}>
            <circle cx={x(m.value)} cy={Y} r={9} fill="#cc3b37" stroke="#fff" strokeWidth={3} />
            <text x={x(m.value)} y={Y - 20 - r * 26} textAnchor="middle" fontSize={20} fontWeight={900} fill="#8f2422"
              stroke="#ffffff" strokeWidth={5} paintOrder="stroke">{m.label}</text>
          </g>
        );
      })}
      {midHitsMark && midGroup}
      {cands.map((c, i) => {
        const r = candRows[i] || 0;
        return (
          <g key={i}>
            <text x={x(c.value)} y={Y - 26} textAnchor="middle" fontSize={26} fill="#d9a441">★</text>
            <text x={x(c.value)} y={Y - 54 - r * 26} textAnchor="middle" fontSize={20} fontWeight={900} fill="#0e2a47"
              stroke="#ffffff" strokeWidth={5} paintOrder="stroke">{c.label}</text>
          </g>
        );
      })}
      {(spec.jumps || []).slice(0, jumpCount).map((jm, i) => {
        const [a, b, label] = jm;
        const xa = x(a), xb = x(b);
        const spanPx = Math.abs(xb - xa);
        // tiny hops (e.g. 48→50) get a tall narrow arc so they clear the
        // mark labels instead of tangling with them
        const peak = spanPx < 48
          ? Math.max(54, Math.min(64, spanPx * 0.32 + 22))
          : Math.min(64, spanPx * 0.32 + 22);
        return (
          <g key={i}>
            <path d={`M${xa},${Y - 10} Q${(xa + xb) / 2},${Y - peak} ${xb},${Y - 10}`}
              fill="none" stroke="#2d91c7" strokeWidth={4} strokeDasharray="7 6" />
            {label ? (
              <text x={(xa + xb) / 2} y={Y - peak / 2 - 16} textAnchor="middle"
                fontSize={21} fontWeight={900} fill="#1687a7"
                stroke="#ffffff" strokeWidth={5} paintOrder="stroke">{label}</text>
            ) : null}
            <circle cx={xb} cy={Y} r={9} fill="#cc3b37" stroke="#fff" strokeWidth={3} />
          </g>
        );
      })}
    </svg>
    </div>
  );
}

function DemoVisual({ spec, runId }) {
  if (spec.kind === 'line') return null; // handled by NumberLineDemo
  if (spec.kind === 'equation') {
    return (
      <div key={runId}>
        <div className="nlv-equation">{spec.equation}</div>
        {spec.line && <NumberLineSVG spec={spec.line} stage={Infinity} />}
      </div>
    );
  }
  if (spec.kind === 'sequence') {
    return (
      <div key={runId}>
        <div className="nlv-pattern nlv-anim">
          {spec.chips.map((c, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.18}s` }}>{c}</span>
          ))}
        </div>
        <p className="nlv-caption"><b>{spec.rule}</b></p>
      </div>
    );
  }
  if (spec.kind === 'cards') {
    return (
      <div key={runId} className="nlv-prop-grid nlv-anim">
        {spec.cards.map(([title, eq], i) => (
          <div key={i} style={{ animationDelay: `${i * 0.18}s` }}>
            <strong>{title}</strong>
            <div>{eq}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function NumberLineDemo({ spec }) {
  const reduced = prefersReducedMotion();
  const jumps = spec.jumps || [];
  const layers = ['bounds'];
  if (spec.mid != null) layers.push('mid');
  layers.push('marks');
  jumps.forEach((_, i) => layers.push(`j${i}`));
  const maxStage = layers.length - 1;
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [runId, setRunId] = useState(0);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunId(n => n + 1);
    if (spec.kind !== 'line') return;
    if (reduced) { setStage(maxStage); return; }
    setPlaying(true);
    setStage(0);
    const order = [];
    for (let s = 1; s <= maxStage; s += 1) order.push(s);
    let t = 450;
    order.forEach((s, i) => {
      timers.current.push(setTimeout(() => {
        setStage(s);
        if (i === order.length - 1) setPlaying(false);
      }, t));
      t += i === 0 ? 650 : 850;
    });
  };
  const finished = spec.kind !== 'line' || stage >= maxStage;
  return (
    <div className="nlv-demo">
      {spec.kind === 'line'
        ? <NumberLineSVG spec={spec} stage={stage} />
        : <DemoVisual spec={spec} runId={runId} />}
      {finished && spec.caption && <p className="nlv-caption">{spec.caption}</p>}
      <div className="nlv-play-row">
        <button className="secondary" onClick={play} disabled={playing && spec.kind === 'line'}>
          <Play size={16} /> {stage === 0 && runId === 0 ? 'Watch it work' : 'Replay'}
        </button>
      </div>
    </div>
  );
}

function QuestionVisual({ q }) {
  if (q.kind === 'line' || q.kind === 'jumps' || q.kind === 'candidates') {
    return <NumberLineSVG spec={q.line} stage={Infinity} />;
  }
  if (q.kind === 'equation') return <div className="nlv-equation">{q.line.equation}</div>;
  if (q.kind === 'pattern') {
    return (
      <div className="nlv-pattern">
        {q.line.chips.map((c, i) => (
          <span key={i} className={c === '?' ? 'nlv-missing' : ''}>{c}</span>
        ))}
      </div>
    );
  }
  if (q.kind === 'compare') {
    return q.line ? <NumberLineSVG spec={q.line} stage={Infinity} /> : null;
  }
  return null;
}

const choiceLabel = (q, value) => {
  const hit = q.choices.find(c => String(c.value) === String(value));
  return hit ? hit.label : String(value);
};

function starRow(n) {
  return (
    <span className="nlv-stars" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < n ? '' : 'off'}>★</i>
      ))}
    </span>
  );
}

function IslandPlay({ island, onBack, onComplete }) {
  const [phase, setPhase] = useState('learn');
  const [questions, setQuestions] = useState(() => makeQuestions(island.id));
  const [qi, setQi] = useState(0);
  const [tries, setTries] = useState(0);
  const [stars, setStars] = useState(0);
  const [wrongTotal, setWrongTotal] = useState(0);
  const [state, setState] = useState('open'); // open | right | revealed
  const [picked, setPicked] = useState(null);
  const [msg, setMsg] = useState('');
  const started = useRef(Date.now());
  const q = questions[qi];

  useEffect(() => { window.scrollTo(0, 0); }, [phase]);

  const choose = c => {
    if (state !== 'open') return;
    if (String(c.value) === String(q.answer)) {
      const first = tries === 0;
      ding();
      if (first) setStars(s => s + 1);
      setState('right');
      setPicked(c.value);
      setMsg(`${island.cheer || PRAISE[Math.floor(Math.random() * PRAISE.length)]}${first ? ' You earned a star!' : ' Nice recovery!'}`);
    } else {
      const t = tries + 1;
      setTries(t);
      setWrongTotal(n => n + 1);
      setPicked(c.value);
      if (t === 1) {
        setMsg(`Try once more. ${q.hint}`);
      } else {
        setState('revealed');
        setMsg(`Good learning! The answer is ${choiceLabel(q, q.answer)}.`);
      }
    }
  };

  const next = () => {
    if (qi >= questions.length - 1) {
      ding(true);
      setPhase('done');
      onComplete({ stars, duration: Date.now() - started.current, tries: wrongTotal });
      return;
    }
    setQi(i => i + 1);
    setTries(0);
    setState('open');
    setPicked(null);
    setMsg('');
  };

  const replay = () => {
    setQuestions(makeQuestions(island.id));
    setQi(0); setTries(0); setStars(0); setWrongTotal(0);
    setState('open'); setPicked(null); setMsg('');
    started.current = Date.now();
    setPhase('learn');
  };

  if (phase === 'learn') {
    return (
      <section className="arcade-page">
        <button className="text-button" onClick={onBack}><ArrowLeft /> All islands</button>
        <div className="worksheet" style={{ marginTop: 18 }}>
          <div className="worksheet-title">
            <div>
              <div className="eyebrow">TEACHER’S STRATEGY</div>
              <h1><span aria-hidden="true">{island.icon}</span> {island.name}</h1>
              <p style={{ margin: '4px 0 0' }}>{island.tag}</p>
            </div>
          </div>
          <ol className="nlv-steps">
            {island.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {island.rhyme && <div className="nlv-rhyme">{island.rhyme}</div>}
          {island.remember && <div className="nlv-remember">{island.remember}</div>}
          <NumberLineDemo spec={island.demo} />
          <div className="nlv-play-row">
            <button className="primary" onClick={() => setPhase('quiz')}>
              I’m ready — start questions
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'done') {
    return (
      <section className="arcade-page">
        <Confetti3D fireKey={1} />
        <div className="worksheet" style={{ marginTop: 18 }}>
          <div className="trail-win">
            <div className="mini-confetti" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <i key={i}>★</i>)}
            </div>
            <span aria-hidden="true">{island.icon}</span>
            <div>
              <small>ISLAND COMPLETE</small>
              <h2>{island.name}</h2>
              <p>{starRow(stars)}</p>
              <p>{stars} of 5 stars — {stars === 5 ? 'Perfect voyage, Captain Shivani!' : stars >= 3 ? 'Strong sailing — your strategy is working!' : 'Every try trained your math brain. Sail again when you’re ready!'}</p>
            </div>
          </div>
          <Star3D />
          <div className="trail-win-actions" style={{ margin: '18px auto 0', maxWidth: 420 }}>
            <button className="primary" onClick={replay}><RotateCcw size={16} /> Sail again</button>
            <button className="secondary" onClick={onBack}>Back to map</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="arcade-page">
      <button className="text-button" onClick={onBack}><ArrowLeft /> All islands</button>
      <div style={{ margin: '14px 0' }}>
        <div className="eyebrow">QUESTION {qi + 1} OF {questions.length} · {stars} {stars === 1 ? 'STAR' : 'STARS'}</div>
      </div>
      <div className="worksheet">
        <div className="worksheet-title">
          <div>
            <div className="eyebrow">{island.name.toUpperCase()}</div>
            <h1>{q.prompt}</h1>
          </div>
          <div className="trail-score"><b>{qi + 1}</b><small>of {questions.length}</small></div>
        </div>
        <QuestionVisual q={q} />
        <div className="nlv-choices">
          {q.choices.map((c, i) => {
            const isAnswer = String(c.value) === String(q.answer);
            const cls = (state !== 'open' && isAnswer) ? 'right'
              : (state !== 'open' && String(c.value) === String(picked) && !isAnswer) ? 'wrong' : '';
            return (
              <button key={i} className={cls} onClick={() => choose(c)}
                disabled={state !== 'open'} aria-label={c.label}>
                {c.label}
              </button>
            );
          })}
        </div>
        <p className={`nlv-feedback ${state === 'right' ? 'good' : msg ? 'hint' : ''}`} aria-live="polite">
          {msg || 'Tap an answer to play.'}
        </p>
        {state !== 'open' && (
          <div className="nlv-play-row">
            <button className="primary" onClick={next}>
              {qi === questions.length - 1 ? 'See my stars' : 'Next question →'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function VoyageMap({ stars, onChoose, onBack }) {
  const total = stars.reduce((a, b) => a + b, 0);
  return (
    <section className="arcade-page">
      <button className="text-button" onClick={onBack}><ArrowLeft /> Adventures</button>
      <div className="arcade-hero">
        <span aria-hidden="true">🌊</span>
        <div>
          <div className="eyebrow">SHIVANI’S NUMBER LINE VOYAGE</div>
          <h1>Choose your next island</h1>
          <p>Learn one smart number-line strategy, watch it work, then earn five stars.</p>
        </div>
      </div>
      <div className="nlv-log">
        <Waves size={26} aria-hidden="true" />
        <div><small>CAPTAIN’S LOG</small><b>{total} / 40 stars</b></div>
        <p>Every try makes your math brain stronger.</p>
      </div>
      <div className="nlv-grid">
        {ISLANDS.map((isl, i) => (
          <button key={isl.id} className="nlv-island" style={{ '--accent': isl.accent }} onClick={() => onChoose(isl.id)}>
            <span className="num">ISLAND {i + 1}</span>
            <span className="ico" aria-hidden="true">{isl.icon}</span>
            <h2>{isl.name}</h2>
            <p>{isl.tag}</p>
            {starRow(stars[i])}
          </button>
        ))}
      </div>
    </section>
  );
}

export function NumberLineVoyage({ onBack, onSave }) {
  const [stars, setStars] = useState(() => Array(ISLANDS.length).fill(0));
  const [active, setActive] = useState(null);
  const island = active ? islandById(active) : null;
  if (island) {
    return (
      <IslandPlay
        key={active}
        island={island}
        onBack={() => setActive(null)}
        onComplete={({ stars: earned, duration, tries }) => {
          setStars(prev => {
            const nextArr = [...prev];
            const i = ISLANDS.findIndex(x => x.id === island.id);
            nextArr[i] = Math.max(nextArr[i], earned);
            return nextArr;
          });
          onSave?.({ mode: `voyage-${island.id}`, round: 1, duration, tries });
        }}
      />
    );
  }
  return <VoyageMap stars={stars} onChoose={setActive} onBack={onBack} />;
}

export default NumberLineVoyage;
