import React, { useState, useMemo } from "react";
import {
  todayISO,
  uid,
  fmtDate,
  safeNum,
  DISCLAIMER_TEXT,
  CONTROL_LOOPS,
  Button,
  Card,
  Heading,
  Empty,
  Field,
  Stat,
  CountdownTimer,
} from "../shared";

const POMODORO_PRESETS = [
  { id: "p25", label: "25m Pomodoro", mins: 25, sec: 1500 },
  { id: "p50", label: "50m Deep Work", mins: 50, sec: 3000 },
  { id: "p90", label: "90m Mock / Coding", mins: 90, sec: 5400 },
  { id: "b10", label: "10m Walk Break", mins: 10, sec: 600 },
];

function parseTimeMins(timeStr = "07:00") {
  const parts = String(timeStr).split(":");
  const h = safeNum(parts[0], 7);
  const m = safeNum(parts[1], 0);
  return h * 60 + m;
}

function minsToTimeStr(totalMins) {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function MoreAndSettingsPage({
  data,
  setData,
  updateProfile,
  exportData,
  importData,
  resetAll,
  notify,
}) {
  const [subTab, setSubTab] = useState("sleep"); // sleep | control | help
  const [taskName, setTaskName] = useState("Apna Kaam (25m Deep Focus)");
  const [selectedPreset, setSelectedPreset] = useState(POMODORO_PRESETS[0]);
  const [manualMins, setManualMins] = useState(45);
  const [ifThenForm, setIfThenForm] = useState({ trigger: "", action: "" });

  const today = todayISO();
  const p = data.profile || {};
  const activeLoops = data.settings?.activeLoops || [];
  const focusSessions = data.focusSessions || [];

  const toggleLoop = (loopId) => {
    setData((old) => {
      const cur = old.settings?.activeLoops || [];
      const next = cur.includes(loopId)
        ? cur.filter((x) => x !== loopId)
        : [...cur, loopId];
      return {
        ...old,
        settings: { ...(old.settings || {}), activeLoops: next },
      };
    });
  };

  const setAllLoops = (mode) => {
    const next =
      mode === "all"
        ? CONTROL_LOOPS.map((x) => x.id)
        : ["junk", "lateCaff", "doomscroll"];
    setData((old) => ({
      ...old,
      settings: { ...(old.settings || {}), activeLoops: next },
    }));
    notify(
      mode === "all"
        ? "All 13 control loops activated"
        : "Reset to top 3 core loops"
    );
  };

  const logFocusSession = (minsToLog, labelToLog) => {
    const cleanMins = Math.max(5, safeNum(minsToLog, 25));
    const entry = {
      id: uid(),
      date: today,
      task: (labelToLog || taskName || "Deep Work Block").trim(),
      mins: cleanMins,
      ts: Date.now(),
    };
    setData((old) => ({
      ...old,
      focusSessions: [entry, ...(old.focusSessions || [])],
    }));
    notify(`${cleanMins}-min focus block logged!`);
  };

  const deleteFocusSession = (id) => {
    setData((old) => ({
      ...old,
      focusSessions: (old.focusSessions || []).filter((s) => s.id !== id),
    }));
  };

  const todayMins = useMemo(
    () =>
      focusSessions
        .filter((s) => s.date === today)
        .reduce((acc, s) => acc + safeNum(s.mins, 0), 0),
    [focusSessions, today]
  );

  const sleepMetrics = useMemo(() => {
    const wakeMins = parseTimeMins(p.wakeTime || "07:00");
    const bedMins = parseTimeMins(p.bedtime || "23:00");

    let durationMins = wakeMins - bedMins;
    if (durationMins <= 0) durationMins += 1440;

    return {
      durationHours: +(durationMins / 60).toFixed(1),
      caffeineCutoff: minsToTimeStr(bedMins - 480),
      screenSunset: minsToTimeStr(bedMins - 90),
      sunlightWindowEnd: minsToTimeStr(wakeMins + 45),
      fiveCycleBed: minsToTimeStr(wakeMins - 465),
    };
  }, [p.wakeTime, p.bedtime]);

  const handleAddIfThen = () => {
    const t = ifThenForm.trigger.trim();
    const a = ifThenForm.action.trim();
    if (!t || !a) return;
    setData((old) => ({
      ...old,
      ifThen: [
        { id: `ift-${uid()}`, trigger: t, action: a },
        ...(old.ifThen || []),
      ],
    }));
    setIfThenForm({ trigger: "", action: "" });
    notify("If-Then rule saved");
  };

  const handleDeleteIfThen = (id) => {
    setData((old) => ({
      ...old,
      ifThen: (old.ifThen || []).filter((x) => x.id !== id),
    }));
  };

  return (
    <>
      <Heading
        title="Focus, Sleep & Settings"
        description="Deep work Pomodoro timer, sleep anchors, dopamine guards, and data backup."
      />

      <div className="tabs large-tabs">
        {[
          ["sleep", `Pomodoro & Sleep (${todayMins}m)`],
          ["control", `Control Guards (${activeLoops.length})`],
          ["help", "Targets & Backup"],
        ].map(([k, lbl]) => (
          <button
            type="button"
            key={k}
            className={subTab === k ? "selected" : ""}
            onClick={() => setSubTab(k)}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: SLEEP & DEEP WORK POMODORO
          ===================================================================== */}
      {subTab === "sleep" && (
        <div className="stack-col">
          <div className="stats-grid">
            <Stat
              icon="◈"
              label="Today's Deep Focus"
              value={`${todayMins} mins`}
              detail={`${(todayMins / 60).toFixed(1)} hrs logged today`}
              color="sage"
            />
            <Stat
              icon="☾"
              label="Sleep Window"
              value={`${sleepMetrics.durationHours} hrs`}
              detail={`Cutoff: ${sleepMetrics.caffeineCutoff} caffeine · ${sleepMetrics.screenSunset} screen`}
              color="blue"
            />
          </div>

          <div className="dashboard-grid">
            <Card>
              <div className="eyebrow">DEEP WORK POMODORO</div>
              <h2>Distraction-free focus sprint</h2>

              <div className="category-pills jsx-e5a6d3c3">
                {POMODORO_PRESETS.map((pr) => (
                  <button
                    type="button"
                    key={pr.id}
                    className={selectedPreset.id === pr.id ? "selected" : ""}
                    onClick={() => {
                      setSelectedPreset(pr);
                      setTaskName(`Apna Kaam (${pr.label})`);
                    }}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>

              <Field label="Current Focus Task">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </Field>

              <div className="jsx-dffc4db2">
                <CountdownTimer
                  defaultSeconds={selectedPreset.sec}
                  label={taskName}
                  onComplete={() =>
                    logFocusSession(selectedPreset.mins, taskName)
                  }
                />
              </div>

              <div className="inline-add-row jsx-d18d96ac">
                <input
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  className="clean-input jsx-068ccabc"
                  value={manualMins}
                  onChange={(e) => setManualMins(safeNum(e.target.value, 45))}
                />
                <Button onClick={() => logFocusSession(manualMins, taskName)}>
                  ＋ Log {manualMins}m Offline Study
                </Button>
              </div>
            </Card>

            <Card>
              <div className="eyebrow">CIRCADIAN SLEEP ANCHORS</div>
              <h2>Wake &amp; bedtime schedule</h2>
              <div className="form-grid jsx-4bb90035">
                <Field label="Fixed Wake Time">
                  <input
                    type="time"
                    value={p.wakeTime || "07:00"}
                    onChange={(e) =>
                      updateProfile({ wakeTime: e.target.value })
                    }
                  />
                </Field>
                <Field label="Planned Bedtime">
                  <input
                    type="time"
                    value={p.bedtime || "23:00"}
                    onChange={(e) => updateProfile({ bedtime: e.target.value })}
                  />
                </Field>
              </div>

              <div className="category-pills jsx-f6adec06">
                <button
                  type="button"
                  onClick={() =>
                    updateProfile({ bedtime: sleepMetrics.fiveCycleBed })
                  }
                >
                  Set 7.5h Sleep ({sleepMetrics.fiveCycleBed})
                </button>
              </div>

              <div className="routine-step-box jsx-e5a6d3c3">
                <p>
                  • <strong>Morning Sunlight:</strong> Before{" "}
                  <strong>{sleepMetrics.sunlightWindowEnd}</strong>
                </p>
                <p>
                  • <strong>Caffeine Cutoff:</strong> By{" "}
                  <strong>{sleepMetrics.caffeineCutoff}</strong>
                </p>
                <p>
                  • <strong>Phone Outside Bedroom:</strong> By{" "}
                  <strong>{sleepMetrics.screenSunset}</strong>
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">RECENT SESSIONS</div>
                <h2>Completed focus blocks</h2>
              </div>
              <span className="status-pill">
                {focusSessions.length} sessions
              </span>
            </div>
            {focusSessions.length === 0 ? (
              <Empty
                icon="◈"
                title="No focus sessions logged yet"
                description="Complete a Pomodoro sprint or log an offline study block above."
              />
            ) : (
              <div className="habit-list">
                {focusSessions.slice(0, 6).map((s) => (
                  <div className="habit-row checked" key={s.id}>
                    <div className="habit-info">
                      <strong>{s.task}</strong>
                      <small>{fmtDate(s.date)}</small>
                    </div>
                    <span className="status-pill complete">{s.mins} mins</span>
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() => deleteFocusSession(s.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 2: DOPAMINE CONTROL PANEL & IF-THEN BUILDER
          ===================================================================== */}
      {subTab === "control" && (
        <div className="stack-col">
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">DAILY GUARDS</div>
                <h2>Select loops to monitor on Today&apos;s dashboard</h2>
              </div>
              <div className="heading-btn-group">
                <Button onClick={() => setAllLoops("all")}>Select All</Button>
                <Button onClick={() => setAllLoops("default")}>
                  Reset Top 3
                </Button>
              </div>
            </div>

            <div className="habit-list jsx-dffc4db2">
              {CONTROL_LOOPS.map((item) => {
                const active = activeLoops.includes(item.id);
                return (
                  <div
                    className={`habit-row ${active ? "checked" : ""}`}
                    key={item.id}
                  >
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() => toggleLoop(item.id)}
                    >
                      {active ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{item.title}</strong>
                      <small>{item.sub}</small>
                    </div>
                    <span className={`status-pill ${active ? "complete" : ""}`}>
                      {active ? "Active" : "Off"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="eyebrow">IF–THEN IMPLEMENTATION RULES</div>
            <h2>Pre-program your response to triggers</h2>

            <div className="form-grid jsx-4bb90035">
              <Field label="IF (Trigger occurs...)">
                <input
                  type="text"
                  placeholder="e.g. I feel like scrolling reels alone at night"
                  value={ifThenForm.trigger}
                  onChange={(e) =>
                    setIfThenForm({ ...ifThenForm, trigger: e.target.value })
                  }
                />
              </Field>
              <Field label="THEN (I will immediately...)">
                <div className="inline-add-row jsx-ec0f7ffa">
                  <input
                    type="text"
                    placeholder="e.g. Put phone in living room & do 15 push-ups"
                    value={ifThenForm.action}
                    onChange={(e) =>
                      setIfThenForm({ ...ifThenForm, action: e.target.value })
                    }
                  />
                  <Button kind="primary" onClick={handleAddIfThen}>
                    ＋ Add
                  </Button>
                </div>
              </Field>
            </div>

            {(data.ifThen || []).length > 0 && (
              <div className="habit-list jsx-dffc4db2">
                {(data.ifThen || []).map((rule) => (
                  <div className="habit-row checked" key={rule.id}>
                    <span className="status-pill complete">IF → THEN</span>
                    <div className="habit-info">
                      <strong>If: {rule.trigger}</strong>
                      <small>Then: {rule.action}</small>
                    </div>
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() => handleDeleteIfThen(rule.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 3: SYSTEM SETTINGS & BACKUP VAULT
          ===================================================================== */}
      {subTab === "help" && (
        <div className="dashboard-grid">
          <Card>
            <div className="eyebrow">PREFERENCES &amp; TARGETS</div>
            <h2>Discreet mode, Bad Day mode &amp; targets</h2>
            <div className="habit-list jsx-4bb90035">
              <div className={`habit-row ${p.discreet ? "checked" : ""}`}>
                <button
                  type="button"
                  className="check-circle"
                  onClick={() =>
                    updateProfile({ discreet: !Boolean(p.discreet) })
                  }
                >
                  {p.discreet ? "✓" : ""}
                </button>
                <div className="habit-info">
                  <strong>Discreet UI Labels</strong>
                  <small>Hides sensitive words in public</small>
                </div>
              </div>

              <div
                className={`habit-row ${data.badDayMode ? "checked" : ""}`}
              >
                <button
                  type="button"
                  className="check-circle"
                  onClick={() =>
                    setData((old) => ({
                      ...old,
                      badDayMode: !Boolean(old.badDayMode),
                    }))
                  }
                >
                  {data.badDayMode ? "✓" : ""}
                </button>
                <div className="habit-info">
                  <strong>Bad Day Mode (3 Basics Only)</strong>
                  <small>
                    Sunlight, Phone Outside Bedroom, and Bed on Time
                  </small>
                </div>
              </div>
            </div>

            <div className="form-grid three-col-grid jsx-dffc4db2">
              <Field label="Steps Target">
                <input
                  type="number"
                  step="500"
                  value={p.targets?.steps || 8000}
                  onChange={(e) =>
                    updateProfile({
                      targets: {
                        ...(p.targets || {}),
                        steps: Math.max(2000, safeNum(e.target.value, 8000)),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Water Target (L)">
                <input
                  type="number"
                  step="0.25"
                  value={p.targets?.waterL || 3}
                  onChange={(e) =>
                    updateProfile({
                      targets: {
                        ...(p.targets || {}),
                        waterL: Math.max(1.5, safeNum(e.target.value, 3)),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Screen Limit (h)">
                <input
                  type="number"
                  step="0.5"
                  value={p.targets?.screenH || 3}
                  onChange={(e) =>
                    updateProfile({
                      targets: {
                        ...(p.targets || {}),
                        screenH: Math.max(0.5, safeNum(e.target.value, 3)),
                      },
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="eyebrow">DATA VAULT</div>
            <h2>Backup, restore or reset</h2>
            <p className="jsx-0d69e4b1">
              Export a JSON backup anytime or restore from an older file.
            </p>

            <div className="record-actions jsx-4c0544d5">
              <Button kind="primary" onClick={exportData}>
                ⬇ Export JSON
              </Button>

              <label className="btn secondary jsx-74fa97c2">
                ⬆ Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="jsx-5790ffba"
                  onChange={(e) => importData(e.target.files?.[0])}
                />
              </label>

              <Button onClick={resetAll}>Reset All Data</Button>
            </div>

            <small className="muted-text jsx-bd6f9cbb">{DISCLAIMER_TEXT}</small>
          </Card>
        </div>
      )}
    </>
  );
}

export { MoreAndSettingsPage };