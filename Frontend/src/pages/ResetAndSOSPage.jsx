import React, { useState, useEffect, useMemo } from "react";
import {
  todayISO,
  uid,
  fmtDate,
  percent,
  safeNum,
  URGE_STEPS,
  URGE_TRIGGERS,
  URGE_LOCATIONS,
  ENV_CHECKLIST,
  Button,
  Card,
  Heading,
  Empty,
  Progress,
  Field,
  Stat,
  CountdownTimer,
} from "../shared";

const BREATH_478 = [
  { name: "Inhale through nose", secs: 4, scale: 1.18 },
  { name: "Hold calmly", secs: 7, scale: 1.18 },
  { name: "Slow mouth exhale", secs: 8, scale: 0.88 },
];

function ResetAndSOSPage({
  data,
  setData,
  today,
  dm,
  updateDay,
  onOpenSOS,
  notify,
}) {
  const [subTab, setSubTab] = useState("sos"); // sos | shields | history
  const [breathRunning, setBreathRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecLeft, setPhaseSecLeft] = useState(BREATH_478[0].secs);
  const [doneSteps, setDoneSteps] = useState({});

  const [quickUrge, setQuickUrge] = useState({
    trigger: URGE_TRIGGERS[0],
    location: URGE_LOCATIONS[0],
    before: 8,
    after: 2,
    slip: false,
  });

  const currentPhase = BREATH_478[phaseIdx] || BREATH_478[0];

  useEffect(() => {
    if (!breathRunning) return undefined;
    const id = window.setInterval(() => {
      setPhaseSecLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx = (phaseIdx + 1) % BREATH_478.length;
        setPhaseIdx(nextIdx);
        return BREATH_478[nextIdx].secs;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathRunning, phaseIdx]);

  const urges = data.urges || [];
  const passed = urges.filter((u) => !u.slip).length;
  const activeShieldsCount = Object.values(data.env || {}).filter(Boolean).length;

  const topTriggers = useMemo(() => {
    const counts = {};
    urges.forEach((u) => {
      const k = u.trigger?.trim();
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [urges]);

  const handleSaveQuickUrge = () => {
    const entry = {
      id: uid(),
      ts: Date.now(),
      trigger: quickUrge.trigger,
      location: quickUrge.location,
      before: safeNum(quickUrge.before, 8),
      after: safeNum(quickUrge.after, 2),
      slip: Boolean(quickUrge.slip),
    };
    setData((old) => ({
      ...old,
      urges: [entry, ...(old.urges || [])],
    }));
    if (typeof updateDay === "function") {
      updateDay(today, (prev) => ({
        ...prev,
        slip: quickUrge.slip ? true : prev.slip,
        c: {
          ...(prev.c || {}),
          noPorn: !quickUrge.slip,
        },
      }));
    }
    notify(
      quickUrge.slip
        ? "Logged without shame. Focus on the next clean hour."
        : "Urge surfed! Streak protected."
    );
  };

  const handleDeleteUrge = (id) => {
    setData((old) => ({
      ...old,
      urges: (old.urges || []).filter((u) => u.id !== id),
    }));
    notify("Entry removed");
  };

  return (
    <>
      <Heading
        title={dm("Reset & Urge SOS")}
        description="Calm your nervous system in 10 minutes. No shame, just action."
        action={
          <Button kind="primary" onClick={onOpenSOS}>
            🛡 Full-Screen SOS
          </Button>
        }
      />

      <div className="stats-grid reset-stats">
        <Stat
          icon="✓"
          label="Urges Surfed"
          value={passed}
          detail="Waves overcome"
          color="sage"
        />
        <Stat
          icon="🛡"
          label="Digital Shields"
          value={`${activeShieldsCount}/${ENV_CHECKLIST.length}`}
          detail={`${percent(activeShieldsCount, ENV_CHECKLIST.length)}% active`}
          color="blue"
        />
      </div>

      <div className="tabs large-tabs">
        <button
          type="button"
          className={subTab === "sos" ? "selected" : ""}
          onClick={() => setSubTab("sos")}
        >
          4-7-8 Breathing &amp; Wave Timer
        </button>
        <button
          type="button"
          className={subTab === "shields" ? "selected" : ""}
          onClick={() => setSubTab("shields")}
        >
          Blocker Shields ({activeShieldsCount}/{ENV_CHECKLIST.length})
        </button>
        <button
          type="button"
          className={subTab === "history" ? "selected" : ""}
          onClick={() => setSubTab("history")}
        >
          Patterns &amp; History ({urges.length})
        </button>
      </div>

      {subTab === "sos" && (
        <div className="stack-col">
          <div className="dashboard-grid">
            <Card>
              <div className="eyebrow">CALM YOUR BODY</div>
              <h2>4-7-8 Breathing Pacer</h2>
              <div className="breathing-guide-stage">
                <div
                  className={`breathing-guide-orb ${breathRunning ? "is-running" : ""} ${
                    currentPhase.scale > 1 ? "phase-expand" : "phase-contract"
                  }`}
                >
                  <strong className="breathing-guide-time">{phaseSecLeft}s</strong>
                  <small className="muted-text jsx-65f9d5a3">
                    {breathRunning ? currentPhase.name : "Tap Start"}
                  </small>
                </div>
              </div>
              <div className="heading-btn-group">
                <Button
                  kind="primary"
                  onClick={() => setBreathRunning((r) => !r)}
                >
                  {breathRunning ? "Pause" : "▶ Start 4-7-8"}
                </Button>
                <Button
                  onClick={() => {
                    setBreathRunning(false);
                    setPhaseIdx(0);
                    setPhaseSecLeft(BREATH_478[0].secs);
                  }}
                >
                  Reset
                </Button>
              </div>
            </Card>

            <Card>
              <div className="eyebrow">OUTLAST THE PEAK</div>
              <h2>10-Minute Wave Timer &amp; Quick Log</h2>
              <CountdownTimer
                defaultSeconds={600}
                label="Urge peaks & drops within 10 minutes"
                onComplete={() => notify("10 minutes complete! Wave passed.")}
              />

              <div className="form-grid jsx-655d124c">
                <Field label="Trigger">
                  <select
                    value={quickUrge.trigger}
                    onChange={(e) =>
                      setQuickUrge({ ...quickUrge, trigger: e.target.value })
                    }
                  >
                    {URGE_TRIGGERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Location">
                  <select
                    value={quickUrge.location}
                    onChange={(e) =>
                      setQuickUrge({ ...quickUrge, location: e.target.value })
                    }
                  >
                    {URGE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="row-between jsx-b08e79e1">
                <label className="archive-toggle">
                  <input
                    type="checkbox"
                    checked={quickUrge.slip}
                    onChange={(e) =>
                      setQuickUrge({ ...quickUrge, slip: e.target.checked })
                    }
                  />
                  Slip occurred
                </label>
                <Button kind="primary" onClick={handleSaveQuickUrge}>
                  ✓ Save Log
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <div className="eyebrow">IMMEDIATE CIRCUIT BREAKER</div>
            <h2>Quick Action Checklist</h2>
            <div className="habit-list">
              {URGE_STEPS.map((s) => {
                const checked = Boolean(doneSteps[s.step]);
                return (
                  <div
                    className={`habit-row ${checked ? "checked" : ""}`}
                    key={s.step}
                  >
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() =>
                        setDoneSteps({ ...doneSteps, [s.step]: !checked })
                      }
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>
                        {s.step}. {s.title}
                      </strong>
                      <small>{s.detail}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {subTab === "shields" && (
        <Card>
          <div className="section-head">
            <div>
              <div className="eyebrow">ENVIRONMENT FRICTION</div>
              <h2>Digital Blocker Checklist</h2>
            </div>
            <span className="status-pill complete">
              {activeShieldsCount}/{ENV_CHECKLIST.length} Active
            </span>
          </div>
          <div className="jsx-5beb8fbe">
            <Progress value={percent(activeShieldsCount, ENV_CHECKLIST.length)} />
          </div>
          <div className="habit-list">
            {ENV_CHECKLIST.map((item) => {
              const checked = Boolean(data.env && data.env[item.id]);
              return (
                <div
                  className={`habit-row ${checked ? "checked" : ""}`}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="check-circle"
                    onClick={() =>
                      setData((old) => ({
                        ...old,
                        env: { ...(old.env || {}), [item.id]: !checked },
                      }))
                    }
                  >
                    {checked ? "✓" : ""}
                  </button>
                  <div className="habit-info">
                    <strong>{item.title}</strong>
                    <small>{item.sub}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {subTab === "history" && (
        <div className="stack-col">
          {topTriggers.length > 0 && (
            <Card>
              <div className="eyebrow">TOP TRIGGERS</div>
              <h2>What triggers urges most</h2>
              {topTriggers.map(([label, count]) => (
                <div className="trigger-row" key={label}>
                  <span>{dm(label)}</span>
                  <div className="trigger-track">
                    <progress
                      className="trigger-meter"
                      value={percent(count, topTriggers[0][1])}
                      max={100}
                    />
                  </div>
                  <b>{count}</b>
                </div>
              ))}
            </Card>
          )}

          <Card>
            <div className="eyebrow">LOGS</div>
            <h2>Recent SOS History</h2>
            {urges.length === 0 ? (
              <Empty
                icon="↻"
                title="No logs yet"
                description="Use the wave timer above whenever an urge hits."
              />
            ) : (
              urges.map((u) => (
                <div className="reset-log" key={u.id}>
                  <div className="reset-log-date">
                    <strong>{fmtDate(todayISO(new Date(u.ts || Date.now())))}</strong>
                  </div>
                  <div className="reset-log-content">
                    <strong>{dm(u.trigger)}</strong>
                    <p>Location: {u.location}</p>
                    <span className={`status-pill ${!u.slip ? "complete" : ""}`}>
                      {!u.slip ? "Urge passed" : "Slip logged"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="danger-text"
                    onClick={() => handleDeleteUrge(u.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </>
  );
}

export { ResetAndSOSPage };