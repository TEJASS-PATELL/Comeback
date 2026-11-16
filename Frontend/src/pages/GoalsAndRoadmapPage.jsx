import React, { useState } from "react";
import {
  todayISO,
  uid,
  fmtDate,
  percent,
  ROADMAP_PHASES,
  Button,
  Card,
  Heading,
  Empty,
  Progress,
  Field,
} from "../shared";

function GoalsAndRoadmapPage({
  data,
  setData,
  onAdd,
  onEdit,
  onMilestone,
  onMeasure,
  onDelete,
  notify,
}) {
  const [subTab, setSubTab] = useState("goals"); // goals | roadmap | review
  const [rev, setRev] = useState({ q1: "", q2: "", q3: "" });

  const today = todayISO();
  const goals = (data.goals || []).filter((g) => !g.archived);
  const weeklyReviews = data.weeklyReviews || [];
  const roadmapProgress = data.roadmapProgress || {};

  const handleSaveReview = () => {
    if (!rev.q1.trim() && !rev.q3.trim()) return;
    const entry = {
      id: `rev-${uid()}`,
      week: weeklyReviews.length + 1,
      date: today,
      ...rev,
    };
    setData((old) => ({
      ...old,
      weeklyReviews: [entry, ...(old.weeklyReviews || [])],
    }));
    setRev({ q1: "", q2: "", q3: "" });
    notify("Sunday review saved");
  };

  const toggleRoadmapTask = (phaseId, taskIdx) => {
    const key = `${phaseId}-${taskIdx}`;
    setData((old) => ({
      ...old,
      roadmapProgress: {
        ...(old.roadmapProgress || {}),
        [key]: !(old.roadmapProgress || {})[key],
      },
    }));
  };

  return (
    <>
      <Heading
        title="90-Day Goals & Roadmap"
        description="Track your top goals, 90-day phases, and weekly Sunday review."
        action={
          <Button kind="primary" onClick={onAdd}>
            ＋ Create goal
          </Button>
        }
      />

      <div className="tabs large-tabs">
        <button
          type="button"
          className={subTab === "goals" ? "selected" : ""}
          onClick={() => setSubTab("goals")}
        >
          Active Goals ({goals.length})
        </button>
        <button
          type="button"
          className={subTab === "roadmap" ? "selected" : ""}
          onClick={() => setSubTab("roadmap")}
        >
          90-Day Phases
        </button>
        <button
          type="button"
          className={subTab === "review" ? "selected" : ""}
          onClick={() => setSubTab("review")}
        >
          Sunday Review ({weeklyReviews.length})
        </button>
      </div>

      {subTab === "goals" && (
        <>
          <div className="record-grid goal-grid">
            {goals.map((g) => {
              const ms = (data.milestones || []).filter((m) => m.goalId === g.id);
              const latest = (data.measurements || [])
                .filter((m) => m.goalId === g.id)
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];

              const currentVal = Number(latest?.value || g.progress || 0);
              const targetVal = Number(g.target || 100);
              const pct = g.target ? percent(currentVal, targetVal) : g.progress || 0;

              return (
                <Card className="goal-card" key={g.id}>
                  <div className="goal-card-head">
                    <span className="record-symbol sage">⚑</span>
                    <button
                      type="button"
                      className="dots-button"
                      onClick={() => onEdit(g)}
                    >
                      •••
                    </button>
                  </div>
                  <h3>{g.title}</h3>
                  <p>{g.why || "90-day target"}</p>

                  {g.target && (
                    <div className="goal-progress-detail">
                      <div>
                        <span>Progress</span>
                        <strong>
                          {currentVal} / {g.target} {g.unit || ""}
                        </strong>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )}

                  {ms.map((m) => (
                    <label className="milestone-row" key={m.id}>
                      <input
                        type="checkbox"
                        checked={!!m.done}
                        onChange={() => onDelete("milestones", m.id, "toggle")}
                      />
                      <span className={m.done ? "struck" : ""}>{m.title}</span>
                    </label>
                  ))}

                  <div className="record-actions">
                    <Button kind="primary" onClick={() => onMeasure(g)}>
                      Update Progress
                    </Button>
                    <Button onClick={() => onMilestone(g)}>＋ Step</Button>
                    <Button onClick={() => onDelete("goals", g.id, "archive")}>
                      Archive
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {!goals.length && (
            <Empty
              icon="⚑"
              title="No active goals"
              description="Set 1 to 3 clear goals for your 90-day cycle."
              action={
                <Button kind="primary" onClick={onAdd}>
                  ＋ Create goal
                </Button>
              }
            />
          )}
        </>
      )}

      {subTab === "roadmap" && (
        <div className="stack-col">
          {ROADMAP_PHASES.map((ph) => {
            const completedCount = ph.tasks.filter((_, tIdx) =>
              Boolean(roadmapProgress[`${ph.id}-${tIdx}`])
            ).length;
            const pct = percent(completedCount, ph.tasks.length);

            return (
              <Card key={ph.id}>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">{ph.days.toUpperCase()}</div>
                    <h2>{ph.title}</h2>
                    <p>{ph.focus}</p>
                  </div>
                  <span className="status-pill complete">
                    {completedCount}/{ph.tasks.length}
                  </span>
                </div>
                <div className="jsx-a0d4a037">
                  <Progress value={pct} />
                </div>
                <div className="habit-list">
                  {ph.tasks.map((t, i) => {
                    const checked = Boolean(roadmapProgress[`${ph.id}-${i}`]);
                    return (
                      <div
                        key={i}
                        className={`habit-row ${checked ? "checked" : ""}`}
                      >
                        <button
                          type="button"
                          className="check-circle"
                          onClick={() => toggleRoadmapTask(ph.id, i)}
                        >
                          {checked ? "✓" : ""}
                        </button>
                        <div className="habit-info">
                          <strong>{t}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {subTab === "review" && (
        <div className="dashboard-grid">
          <Card>
            <div className="eyebrow">SUNDAY CHECK-IN</div>
            <h2>Weekly Review</h2>
            <div className="stack-col">
              <Field label="1. Biggest win this week">
                <input
                  type="text"
                  value={rev.q1}
                  placeholder="e.g. Completed all 3 workouts"
                  onChange={(e) => setRev({ ...rev, q1: e.target.value })}
                />
              </Field>
              <Field label="2. What caused friction or slips?">
                <input
                  type="text"
                  value={rev.q2}
                  placeholder="e.g. Late night scrolling"
                  onChange={(e) => setRev({ ...rev, q2: e.target.value })}
                />
              </Field>
              <Field label="3. ONE focus for next week">
                <input
                  type="text"
                  value={rev.q3}
                  placeholder="e.g. Phone outside bedroom by 10 PM"
                  onChange={(e) => setRev({ ...rev, q3: e.target.value })}
                />
              </Field>
              <Button kind="primary" onClick={handleSaveReview}>
                Save Review
              </Button>
            </div>
          </Card>

          <Card>
            <div className="eyebrow">HISTORY</div>
            <h2>Past Reviews ({weeklyReviews.length})</h2>
            {weeklyReviews.length === 0 ? (
              <Empty
                icon="▤"
                title="No reviews yet"
                description="Do a 2-minute check every Sunday."
              />
            ) : (
              <div className="stack-col">
                {weeklyReviews.map((w) => (
                  <div key={w.id || w.week} className="routine-step-box">
                    <strong>
                      Week {w.week} · {fmtDate(w.date)}
                    </strong>
                    {w.q1 && <p>Win: {w.q1}</p>}
                    {w.q3 && <p>Focus: {w.q3}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

export { GoalsAndRoadmapPage };