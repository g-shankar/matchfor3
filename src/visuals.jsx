import React from "react";
import {EnhancedVisual} from "./activities.jsx";
export function Visual({ q, bw, bh }) {
  if(q.requireDifferent)return <><EnhancedVisual q={q}/><p className="your-garden-label">Your new garden</p><Visual q={{...q,visual:'grid',model:null,requireDifferent:false}} bw={bw} bh={bh}/></>;
  if(q.model&&!['shape','fractionCircle','fractionBar','line','compare','sum'].includes(q.visual))return <EnhancedVisual q={q}/>;
  if (q.visual === "shape") {
    const points = {
      triangle: "100,15 180,153.56 20,153.56",
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
        viewBox="-15 -15 230 210"
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
