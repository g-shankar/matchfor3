import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  Heart,
  Leaf,
  Map,
  BarChart3,
  Volume2,
  Lightbulb,
  Check,
  Sparkles,
  Flag,
  Download,
} from "lucide-react";
import {
  worlds,
  labels,
  loadProgress,
  nextQuestion,
  record,
} from "./engine.js";
import "./style.css";
import {
  reflectionSchedule,
  reflectionPrompt,
  hasThought,
  saveReflection,
} from "./reflection.js";
import { useCloudProgress } from "./use-cloud-progress.js";
const Icon = ({ name, ...props }) => {
  const I = { map: Map, heart: Heart, leaf: Leaf }[name] || Sparkles;
  return <I {...props} />;
};
function Island({ world, large = false }) {
  return (
    <svg
      viewBox="0 0 340 205"
      className={`island ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      <ellipse
        cx="170"
        cy="170"
        rx="133"
        ry="19"
        fill={world.color}
        opacity=".3"
      />
      <path
        d="M43 131Q61 84 130 99Q171 72 224 101Q289 97 303 132L283 163Q167 195 65 156Z"
        fill={world.ink}
        opacity=".45"
      />
      <path
        d="M43 131Q61 84 130 99Q171 72 224 101Q289 97 303 132Q178 169 43 131Z"
        fill={world.color}
      />
      {world.id === "shapes" ? (
        <>
          <path d="M131 119L166 138L206 121L200 143L155 151Z" fill="#faf5e4" />
          <path d="M167 121V39L210 108H167Z" fill="#fff9e8" />
          <path d="M160 106H126L160 55Z" fill="#db9076" />
          <path d="M83 112V72H108V113" fill="#718e9b" />
          <path d="M79 72L96 48L113 72Z" fill="#eef3ed" />
          <rect x="90" y="82" width="9" height="13" rx="3" fill="#faf5e4" />
          <path d="M225 128L233 102L248 128" fill="#77949a" />
          <path
            d="M51 169Q71 162 90 170M233 177Q256 169 281 175"
            stroke="#70a6b4"
            strokeWidth="3"
            fill="none"
          />
        </>
      ) : world.id === "area" ? (
        <>
          <path d="M121 119L165 86L221 109L176 145Z" fill="#8cab68" />
          <path
            d="M131 118L174 91M146 127L190 97M160 135L205 104M143 103L199 128M155 95L214 118"
            stroke="#f4eac1"
            strokeWidth="3"
          />
          <path d="M86 120V68M247 126V83" stroke="#677e50" strokeWidth="5" />
          {[
            [86, 65],
            [247, 80],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="20" fill="#e8ae53" />
              <circle cx={x} cy={y} r="9" fill="#8c6837" />
              <path
                d={`M${x} ${y + 44}q-24-20-24-4q5 13 24 9`}
                fill="#8eaa6c"
              />
            </g>
          ))}
          <path d="M231 134L251 132L249 147L235 149Z" fill="#d78662" />
        </>
      ) : world.id === "fractions" ? (
        <>
          {[
            [93, 112, 1],
            [174, 96, 1.3],
            [242, 126, 0.85],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x},${y}) scale(${s})`}>
              <path d="M0 10V-37" stroke="#8a7355" strokeWidth="9" />
              <path d="M-35-20L0-85L35-20Z" fill="#83aa72" />
              <path d="M-29-42L0-97L29-42Z" fill="#a0bd85" />
            </g>
          ))}
          <path
            d="M148 150Q110 129 146 121Q182 118 190 104"
            stroke="#f8efc9"
            strokeWidth="12"
            fill="none"
          />
          <circle cx="215" cy="137" r="8" fill="#d79b81" />
          <circle cx="72" cy="132" r="6" fill="#e1b460" />
        </>
      ) : (
        <>
          <path d="M82 127L140 34L201 126Z" fill="#a799bf" />
          <path d="M140 34L117 72L138 65L156 80L165 72Z" fill="#fff9ed" />
          <path d="M166 135L215 59L270 132Z" fill="#b6a8ca" />
          <path d="M215 59L199 84L219 80L232 94L237 89Z" fill="#faf5ef" />
          <path d="M121 148L136 121L154 147Z" fill="#83759c" />
          <path d="M186 146L198 130L212 147Z" fill="#e2a983" />
        </>
      )}
      <g fill="#fff9ed" opacity=".9">
        <path d="M282 65l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <circle cx="57" cy="87" r="3" />
      </g>
    </svg>
  );
}
function Mascot() {
  return (
    <svg viewBox="0 0 160 170" aria-hidden="true" className="mascot">
      <path
        d="M31 118Q12 76 46 49L37 12Q64 7 80 43Q99 14 125 17L120 55Q150 90 123 129Z"
        fill="#c8d6b2"
        stroke="#687a53"
        strokeWidth="3"
      />
      <ellipse cx="79" cy="106" rx="40" ry="32" fill="#f5eed8" />
      <circle cx="57" cy="80" r="5" fill="#405243" />
      <circle cx="103" cy="80" r="5" fill="#405243" />
      <path
        d="M72 99Q80 109 89 99"
        fill="none"
        stroke="#405243"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="95" rx="9" ry="5" fill="#e5a58e" />
      <ellipse cx="115" cy="95" rx="9" ry="5" fill="#e5a58e" />
      <path
        d="M46 139L38 159M112 139L122 159"
        stroke="#687a53"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M25 122Q8 139 16 145M132 121Q154 132 146 143"
        stroke="#687a53"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M51 128L80 140L108 127L105 140L80 152L53 140Z" fill="#d89b71" />
    </svg>
  );
}
function Visual({ q, bw, bh }) {
  if (q.visual === "shape") {
    const points = {
      triangle: "100,20 180,140 20,140",
      rectangle: "30,45 170,45 170,130 30,130",
      square: "55,30 145,30 145,120 55,120",
      rhombus: "100,20 175,85 100,150 25,85",
      parallelogram: "65,40 180,40 135,130 20,130",
      pentagon: "100,20 180,75 150,145 50,145 20,75",
      trapezoid: "65,40 135,40 180,130 20,130",
      hexagon: "60,25 140,25 180,85 140,145 60,145 20,85",
    };
    return (
      <svg
        className="shape-visual"
        viewBox="0 0 200 180"
        role="img"
        aria-label={`A rotated ${q.shape}`}
      >
        <polygon
          points={points[q.shape]}
          transform={`rotate(${q.rotation} 100 85)`}
          fill="#bfdbd1"
          stroke="#477361"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const bar = (n, d, key) => (
    <div
      className="fraction-bar"
      key={key}
      role="img"
      aria-label={`${n} of ${d} equal parts colored`}
    >
      {Array.from({ length: d }, (_, i) => (
        <span key={i} className={i < n ? "filled" : ""} />
      ))}
    </div>
  );
  if (q.visual === "fractionCircle")
    return (
      <svg
        viewBox="0 0 200 200"
        className="shape-visual"
        role="img"
        aria-label={`${q.n} of ${q.d} equal sectors colored`}
      >
        {Array.from({ length: q.d }, (_, i) => {
          let t = (i * 2 * Math.PI) / q.d - Math.PI / 2,
            u = ((i + 1) * 2 * Math.PI) / q.d - Math.PI / 2;
          return (
            <path
              key={i}
              d={`M100 100L${100 + 80 * Math.cos(t)} ${100 + 80 * Math.sin(t)}A80 80 0 0 1 ${100 + 80 * Math.cos(u)} ${100 + 80 * Math.sin(u)}Z`}
              fill={i < q.n ? "#a8c69a" : "#f5eedb"}
              stroke="#fffdf7"
              strokeWidth="3"
            />
          );
        })}
      </svg>
    );
  if (["fractionBar", "compare", "sum"].includes(q.visual))
    return (
      <div className="bars">
        {bar(q.n, q.d, "a")}
        {["compare", "sum"].includes(q.visual) && (
          <>
            <span>
              {q.visual === "sum" ? "+" : `${q.n}/${q.d} and ${q.m}/${q.d}`}
            </span>
            {bar(q.m, q.d, "b")}
          </>
        )}
      </div>
    );
  if (q.visual === "line")
    return (
      <svg
        className="number-line"
        viewBox="0 0 440 125"
        role="img"
        aria-label={`A line from zero to one with ${q.d} equal intervals and a dot on the ${q.n}th tick`}
      >
        <path d="M30 60H410" stroke="#647b56" strokeWidth="3" />
        {Array.from({ length: q.d + 1 }, (_, i) => (
          <path
            key={i}
            d={`M${30 + (i * 380) / q.d} 50v20`}
            stroke="#647b56"
            strokeWidth="3"
          />
        ))}
        <circle cx={30 + (q.n * 380) / q.d} cy="60" r="9" fill="#d89672" />
        <text x="25" y="100">
          0
        </text>
        <text x="405" y="100">
          1
        </text>
      </svg>
    );
  if (q.visual === "missing")
    return (
      <div className="missing-diagram">
        <span>
          {q.a * q.b}
          <small>altogether</small>
        </span>
        <b>=</b>
        <span>
          {q.a}
          <small>in each group</small>
        </span>
        <b>×</b>
        <span>
          ?<small>groups</small>
        </span>
      </div>
    );
  const width = q.type === "build" ? bw : q.a,
    height = q.type === "build" ? bh : q.b;
  return (
    <div className="grid-wrap">
      <div className="dimension">
        {width} {q.visual === "missing" ? "per group" : "across"}
      </div>
      <div
        className={`tile-grid ${q.visual === "boundary" ? "boundary" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${width},1fr)`,
          maxWidth: width * 33,
        }}
        role="img"
        aria-label={
          q.visual === "missing"
            ? `${q.a * q.b} total, ${q.a} per group`
            : `${height} rows of ${width} tiles`
        }
      >
        {Array.from({ length: width * height }, (_, i) => (
          <span
            key={i}
            className={
              q.visual === "split" && i % width >= q.cut ? "split-tile" : ""
            }
          >
            {q.visual === "missing" ? "·" : ""}
          </span>
        ))}
      </div>
      <div className="dimension">
        {q.visual === "missing" ? "? groups" : `${height} rows`}
      </div>
      {q.visual === "split" && (
        <p>
          {q.b} × {q.cut} <b>+</b> {q.b} × {q.a - q.cut}
        </p>
      )}
    </div>
  );
}
function App() {
  const [progress, setProgress] = useState(loadProgress),
    [page, setPage] = useState("home"),
    [q, setQ] = useState(null),
    [worldId, setWorldId] = useState(null),
    [count, setCount] = useState(0),
    [sessionSkills, setSessionSkills] = useState([]),
    [hint, setHint] = useState(false),
    [retries, setRetries] = useState(0),
    [feedback, setFeedback] = useState(""),
    [solved, setSolved] = useState(false),
    [selected, setSelected] = useState(""),
    [thought, setThought] = useState(""),
    [thoughtShared, setThoughtShared] = useState(false),
    [bw, setBw] = useState(3),
    [bh, setBh] = useState(3),
    [storageError, setStorageError] = useState(false),
    [error, setError] = useState("");
  const questionStart = useRef(Date.now()),
    sessionStart = useRef(Date.now()),
    reflectionStops = useRef([]);
  const needsThought =
    solved && (reflectionStops.current.includes(count) || retries >= 2);
  const waitingForThought = needsThought && !thoughtShared;
  const { status: cloudStatus, retryCloud } = useCloudProgress(
    progress,
    setProgress,
  );
  useEffect(() => {
    try {
      localStorage.setItem("mathquest-v1", JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const reset = (q) => {
    window.speechSynthesis?.cancel();
    setQ(q);
    setHint(false);
    setRetries(0);
    setFeedback("");
    setSolved(false);
    setSelected("");
    setThought("");
    setThoughtShared(false);
    setBw(3);
    setBh(3);
    questionStart.current = Date.now();
  };
  const start = (id) => {
    if (cloudStatus === "connecting") return;
    try {
      setWorldId(id);
      reflectionStops.current = reflectionSchedule();
      setCount(0);
      setSessionSkills([]);
      sessionStart.current = Date.now();
      reset(nextQuestion(progress, id));
      setPage("play");
    } catch (e) {
      setError(e.message);
    }
  };
  const saveAttempt = (skipped) => {
    const p = record(progress, q, {
      hinted: hint,
      retries,
      skipped,
      duration: Date.now() - questionStart.current,
    });
    setProgress(p);
    return p;
  };
  const check = (value) => {
    setSelected(value);
    if (String(value) === q.answer) {
      saveAttempt(false);
      setSolved(true);
      setFeedback(
        retries || hint
          ? "You figured it out! Taking time and using help is how we learn."
          : "Lovely thinking! You made a discovery.",
      );
    } else {
      setRetries((n) => n + 1);
      setHint(true);
      setFeedback(
        "Let’s explore it together. Try using the picture and this clue.",
      );
    }
  };
  const finish = (p, n) => {
    window.speechSynthesis?.cancel();
    setProgress({
      ...p,
      sessions: [
        ...p.sessions,
        {
          date: Date.now(),
          duration: Date.now() - sessionStart.current,
          count: n,
          worldId,
        },
      ].slice(-365),
    });
    setPage("done");
  };
  const advance = (skip = false) => {
    if (!skip && waitingForThought) return;
    const p = skip ? saveAttempt(true) : progress;
    const n = count + 1,
      skills = [...sessionSkills, q.skill];
    setCount(n);
    setSessionSkills(skills);
    if (n >= 8) {
      finish(p, n);
      return;
    }
    try {
      reset(nextQuestion(p, worldId, skills));
    } catch (e) {
      setError(e.message);
      finish(p, n);
    }
  };
  const leave = () => {
    window.speechSynthesis?.cancel();
    if (solved) setSessionSkills((s) => [...s, q.skill]);
    if (count || solved) finish(progress, count + (solved ? 1 : 0));
    else setPage("home");
  };
  const read = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      let u = new SpeechSynthesisUtterance(q.prompt);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mathquest-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const total = progress.attempts.length,
    minutes = Math.round(
      progress.sessions.reduce((s, x) => s + x.duration, 0) / 60000,
    );
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => (page === "play" ? leave() : setPage("home"))}
        >
          <span className="brand-icon">
            <Compass size={26} />
          </span>
          mathquest<span className="brand-dot">✦</span>
        </button>
        <nav>
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => (page === "play" ? leave() : setPage("home"))}
          >
            <Map size={17} /> My adventures
          </button>
          <button
            className={page === "parent" ? "active" : ""}
            onClick={() => {
              if (page === "play") leave();
              setPage("parent");
            }}
          >
            <BarChart3 size={17} /> Parent corner
          </button>
        </nav>
        <div className="profile">
          <span>S</span>
          <div>
            Shivani<small>Curious explorer</small>
          </div>
        </div>
      </header>
      <main>
        {cloudStatus === "connecting" && (
          <div className="cloud-notice">
            Getting your saved discoveries… You can play in a moment.
          </div>
        )}
        {storageError && (
          <div className="notice">
            Your browser cannot save progress right now. You can keep playing;
            export your discoveries in Parent corner before closing.
          </div>
        )}
        {error && (
          <div className="notice">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">
                  <span /> YOUR LITTLE WORLD OF MATH
                </div>
                <h1>
                  A little adventure.
                  <br />A big <em>“I get it!”</em>
                </h1>
                <p>
                  Build a garden. Share a sunbeam. Find a new way.
                  <br />
                  There’s something wonderful waiting to make sense.
                </p>
                <button
                  className="primary"
                  disabled={cloudStatus === "connecting"}
                  onClick={() => start(null)}
                >
                  Let’s explore <ArrowRight size={19} />
                </button>
                <div className="gentle">
                  <Heart size={15} /> No timers. No lost lives. Just
                  discoveries.
                </div>
              </div>
              <div className="hero-art">
                <div className="orbit">
                  ✦<span>1/2</span>
                  <span>×</span>
                  <span>4 + 4</span>
                </div>
                <Island world={worlds[2]} large />
                <Mascot />
                <div className="speech">
                  “What shall we discover today?”
                  <span>YOUR ADVENTURE BUDDY, MILO</span>
                </div>
              </div>
            </section>
            <section className="world-section">
              <div className="section-title">
                <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
                <h2>Pick a place to play</h2>
                <p>
                  Every island is open. Every adventure is a little different.
                </p>
              </div>
              <span className="session-note">
                <Leaf size={17} /> 8 discoveries · go at your pace
              </span>
              <div className="worlds">
                {worlds.map((w, i) => {
                  const practiced = w.skills.filter(
                    (s) => progress.skills[s]?.total,
                  ).length;
                  return (
                    <button
                      className="world-card"
                      disabled={cloudStatus === "connecting"}
                      key={w.id}
                      onClick={() => start(w.id)}
                      style={{ "--world-color": w.color, "--world-ink": w.ink }}
                    >
                      <div className="card-top">
                        <span className="world-number">0{i + 1}</span>
                        {i === 0 && total === 0 ? (
                          <span className="pill">A lovely place to start</span>
                        ) : (
                          <span className="mini-stars">✧ ✧ ✧</span>
                        )}
                      </div>
                      <Island world={w} />
                      <h3>{w.name}</h3>
                      <p>{w.tag}</p>
                      <div className="card-footer">
                        <span>
                          {practiced
                            ? `${practiced} skills explored`
                            : "A fresh adventure"}
                        </span>
                        <span className="round-arrow">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="bottom-note">
              <span className="note-flower">✿</span>
              <div>
                <b>Small steps are wonderful steps.</b>
                <p>
                  A hint is a helping hand. A mistake is a chance to discover.
                  You can stop whenever you like.
                </p>
              </div>
              <span className="little-stamp">
                MADE FOR
                <br />
                <b>curious minds</b>
              </span>
            </section>
          </>
        )}
        {page === "play" && q && (
          <section className="play">
            <div className="play-top">
              <button className="text-button" onClick={leave}>
                <ArrowLeft size={17} /> Finish for now
              </button>
              <span>
                {worlds.find((w) => w.id === worldId)?.name ||
                  "A little of everything"}
              </span>
              <span>{count + 1} of 8 discoveries</span>
            </div>
            <div className="progress-dots">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < count ? "complete" : i === count ? "current" : ""
                  }
                />
              ))}
            </div>
            <div className="question-card">
              <div className="eyebrow">
                {labels[q.skill]} ·{" "}
                {q.level === 1
                  ? "EXPLORE"
                  : q.level === 2
                    ? "CONNECT"
                    : "STRETCH"}
              </div>
              <div className="question-heading">
                <h2>{q.prompt}</h2>
                <button
                  className="audio"
                  aria-label="Read question aloud"
                  onClick={read}
                >
                  <Volume2 size={22} />
                </button>
              </div>
              <Visual q={q} bw={bw} bh={bh} />
              {q.type === "build" && (
                <div className="builder">
                  <label>
                    Width{" "}
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={bw}
                      disabled={solved}
                      onChange={(e) => setBw(+e.target.value)}
                    />
                    <b>{bw}</b>
                  </label>
                  <label>
                    Height{" "}
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={bh}
                      disabled={solved}
                      onChange={(e) => setBh(+e.target.value)}
                    />
                    <b>{bh}</b>
                  </label>
                  <button
                    className="primary"
                    disabled={solved}
                    onClick={() => check(bw * bh)}
                  >
                    Check my garden <Check size={18} />
                  </button>
                </div>
              )}
              {q.type === "choice" && (
                <div className="answers">
                  {q.choices.map((c) => (
                    <button
                      key={c}
                      className={
                        selected === c ? (solved ? "correct" : "chosen") : ""
                      }
                      disabled={solved}
                      onClick={() => check(c)}
                    >
                      {c}
                      {solved && selected === c && <Check size={20} />}
                    </button>
                  ))}
                </div>
              )}
              <div aria-live="polite">
                {feedback && (
                  <p className={`feedback ${solved ? "success" : ""}`}>
                    {solved ? <Sparkles size={18} /> : <Leaf size={18} />}{" "}
                    {feedback}
                  </p>
                )}
                {hint && !solved && (
                  <div className="hint">
                    <Lightbulb size={19} />
                    <p>{q.hint}</p>
                  </div>
                )}
                {solved && !waitingForThought && (
                  <div className="explanation">{q.explain}</div>
                )}
              </div>
              {needsThought && (
                <section
                  className="reflection-box"
                  aria-labelledby="thought-heading"
                >
                  <div className="eyebrow">
                    <Lightbulb size={16} /> MILO IS CURIOUS
                  </div>
                  <h3 id="thought-heading">How did you figure it out?</h3>
                  <label htmlFor="thought-text">
                    {reflectionPrompt(q.skill)}
                  </label>
                  <p id="thought-help">
                    A few words or a math sentence is plenty. Spelling doesn’t
                    matter. You can say “I guessed” and tell us what you’ll try
                    next.
                  </p>
                  <textarea
                    id="thought-text"
                    aria-describedby="thought-help"
                    maxLength={500}
                    rows={3}
                    value={thought}
                    disabled={thoughtShared}
                    onChange={(e) => setThought(e.target.value)}
                    placeholder="I noticed… / I counted… / I broke it into…"
                  />
                  {thoughtShared ? (
                    <p className="thought-thanks" role="status">
                      Thanks for sharing your thinking! There’s more than one
                      way to discover.
                    </p>
                  ) : (
                    <button
                      className="primary"
                      disabled={!hasThought(thought)}
                      onClick={() => {
                        if (!hasThought(thought)) return;
                        setProgress((p) => saveReflection(p, q, thought));
                        setThoughtShared(true);
                      }}
                    >
                      Share my thinking <Check size={17} />
                    </button>
                  )}
                </section>
              )}
              <div className="question-actions">
                {solved ? (
                  <button
                    className="primary"
                    disabled={waitingForThought}
                    onClick={() => advance()}
                  >
                    {count === 7 ? "See my discoveries" : "Next discovery"}{" "}
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button
                      className="text-button"
                      onClick={() => setHint(true)}
                    >
                      <Lightbulb size={17} /> Give me a clue
                    </button>
                    <button
                      className="text-button"
                      onClick={() => advance(true)}
                    >
                      Let’s try something else <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="under-question">
              <Heart size={15} /> Thinking takes time. There’s no hurry here.
            </p>
          </section>
        )}
        {page === "done" && (
          <section className="done">
            <div className="eyebrow">A GOOD PLACE TO PAUSE</div>
            <Mascot />
            <h1>Look what you explored!</h1>
            <p>
              {count} {count === 1 ? "discovery" : "discoveries"}. New ideas.
              And a little more confidence.
              <br />
              Milo will be here whenever you feel like another adventure.
            </p>
            <div className="discovery-tags">
              {[...new Set(sessionSkills)].map((s) => (
                <span key={s}>
                  <Sparkles size={15} />
                  {labels[s]}
                </span>
              ))}
            </div>
            <div className="done-actions">
              <button className="primary" onClick={() => setPage("home")}>
                Back to my islands <Map size={18} />
              </button>
              <button className="secondary" onClick={() => start(worldId)}>
                I’d like to explore more
              </button>
            </div>
            <p className="offline">
              Try something off screen:{" "}
              {worlds.find((w) => w.id === worldId)?.activity ||
                "Find a rectangle nearby. How could you measure its inside and its boundary?"}
            </p>
          </section>
        )}
        {page === "parent" && (
          <section className="parent">
            <div className="eyebrow">FOR THE GROWN-UPS</div>
            <h1>Little steps, made visible.</h1>
            <p>Notice how she thinks. Celebrate the ideas that click.</p>
            <div className="stats">
              <div>
                <span>Discoveries explored</span>
                <strong>{total}</strong>
              </div>
              <div>
                <span>Skills encountered</span>
                <strong>
                  {Object.keys(progress.skills).length}
                  <small> / 13</small>
                </strong>
              </div>
              <div>
                <span>Completed adventures</span>
                <strong>{progress.sessions.length}</strong>
              </div>
              <div>
                <span>Adventure time</span>
                <strong>
                  {minutes}
                  <small> min</small>
                </strong>
              </div>
            </div>
            <div className="parent-note">
              <Leaf size={22} />
              <p>
                Practice observations, not test scores. “Independent” means
                solved without a clue or retry. Supported answers count as
                learning too. A few answers are too little evidence to judge
                understanding.
              </p>
            </div>
            <div className="parent-grid">
              {worlds.map((w) => (
                <article key={w.id}>
                  <h2>
                    {w.icon} {w.name}
                  </h2>
                  {w.skills.map((skill) => {
                    const s = progress.skills[skill];
                    return (
                      <div className="skill-row" key={skill}>
                        <div>
                          <b>{labels[skill]}</b>
                          <span>
                            {s
                              ? `${s.independent} independent · ${s.supported} with help · ${s.total} explored`
                              : "Waiting to be explored"}
                          </span>
                        </div>
                        <div className="skill-meter">
                          <span
                            style={{
                              width: `${s ? (s.independent / s.total) * 100 : 0}%`,
                              background: w.ink,
                            }}
                          />
                        </div>
                        {s && s.total < 5 && (
                          <small>Still getting to know this skill</small>
                        )}
                      </div>
                    );
                  })}
                  <div className="offline-tip">
                    <b>An off-screen idea</b>
                    <p>{w.activity}</p>
                  </div>
                </article>
              ))}
            </div>
            <section className="parent-reflections">
              <h2>In her own words</h2>
              <p>
                Her latest explanations. These are conversation starters, not
                graded writing.
              </p>
              {progress.attempts.some((a) => a.reflection) ? (
                progress.attempts
                  .filter((a) => a.reflection)
                  .slice(-6)
                  .reverse()
                  .map((a) => (
                    <article key={`${a.date}-${a.fingerprint}`}>
                      <div className="eyebrow">{labels[a.skill]}</div>
                      <h3>{a.reflection.question}</h3>
                      <p>{a.reflection.prompt}</p>
                      <blockquote>{a.reflection.text}</blockquote>
                    </article>
                  ))
              ) : (
                <p>
                  Occasional “How did you figure it out?” moments will appear
                  here after she shares her thinking.
                </p>
              )}
            </section>
            <div className="cloud-panel">
              <div>
                <b>
                  {cloudStatus === "saved"
                    ? "Discoveries backed up to Firebase"
                    : cloudStatus === "saving"
                      ? "Saving your discoveries…"
                      : cloudStatus === "connecting"
                        ? "Connecting to cloud backup…"
                        : "Saved in this browser · cloud backup unavailable"}
                </b>
                <p>
                  Practice history is saved to your private browser profile in
                  Firestore. School reports and assessment scores are never
                  uploaded. This anonymous profile does not sync to another
                  device or survive clearing your sign-in data.
                </p>
              </div>
              {cloudStatus === "local" && (
                <button className="secondary" onClick={retryCloud}>
                  Retry cloud saving
                </button>
              )}
            </div>
            <div className="data-note">
              <p>
                Browser saving keeps play available if the cloud connection
                fails. Export a copy to keep a backup you control.
              </p>
              <button className="secondary" onClick={exportData}>
                <Download size={17} /> Export progress
              </button>
            </div>
          </section>
        )}
      </main>
      <footer>
        <span>
          <Compass size={15} /> mathquest
        </span>
        <p>Made for discovery. A little at a time.</p>
        <span>With room to wonder ✦</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
