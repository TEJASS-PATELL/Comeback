import React, { useState, useMemo } from "react";
import {
  WEEKDAY_KEYS,
  todayISO,
  uid,
  getWeekdayShort,
  percent,
  safeNum,
  GYM_WORKOUT_PLAN,
  PROTEIN_TABLE,
  DIET_PLANS,
  calcBodyMetrics,
  ModernAreaChart,
  Button,
  Card,
  Heading,
  Progress,
  Field,
  Stat,
  CountdownTimer,
  DAILY_HOME_WORKOUTS,
  QUICK_PROTEIN_FOODS,
} from "../shared";

function LifestyleAndBodyPage({
  data,
  setData,
  updateProfile,
  notify,
}) {
  const [tab, setTab] = useState("workouts"); // workouts | diet | body
  const today = todayISO();
  const currentWeekday = getWeekdayShort(today);
  const [selectedDayKey, setSelectedDayKey] = useState(
    DAILY_HOME_WORKOUTS[currentWeekday] ? currentWeekday : "Mon"
  );
  const [restSeconds, setRestSeconds] = useState(90);
  const [customFood, setCustomFood] = useState({ name: "", protein: "", kcal: "" });

  const p = data.profile || {};
  const measures = data.measures || [];
  const bodyMetrics = useMemo(() => calcBodyMetrics(p, measures), [p, measures]);

  const activeDayPlan = DAILY_HOME_WORKOUTS[selectedDayKey] || DAILY_HOME_WORKOUTS.Mon;
  const todayDayObj = (data.days && data.days[today]) || {};
  const savedWorkoutLog = todayDayObj.homeWorkoutLog || {
    setsDone: {},
    repsByEx: {},
    loadByEx: {},
    completed: false,
  };

  const getExReps = (ex) =>
    savedWorkoutLog.repsByEx?.[ex.id] !== undefined
      ? savedWorkoutLog.repsByEx[ex.id]
      : ex.defaultReps;

  const isSetChecked = (exId, setIdx) =>
    Boolean(savedWorkoutLog.setsDone?.[`${exId}-${setIdx}`]);

  const recalcAndSaveTodayWorkout = (setsDoneMap, repsMap, markCompleted = false) => {
    let totalSets = 0;
    let totalReps = 0;
    Object.values(DAILY_HOME_WORKOUTS).forEach((dayPlan) => {
      dayPlan.exercises.forEach((ex) => {
        const r = repsMap[ex.id] !== undefined ? repsMap[ex.id] : ex.defaultReps;
        for (let s = 1; s <= ex.sets; s += 1) {
          if (setsDoneMap[`${ex.id}-${s}`]) {
            totalSets += 1;
            totalReps += Number(r) || 0;
          }
        }
      });
    });

    setData((old) => {
      const prevDay = (old.days && old.days[today]) || {};
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            c: {
              ...(prevDay.c || {}),
              workout: markCompleted || totalSets >= 3 || Boolean(prevDay.c?.workout),
            },
            homeWorkoutLog: {
              dayKey: selectedDayKey,
              setsDone: setsDoneMap,
              repsByEx: repsMap,
              totalSets,
              totalReps,
              completed: markCompleted || totalSets >= 6,
            },
          },
        },
      };
    });
  };

  const toggleWorkoutSet = (ex, setIdx) => {
    const key = `${ex.id}-${setIdx}`;
    const nextSetsDone = {
      ...(savedWorkoutLog.setsDone || {}),
      [key]: !isSetChecked(ex.id, setIdx),
    };
    const nextRepsByEx = {
      ...(savedWorkoutLog.repsByEx || {}),
      [ex.id]: getExReps(ex),
    };
    recalcAndSaveTodayWorkout(nextSetsDone, nextRepsByEx, savedWorkoutLog.completed);
  };

  const completeAllSetsForToday = () => {
    const nextSetsDone = { ...(savedWorkoutLog.setsDone || {}) };
    const nextRepsByEx = { ...(savedWorkoutLog.repsByEx || {}) };
    activeDayPlan.exercises.forEach((ex) => {
      if (nextRepsByEx[ex.id] === undefined) nextRepsByEx[ex.id] = ex.defaultReps;
      for (let s = 1; s <= ex.sets; s += 1) nextSetsDone[`${ex.id}-${s}`] = true;
    });
    recalcAndSaveTodayWorkout(nextSetsDone, nextRepsByEx, true);
    notify(`${activeDayPlan.day} workout logged! (+12 pts)`);
  };

  /* Diet Live Protein Tracker */
  const todayDietLog = todayDayObj.dietItems || [];
  const loggedProteinToday = todayDietLog.reduce((s, item) => s + safeNum(item.protein, 0), 0);
  const loggedKcalToday = todayDietLog.reduce((s, item) => s + safeNum(item.kcal, 0), 0);

  const addQuickFoodToday = (food) => {
    setData((old) => {
      const prevDay = (old.days && old.days[today]) || {};
      const nextList = [...(prevDay.dietItems || []), { ...food, uid: uid() }];
      const newProt = nextList.reduce((s, x) => s + safeNum(x.protein, 0), 0);
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            dietItems: nextList,
            c: {
              ...(prevDay.c || {}),
              protein: newProt >= bodyMetrics.proteinMin || Boolean(prevDay.c?.protein),
            },
          },
        },
      };
    });
    notify(`+${food.protein}g protein logged`);
  };

  const handleAddCustomFood = () => {
    const name = customFood.name.trim();
    const prot = Math.max(0, safeNum(customFood.protein, 0));
    const kcal = Math.max(0, safeNum(customFood.kcal, prot * 4));
    if (!name || (prot === 0 && kcal === 0)) return;
    addQuickFoodToday({ id: `cust-${uid()}`, name, protein: prot, kcal });
    setCustomFood({ name: "", protein: "", kcal: "" });
  };

  const removeFoodItemToday = (itemUid) => {
    setData((old) => {
      const prevDay = (old.days && old.days[today]) || {};
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            dietItems: (prevDay.dietItems || []).filter((x) => x.uid !== itemUid),
          },
        },
      };
    });
  };

  /* Body Measurements */
  const [newMeas, setNewMeas] = useState({
    weight: p.weightKg || 56,
    waist: 74,
    shoulder: 105,
  });

  const handleSaveMeasurement = () => {
    const entry = {
      date: today,
      weight: safeNum(newMeas.weight, p.weightKg),
      waist: safeNum(newMeas.waist, 74),
      shoulder: safeNum(newMeas.shoulder, 105),
    };
    setData((old) => ({
      ...old,
      measures: [...(old.measures || []), entry],
      profile: { ...old.profile, weightKg: entry.weight },
    }));
    notify("Weight & measurements saved");
  };

  const weightSeries = useMemo(
    () =>
      measures.map((m) => ({
        key: m.date,
        label: String(m.date).slice(5),
        value: safeNum(m.weight, 0),
      })),
    [measures]
  );

  return (
    <>
      <Heading
        title="Workouts, Diet & Body"
        description={`Target: ${bodyMetrics.calMin}–${bodyMetrics.calMax} kcal · ${bodyMetrics.proteinMin}–${bodyMetrics.proteinMax}g protein/day`}
      />

      <div className="tabs large-tabs">
        <button
          type="button"
          className={tab === "workouts" ? "selected" : ""}
          onClick={() => setTab("workouts")}
        >
          Workouts ({safeNum(savedWorkoutLog.totalSets, 0)} sets today)
        </button>
        <button
          type="button"
          className={tab === "diet" ? "selected" : ""}
          onClick={() => setTab("diet")}
        >
          Diet &amp; Protein ({loggedProteinToday}g / {bodyMetrics.proteinMin}g)
        </button>
        <button
          type="button"
          className={tab === "body" ? "selected" : ""}
          onClick={() => setTab("body")}
        >
          TDEE &amp; Weight Tracker
        </button>
      </div>

      {/* TAB 1: WORKOUTS */}
      {tab === "workouts" && (
        <div className="stack-col">
          <div className="toolbar">
            <div className="tabs">
              <button
                type="button"
                className={data.settings?.activePlan !== "gym" ? "selected" : ""}
                onClick={() =>
                  setData((old) => ({ ...old, settings: { ...old.settings, activePlan: "home" } }))
                }
              >
                🏠 Home Split (Mon–Sun)
              </button>
              <button
                type="button"
                className={data.settings?.activePlan === "gym" ? "selected" : ""}
                onClick={() =>
                  setData((old) => ({ ...old, settings: { ...old.settings, activePlan: "gym" } }))
                }
              >
                🏋️ Gym A/B/C
              </button>
            </div>
            <Button kind="primary" onClick={completeAllSetsForToday}>
              ✓ Complete {activeDayPlan.day} Workout
            </Button>
          </div>

          {data.settings?.activePlan !== "gym" ? (
            <>
              <Card>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">{activeDayPlan.day.toUpperCase()}</div>
                    <h2>{activeDayPlan.title}</h2>
                    <p>{activeDayPlan.focus}</p>
                  </div>
                </div>

                <div className="weekday-selector-grid">
                  {WEEKDAY_KEYS.map((dKey) => (
                    <button
                      type="button"
                      key={dKey}
                      className={`weekday-pill ${selectedDayKey === dKey ? "active" : ""}`}
                      onClick={() => setSelectedDayKey(dKey)}
                    >
                      <strong>{dKey}</strong>
                    </button>
                  ))}
                </div>

                <div className="home-exercise-list">
                  {activeDayPlan.exercises.map((ex, idx) => (
                    <div key={ex.id} className="home-exercise-card">
                      <div className="home-ex-main">
                        <span className="status-pill complete">0{idx + 1}</span>
                        <div className="habit-info">
                          <strong>{ex.name}</strong>
                          <small>{ex.repsLabel} · {ex.cue}</small>
                        </div>
                      </div>
                      <div className="set-chips-row">
                        {Array.from({ length: ex.sets }, (_, sIdx) => {
                          const setNum = sIdx + 1;
                          const done = isSetChecked(ex.id, setNum);
                          return (
                            <button
                              type="button"
                              key={setNum}
                              className={`set-check-btn ${done ? "done" : ""}`}
                              onClick={() => toggleWorkoutSet(ex, setNum)}
                            >
                              {done ? `✓ S${setNum}` : `S${setNum}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="row-between">
                  <strong>Rest Timer Between Sets</strong>
                  <div className="category-pills">
                    {[60, 90, 120].map((sec) => (
                      <button
                        type="button"
                        key={sec}
                        className={restSeconds === sec ? "selected" : ""}
                        onClick={() => setRestSeconds(sec)}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
                <CountdownTimer defaultSeconds={restSeconds} label={`${restSeconds}s Rest`} />
              </Card>
            </>
          ) : (
            <div className="record-grid three-col-grid">
              {Object.entries(GYM_WORKOUT_PLAN.sessions).map(([sessKey, list]) => (
                <Card key={sessKey}>
                  <div className="eyebrow">SESSION {sessKey}</div>
                  <h2>Full-Body {sessKey}</h2>
                  <div className="habit-list jsx-4bb90035">
                    {list.map((ex, i) => (
                      <div className="habit-row" key={i}>
                        <div className="habit-info">
                          <strong>{ex.name}</strong>
                          <small>{ex.sets} · {ex.reps}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIET & LIVE PROTEIN */}
      {tab === "diet" && (
        <div className="stack-col">
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">TODAY&apos;S PROTEIN &amp; CALORIES</div>
                <h2>
                  {loggedProteinToday}g / {bodyMetrics.proteinMin}g Protein · {loggedKcalToday} kcal
                </h2>
              </div>
            </div>

            <div className="jsx-5beb8fbe">
              <Progress value={percent(loggedProteinToday, bodyMetrics.proteinMin)} />
            </div>

            <div className="quick-food-grid">
              {QUICK_PROTEIN_FOODS.map((food) => (
                <button
                  type="button"
                  key={food.id}
                  className="quick-food-btn"
                  onClick={() => addQuickFoodToday(food)}
                >
                  <strong>＋ {food.name}</strong>
                  <span>{food.protein}g P · {food.kcal} kcal</span>
                </button>
              ))}
            </div>

            <div className="form-grid three-col-grid jsx-4c0544d5">
              <Field label="Custom Food">
                <input
                  type="text"
                  placeholder="e.g. 2 Besan Chilla"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                />
              </Field>
              <Field label="Protein (g)">
                <input
                  type="number"
                  placeholder="14"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                />
              </Field>
              <Field label="Calories">
                <div className="inline-add-row">
                  <input
                    type="number"
                    placeholder="250"
                    value={customFood.kcal}
                    onChange={(e) => setCustomFood({ ...customFood, kcal: e.target.value })}
                  />
                  <Button kind="primary" onClick={handleAddCustomFood}>Add</Button>
                </div>
              </Field>
            </div>

            {todayDietLog.length > 0 && (
              <div className="category-pills jsx-4c0544d5">
                {todayDietLog.map((item) => (
                  <span key={item.uid} className="status-pill complete">
                    {item.name} ({item.protein}g)
                    <button
                      type="button"
                      onClick={() => removeFoodItemToday(item.uid)}
                      className="jsx-e0c0acac"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="record-grid">
            <Card>
              <div className="eyebrow">SAMPLE INDIAN PLANS</div>
              <h2>Veg (~100g+ protein)</h2>
              <div className="habit-list jsx-4bb90035">
                {DIET_PLANS.veg.map((m, i) => (
                  <div className="habit-row" key={i}>
                    <div className="habit-info">
                      <strong>{m.meal}</strong>
                      <small>{m.items}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="eyebrow">PROTEIN GUIDE</div>
              <h2>Per serving reference</h2>
              <div className="table-wrap jsx-4bb90035">
                <table className="clean-table">
                  <tbody>
                    {PROTEIN_TABLE.map((row, i) => (
                      <tr key={i}>
                        <td>{row.item}</td>
                        <td><strong>{row.protein}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: TDEE & WEIGHT TRACKER */}
      {tab === "body" && (
        <div className="stack-col">
          <div className="stats-grid">
            <Stat icon="⚖" label="BMI" value={bodyMetrics.bmi} detail={bodyMetrics.bmiCategory} color="sage" />
            <Stat icon="🔥" label="Daily Calories" value={`${bodyMetrics.calMin}–${bodyMetrics.calMax}`} detail={`TDEE: ${bodyMetrics.tdee} kcal`} color="peach" />
            <Stat icon="💪" label="Protein Target" value={`${bodyMetrics.proteinMin}–${bodyMetrics.proteinMax}g`} detail="1.6–2.0g per kg" color="blue" />
          </div>

          <div className="dashboard-grid">
            <Card>
              <div className="eyebrow">CALCULATOR</div>
              <h2>Update your stats</h2>
              <div className="form-grid jsx-dffc4db2">
                <Field label="Height (cm)">
                  <input
                    type="number"
                    value={p.heightCm}
                    onChange={(e) => updateProfile({ heightCm: safeNum(e.target.value, 172) })}
                  />
                </Field>
                <Field label="Weight (kg)">
                  <input
                    type="number"
                    value={p.weightKg}
                    onChange={(e) => updateProfile({ weightKg: safeNum(e.target.value, 56) })}
                  />
                </Field>
                <Field label="Goal">
                  <select
                    value={bodyMetrics.effectiveGoal}
                    onChange={(e) => updateProfile({ calcGoal: e.target.value })}
                  >
                    <option value="gain">Lean Bulk (+350 kcal)</option>
                    <option value="maintain">Maintenance</option>
                    <option value="lose">Fat Loss (-450 kcal)</option>
                  </select>
                </Field>
              </div>
            </Card>

            <Card>
              <div className="eyebrow">LOG MEASUREMENTS</div>
              <h2>Weight &amp; V-Taper (cm)</h2>
              <div className="form-grid three-col-grid jsx-dffc4db2">
                <Field label="Weight (kg)">
                  <input
                    type="number"
                    value={newMeas.weight}
                    onChange={(e) => setNewMeas({ ...newMeas, weight: safeNum(e.target.value, 56) })}
                  />
                </Field>
                <Field label="Shoulders (cm)">
                  <input
                    type="number"
                    value={newMeas.shoulder}
                    onChange={(e) => setNewMeas({ ...newMeas, shoulder: safeNum(e.target.value, 105) })}
                  />
                </Field>
                <Field label="Waist (cm)">
                  <input
                    type="number"
                    value={newMeas.waist}
                    onChange={(e) => setNewMeas({ ...newMeas, waist: safeNum(e.target.value, 74) })}
                  />
                </Field>
              </div>
              <Button kind="primary" onClick={handleSaveMeasurement}>
                Save Measurement
              </Button>
            </Card>
          </div>

          <Card>
            <div className="eyebrow">WEIGHT TREND</div>
            <h2>Progress over time (kg)</h2>
            <ModernAreaChart
              data={weightSeries}
              maxVal={Math.max(...weightSeries.map((d) => d.value), 65) + 5}
              unit=" kg"
            />
          </Card>
        </div>
      )}
    </>
  );
}

export { LifestyleAndBodyPage };