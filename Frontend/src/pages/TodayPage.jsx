import React, { useState, useMemo } from "react";
import {
  uid,
  addDaysISO,
  getDayIndex,
  getWeekdayShort,
  fmtDate,
  percent,
  safeNum,
  QUOTES,
  MINIMUM_DAY_IDS,
  SCORED_CHECKS,
  CONTROL_LOOPS,
  ModernAreaChart,
  Button,
  Card,
  Heading,
  Empty,
  Progress,
  Field,
  Stat,
  CountdownTimer,
  Heatmap90,
} from "../shared";

function TodayPage({
  data,
  setData,
  today,
  todayHabits,
  doneHabits,
  activeTasks,
  doneTasks,
  todayMood,
  todayDayObj,
  todayBreakdown,
  streaks,
  dailyWinXP,
  dailyWinXPCap,
  dm,
  updateDay,
  onHabit,
  onTask,
  onScoredCheck,
  onAddTask,
  onAddHabit,
  onMood,
  onNavigate,
  selectedISO,
  setSelectedISO,
}) {
  const [chartMetric, setChartMetric] = useState("score");
  const [checkTab, setCheckTab] = useState("comeback"); // comeback | custom | loops
  const [onlyMinDay, setOnlyMinDay] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [showInlinePomodoro, setShowInlinePomodoro] = useState(false);

  const p = data.profile || {};
  const dayNumber = getDayIndex(p.startDate, today);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const quote = QUOTES[(dayNumber - 1) % QUOTES.length];
  const currentWeekday = getWeekdayShort(today);
  const isRestDay = !(p.workoutDays || ["Mon", "Wed", "Fri"]).includes(
    currentWeekday
  );

  const yesterdayScore = useMemo(() => {
    const yISO = addDaysISO(today, -1);
    const yObj = data.days && data.days[yISO];
    if (!yObj) return null;
    return Object.values(yObj.c || {}).filter(Boolean).length;
  }, [data.days, today]);

  const chartSeries = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => {
      const iso = addDaysISO(today, -(13 - idx));
      const dObj = (data.days && data.days[iso]) || {};
      const moodEntry = (data.moods || []).find((m) => m.date === iso);
      let value = 0;
      if (chartMetric === "score") value = Number(dObj.score || 0);
      else if (chartMetric === "mood")
        value = Number(moodEntry?.score || dObj.mood || 0);
      else if (chartMetric === "sleep") value = Number(dObj.sleepH || 0);
      else if (chartMetric === "steps") value = Number(dObj.steps || 0);
      return {
        key: iso,
        label: getWeekdayShort(iso),
        fullLabel: fmtDate(iso),
        value,
      };
    });
  }, [data.days, data.moods, chartMetric, today]);

  const visibleScoredChecks =
    data.badDayMode || onlyMinDay
      ? SCORED_CHECKS.filter((item) => MINIMUM_DAY_IDS.includes(item.id))
      : SCORED_CHECKS;

  const activeControlLoops = useMemo(() => {
    const activeIds = data.settings?.activeLoops || [];
    return CONTROL_LOOPS.filter((l) => activeIds.includes(l.id));
  }, [data.settings?.activeLoops]);

  const toggleScoredCheck = (id, checked) => {
    if (checked && onScoredCheck) onScoredCheck(id);
    updateDay(today, (prev) => ({
      ...prev,
      slip: id === "noPorn" && checked ? false : prev.slip,
      c: { ...(prev.c || {}), [id]: checked },
    }));
  };

  const toggleControlLoopToday = (loopId) => {
    updateDay(today, (prev) => {
      const cur = Boolean(prev.loops && prev.loops[loopId]);
      return {
        ...prev,
        loops: { ...(prev.loops || {}), [loopId]: !cur },
      };
    });
  };

  const lockThreeMinimumBasics = () => {
    updateDay(today, (prev) => {
      const nextC = { ...(prev.c || {}) };
      MINIMUM_DAY_IDS.forEach((id) => {
        nextC[id] = true;
      });
      return { ...prev, c: nextC };
    });
  };

  const targetSteps = p.targets?.steps || 8000;
  const targetWater = p.targets?.waterL || 3;
  const targetScreen = p.targets?.screenH || 3;
  const recommendedWaterByWeight = +(
    Math.max(45, safeNum(p.weightKg, 56)) * 0.04
  ).toFixed(1);

  const handleQuickAddTask = (e) => {
    if (e) e.preventDefault();
    const clean = quickTaskTitle.trim();
    if (!clean) return;
    const newTask = {
      id: uid(),
      createdAt: Date.now(),
      title: clean,
      notes: "",
      due: today,
      priority: "normal",
      done: false,
      archived: false,
    };
    setData((old) => ({
      ...old,
      tasks: [newTask, ...(old.tasks || [])],
    }));
    setQuickTaskTitle("");
  };

  const minDayDoneCount = MINIMUM_DAY_IDS.filter(
    (id) => todayDayObj.c && todayDayObj.c[id]
  ).length;

  return (
    <>
      <Heading
        title={`${greeting}, ${p.name || "Bhai"}.`}
        description="Day by day. Keep it simple and steady."
        action={
          <div className="heading-btn-group">
            {minDayDoneCount < 3 && (
              <Button onClick={lockThreeMinimumBasics}>
                ✓ 3 Basics ({minDayDoneCount}/3)
              </Button>
            )}
            <Button
              onClick={() =>
                setData((old) => ({ ...old, badDayMode: !old.badDayMode }))
              }
            >
              {data.badDayMode ? "★ Bad Day: ON" : "Bad Day Mode"}
            </Button>
            <Button kind="primary" onClick={onAddTask}>
              ＋ Task
            </Button>
          </div>
        }
      />

      {/* COMPACT HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="sparkle">✳</span> DAY {dayNumber} OF 90 · NEVER MISS TWICE
          </div>
          <h2>
            Become who you want to be, <em>one day at a time.</em>
          </h2>
          <p>{dm(quote)}</p>
          <div className="hero-progress-wrap">
            <Progress value={percent(Math.min(dayNumber, 90), 90)} />
            <small>{Math.min(dayNumber, 90)}/90 days completed</small>
          </div>
          <div className="hero-cta-row">
            <button
              type="button"
              className="hero-link"
              onClick={() => setShowInlinePomodoro((v) => !v)}
            >
              {showInlinePomodoro ? "Hide 25m Timer" : "Start 25m Deep Work"}{" "}
              <span>◈</span>
            </button>
            <button
              type="button"
              className="hero-link"
              onClick={() => onNavigate("Quest")}
            >
              Today&apos;s Quest <span>✦</span>
            </button>
          </div>
        </div>
        <div className="hero-index">
          {String(dayNumber).padStart(2, "0")} <span>/ 90</span>
        </div>
      </div>

      {showInlinePomodoro && (
        <Card className="jsx-2f23af6b">
          <CountdownTimer
            defaultSeconds={1500}
            label="25-Minute Distraction-Free Sprint"
            onComplete={() => {
              setData((old) => ({
                ...old,
                focusSessions: [
                  { id: uid(), date: today, task: "25m Sprint", mins: 25 },
                  ...(old.focusSessions || []),
                ],
              }));
            }}
          />
        </Card>
      )}

      {yesterdayScore === 0 && todayBreakdown.total < 30 && (
        <div className="intro-callout jsx-2f23af6b">
          <div className="callout-icon">↻</div>
          <div>
            <strong>Never Miss Twice:</strong>
            <p>
              Kal miss hua to koi baat nahi—aaj bas 3 basics (Sunlight, Phone
              Outside Bedroom, Bed on Time) lock kar lo.
            </p>
          </div>
        </div>
      )}

      {/* 4 CORE STATS */}
      <div className="stats-grid">
        <Stat
          icon="◉"
          label="Daily Score"
          value={`${todayBreakdown.total}/100`}
          detail={`Routine streak: ${streaks.currentRoutine}d`}
          color="sage"
        />
        <Stat
          icon="🛡"
          label={dm("Clean Streak")}
          value={`${streaks.currentClean} days`}
          detail={`Best: ${streaks.bestClean}d`}
          color="blue"
        />
        <Stat
          icon="✓"
          label="Habits & Tasks"
          value={`${doneHabits + doneTasks}/${
            todayHabits.length + activeTasks.length
          }`}
          detail={`${doneHabits} habits · ${doneTasks} tasks`}
          color="peach"
        />
        <div onClick={onMood} className="jsx-74fa97c2" title="Tap to log mood">
          <Stat
            icon="♡"
            label="Mood"
            value={
              todayMood ? `${todayMood.score}/5` : `${todayDayObj.mood || 3}/5`
            }
            detail="Tap to log check-in"
            color="lavender"
          />
        </div>
      </div>

      {/* DAILY NUMBERS & BIOMETRICS (Moved from HabitsPage) */}
      <Card className="jsx-2f23af6b">
        <div className="section-head">
          <div>
            <div className="eyebrow">DAILY NUMBERS &amp; BIOMETRICS</div>
            <h2>
              Steps, hydration, screen &amp; sleep ({fmtDate(today)})
            </h2>
            <p>
              Partial progress automatically calculates towards your 100-point
              score. Use the quick-tap buttons for instant logging.
            </p>
          </div>
          <span className="status-pill complete">
            Weight-based water guide: ~{recommendedWaterByWeight}L/day
          </span>
        </div>

        <div className="form-grid four-col-grid tracker-metrics">
          <div>
            <Field label={`Steps (Target: ${targetSteps})`}>
              <input
                type="number"
                min="0"
                step="500"
                value={todayDayObj.steps}
                onChange={(e) => {
                  const v = Math.max(0, safeNum(e.target.value, 0));
                  updateDay(today, (prev) => ({
                    ...prev,
                    steps: v,
                    c: {
                      ...(prev.c || {}),
                      steps: v >= targetSteps,
                    },
                  }));
                }}
              />
            </Field>
            <div className="jsx-0d69e4b1">
              <Progress value={percent(todayDayObj.steps || 0, targetSteps)} />
              <div className="category-pills jsx-0d69e4b1">
                {[1000, 2500, targetSteps].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => {
                      const nextSteps =
                        val === targetSteps
                          ? targetSteps
                          : Math.max(0, safeNum(todayDayObj.steps, 0) + val);
                      updateDay(today, (prev) => ({
                        ...prev,
                        steps: nextSteps,
                        c: {
                          ...(prev.c || {}),
                          steps: nextSteps >= targetSteps,
                        },
                      }));
                    }}
                  >
                    {val === targetSteps ? `Hit ${targetSteps}` : `+${val}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Field label={`Water in Litres (Target: ${targetWater}L)`}>
              <input
                type="number"
                min="0"
                step="0.25"
                value={todayDayObj.waterL}
                onChange={(e) => {
                  const v = Math.max(0, safeNum(e.target.value, 0));
                  updateDay(today, (prev) => ({
                    ...prev,
                    waterL: v,
                    c: {
                      ...(prev.c || {}),
                      water: v >= targetWater,
                    },
                  }));
                }}
              />
            </Field>
            <div className="jsx-0d69e4b1">
              <Progress value={percent(todayDayObj.waterL || 0, targetWater)} />
              <div className="category-pills jsx-0d69e4b1">
                {[
                  [0.25, "+250ml"],
                  [0.5, "+500ml"],
                  [targetWater, `Hit ${targetWater}L`],
                ].map(([amt, lbl]) => (
                  <button
                    type="button"
                    key={lbl}
                    onClick={() => {
                      const nextW =
                        amt === targetWater
                          ? targetWater
                          : +(
                              safeNum(todayDayObj.waterL, 0) + Number(amt)
                            ).toFixed(2);
                      updateDay(today, (prev) => ({
                        ...prev,
                        waterL: nextW,
                        c: {
                          ...(prev.c || {}),
                          water: nextW >= targetWater,
                        },
                      }));
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Field label={`Recreational Screen (Limit ≤ ${targetScreen}h)`}>
              <input
                type="number"
                min="0"
                step="0.5"
                value={todayDayObj.screenH}
                onChange={(e) => {
                  const v = Math.max(0, safeNum(e.target.value, 0));
                  updateDay(today, (prev) => ({
                    ...prev,
                    screenH: v,
                    c: {
                      ...(prev.c || {}),
                      screenUnderLimit: v > 0 && v <= targetScreen,
                    },
                  }));
                }}
              />
            </Field>
            <div className="jsx-0d69e4b1">
              <Progress
                value={
                  todayDayObj.screenH > 0
                    ? Math.min(100, percent(todayDayObj.screenH, targetScreen))
                    : 0
                }
              />
              <div className="category-pills jsx-0d69e4b1">
                {[1, 2, targetScreen].map((hr) => (
                  <button
                    type="button"
                    key={hr}
                    onClick={() =>
                      updateDay(today, (prev) => ({
                        ...prev,
                        screenH: hr,
                        c: {
                          ...(prev.c || {}),
                          screenUnderLimit: hr <= targetScreen,
                        },
                      }))
                    }
                  >
                    {hr}h logged
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Field label="Last Night's Sleep (Hours)">
              <input
                type="number"
                min="0"
                max="16"
                step="0.5"
                value={todayDayObj.sleepH}
                onChange={(e) =>
                  updateDay(today, (prev) => ({
                    ...prev,
                    sleepH: Math.max(0, safeNum(e.target.value, 0)),
                  }))
                }
              />
            </Field>
            <div className="jsx-0d69e4b1">
              <Progress value={percent(todayDayObj.sleepH || 0, 8)} />
              <div className="category-pills jsx-0d69e4b1">
                {[6.5, 7.5, 8].map((sh) => (
                  <button
                    type="button"
                    key={sh}
                    onClick={() =>
                      updateDay(today, (prev) => ({
                        ...prev,
                        sleepH: sh,
                        c: {
                          ...(prev.c || {}),
                          wakeOnTime: sh >= 7 || Boolean(prev.c?.wakeOnTime),
                        },
                      }))
                    }
                  >
                    {sh}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 100-POINT COMEBACK SCORE ENGINE (Moved from HabitsPage) */}
      <Card className="jsx-2f23af6b">

        {checkTab === "comeback" ? (
          <div className="habit-list">
            {visibleScoredChecks.map((item) => {
              const checked = Boolean(
                todayDayObj.c && todayDayObj.c[item.id]
              );
              const isMin = MINIMUM_DAY_IDS.includes(item.id);
              return (
                <div
                  className={`habit-row ${checked ? "checked" : ""}`}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="check-circle"
                    aria-label={`${checked ? "Uncheck" : "Complete"} ${
                      item.title
                    }`}
                    aria-pressed={checked}
                    onClick={() => toggleScoredCheck(item.id, !checked)}
                  >
                    {checked ? "✓" : ""}
                  </button>
                  <div className="habit-info">
                    <strong>
                      {item.id === "workout" && isRestDay
                        ? item.restTitle
                        : dm(item.title)}{" "}
                      {isMin && (
                        <span className="status-pill peach-pill jsx-8cdcd88b">
                          Minimum Day Basic
                        </span>
                      )}
                    </strong>
                    <small>{dm(item.sub)}</small>
                  </div>
                  <span className={`status-pill ${checked ? "complete" : ""}`}>
                    +{item.weight} pts
                  </span>
                </div>
              );
            })}
          </div>
        ) : checkTab === "custom" ? (
          todayHabits.length ? (
            <div className="habit-list">
              {todayHabits.map((h) => (
                <div
                  className={`habit-row ${h.doneDate === today ? "checked" : ""}`}
                  key={h.id}
                >
                  <button
                    type="button"
                    className="check-circle"
                    onClick={() => onHabit(h)}
                  >
                    {h.doneDate === today ? "✓" : ""}
                  </button>
                  <div className="habit-info">
                    <strong>{h.name}</strong>
                    <small>{h.target || "Daily habit"}</small>
                  </div>
                  <span
                    className={`status-pill ${
                      h.doneDate === today ? "complete" : ""
                    }`}
                  >
                    {h.doneDate === today ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="✳"
              title="No custom habits"
              description="Add a simple daily habit."
              action={
                <Button kind="primary" onClick={onAddHabit}>
                  ＋ Add habit
                </Button>
              }
            />
          )
        ) : (
          <div className="habit-list">
            {activeControlLoops.map((loop) => {
              const checked = Boolean(
                todayDayObj.loops && todayDayObj.loops[loop.id]
              );
              return (
                <div
                  className={`habit-row ${checked ? "checked" : ""}`}
                  key={loop.id}
                >
                  <button
                    type="button"
                    className="check-circle"
                    onClick={() => toggleControlLoopToday(loop.id)}
                  >
                    {checked ? "✓" : ""}
                  </button>
                  <div className="habit-info">
                    <strong>{dm(loop.title)}</strong>
                    <small>{dm(loop.sub)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="panel-foot">
          <div>
            <span className="foot-dot" />
            <span>Today&apos;s Score: {todayBreakdown.total}/100</span>
          </div>
          <Progress value={todayBreakdown.total} />
        </div>
      </Card>

      {/* MAIN WORKSPACE: TASKS + 90-DAY CONSISTENCY */}
      <div className="dashboard-grid">
        <Card className="tasks-panel">
          <div className="section-head">
            <div>
              <div className="eyebrow">FOCUS</div>
              <h2>Today&apos;s tasks</h2>
            </div>
            <span className="status-pill">
              +{dailyWinXP}/{dailyWinXPCap} XP
            </span>
          </div>

          <form
            className="inline-add-row jsx-5beb8fbe"
            onSubmit={handleQuickAddTask}
          >
            <input
              type="text"
              className="clean-input"
              placeholder="Quick add task & press Enter..."
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
            />
            <Button kind="primary" onClick={handleQuickAddTask}>
              Add
            </Button>
          </form>

          {activeTasks.length ? (
            <div className="task-list">
              {activeTasks.slice(0, 6).map((t) => (
                <div
                  className={`task-row ${t.done ? "task-done" : ""}`}
                  key={t.id}
                >
                  <button
                    type="button"
                    className={`task-check ${t.done ? "on" : ""}`}
                    onClick={() => onTask(t.id)}
                  >
                    {t.done ? "✓" : ""}
                  </button>
                  <div className="task-main">
                    <strong>{t.title}</strong>
                    <small>{t.due ? fmtDate(t.due) : "Today"}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="↗"
              title="No tasks yet"
              description="Add 1–3 clear priorities for today."
              action={<Button onClick={onAddTask}>＋ Add task</Button>}
            />
          )}
        </Card>

        <Card className="goals-card">
          <div className="section-head">
            <div>
              <div className="eyebrow">90-DAY CONSISTENCY</div>
              <h2>Your 90-day grid</h2>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate("Habits")}
            >
              Schedule &amp; Matrix ↗
            </button>
          </div>
          <Heatmap90
            startDate={p.startDate}
            daysMap={data.days}
            profile={p}
            selectedDate={selectedISO}
            onSelectDate={(iso) => setSelectedISO(iso)}
          />
        </Card>
      </div>

      {/* SINGLE 14-DAY TREND CHART */}
      <Card className="modern-chart-card">
        <div className="section-head">
          <div>
            <div className="eyebrow">14-DAY TREND</div>
            <h2>Consistency curve</h2>
          </div>
          <div className="tabs">
            {[
              ["score", "Score"],
              ["mood", "Mood"],
              ["sleep", "Sleep"],
              ["steps", "Steps"],
            ].map(([k, lbl]) => (
              <button
                type="button"
                key={k}
                className={chartMetric === k ? "selected" : ""}
                onClick={() => setChartMetric(k)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <ModernAreaChart
          data={chartSeries}
          maxVal={
            chartMetric === "score"
              ? 100
              : chartMetric === "mood"
              ? 5
              : chartMetric === "sleep"
              ? 10
              : p.targets?.steps || 8000
          }
          unit={
            chartMetric === "score"
              ? " pts"
              : chartMetric === "mood"
              ? "/5"
              : chartMetric === "sleep"
              ? " h"
              : " steps"
          }
        />
      </Card>
    </>
  );
}

export { TodayPage };