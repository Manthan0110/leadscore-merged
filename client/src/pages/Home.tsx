import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Link } from "react-router-dom";
import "../styles.css";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// Types
type Distribution = { name: string; value: number };
type Bucket = { range: string; value: number };
type Source = { name: string; value: number };
type Lead = {
  score?: number | null;
  source?: string | null;
  createdAt?: Timestamp | null;
  // optional - if your lead documents contain these, we can search them:
  name?: string | null;
  email?: string | null;
  company?: string | null;
  pitch?: string | null;
};

// Colors
const DONUT_COLORS = ["#ec4899", "#8b5cf6", "#10b981"];
const TOP_COLORS = ["#ec4899", "#8b5cf6", "#10b981"];

// Helpers
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- FILTER STATE ---
  const [startDateStr, setStartDateStr] = useState<string>(""); // yyyy-mm-dd
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [queryText, setQueryText] = useState<string>("");

  // Subscribe to leads in real time
  useEffect(() => {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const rows: Lead[] = snap.docs.map((d) => d.data() as Lead);
          setLeads(rows);
          setLoading(false);
        },
        (e) => {
          console.error(e);
          setErr(e.message || "Failed to load leads");
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e: any) {
      setErr(e.message || "Failed to subscribe");
      setLoading(false);
    }
  }, []);

  // --- Derived: unique sources (for filter select) ---
  const uniqueSources = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.source) s.add(l.source);
    });
    return ["all", ...Array.from(s)];
  }, [leads]);

  // --- Convert date strings to Date objects (start/end inclusive) ---
  const startDate = useMemo(() => (startDateStr ? new Date(startDateStr + "T00:00:00") : null), [startDateStr]);
  const endDate = useMemo(() => (endDateStr ? new Date(endDateStr + "T23:59:59") : null), [endDateStr]);

  // --- FILTERED LEADS used by all charts/derivations ---
  const filteredLeads = useMemo(() => {
    const q = queryText.trim().toLowerCase();

    return leads.filter((l) => {
      // createdAt date filter
      const created = l.createdAt instanceof Timestamp ? l.createdAt.toDate() : null;
      if (startDate && created && created < startDate) return false;
      if (endDate && created && created > endDate) return false;

      // source filter
      if (sourceFilter !== "all") {
        const s = (l.source ?? "").toLowerCase();
        if (s !== sourceFilter.toLowerCase()) return false;
      }

      // score range filter
      const score = typeof l.score === "number" ? l.score : null;
      if (minScore !== "" && score !== null && score < Number(minScore)) return false;
      if (maxScore !== "" && score !== null && score > Number(maxScore)) return false;
      // If user set min/max and the lead has null score, we exclude it
      if ((minScore !== "" || maxScore !== "") && score === null) return false;

      // text query (search in name, email, company, pitch)
      if (q) {
        const hay = (
          (l.name ?? "") +
          " " +
          (l.email ?? "") +
          " " +
          (l.company ?? "") +
          " " +
          (l.pitch ?? "") +
          " " +
          (l.source ?? "")
        )
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [leads, startDate, endDate, sourceFilter, minScore, maxScore, queryText]);

  // === Derivations using filteredLeads ===

  // 1) Leads Over Time — last 7 days (based on filtered leads)
  const leadsOverTime = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { [iso: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days[formatISODate(d)] = 0;
    }
    filteredLeads.forEach((l) => {
      const ts = l.createdAt instanceof Timestamp ? l.createdAt.toDate() : null;
      if (!ts) return;
      const iso = formatISODate(startOfDay(ts));
      if (iso in days) days[iso] += 1;
    });
    return Object.entries(days).map(([date, leads]) => ({ date, leads }));
  }, [filteredLeads]);

  // 2) Donut — High/Medium/Low split
  const donutDistribution: Distribution[] = useMemo(() => {
    let high = 0,
      med = 0,
      low = 0;
    filteredLeads.forEach((l) => {
      const s = typeof l.score === "number" ? l.score : null;
      if (s === null) return;
      if (s >= 70) high += 1;
      else if (s >= 40) med += 1;
      else low += 1;
    });
    return [
      { name: "High", value: high },
      { name: "Medium", value: med },
      { name: "Low", value: low },
    ];
  }, [filteredLeads]);

  const totalLeads = useMemo(
    () => donutDistribution.reduce((a, b) => a + b.value, 0),
    [donutDistribution]
  );

  const avgScore = useMemo(() => {
    const scores = filteredLeads
      .map((l) => (typeof l.score === "number" ? l.score : null))
      .filter((x): x is number => x !== null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [filteredLeads]);

  // 3) Score Buckets — 0–20 … 81–100
  const bucketDistribution: Bucket[] = useMemo(() => {
    const ranges: Bucket[] = [
      { range: "0–20", value: 0 },
      { range: "21–40", value: 0 },
      { range: "41–60", value: 0 },
      { range: "61–80", value: 0 },
      { range: "81–100", value: 0 },
    ];
    filteredLeads.forEach((l) => {
      const s = typeof l.score === "number" ? l.score : null;
      if (s === null) return;
      if (s <= 20) ranges[0].value++;
      else if (s <= 40) ranges[1].value++;
      else if (s <= 60) ranges[2].value++;
      else if (s <= 80) ranges[3].value++;
      else ranges[4].value++;
    });
    return ranges;
  }, [filteredLeads]);

  const barData = useMemo(() => bucketDistribution.map((b) => ({ name: b.range, value: b.value })), [bucketDistribution]);

  const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const leadsByWeekday = useMemo(() => {
    const counts = Array(7).fill(0);
    filteredLeads.forEach((l) => {
      const t = l.createdAt instanceof Timestamp ? l.createdAt.toDate() : null;
      if (!t) return;
      counts[t.getDay()] += 1;
    });
    return WEEKDAYS.map((d, i) => ({ day: d, leads: counts[i] }));
  }, [filteredLeads]);

  // 4) Top Sources — percent share of count
  const topSources: Source[] = useMemo(() => {
    const counts: Record<string, number> = {};
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return entries.map(([name, c]) => ({ name, value: Math.round((c / total) * 100) }));
  }, [filteredLeads]);

  // Dashboard summary
  const DASH_SUMMARY = useMemo(() => {
    const hotLeads = filteredLeads.filter((l) => (typeof l.score === "number" ? l.score >= 70 : false)).length;
    const updated = new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
    return {
      avg: avgScore,
      hotLeads,
      recent: leadsOverTime.reduce((a, p) => a + p.leads, 0),
      updated,
      retrain: "weekly",
    };
  }, [avgScore, leadsOverTime, filteredLeads]);

  // --- helper to reset filters quickly ---
  const resetFilters = () => {
    setStartDateStr("");
    setEndDateStr("");
    setSourceFilter("all");
    setMinScore("");
    setMaxScore("");
    setQueryText("");
  };

  // ---------------------
  // Inline styles (pink gradient pills)
  // ---------------------
  const pillWrapper: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "linear-gradient(90deg,#ffe6f2 0%, #ffd0eb 40%, #ffb3e2 100%)",
    boxShadow: "0 6px 18px rgba(236,72,153,0.12)",
    border: "1px solid rgba(236,72,153,0.12)",
  };

  const inputPill: React.CSSProperties = {
    border: "none",
    background: "transparent",
    outline: "none",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 14,
  };

  const selectPill: React.CSSProperties = {
    ...inputPill,
    padding: "4px 10px",
  };

  const resetButtonStyle: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(90deg,#ff7ab8 0%, #8b5cf6 100%)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(139,92,246,0.16)",
  };

  const smallMutedStyle: React.CSSProperties = {
    color: "#6b7280",
    fontSize: 13,
  };

  return (
    <div>
      {/* HERO Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title-pinkpurple">
            LeadScore Lite: Tiny AI,<br /> Big Impact
          </h1>
          <p className="hero-subtitle-effect">
            Prioritize incoming leads instantly with a lightweight, explainable scoring
            model. <br />
            <span className="highlight-pill">
              Submit a pitch, get a score, and focus your team on high-value opportunities.
            </span>
          </p>
        </div>
      </section>

      {/* Optional: loading / error */}
      {loading && (
        <div className="container" style={{ marginTop: 16 }}>
          <div className="small-muted">Loading live data…</div>
        </div>
      )}
      {err && (
        <div className="container" style={{ marginTop: 16, color: "crimson" }}>
          {err}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <section className="container" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={pillWrapper}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>From</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              style={inputPill}
            />
          </label>

          <label style={pillWrapper}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>To</span>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              style={inputPill}
            />
          </label>

          <label style={pillWrapper}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Source</span>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={selectPill}>
              {uniqueSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label style={pillWrapper}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Min</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore === "" ? "" : String(minScore)}
              onChange={(e) => setMinScore(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              style={{ ...inputPill, width: 60 }}
            />
          </label>

          <label style={pillWrapper}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Max</span>
            <input
              type="number"
              min={0}
              max={100}
              value={maxScore === "" ? "" : String(maxScore)}
              onChange={(e) => setMaxScore(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="100"
              style={{ ...inputPill, width: 60 }}
            />
          </label>

          <label style={{ ...pillWrapper, flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Search</span>
            <input
              type="search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="name, email, company, pitch..."
              style={{ ...inputPill, width: "100%" }}
            />
          </label>

          <button onClick={resetFilters} style={resetButtonStyle} aria-label="Reset filters">
            Reset
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={smallMutedStyle}>Tip: use the pills to quickly narrow down leads by date, score or source.</div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW GRID */}
      <section className="container dashboard-preview" style={{ marginTop: 18, opacity: loading ? 0.6 : 1 }}>
        {/* Card 1 — Leads Over Time (Line) */}
        <div className="dashboard-card graph-box">
          <div className="card-header">
            <h3>Leads Over Time</h3>
            <div className="small-muted">Last 7 days (filtered)</div>
          </div>
          <div className="card-content" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#7C4DFF" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 — Donut (Average) */}
        <div className="dashboard-card graph-box">
          <div className="card-header">
            <h3>Lead Score Distribution</h3>
            <div className="small-muted">High / Medium / Low (filtered)</div>
          </div>

          <div
            className="card-content"
            style={{
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {/* Donut */}
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutDistribution}
                    dataKey="value"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={6}
                  >
                    {donutDistribution.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right column: score + legend */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {DASH_SUMMARY.avg}
              </div>
              <div className="small-muted">Average score</div>

              <div
                className="donut-legend"
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                {donutDistribution.map((seg, i) => (
                  <span key={seg.name ?? i} style={{ display: "inline-flex", alignItems: "center" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: DONUT_COLORS[i % DONUT_COLORS.length],
                        display: "inline-block",
                        marginRight: 6,
                      }}
                      aria-hidden="true"
                    />
                    {seg.name ?? ["High", "Medium", "Low"][i]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 — Score Distribution (Bar) */}
        <div className="dashboard-card graph-box">
          <div className="card-header">
            <h3>Score Buckets</h3>
            <div className="small-muted">Distribution by bucket (filtered)</div>
          </div>

          <div className="card-content" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#ec4899" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4 — Leads by Weekday + Top Sources */}
        <div className="dashboard-card graph-box">
          <div className="card-header">
            <h3>Leads by Weekday</h3>
            <div className="small-muted">When leads arrive (filtered)</div>
          </div>

          <div className="card-content" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByWeekday} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="leads" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1 }}>
            {topSources.map((s, i) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 6, background: TOP_COLORS[i % TOP_COLORS.length] }} />
                  <strong>{s.name}</strong>
                </div>
                <div style={{ fontWeight: 800 }}>{s.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
