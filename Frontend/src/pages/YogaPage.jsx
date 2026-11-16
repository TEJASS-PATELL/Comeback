import React, { useState, useEffect, useCallback } from "react";
import {
  todayISO,
  safeNum,
  YOGA_POSES,
  createEmptyDay,
} from "../shared";

function YogaPage({ data, setData, today: propToday, updateDay, notify }) {
  const today = propToday || todayISO();
  const [filter, setFilter] = useState("all"); // all | apt | daily

  const completedSets =
    data?.yogaSets?._date === today ? data.yogaSets : { _date: today };

  const setCompletedSets = (next) => {
    const nextSets = typeof next === "function" ? next(completedSets) : next;
    setData((previous) => ({
      ...previous,
      yogaSets: { ...nextSets, _date: today },
    }));
  };

  const [activePoseId, setActivePoseId] = useState(YOGA_POSES[0].id);
  const [activePoseTitle, setActivePoseTitle] = useState(YOGA_POSES[0].title);
  const [timerSec, setTimerSec] = useState(YOGA_POSES[0].holdSec || 45);
  const [initialSec, setInitialSec] = useState(YOGA_POSES[0].holdSec || 45);
  const [isRunning, setIsRunning] = useState(false);

  const todayDayObj = (data?.days && data.days[today]) || createEmptyDay();
  const deskBreaksToday = safeNum(todayDayObj.yogaLog?.deskBreaks, 0);

  const syncYogaToGlobalStore = useCallback(
    (setsMap) => {
      const setsCount = Object.keys(setsMap).filter(
        (k) => k !== "_date" && Boolean(setsMap[k])
      ).length;

      if (typeof updateDay === "function") {
        updateDay(today, (prev) => ({
          ...prev,
          c: {
            ...(prev.c || {}),
            workout: setsCount >= 5 || Boolean(prev.c?.workout),
          },
          yogaLog: {
            ...(prev.yogaLog || {}),
            setsDone: setsCount,
            updatedAt: Date.now(),
          },
        }));
      }
    },
    [today, updateDay]
  );

  useEffect(() => {
    if (!isRunning) return undefined;
    if (timerSec <= 0) {
      setIsRunning(false);
      const poseObj = YOGA_POSES.find((p) => p.id === activePoseId);
      if (poseObj) {
        let markedIdx = -1;
        for (let i = 0; i < poseObj.sets; i += 1) {
          if (!completedSets[`${poseObj.id}-set-${i}`]) {
            markedIdx = i;
            break;
          }
        }
        if (markedIdx !== -1) {
          const nextMap = {
            ...completedSets,
            [`${poseObj.id}-set-${markedIdx}`]: true,
          };
          setCompletedSets(nextMap);
          syncYogaToGlobalStore(nextMap);
          if (typeof notify === "function") {
            notify(`✓ ${poseObj.title} — Set ${markedIdx + 1} done!`);
          }
        }
      }
      return undefined;
    }

    const id = setInterval(() => setTimerSec((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timerSec, activePoseId, completedSets, syncYogaToGlobalStore, notify]);

  const toggleSet = (poseId, setIdx) => {
    const key = `${poseId}-set-${setIdx}`;
    const next = { ...completedSets, [key]: !completedSets[key] };
    setCompletedSets(next);
    syncYogaToGlobalStore(next);
  };

  const loadPoseTimer = (pose) => {
    setIsRunning(false);
    setActivePoseId(pose.id);
    setInitialSec(pose.holdSec);
    setTimerSec(pose.holdSec);
    setActivePoseTitle(pose.title);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const logStandingDeskBreak = () => {
    if (typeof updateDay === "function") {
      updateDay(today, (prev) => ({
        ...prev,
        yogaLog: {
          ...(prev.yogaLog || {}),
          deskBreaks: safeNum(prev.yogaLog?.deskBreaks, 0) + 1,
        },
      }));
    }
    if (typeof notify === "function") {
      notify("30s Posture Break logged!");
    }
  };

  const totalSetsCount = YOGA_POSES.reduce((acc, p) => acc + p.sets, 0);
  const doneSetsCount = Object.entries(completedSets).filter(
    ([k, v]) => k !== "_date" && Boolean(v)
  ).length;

  const filteredPoses = YOGA_POSES.filter((p) =>
    filter === "all" ? true : p.category === filter
  );

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Yoga &amp; Posture</h1>
          <p>
            {doneSetsCount}/{totalSetsCount} sets done today · Complete 5 sets to auto-tick today&apos;s workout.
          </p>
        </div>

        <div className="heading-btn-group">
          <button type="button" className="btn primary" onClick={logStandingDeskBreak}>
            ＋ 30s Desk Break ({deskBreaksToday})
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const empty = { _date: today };
              setCompletedSets(empty);
              syncYogaToGlobalStore(empty);
            }}
          >
            Reset
          </button>
        </div>
      </header>

      {/* GUIDED HOLD TIMER */}
      <section className="card jsx-2f23af6b">
        <div className="section-head">
          <div>
            <div className="eyebrow">POSE HOLD TIMER</div>
            <h2>{activePoseTitle}</h2>
          </div>
          <span className={`status-pill ${isRunning ? "complete" : ""}`}>
            {isRunning ? "Holding..." : "Ready"}
          </span>
        </div>

        <div className="timer-strip">
          <div className="timer-readout">{formatTime(timerSec)}</div>
          <div className="timer-btns">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                if (isRunning) setIsRunning(false);
                else {
                  if (timerSec <= 0) setTimerSec(initialSec);
                  setIsRunning(true);
                }
              }}
            >
              {isRunning ? "Pause" : "▶ Start Hold"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setIsRunning(false);
                setTimerSec(initialSec);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* FILTER TABS */}
      <div className="toolbar">
        <div className="tabs">
          <button
            type="button"
            className={filter === "all" ? "selected" : ""}
            onClick={() => setFilter("all")}
          >
            All ({YOGA_POSES.length})
          </button>
          <button
            type="button"
            className={filter === "apt" ? "selected" : ""}
            onClick={() => setFilter("apt")}
          >
            APT Fix (5)
          </button>
          <button
            type="button"
            className={filter === "daily" ? "selected" : ""}
            onClick={() => setFilter("daily")}
          >
            Daily Flow (5)
          </button>
        </div>
      </div>

      {/* POSE CARDS */}
      <section className="yoga-pose-list jsx-cff380b4">
        {filteredPoses.map((pose, index) => {
          const isPoseComplete = Array.from({ length: pose.sets }).every(
            (_, i) => completedSets[`${pose.id}-set-${i}`]
          );

          return (
            <article
              key={pose.id}
              className={`yoga-pose-card ${isPoseComplete ? "pose-complete" : ""}`}
            >
              <div className="yoga-pose-header">
                <h3>
                  {index + 1}. {pose.title}{" "}
                  <span className="sanskrit-name">({pose.prescription})</span>
                </h3>
                {isPoseComplete && (
                  <span className="status-pill complete">✓ Done</span>
                )}
              </div>

              <p className="muted-text">{pose.aptCue}</p>

              <div className="yoga-pose-footer">
                <div className="set-chips-row">
                  {Array.from({ length: pose.sets }).map((_, setIdx) => {
                    const done = Boolean(completedSets[`${pose.id}-set-${setIdx}`]);
                    return (
                      <button
                        key={setIdx}
                        type="button"
                        className={`set-check-btn ${done ? "done" : ""}`}
                        onClick={() => toggleSet(pose.id, setIdx)}
                      >
                        {done ? "✓ " : ""}Set {setIdx + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn primary"
                  onClick={() => loadPoseTimer(pose)}
                >
                  ◷ {pose.holdSec}s Timer
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

export { YogaPage };