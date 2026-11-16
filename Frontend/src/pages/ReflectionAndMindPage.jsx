import React, { useState, useMemo } from "react";
import {
  uid,
  addDaysISO,
  dayDiff,
  fmtDate,
  ModernAreaChart,
  Button,
  Card,
  Heading,
  Empty,
  Field,
  Stat,
} from "../shared";

function ReflectionAndMindPage({
  data,
  setData,
  today,
  onJournal,
  onEditJournal,
  onDelete,
  onMood,
  notify,
}) {
  const [subTab, setSubTab] = useState("journal"); // journal | reframe
  const [journalSearch, setJournalSearch] = useState("");
  const [thoughtInput, setThoughtInput] = useState({
    thought: "",
    balanced: "",
  });

  const moods = useMemo(
    () => [...(data.moods || [])].sort((a, b) => a.date.localeCompare(b.date)),
    [data.moods]
  );

  const recent = useMemo(
    () => moods.filter((m) => dayDiff(m.date, today) >= 0 && dayDiff(m.date, today) < 14),
    [moods, today]
  );

  const averageMood = recent.length
    ? (recent.reduce((s, m) => s + Number(m.score || 0), 0) / recent.length).toFixed(1)
    : "—";

  const moodChartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const iso = addDaysISO(today, -(13 - i));
      const m = moods.find((x) => x.date === iso);
      const dObj = data.days && data.days[iso];
      return {
        key: iso,
        label: new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
          weekday: "narrow",
        }),
        fullLabel: fmtDate(iso),
        value: m ? Number(m.score) : dObj?.mood || 0,
      };
    });
  }, [today, moods, data.days]);

  const filteredJournals = useMemo(() => {
    const q = journalSearch.trim().toLowerCase();
    return [...(data.journals || [])]
      .filter((j) => {
        if (!q) return true;
        return (
          (j.title || "").toLowerCase().includes(q) ||
          (j.content || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [data.journals, journalSearch]);

  const handleSaveThought = () => {
    if (!thoughtInput.thought.trim() || !thoughtInput.balanced.trim()) return;
    const entry = {
      id: uid(),
      date: today,
      thought: thoughtInput.thought.trim(),
      balanced: thoughtInput.balanced.trim(),
    };
    setData((old) => ({ ...old, thoughts: [entry, ...(old.thoughts || [])] }));
    setThoughtInput({ thought: "", balanced: "" });
    notify("Thought reframed");
  };

  const handleDeleteThought = (id) => {
    setData((old) => ({
      ...old,
      thoughts: (old.thoughts || []).filter((t) => t.id !== id),
    }));
  };

  return (
    <>
      <Heading
        title="Journal & Mind"
        description="Track your mood, write quick daily reflections, and reframe overthinking."
        action={
          <div className="heading-btn-group">
            <Button onClick={onMood}>♡ Log Mood</Button>
            <Button kind="primary" onClick={onJournal}>
              ＋ Write Entry
            </Button>
          </div>
        }
      />

      <div className="tabs large-tabs">
        <button
          type="button"
          className={subTab === "journal" ? "selected" : ""}
          onClick={() => setSubTab("journal")}
        >
          Mood &amp; Journal ({(data.journals || []).length})
        </button>
        <button
          type="button"
          className={subTab === "reframe" ? "selected" : ""}
          onClick={() => setSubTab("reframe")}
        >
          Quick Thought Reframe ({(data.thoughts || []).length})
        </button>
      </div>

      {subTab === "journal" && (
        <div className="stack-col">
          <div className="stats-grid">
            <Stat
              icon="♡"
              label="14-Day Avg Mood"
              value={`${averageMood}/5`}
              detail={`${recent.length} check-ins`}
              color="lavender"
            />
            <Stat
              icon="▤"
              label="Journal Entries"
              value={(data.journals || []).length}
              detail="Private notes"
              color="sage"
            />
          </div>

          <Card className="mood-chart-card">
            <div className="eyebrow">14-DAY MOOD TREND</div>
            <h2>Emotional weather</h2>
            <ModernAreaChart
              data={moodChartData}
              maxVal={5}
              unit="/5"
              color="#766694"
              height={160}
            />
          </Card>

          <Card className="journal-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">PRIVATE JOURNAL</div>
                <h2>Reflections</h2>
              </div>
              <input
                type="search"
                className="clean-input"
                placeholder="Search entries..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
              />
            </div>

            {filteredJournals.length ? (
              filteredJournals.map((j) => (
                <article className="journal-entry" key={j.id}>
                  <div className="journal-date">{fmtDate(j.date)}</div>
                  <div className="journal-entry-body">
                    <h3>{j.title}</h3>
                    <p>{j.content}</p>
                    {j.gratitude && (
                      <div className="gratitude">
                        <span>♡</span> {j.gratitude}
                      </div>
                    )}
                  </div>
                  <div className="row-actions">
                    <button type="button" onClick={() => onEditJournal(j)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() => onDelete("journals", j.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <Empty
                icon="▤"
                title="No entries yet"
                description="Write a few lines about today."
                action={
                  <Button kind="primary" onClick={onJournal}>
                    ＋ Write entry
                  </Button>
                }
              />
            )}
          </Card>
        </div>
      )}

      {subTab === "reframe" && (
        <div className="dashboard-grid">
          <Card>
            <div className="eyebrow">STOP OVERTHINKING</div>
            <h2>Reframe a negative thought</h2>
            <div className="stack-col">
              <Field label="1. Negative Thought">
                <input
                  type="text"
                  value={thoughtInput.thought}
                  placeholder="e.g. Everyone is judging me..."
                  onChange={(e) =>
                    setThoughtInput({ ...thoughtInput, thought: e.target.value })
                  }
                />
              </Field>

              <Field label="2. Realistic Truth">
                <input
                  type="text"
                  value={thoughtInput.balanced}
                  placeholder="e.g. People are busy with their own lives; I am improving daily."
                  onChange={(e) =>
                    setThoughtInput({ ...thoughtInput, balanced: e.target.value })
                  }
                />
              </Field>

              <Button kind="primary" onClick={handleSaveThought}>
                Save Reframe
              </Button>
            </div>
          </Card>

          <Card>
            <div className="eyebrow">SAVED REFRAMES</div>
            <h2>Balanced truths</h2>
            {(data.thoughts || []).length === 0 ? (
              <Empty
                icon="▤"
                title="No reframes yet"
                description="Challenge anxious thoughts with facts."
              />
            ) : (
              <div className="stack-col">
                {(data.thoughts || []).map((t) => (
                  <div key={t.id} className="routine-step-box">
                    <div className="row-between">
                      <small className="eyebrow">{fmtDate(t.date)}</small>
                      <button
                        type="button"
                        className="danger-text"
                        onClick={() => handleDeleteThought(t.id)}
                      >
                        ×
                      </button>
                    </div>
                    <p>
                      <strong>Thought:</strong> {t.thought}
                    </p>
                    <p>
                      <strong>Truth:</strong> {t.balanced}
                    </p>
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

export { ReflectionAndMindPage };