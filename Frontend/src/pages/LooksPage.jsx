import React, { useState, useMemo } from "react";
import {
  todayISO,
  dayDiff,
  addDaysISO,
  fmtDate,
  percent,
  FACE_ROUTINE_STEPS,
  FACE_SHAPES_GUIDE,
  SKIN_ROUTINES,
  WARDROBE_CAPSULE,
  WEEK1_QUICK_WINS,
  createEmptyDay,
  Button,
  Card,
  Heading,
  Progress,
  Field,
  CountdownTimer,
} from "../shared";

function LooksPage({ data, setData, notify }) {
  const [subTab, setSubTab] = useState("routine"); // routine | skinHair | wardrobe
  const [doneRoutineSteps, setDoneRoutineSteps] = useState({});

  const today = todayISO();
  const groom = data.groom || {};
  const todayDayObj = (data.days && data.days[today]) || createEmptyDay();

  const setGroom = (patch) =>
    setData((old) => ({
      ...old,
      groom: { ...(old.groom || {}), ...patch },
    }));

  const selectedSkinType = SKIN_ROUTINES[groom.skinType] ? groom.skinType : "oily";
  const selectedFaceShape = FACE_SHAPES_GUIDE[groom.faceShape] ? groom.faceShape : "oval";

  const isFaceRoutineLoggedToday = Boolean(todayDayObj.face?.faceRoutineDone);

  const toggleFaceStepDone = (stepId) => {
    const next = { ...doneRoutineSteps, [stepId]: !doneRoutineSteps[stepId] };
    setDoneRoutineSteps(next);
    if (Object.values(next).filter(Boolean).length >= FACE_ROUTINE_STEPS.length) {
      markFullFaceRoutineToday(true);
    }
  };

  const markFullFaceRoutineToday = (val = true) => {
    const nextSteps = {};
    if (val) FACE_ROUTINE_STEPS.forEach((s) => { nextSteps[s.id] = true; });
    setDoneRoutineSteps(nextSteps);

    setData((old) => {
      const prevDay = (old.days && old.days[today]) || createEmptyDay();
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            face: { ...(prevDay.face || {}), faceRoutineDone: val },
          },
        },
      };
    });
    if (val && typeof notify === "function") notify("Face & posture routine logged!");
  };

  /* Daily AM/PM Skincare Tracker (+5 Comeback pts) */
  const todaySkinLog = todayDayObj.skinCareSteps || {
    amCleanse: false,
    amSpf: false,
    pmWash: false,
    pmMoist: false,
  };

  const toggleSkinStepToday = (key) => {
    const nextLog = { ...todaySkinLog, [key]: !todaySkinLog[key] };
    const bothDone = (nextLog.amCleanse || nextLog.amSpf) && (nextLog.pmWash || nextLog.pmMoist);

    setData((old) => {
      const prevDay = (old.days && old.days[today]) || createEmptyDay();
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            skinCareSteps: nextLog,
            c: {
              ...(prevDay.c || {}),
              skincare: bothDone || Boolean(prevDay.c?.skincare),
            },
          },
        },
      };
    });

    if (bothDone && !todayDayObj.c?.skincare && typeof notify === "function") {
      notify("AM + PM Skincare complete! (+5 Comeback pts)");
    }
  };

  const haircutStatus = useMemo(() => {
    if (!groom.lastHaircutDate) return null;
    const daysSince = Math.max(0, dayDiff(groom.lastHaircutDate, today));
    const nextIdealISO = addDaysISO(groom.lastHaircutDate, 28);
    return { daysSince, nextIdealISO, daysLeft: dayDiff(today, nextIdealISO) };
  }, [groom.lastHaircutDate, today]);

  const ownedWardrobe = groom.ownedWardrobe || {};
  const ownedCount = Object.values(ownedWardrobe).filter(Boolean).length;

  return (
    <>
      <Heading
        title="Posture, Skincare & Style"
        description="Daily 5-minute posture & jaw routine, AM/PM skincare, haircut guide, and well-fitted essentials."
      />

      <div className="tabs large-tabs">
        <button
          type="button"
          className={subTab === "routine" ? "selected" : ""}
          onClick={() => setSubTab("routine")}
        >
          5-Min Posture &amp; Face
        </button>
        <button
          type="button"
          className={subTab === "skinHair" ? "selected" : ""}
          onClick={() => setSubTab("skinHair")}
        >
          Skincare &amp; Haircut
        </button>
        <button
          type="button"
          className={subTab === "wardrobe" ? "selected" : ""}
          onClick={() => setSubTab("wardrobe")}
        >
          Wardrobe &amp; Quick Wins ({ownedCount}/{WARDROBE_CAPSULE.length})
        </button>
      </div>

      {/* TAB 1: 5-MIN POSTURE & FACE ROUTINE */}
      {subTab === "routine" && (
        <Card>
          <div className="section-head">
            <div>
              <div className="eyebrow">DAILY 5-MINUTE ROUTINE</div>
              <h2>Neck alignment, posture &amp; jaw relaxation</h2>
              <p>Fixes forward-head posture and sharpens your jawline naturally.</p>
            </div>
            <Button
              kind={isFaceRoutineLoggedToday ? "secondary" : "primary"}
              onClick={() => markFullFaceRoutineToday(!isFaceRoutineLoggedToday)}
            >
              {isFaceRoutineLoggedToday ? "✓ Done Today" : "✓ Mark All Done"}
            </Button>
          </div>

          <div className="stack-col jsx-dffc4db2">
            {FACE_ROUTINE_STEPS.map((s) => {
              const stepDone = Boolean(doneRoutineSteps[s.id]) || isFaceRoutineLoggedToday;
              return (
                <div
                  key={s.id}
                  className={`routine-step-box ${stepDone ? "routine-step-complete" : ""}`}
                >
                  <div className="row-between">
                    <div className="jsx-f265ed37">
                      <button
                        type="button"
                        className="check-circle"
                        onClick={() => toggleFaceStepDone(s.id)}
                      >
                        {stepDone ? "✓" : ""}
                      </button>
                      <strong>{s.name}</strong>
                    </div>
                    <span className="status-pill complete">{s.reps}</span>
                  </div>
                  <p className="jsx-a5595d11">{s.instruction}</p>
                  <CountdownTimer
                    defaultSeconds={s.durationSec}
                    label={s.name}
                    onComplete={() => toggleFaceStepDone(s.id)}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 2: SKINCARE & HAIRCUT */}
      {subTab === "skinHair" && (
        <div className="stack-col">
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">DAILY SKINCARE (+5 PTS)</div>
                <h2>AM &amp; PM Check-in</h2>
              </div>
              <span className={`status-pill ${todayDayObj.c?.skincare ? "complete" : ""}`}>
                {todayDayObj.c?.skincare ? "✓ +5 pts" : "Pending"}
              </span>
            </div>

            <div className="form-grid jsx-4bb90035">
              {[
                ["amCleanse", "AM: Gentle Face Cleanser + Moisturizer"],
                ["amSpf", "AM: SPF 50 PA+++ Sunscreen (Before stepping out)"],
                ["pmWash", "PM: Evening Face Wash (Remove sweat & dust)"],
                ["pmMoist", "PM: Night Moisturizer + Lip Balm"],
              ].map(([key, title]) => {
                const checked = Boolean(todaySkinLog[key]);
                return (
                  <div key={key} className={`habit-row ${checked ? "checked" : ""}`}>
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() => toggleSkinStepToday(key)}
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{title}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="dashboard-grid">
            <Card>
              <div className="eyebrow">SKIN TYPE ROUTINE</div>
              <h2>Products by skin type</h2>
              <div className="category-pills jsx-4bb90035">
                {Object.keys(SKIN_ROUTINES).map((st) => (
                  <button
                    type="button"
                    key={st}
                    className={selectedSkinType === st ? "selected" : ""}
                    onClick={() => setGroom({ skinType: st })}
                  >
                    {SKIN_ROUTINES[st].label}
                  </button>
                ))}
              </div>
              <div className="routine-step-box jsx-4bb90035">
                <strong>Morning (AM)</strong>
                {SKIN_ROUTINES[selectedSkinType].am.map((line, i) => <p key={i}>{line}</p>)}
                <strong className="jsx-0d69e4b1">Night (PM)</strong>
                {SKIN_ROUTINES[selectedSkinType].pm.map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </Card>

            <Card>
              <div className="eyebrow">HAIR &amp; BEARD FRAMING</div>
              <h2>Face shape &amp; 28-day trim tracker</h2>
              <div className="category-pills jsx-4bb90035">
                {Object.keys(FACE_SHAPES_GUIDE).map((shape) => (
                  <button
                    type="button"
                    key={shape}
                    className={selectedFaceShape === shape ? "selected" : ""}
                    onClick={() => setGroom({ faceShape: shape })}
                  >
                    {shape.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="routine-step-box jsx-4bb90035">
                <p><strong>Haircut:</strong> {FACE_SHAPES_GUIDE[selectedFaceShape].haircut}</p>
                <p><strong>Beard:</strong> {FACE_SHAPES_GUIDE[selectedFaceShape].beard}</p>
              </div>
              <div className="jsx-4bb90035">
                <Field label="Last Haircut Date">
                  <input
                    type="date"
                    max={today}
                    value={groom.lastHaircutDate || ""}
                    onChange={(e) => setGroom({ lastHaircutDate: e.target.value })}
                  />
                </Field>
                {haircutStatus && (
                  <small className="muted-text">
                    {haircutStatus.daysSince} days ago · Next trim: {fmtDate(haircutStatus.nextIdealISO)}
                  </small>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: WARDROBE & QUICK WINS */}
      {subTab === "wardrobe" && (
        <div className="stack-col">
          <Card>
            <div className="eyebrow">WEEK-1 QUICK WINS</div>
            <h2>Fast visible upgrades</h2>
            <div className="habit-list jsx-4bb90035">
              {WEEK1_QUICK_WINS.map((qw) => {
                const checked = Boolean(groom.quickWins && groom.quickWins[qw.id]);
                return (
                  <div className={`habit-row ${checked ? "checked" : ""}`} key={qw.id}>
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() =>
                        setGroom({
                          quickWins: { ...(groom.quickWins || {}), [qw.id]: !checked },
                        })
                      }
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{qw.title}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">CAPSULE WARDROBE</div>
                <h2>Slim-frame essentials ({ownedCount}/{WARDROBE_CAPSULE.length})</h2>
                <p>Shoulder seam must sit directly on the outer shoulder bone.</p>
              </div>
            </div>
            <div className="jsx-a1836c1d">
              <Progress value={percent(ownedCount, WARDROBE_CAPSULE.length)} />
            </div>
            <div className="table-wrap jsx-4bb90035">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Owned</th>
                    <th>Item</th>
                    <th>Budget</th>
                    <th>Mid-Range</th>
                  </tr>
                </thead>
                <tbody>
                  {WARDROBE_CAPSULE.map((row, i) => {
                    const isOwned = Boolean(ownedWardrobe[i]);
                    return (
                      <tr key={i}>
                        <td>
                          <button
                            type="button"
                            className={`check-circle ${isOwned ? "checked" : ""}`}
                            onClick={() =>
                              setGroom({
                                ownedWardrobe: { ...ownedWardrobe, [i]: !isOwned },
                              })
                            }
                          >
                            {isOwned ? "✓" : ""}
                          </button>
                        </td>
                        <td><strong className={isOwned ? "struck" : ""}>{row.item}</strong></td>
                        <td>{row.low}</td>
                        <td>{row.mid}</td>
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

export { LooksPage };