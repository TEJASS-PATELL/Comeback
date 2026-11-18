import React, { useState, useMemo, useEffect } from "react";
import {
  uid,
  addDaysISO,
  getWeekdayShort,
  fmtDate,
  percent,
  SCORED_CHECKS,
  LIFE_BASICS,
  CONTROL_LOOPS,
  FACE_HABITS,
  DEFAULT_SCHEDULE,
  MOOD_ACTIVITIES,
  createEmptyDay,
  calcDailyScoreBreakdown,
  calcDailyScore,
  Button,
  Card,
  Heading,
  Field,
} from "../shared";

const HABIT_STACK_PRESETS = [
  {
    anchor: "Subah uth kar paani peene ke turant baad",
    action: "Main bistar saaf karunga aur 15 min dhoop mein walk karunga",
    category: "Morning Anchor",
  },
  {
    anchor: "Dopahar ka khana khane ke baad",
    action: "Main bina phone ke 15 min family ke saath baithunga",
    category: "Social & Mind",
  },
  {
    anchor: "Shaam ko study/kaam khatam karne ke baad",
    action: "Main turant workout kapde pehnunga aur 1st warm-up set shuru karunga",
    category: "Fitness",
  },
  {
    anchor: "Raat ko 10:00 PM alarm bajte hi",
    action: "Main phone bedroom ke bahar charge par lagaunga aur 2-line journal likhunga",
    category: "Sleep Shield",
  },
];

