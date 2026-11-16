import React, { useState, useMemo, useEffect } from "react";
import {
  uid,
  addDaysISO,
  getWeekdayShort,
  fmtDate,
  percent,
  SCORED_CHECKS,
  DEFAULT_SCHEDULE,
  createEmptyDay,
  calcDailyScore,
  Button,
  Card,
  Heading,
  Empty,
} from "../shared";

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
  const [viewMode, setViewMode] = useState("custom"); // custom | matrix | schedule
  const [filter, setFilter] = useState("all");
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

  /* 7-Day Window for Matrix & Habit Streaks */
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

    return {
      streak,
      missedYesterday,
      last7,
      rate7d: percent(last7.filter((x) => x.done).length, last7.length),
    };
  };

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
        title="Habits, Matrix & Schedule"
        description="Manage custom habits, review your 7-day consistency grid, and follow your daily schedule."
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
              <Button onClick={() => setSelectedISO(today)}>Today</Button>
            )}

            <Button kind="primary" onClick={onAdd}>
              ＋ Create habit
            </Button>
          </div>
        }
      />

      <div className="tabs large-tabs">
        <button
          type="button"
          className={viewMode === "custom" ? "selected" : ""}
          onClick={() => setViewMode("custom")}
        >
          Custom Habits{" "}
          <span>{(data.habits || []).filter((h) => !h.archived).length}</span>
        </button>

        <button
          type="button"
          className={viewMode === "matrix" ? "selected" : ""}
          onClick={() => setViewMode("matrix")}
        >
          7-Day Matrix <span>{avg7DayScore} avg</span>
        </button>

        <button
          type="button"
          className={viewMode === "schedule" ? "selected" : ""}
          onClick={() => setViewMode("schedule")}
        >
          Daily Schedule <span>{scheduleRows.length}</span>
        </button>
      </div>

      {/* ================= CUSTOM HABITS TAB ================= */}
      {viewMode === "custom" && (
        <div className="stack-col">
          <div className="toolbar">
            <div className="tabs">
              {["all", "build", "quit"].map((k) => (
                <button
                  type="button"
                  key={k}
                  className={filter === k ? "selected" : ""}
                  onClick={() => setFilter(k)}
                >
                  {k === "all" ? "All" : k === "build" ? "Build" : "Quit"}
                </button>
              ))}
            </div>

            <div className="toolbar-right">
              <input
                type="search"
                className="clean-input"
                placeholder="Search habits..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <label className="archive-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Archived
              </label>
            </div>
          </div>

          <div className="record-grid">
            {list.map((h) => {
              const stats = getHabitStats(h.id);
              return (
                <Card className="record-card" key={h.id}>
                  <div className="record-top">
                    <span
                      className={`record-symbol ${
                        h.kind === "quit" ? "peach" : "sage"
                      }`}
                    >
                      {h.kind === "quit" ? "↘" : "↗"}
                    </span>

                    <div className="heading-btn-group">
                      {stats.streak > 0 && (
                        <span className="status-pill complete">
                          🔥 {stats.streak}d
                        </span>
                      )}
                      {stats.missedYesterday && !h.archived && (
                        <span className="status-pill peach-pill">
                          Never Miss Twice!
                        </span>
                      )}
                      <button
                        type="button"
                        className="dots-button"
                        aria-label={`Edit ${h.name}`}
                        onClick={() => onEdit(h)}
                      >
                        •••
                      </button>
                    </div>
                  </div>

                  <span className="eyebrow">
                    {h.kind === "quit" ? "QUIT" : "BUILD"} · {stats.rate7d}% (7d)
                  </span>

                  <h3>{h.name}</h3>
                  <p>{h.target || "Daily intention"}</p>

                  <div className="quest-week-row jsx-88424d34">
                    {stats.last7.map((d) => (
                      <div
                        key={d.iso}
                        className={`quest-day-pill ${d.done ? "done" : ""}`}
                        title={d.iso}
                      >
                        <small>{d.shortDay.slice(0, 1)}</small>
                        <strong>{d.done ? "✓" : "·"}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="record-actions">
                    {!showArchived && (
                      <Button
                        kind={h.doneDate === today ? "primary" : "secondary"}
                        onClick={() => onToggle(h)}
                      >
                        {h.doneDate === today ? "✓ Done today" : "Check in"}
                      </Button>
                    )}

                    <Button onClick={() => onEdit(h)}>Edit</Button>

                    <Button onClick={() => onDelete(h.id)}>
                      {h.archived ? "Delete" : "Archive"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {!list.length && (
            <Empty
              icon="◉"
              title="No matching habits"
              description="Create a build or quit habit to track alongside your core routine."
              action={
                <Button kind="primary" onClick={onAdd}>
                  ＋ Create habit
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* ================= 7-DAY CONSISTENCY MATRIX TAB ================= */}
      {viewMode === "matrix" && (
        <Card>
          <div className="section-head">
            <div>
              <div className="eyebrow">7-DAY CONSISTENCY MATRIX</div>
              <h2>Weekly core scorecard</h2>
              <p>Tap any cell to toggle completion for that day.</p>
            </div>
            <span className="status-pill complete">
              7-Day Avg: {avg7DayScore}/100
            </span>
          </div>

          <div className="table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Core Habit</th>
                  {last7Dates.map((d) => (
                    <th key={d.iso} className="jsx-65f9d5a3">
                      <div>{d.shortDay}</div>
                      <small>{d.dayNum}</small>
                    </th>
                  ))}
                  <th className="jsx-65f9d5a3">7d</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Daily Total Score</strong>
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
                    <strong>{avg7DayScore}</strong>
                  </td>
                </tr>

                {SCORED_CHECKS.map((chk) => {
                  const doneCount = last7Dates.filter(
                    (d) => d.dayObj.c && d.dayObj.c[chk.id]
                  ).length;
                  return (
                    <tr key={chk.id}>
                      <td>
                        <strong>{dm(chk.title)}</strong>
                      </td>
                      {last7Dates.map((d) => {
                        const isChecked = Boolean(
                          d.dayObj.c && d.dayObj.c[chk.id]
                        );
                        return (
                          <td key={d.iso} className="jsx-65f9d5a3">
                            <button
                              type="button"
                              className={`jsx-2d92f77e check-circle ${
                                isChecked ? "checked" : ""
                              }`}
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
      )}

      {/* ================= SCHEDULE TAB ================= */}
      {viewMode === "schedule" && (
        <Card>
          <div className="section-head">
            <div>
              <div className="eyebrow">DAILY STRUCTURE</div>
              <h2>Schedule ({fmtDate(selectedISO)})</h2>
            </div>
            <div className="heading-btn-group">
              <Button onClick={addScheduleBlock}>＋ Add block</Button>
              <Button onClick={resetDefaultSchedule}>Reset</Button>
            </div>
          </div>

          <div className="schedule-list">
            {scheduleRows.map((row, idx) => {
              const blockId = row.id || `idx-${idx}`;
              const isDone = Boolean(
                dayObj.scheduleDone && dayObj.scheduleDone[blockId]
              );
              const isCurrentNow = idx === activeScheduleIdx;

              return (
                <div
                  key={blockId}
                  className={`schedule-edit-row ${isDone ? "checked" : ""} ${
                    isCurrentNow ? "current-time-block" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="check-circle"
                    aria-label={`Mark ${row.label} complete`}
                    onClick={() => toggleScheduleDoneForDay(blockId)}
                  >
                    {isDone ? "✓" : ""}
                  </button>

                  <input
                    type="time"
                    className="clean-input time-w"
                    value={row.time}
                    onChange={(e) =>
                      handleScheduleChange(idx, "time", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    className="clean-input flex-1"
                    value={row.label}
                    onChange={(e) =>
                      handleScheduleChange(idx, "label", e.target.value)
                    }
                  />

                  {isCurrentNow && (
                    <span className="status-pill complete">LIVE NOW</span>
                  )}

                  <button
                    type="button"
                    className="danger-text"
                    onClick={() => removeScheduleBlock(idx)}
                    title="Remove block"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}

export { HabitsAndTrackPage };