function HabitsAndTrackPage({
  data,
  setData,
  today,
  selectedISO,
  setSelectedISO,
  updateDay,
  dm,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  showArchived,
  setShowArchived,
  query,
  setQuery,
}) {
  const [viewMode, setViewMode] = useState("tracker"); // tracker | custom | matrix | schedule
  const [filter, setFilter] = useState("all");
  const [newWin, setNewWin] = useState("");
  const [stackInput, setStackInput] = useState({
    anchor: "",
    action: "",
    category: "Morning Anchor",
  });
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const p = data.profile || {};
  const dayObj = (data.days && data.days[selectedISO]) || createEmptyDay();

  const breakdown = useMemo(
    () => calcDailyScoreBreakdown(dayObj, p),
    [dayObj, p]
  );

  /* 7-Day Window for Matrix & Trend */
  const last7Dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const iso = addDaysISO(selectedISO, -(6 - idx));
      const d = (data.days && data.days[iso]) || createEmptyDay();
      return {
        iso,
        shortDay: getWeekdayShort(iso),
        dayNum: iso.slice(8),
        score: calcDailyScore(d, p),
        dayObj: d,
      };
    });
  }, [selectedISO, data.days, p]);

  const avg7DayScore = useMemo(() => {
    if (!last7Dates.length) return 0;
    const sum = last7Dates.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / last7Dates.length);
  }, [last7Dates]);

  const list = (data.habits || []).filter(
    (h) =>
      !!h.archived === showArchived &&
      (filter === "all" || h.kind === filter) &&
      (h.name || "").toLowerCase().includes((query || "").toLowerCase())
  );

  const builds = (data.habits || []).filter(
    (h) => !h.archived && h.kind !== "quit"
  ).length;

  const quits = (data.habits || []).filter(
    (h) => !h.archived && h.kind === "quit"
  ).length;

  const toggleGroup = (groupKey, itemId, val) => {
    updateDay(selectedISO, (prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        [itemId]: val,
      },
    }));
  };

  const handleScheduleChange = (idx, field, val) => {
    setData((old) => {
      const next = [...(old.schedule || DEFAULT_SCHEDULE)];
      next[idx] = { ...next[idx], [field]: val };
      return { ...old, schedule: next };
    });
  };

  const addScheduleBlock = () => {
    setData((old) => {
      const next = [
        ...(old.schedule || DEFAULT_SCHEDULE),
        {
          id: `sch-${uid()}`,
          time: "16:30",
          label: "New focused block / revision session",
        },
      ].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      return { ...old, schedule: next };
    });
  };

  const removeScheduleBlock = (idx) => {
    setData((old) => {
      const next = [...(old.schedule || DEFAULT_SCHEDULE)].filter(
        (_, i) => i !== idx
      );
      return { ...old, schedule: next };
    });
  };

  const resetDefaultSchedule = () => {
    setData((old) => ({
      ...old,
      schedule: DEFAULT_SCHEDULE.map((x) => ({ ...x })),
    }));
  };

  const toggleScheduleDoneForDay = (blockId) => {
    updateDay(selectedISO, (prev) => {
      const curMap = prev.scheduleDone || {};
      return {
        ...prev,
        scheduleDone: {
          ...curMap,
          [blockId]: !curMap[blockId],
        },
      };
    });
  };

  /* Habit Stacks (stored in data.habitStacks) */
  const habitStacks = data.habitStacks || [];

  const addHabitStack = (anchorText, actionText, categoryText = "Routine") => {
    const a = (anchorText || "").trim();
    const b = (actionText || "").trim();
    if (!a || !b) return;
    const newStack = {
      id: `stk-${uid()}`,
      anchor: a,
      action: b,
      category: categoryText,
    };
    setData((old) => ({
      ...old,
      habitStacks: [newStack, ...(old.habitStacks || [])],
    }));
    setStackInput({ anchor: "", action: "", category: "Morning Anchor" });
  };

  const removeHabitStack = (stackId) => {
    setData((old) => ({
      ...old,
      habitStacks: (old.habitStacks || []).filter((s) => s.id !== stackId),
    }));
  };

  /* Helper to calculate custom habit streak & 7-day history */
  const getHabitStats = (habitId) => {
    const checkins = (data.checkins || []).filter(
      (c) => c.habitId === habitId && c.done
    );
    const doneDatesSet = new Set(checkins.map((c) => c.date));
    const hObj = (data.habits || []).find((h) => h.id === habitId);
    if (hObj?.doneDate) doneDatesSet.add(hObj.doneDate);

    let streak = 0;
    let cursor = doneDatesSet.has(today) ? today : addDaysISO(today, -1);
    while (doneDatesSet.has(cursor)) {
      streak += 1;
      cursor = addDaysISO(cursor, -1);
    }

    const missedYesterday =
      !doneDatesSet.has(addDaysISO(today, -1)) && !doneDatesSet.has(today);

    const last7 = last7Dates.map((d) => ({
      iso: d.iso,
      shortDay: d.shortDay,
      done: doneDatesSet.has(d.iso),
    }));

    const rate7d = percent(
      last7.filter((x) => x.done).length,
      last7.length
    );

    return { streak, missedYesterday, last7, rate7d };
  };

  const activeLoopsList = CONTROL_LOOPS.filter((loop) =>
    (data.settings?.activeLoops || []).includes(loop.id)
  );

  /* Determine active schedule block index for today */
  const scheduleRows = data.schedule || DEFAULT_SCHEDULE;
  const activeScheduleIdx = useMemo(() => {
    if (selectedISO !== today) return -1;
    let found = -1;
    for (let i = 0; i < scheduleRows.length; i += 1) {
      if ((scheduleRows[i].time || "00:00") <= currentTimeStr) {
        found = i;
      }
    }
    return found;
  }, [scheduleRows, currentTimeStr, selectedISO, today]);

  return (
    <>
      <Heading
        title="Habits & daily tracker"
        description="Track your life basics, face posture, control loops, behavioral wins, and 7-day consistency matrix."
        action={
          <div className="heading-btn-group">
            <Button
              onClick={() => setSelectedISO(addDaysISO(selectedISO, -1))}
              title="Previous Day"
            >
              ← Prev
            </Button>

            <input
              type="date"
              className="date-picker-input"
              value={selectedISO}
              max={today}
              onChange={(e) => setSelectedISO(e.target.value || today)}
            />

            {selectedISO !== today && (
              <Button onClick={() => setSelectedISO(today)}>
                Jump to Today
              </Button>
            )}

            <Button kind="primary" onClick={onAdd}>
              ＋ Create habit
            </Button>
          </div>
        }
      />

      <div className="mini-stat-row">
        <div>
          <span className="mini-stat-number">{breakdown.total}/100</span>
          <span>Score on {fmtDate(selectedISO)}</span>
        </div>

        <div>
          <span className="mini-stat-number">{avg7DayScore} pts</span>
          <span>7-Day avg score</span>
        </div>

        <div>
          <span className="mini-stat-number">{builds}</span>
          <span>Building habits</span>
        </div>

        <div>
          <span className="mini-stat-number">{quits}</span>
          <span>Letting go</span>
        </div>

        <div>
          <span className="mini-stat-number">
            {(data.checkins || []).filter((c) => c.done).length}
          </span>
          <span>Total check-ins</span>
        </div>
      </div>

      <div className="tabs large-tabs">
        <button
          type="button"
          className={viewMode === "tracker" ? "selected" : ""}
          onClick={() => setViewMode("tracker")}
        >
          Comeback 90 Daily Log <span>{breakdown.total} pts</span>
        </button>

        <button
          type="button"
          className={viewMode === "matrix" ? "selected" : ""}
          onClick={() => setViewMode("matrix")}
        >
          7-Day Consistency Matrix <span>{avg7DayScore}%</span>
        </button>
      </div>

      {/* ================= TRACKER TAB ================= */}

      {viewMode === "tracker" && (
        <div className="tracker-layout stack-col">
          {/* Two main columns */}
          <div className="tracker-sections">
            {/* LEFT COLUMN */}
            <div className="tracker-life-column">
              <Card>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">LIFE BASICS &amp; FACE POSTURE</div>
                    <h2>Daily grounding &amp; jaw care</h2>
                  </div>
                  <span className="status-pill">
                    {
                      [...LIFE_BASICS, ...FACE_HABITS].filter((item) => {
                        const isFace = FACE_HABITS.some((f) => f.id === item.id);
                        const grp = isFace ? "face" : "life";
                        return Boolean(dayObj[grp] && dayObj[grp][item.id]);
                      }).length
                    }
                    /{LIFE_BASICS.length + FACE_HABITS.length} done
                  </span>
                </div>

                <div className="habit-list">
                  {[...LIFE_BASICS, ...FACE_HABITS].map((item) => {
                    const isFace = FACE_HABITS.some((f) => f.id === item.id);
                    const group = isFace ? "face" : "life";
                    const checked = Boolean(
                      dayObj[group] && dayObj[group][item.id]
                    );

                    return (
                      <div
                        className={`habit-row ${checked ? "checked" : ""}`}
                        key={item.id}
                      >
                        <button
                          type="button"
                          className="check-circle"
                          aria-label={`${
                            checked ? "Uncheck" : "Complete"
                          } ${item.title}`}
                          aria-pressed={checked}
                          onClick={() => toggleGroup(group, item.id, !checked)}
                        >
                          {checked ? "✓" : ""}
                        </button>

                        <div className="habit-info">
                          <strong>{item.title}</strong>
                          <small>{item.sub}</small>
                        </div>

                        <span className="status-pill">
                          {isFace ? "Face" : "Life"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="tracker-right-column">
              {/* Control loops */}
              <Card>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">ACTIVE CONTROL LOOPS</div>
                    <h2>Dopamine &amp; impulse guards</h2>
                  </div>
                  <span className="status-pill complete">
                    {
                      activeLoopsList.filter(
                        (item) => dayObj.loops && dayObj.loops[item.id]
                      ).length
                    }
                    /{activeLoopsList.length} clean
                  </span>
                </div>

                <div className="habit-list">
                  {activeLoopsList.map((item) => {
                    const checked = Boolean(
                      dayObj.loops && dayObj.loops[item.id]
                    );

                    return (
                      <div
                        className={`habit-row ${checked ? "checked" : ""}`}
                        key={item.id}
                      >
                        <button
                          type="button"
                          className="check-circle"
                          aria-label={`${
                            checked ? "Uncheck" : "Complete"
                          } ${item.title}`}
                          aria-pressed={checked}
                          onClick={() => toggleGroup("loops", item.id, !checked)}
                        >
                          {checked ? "✓" : ""}
                        </button>

                        <div className="habit-info">
                          <strong>{dm(item.title)}</strong>
                          <small>{dm(item.sub)}</small>
                        </div>
                      </div>
                    );
                  })}

                  {!activeLoopsList.length && (
                    <div className="empty">
                      <strong>No active control loops</strong>
                      <p>
                        Activate a control loop in your settings to track it
                        here.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Mood and journal cards below control loops */}
              <div className="tracker-bottom-grid">
                {/* Mood-lifting card */}
                <Card>
                  <div className="section-head">
                    <div>
                      <div className="eyebrow">BEHAVIORAL ACTIVATION</div>
                      <h2>Mood-lifting action &amp; wins</h2>
                      <p>
                        Action precedes mood. Pick one small uplift today.
                      </p>
                    </div>
                  </div>

                  <div className="category-pills">
                    {MOOD_ACTIVITIES.map((act) => (
                      <button
                        type="button"
                        key={act.id}
                        className={
                          dayObj.activity?.id === act.id ? "selected" : ""
                        }
                        aria-pressed={dayObj.activity?.id === act.id}
                        onClick={() =>
                          updateDay(selectedISO, {
                            activity: {
                              ...(dayObj.activity || {}),
                              id: act.id,
                            },
                          })
                        }
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>

                  <div className="inline-add-row">
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="Add a small win from today..."
                      value={newWin}
                      onChange={(e) => setNewWin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newWin.trim()) {
                          e.preventDefault();
                          updateDay(selectedISO, {
                            wins: [...(dayObj.wins || []), newWin.trim()],
                          });
                          setNewWin("");
                        }
                      }}
                    />

                    <Button
                      kind="primary"
                      onClick={() => {
                        if (!newWin.trim()) return;
                        updateDay(selectedISO, {
                          wins: [...(dayObj.wins || []), newWin.trim()],
                        });
                        setNewWin("");
                      }}
                    >
                      ＋ Add win
                    </Button>
                  </div>

                  {(dayObj.wins || []).length > 0 && (
                    <div className="category-pills tracker-saved-wins">
                      {dayObj.wins.map((w, idx) => (
                        <span
                          key={`${idx}-${w}`}
                          className="status-pill complete"
                        >
                          ✓ {w}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Journal card */}
                <Card>
                  <div className="section-head">
                    <div>
                      <div className="eyebrow">
                        DAILY QUICK JOURNAL (+4 PTS)
                      </div>
                      <h2>2-Line evening reflection</h2>
                    </div>
                    {dayObj.c?.journal && (
                      <span className="status-pill complete">+4 pts earned</span>
                    )}
                  </div>

                  <Field label="How did today go? What did you notice?">
                    <textarea
                      rows={4}
                      placeholder="Write a short reflection on your day..."
                      value={dayObj.journal || ""}
                      onChange={(e) =>
                        updateDay(selectedISO, {
                          journal: e.target.value,
                          c: {
                            ...(dayObj.c || {}),
                            journal: e.target.value.trim().length > 3,
                          },
                        })
                      }
                    />
                  </Field>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7-DAY CONSISTENCY MATRIX TAB ================= */}

      {viewMode === "matrix" && (
        <div className="stack-col">
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  7-DAY CONSISTENCY MATRIX &amp; NEVER-MISS-TWICE ENGINE
                </div>
                <h2>Weekly scorecard across core pillars &amp; custom habits</h2>
                <p>
                  Tap any cell in the 7-day grid to toggle completion for that
                  specific day.
                </p>
              </div>
              <span className="status-pill complete">
                7-Day Avg: {avg7DayScore}/100 pts
              </span>
            </div>

            <div className="table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Core Habit / Pillar</th>
                    {last7Dates.map((d) => (
                      <th key={d.iso} className="jsx-65f9d5a3">
                        <div>{d.shortDay}</div>
                        <small>{d.dayNum}</small>
                      </th>
                    ))}
                    <th className="jsx-65f9d5a3">7d Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Daily Total Comeback Score</strong>
                    </td>
                    {last7Dates.map((d) => (
                      <td key={d.iso} className="jsx-65f9d5a3">
                        <span
                          className={`status-pill ${
                            d.score >= 60 ? "complete" : ""
                          }`}
                        >
                          {d.score}
                        </span>
                      </td>
                    ))}
                    <td className="jsx-65f9d5a3">
                      <strong>{avg7DayScore} pts</strong>
                    </td>
                  </tr>

                  {SCORED_CHECKS.map((chk) => {
                    const doneCount = last7Dates.filter(
                      (d) => d.dayObj.c && d.dayObj.c[chk.id]
                    ).length;
                    return (
                      <tr key={chk.id}>
                        <td>
                          <strong>{dm(chk.title)}</strong>{" "}
                          <small className="muted-text">
                            (+{chk.weight}p)
                          </small>
                        </td>
                        {last7Dates.map((d) => {
                          const isChecked = Boolean(
                            d.dayObj.c && d.dayObj.c[chk.id]
                          );
                          return (
                            <td key={d.iso} className="jsx-65f9d5a3">
                              <button
                                type="button"
                                className={`jsx-2d92f77e ${`check-circle ${
                                  isChecked ? "checked" : ""
                                }`}`}
                                onClick={() => {
                                  updateDay(d.iso, (prev) => ({
                                    ...prev,
                                    c: {
                                      ...(prev.c || {}),
                                      [chk.id]: !isChecked,
                                    },
                                  }));
                                }}
                                title={`${chk.title} on ${d.iso}`}
                              >
                                {isChecked ? "✓" : ""}
                              </button>
                            </td>
                          );
                        })}
                        <td className="jsx-65f9d5a3">
                          <strong>{percent(doneCount, 7)}%</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export { HabitsAndTrackPage };