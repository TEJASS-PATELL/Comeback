import React, { useState, useEffect, useMemo, useRef } from "react";

const STORAGE_KEY = "day-by-day-comeback90-unified-v1";
const QUEST_KEY = "day-by-day-comeback90-quest-v1";
const SCHEMA_VERSION = 2;
const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ═══════════════════ DATE & MATH UTILITIES ═══════════════════ */

const todayISO = (dateObj = new Date()) => {
  const d =
    dateObj instanceof Date && !Number.isNaN(dateObj.getTime())
      ? dateObj
      : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const parseLocalISO = (isoStr) => {
  if (typeof isoStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDaysISO = (isoStr, deltaDays) => {
  const dt = parseLocalISO(isoStr);
  dt.setDate(dt.getDate() + Number(deltaDays || 0));
  return todayISO(dt);
};

const dayDiff = (startISO, endISO) => {
  const a = parseLocalISO(startISO);
  const b = parseLocalISO(endISO);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

const getDayIndex = (startDateISO, currentISO = todayISO()) =>
  Math.max(1, dayDiff(startDateISO, currentISO) + 1);

const getWeekdayShort = (isoStr = todayISO()) =>
  WEEKDAY_KEYS[parseLocalISO(isoStr).getDay()] || "Mon";

const fmtDate = (value) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date";

const percent = (n, d) => (d ? Math.round((n / d) * 100) : 0);

const safeNum = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, safeNum(val, min)));

function discreetText(str, isDiscreet) {
  if (!isDiscreet || typeof str !== "string") return str;
  return str
    .replace(/\bpornography\b/gi, "Streak A")
    .replace(/\bporn\b/gi, "Streak A")
    .replace(/\bmasturbation\b/gi, "Habit B")
    .replace(/\bmasturbate\b/gi, "Habit B")
    .replace(/\brelapses\b/gi, "Resets")
    .replace(/\brelapse\b/gi, "Reset")
    .replace(/\bslips\b/gi, "Resets")
    .replace(/\bslip\b/gi, "Reset")
    .replace(/\burges\b/gi, "Cravings")
    .replace(/\burge\b/gi, "Craving");
}

function triggerCompletionFeedback(mode = "success") {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(mode === "tick" ? 15 : [50, 30, 60]);
    }
  } catch {
    /* ignore */
  }
}

/* ═══════════════════ CORE CONSTANTS (Keep existing data intact) ═══════════════════ */
// NOTE: Keep all your existing data arrays from shared.jsx (DISCLAIMER_TEXT, QUOTES, MINIMUM_DAY_IDS,
// SCORED_CHECKS, LIFE_BASICS, CONTROL_LOOPS, FACE_HABITS, DEFAULT_SCHEDULE, MOOD_ACTIVITIES,
// URGE_STEPS, URGE_TRIGGERS, URGE_LOCATIONS, SOS_TEXT_TEMPLATES, ENV_CHECKLIST, HOME_WORKOUT_PLAN,
// YOGA_POSES, AVOID_IN_APT, GYM_WORKOUT_PLAN, GYM_DARR_TIPS, FRAME_BONE_CONTENT, CALCIUM_TABLE,
// PROTEIN_TABLE, DIET_PLANS, WEIGHT_GAIN_TIPS, FACE_SACH_CARD, FACE_AUDIT_QUESTIONS,
// FACE_ROUTINE_STEPS, FACE_SHAPES_GUIDE, SKIN_ROUTINES, WARDROBE_CAPSULE, WEEK1_QUICK_WINS,
// WEEKLY_GROOM_CHECKS, EXPOSURE_LADDER, PHQ9_QUESTIONS, GAD7_QUESTIONS, ROADMAP_PHASES,
// QUESTS, HEALTH_TESTS, SUPPLEMENT_TIERS, DAILY_HOME_WORKOUTS, QUICK_PROTEIN_FOODS) right here!

/* Streamlined 7-Item Navigation (Instead of 12 crowded tabs) */
const NAV = [
  ["Today", "⌂", "Daily dashboard, 100-pt core & tasks"],
  ["Habits", "◉", "Custom habits, 7-day matrix & schedule"],
  ["Quest", "✦", "Daily missions, XP & rank"],
  ["Lifestyle", "✳", "Home workouts, diet & body calculator"],
  ["Looks", "◌", "Face routine, skincare & wardrobe"],
  ["Reset", "↻", "Urge SOS, 4-7-8 breathing & blockers"],
  ["More", "⚙", "Sleep, Pomodoro, journal, goals & backup"],
];

/* ═══════════════════ STORE INITIALIZATION ═══════════════════ */

function createEmptyDay() {
  return {
    c: {},
    life: {},
    loops: {},
    face: {},
    steps: 0,
    waterL: 0,
    screenH: 0,
    sleepH: 0,
    mood: 3,
    energy: 3,
    activity: { id: "", moodAfter: 3 },
    journal: "",
    wins: [],
    dietItems: [],
    homeWorkoutLog: {
      setsDone: {},
      repsByEx: {},
      loadByEx: {},
      totalSets: 0,
      totalReps: 0,
      totalTonnageKg: 0,
      completed: false,
    },
    yogaLog: { setsDone: 0, posesDone: 0, deskBreaks: 0 },
    skinCareSteps: { amCleanse: false, amSpf: false, pmWash: false, pmMoist: false },
    scheduleDone: {},
    stacksDone: {},
    slip: false,
    doneForToday: false,
  };
}

function createInitialData() {
  const today = todayISO();
  return {
    version: SCHEMA_VERSION,
    onboarded: true,
    badDayMode: false,
    profile: {
      name: "Bhai",
      started: today,
      startDate: today,
      age: 22,
      heightCm: 172,
      weightKg: 56,
      goal: "quit_porn_reduce_m",
      activity: "1.375",
      calcGoal: "gain",
      bedtime: "23:00",
      wakeTime: "07:00",
      phoneEstH: 5,
      workoutDays: ["Mon", "Wed", "Fri"],
      targets: { steps: 8000, waterL: 3, screenH: 3 },
      discreet: false,
    },
    habits: [
      {
        id: "h-1",
        name: "Morning sunlight walk (15m)",
        kind: "build",
        category: "Body & Mind",
        target: "15 mins",
        schedule: "daily",
        doneDate: "",
        archived: false,
      },
      {
        id: "h-2",
        name: "No late-night reels in bed",
        kind: "quit",
        category: "Sleep",
        target: "Phone outside bedroom",
        schedule: "daily",
        doneDate: "",
        archived: false,
      },
    ],
    tasks: [
      {
        id: "t-1",
        title: "Complete 25-min deep work block",
        notes: "",
        due: today,
        priority: "high",
        done: false,
        archived: false,
      },
    ],
    moods: [],
    goals: [
      {
        id: "g-1",
        title: "Gain 4 kg lean mass in 90 days",
        why: "Build strength and confidence",
        target: "60",
        unit: "kg",
        due: addDaysISO(today, 90),
        progress: 0,
        archived: false,
      },
    ],
    journals: [],
    routines: [],
    metrics: [],
    resetLogs: [],
    checkins: [],
    milestones: [],
    measurements: [],
    days: { [today]: createEmptyDay() },
    schedule: DEFAULT_SCHEDULE.map((x) => ({ ...x })),
    habitStacks: [],
    urges: [],
    ifThen: [],
    measures: [
      {
        date: today,
        weight: 56,
        waist: 74,
        chest: 87,
        arm: 27.5,
        neck: 35.5,
        shoulder: 105,
      },
    ],
    ladder: {},
    thoughts: [],
    mentalCheckins: [],
    env: {},
    groom: {
      skinType: "oily",
      faceShape: "oval",
      quickWins: {},
      weeklyChecks: {},
      ownedWardrobe: {},
      fitChecks: {},
      lastHaircutDate: "",
    },
    faceAudit: { answers: {}, updatedAt: "" },
    roadmapProgress: {},
    labResults: {},
    aptWallTest: "mild",
    focusSessions: [],
    distractionNotes: [],
    weeklyReviews: [],
    settings: {
      activeLoops: ["junk", "lateCaff", "doomscroll"],
      activePlan: "home",
      darkTheme: false,
    },
    yogaSets: { _date: today },
  };
}

function readUnifiedStore() {
  const def = createInitialData();
  try {
    if (typeof window === "undefined" || !window.localStorage) return def;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return def;
    return {
      ...def,
      ...parsed,
      version: SCHEMA_VERSION,
      profile: {
        ...def.profile,
        ...(parsed.profile || {}),
        targets: {
          ...def.profile.targets,
          ...((parsed.profile && parsed.profile.targets) || {}),
        },
      },
      days: { ...def.days, ...(parsed.days || {}) },
      groom: { ...def.groom, ...(parsed.groom || {}) },
      settings: { ...def.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return def;
  }
}

/* ═══════════════════ SCORING, STREAKS & BODY ENGINE ═══════════════════ */

function calcDailyScoreBreakdown(dayObj, profile) {
  if (!dayObj || typeof dayObj !== "object") {
    return { total: 0, coreClean: 0, fitnessBody: 0, sleepScreen: 0, mindCare: 0 };
  }
  const c = dayObj.c || {};
  const targets = (profile && profile.targets) || { steps: 8000, waterL: 3, screenH: 3 };

  let coreClean = c.noPorn && !dayObj.slip ? 20 : 0;

  let fitnessBody = 0;
  const workoutSetsDone = safeNum(dayObj.homeWorkoutLog?.totalSets, 0);
  const yogaSetsDone = safeNum(dayObj.yogaLog?.setsDone, 0);
  if (c.workout || workoutSetsDone >= 6 || yogaSetsDone >= 5) fitnessBody += 12;
  else if (workoutSetsDone > 0 || yogaSetsDone > 0)
    fitnessBody += Math.min(1, (workoutSetsDone + yogaSetsDone) / 6) * 12;

  const targetSteps = Math.max(1000, safeNum(targets.steps, 8000));
  const actualSteps = Math.max(0, safeNum(dayObj.steps, 0));
  if (c.steps) fitnessBody += 8;
  else if (actualSteps > 0) fitnessBody += Math.min(1, actualSteps / targetSteps) * 8;

  const targetProteinMin = Math.round(Math.max(40, safeNum(profile?.weightKg, 56)) * 1.6);
  const loggedProteinG = Array.isArray(dayObj.dietItems)
    ? dayObj.dietItems.reduce((sum, item) => sum + safeNum(item.protein, 0), 0)
    : 0;
  if (c.protein || loggedProteinG >= targetProteinMin) fitnessBody += 8;
  else if (loggedProteinG > 0)
    fitnessBody += Math.min(1, loggedProteinG / targetProteinMin) * 8;

  const targetWater = Math.max(1, safeNum(targets.waterL, 3));
  const actualWater = Math.max(0, safeNum(dayObj.waterL, 0));
  if (c.water) fitnessBody += 4;
  else if (actualWater > 0) fitnessBody += Math.min(1, actualWater / targetWater) * 4;

  let sleepScreen = 0;
  if (c.wakeOnTime || safeNum(dayObj.sleepH, 0) >= 7) sleepScreen += 8;
  if (c.sunlight) sleepScreen += 8;
  const targetScreen = Math.max(0.5, safeNum(targets.screenH, 3));
  const actualScreen = Math.max(0, safeNum(dayObj.screenH, 0));
  if (c.screenUnderLimit || (actualScreen > 0 && actualScreen <= targetScreen)) sleepScreen += 8;
  if (c.bedOnTime) sleepScreen += 6;
  if (c.phoneOutside) sleepScreen += 5;

  let mindCare = 0;
  const skinStepsCount = dayObj.skinCareSteps
    ? Object.values(dayObj.skinCareSteps).filter(Boolean).length
    : 0;
  if (c.skincare || skinStepsCount >= 2) mindCare += 5;
  else if (skinStepsCount === 1) mindCare += 2.5;
  if (c.braveSocial) mindCare += 4;
  if (c.journal || (typeof dayObj.journal === "string" && dayObj.journal.trim().length > 3))
    mindCare += 4;

  const total = Math.min(100, Math.round(coreClean + fitnessBody + sleepScreen + mindCare));
  return {
    total,
    coreClean: Math.round(coreClean),
    fitnessBody: Math.round(fitnessBody),
    sleepScreen: Math.round(sleepScreen),
    mindCare: Math.round(mindCare),
  };
}

function calcDailyScore(dayObj, profile) {
  return calcDailyScoreBreakdown(dayObj, profile).total;
}

function calcStreaks(daysMap, profile, currentISO = todayISO()) {
  const map = daysMap || {};
  const startISO = (profile && profile.startDate) || currentISO;
  const allDates = Array.from(new Set([...Object.keys(map), currentISO])).sort();
  const earliestISO = allDates[0] < startISO ? allDates[0] : startISO;
  const totalSpan = Math.max(0, dayDiff(earliestISO, currentISO));

  let totalClean = 0;
  let cleanLast30 = 0;
  let bestClean = 0;
  let runningClean = 0;
  let bestRoutine = 0;
  let runningRoutine = 0;

  for (let i = 0; i <= totalSpan; i += 1) {
    const dISO = addDaysISO(earliestISO, i);
    const dObj = map[dISO];
    const isClean = Boolean(dObj && dObj.c && dObj.c.noPorn && !dObj.slip);
    const isSlip = Boolean(dObj && dObj.slip);
    const score = dObj ? calcDailyScore(dObj, profile) : 0;
    const daysAgo = dayDiff(dISO, currentISO);

    if (isClean) {
      totalClean += 1;
      runningClean += 1;
      if (runningClean > bestClean) bestClean = runningClean;
    } else if (isSlip || dISO < currentISO) {
      runningClean = 0;
    }
    if (daysAgo < 30 && isClean) cleanLast30 += 1;

    if (score >= 60) {
      runningRoutine += 1;
      if (runningRoutine > bestRoutine) bestRoutine = runningRoutine;
    } else if (dISO < currentISO) {
      runningRoutine = 0;
    }
  }

  const todayObj = map[currentISO];
  const todayLoggedClean = Boolean(todayObj && todayObj.c && todayObj.c.noPorn && !todayObj.slip);
  const todaySlipped = Boolean(todayObj && todayObj.slip);

  let currentClean = 0;
  if (!todaySlipped) {
    let cursor = todayLoggedClean ? currentISO : addDaysISO(currentISO, -1);
    while (cursor >= earliestISO) {
      const obj = map[cursor];
      if (obj && obj.c && obj.c.noPorn && !obj.slip) {
        currentClean += 1;
        cursor = addDaysISO(cursor, -1);
      } else break;
    }
  }

  const todayScore = todayObj ? calcDailyScore(todayObj, profile) : 0;
  let currentRoutine = 0;
  let rCursor = todayScore >= 60 ? currentISO : addDaysISO(currentISO, -1);
  while (rCursor >= earliestISO) {
    const obj = map[rCursor];
    if (obj && calcDailyScore(obj, profile) >= 60) {
      currentRoutine += 1;
      rCursor = addDaysISO(rCursor, -1);
    } else break;
  }

  return {
    currentClean,
    bestClean: Math.max(bestClean, currentClean),
    totalClean,
    cleanLast30,
    currentRoutine,
    bestRoutine: Math.max(bestRoutine, currentRoutine),
  };
}

function calcBodyMetrics(profile, measures = []) {
  const heightCm = clamp(profile?.heightCm, 120, 230);
  const weightKg = clamp(profile?.weightKg, 30, 200);
  const age = clamp(profile?.age, 16, 80);
  const mult = clamp(profile?.activity, 1.2, 1.9);
  const requestedGoal = profile?.calcGoal || "gain";

  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(1);
  const isUnderweight = bmi < 18.5;

  let bmiCategory = "Normal weight";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
  else if (bmi >= 30) bmiCategory = "Obese";

  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  const tdee = Math.round(bmr * mult);
  const loseBlocked = isUnderweight && requestedGoal === "lose";
  const effectiveGoal = loseBlocked ? "gain" : requestedGoal;

  let calMin = tdee;
  let calMax = tdee;
  if (effectiveGoal === "gain") {
    calMin = tdee + 300;
    calMax = tdee + 450;
  } else if (effectiveGoal === "lose") {
    calMin = Math.max(1450, tdee - 500);
    calMax = Math.max(1550, tdee - 350);
  }

  let swRatio = null;
  if (Array.isArray(measures) && measures.length > 0) {
    const latest = measures[measures.length - 1];
    const sh = safeNum(latest.shoulder, 0);
    const wa = safeNum(latest.waist, 0);
    if (sh > 0 && wa > 0) swRatio = +(sh / wa).toFixed(2);
  }

  return {
    heightCm,
    weightKg,
    age,
    bmi,
    bmiCategory,
    isUnderweight,
    loseBlocked,
    effectiveGoal,
    bmr,
    tdee,
    calMin,
    calMax,
    proteinMin: Math.round(weightKg * 1.6),
    proteinMax: Math.round(weightKg * 2.0),
    swRatio,
  };
}

/* ═══════════════════ CHARTS & BASE UI PRIMITIVES ═══════════════════ */

function buildSmoothSvgPath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");
}

function ModernAreaChart({ data = [], maxVal = 100, unit = "", color = "#3f6952", height = 180 }) {
  const w = 600;
  const h = height;
  const padL = 34;
  const padR = 16;
  const padT = 18;
  const padB = 26;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const safeMax = Math.max(maxVal || 10, ...data.map((d) => safeNum(d.value, 0)), 1);
  const coords = data.map((d, i) => {
    const val = Math.max(0, safeNum(d.value, 0));
    const x = data.length <= 1 ? padL + plotW / 2 : padL + (i / (data.length - 1)) * plotW;
    const y = padT + plotH - Math.min(1, val / safeMax) * plotH;
    return { ...d, x, y, val };
  });

  const linePath = buildSmoothSvgPath(coords);
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`
    : "";

  if (!data.length) return <div className="empty-chart">No data yet.</div>;

  return (
    <div className="modern-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="modern-svg-chart">
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padT + plotH * (1 - ratio);
          return (
            <g key={idx}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--line)" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="chart-axis-text">
                {Math.round(safeMax * ratio)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill={color} fillOpacity="0.14" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {coords.map((pt, i) => (
          <g key={pt.key || i}>
            <circle cx={pt.x} cy={pt.y} r="3.5" fill="var(--paper)" stroke={color} strokeWidth="2" />
            {(coords.length <= 8 || i % 2 === 0 || i === coords.length - 1) && (
              <text x={pt.x} y={h - 6} textAnchor="middle" className="chart-axis-text">
                {pt.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Button({ children, kind = "secondary", className = "", ...props }) {
  return (
    <button type="button" className={`btn ${kind} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "", ...props }) {
  return <section className={`card ${className}`.trim()} {...props}>{children}</section>;
}

function Heading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function Empty({ icon = "✳", title, description, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function Progress({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, safeNum(value, 0)));
  return <progress className="progress-meter" value={clamped} max={100} />;
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && typeof onClose === "function") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, detail, color }) {
  return (
    <Card className={`stat-card ${color || ""}`.trim()}>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </Card>
  );
}

function Accordion({ title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`accordion-box ${open ? "open" : ""}`}>
      <button type="button" className="accordion-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <strong>{title}</strong>
        <div className="accordion-right">
          {badge && <span className="status-pill complete">{badge}</span>}
          <span>{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function CountdownTimer({ defaultSeconds = 600, label = "Timer", onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const completeRef = useRef(onComplete);

  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);
  useEffect(() => { setSecondsLeft(defaultSeconds); setRunning(false); }, [defaultSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setSecondsLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false);
      triggerCompletionFeedback("success");
      if (typeof completeRef.current === "function") completeRef.current();
    }
  }, [secondsLeft, running]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="timer-strip">
      <div>
        <small className="eyebrow">{label}</small>
        <div className="timer-readout">{mins}:{secs}</div>
      </div>
      <div className="timer-btns">
        <Button kind="primary" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </Button>
        <Button onClick={() => { setRunning(false); setSecondsLeft(defaultSeconds); }}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function Heatmap90({ startDate, daysMap, profile, selectedDate, onSelectDate }) {
  const cells = useMemo(() => {
    const start = startDate || todayISO();
    return Array.from({ length: 90 }, (_, i) => {
      const iso = addDaysISO(start, i);
      const dayObj = daysMap && daysMap[iso];
      const score = dayObj ? calcDailyScore(dayObj, profile) : 0;
      let lvl = 0;
      if (score >= 75) lvl = 3;
      else if (score >= 50) lvl = 2;
      else if (score > 0) lvl = 1;
      return { dayNum: i + 1, iso, score, lvl, slip: Boolean(dayObj && dayObj.slip) };
    });
  }, [startDate, daysMap, profile]);

  return (
    <div className="heatmap-grid" role="group" aria-label="90-day comeback heatmap">
      {cells.map((cell) => (
        <button
          key={cell.iso}
          type="button"
          className={`heat-cell lvl-${cell.lvl} ${cell.slip ? "slip-day" : ""} ${selectedDate === cell.iso ? "selected" : ""}`}
          onClick={() => onSelectDate(cell.iso)}
          title={`Day ${cell.dayNum} (${cell.iso}): ${cell.score}/100`}
        >
          {cell.dayNum}
        </button>
      ))}
    </div>
  );
}

// Keep all exports intact (including existing data constants at top of your file)
export {
  STORAGE_KEY,
  QUEST_KEY,
  SCHEMA_VERSION,
  WEEKDAY_KEYS,
  todayISO,
  uid,
  parseLocalISO,
  addDaysISO,
  dayDiff,
  getDayIndex,
  getWeekdayShort,
  fmtDate,
  percent,
  safeNum,
  clamp,
  discreetText,
  triggerCompletionFeedback,
  DISCLAIMER_TEXT,
  QUOTES,
  MINIMUM_DAY_IDS,
  SCORED_CHECKS,
  LIFE_BASICS,
  CONTROL_LOOPS,
  FACE_HABITS,
  DEFAULT_SCHEDULE,
  MOOD_ACTIVITIES,
  URGE_STEPS,
  URGE_TRIGGERS,
  URGE_LOCATIONS,
  SOS_TEXT_TEMPLATES,
  ENV_CHECKLIST,
  HOME_WORKOUT_PLAN,
  YOGA_POSES,
  AVOID_IN_APT,
  GYM_WORKOUT_PLAN,
  GYM_DARR_TIPS,
  FRAME_BONE_CONTENT,
  CALCIUM_TABLE,
  PROTEIN_TABLE,
  DIET_PLANS,
  WEIGHT_GAIN_TIPS,
  FACE_SACH_CARD,
  FACE_AUDIT_QUESTIONS,
  FACE_ROUTINE_STEPS,
  FACE_SHAPES_GUIDE,
  SKIN_ROUTINES,
  WARDROBE_CAPSULE,
  WEEK1_QUICK_WINS,
  WEEKLY_GROOM_CHECKS,
  EXPOSURE_LADDER,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  ROADMAP_PHASES,
  QUESTS,
  HEALTH_TESTS,
  SUPPLEMENT_TIERS,
  createEmptyDay,
  createInitialData,
  readUnifiedStore,
  calcDailyScoreBreakdown,
  calcDailyScore,
  calcStreaks,
  calcBodyMetrics,
  buildSmoothSvgPath,
  ModernAreaChart,
  Icon,
  Button,
  Card,
  Heading,
  Empty,
  Progress,
  Field,
  Modal,
  Stat,
  Accordion,
  CountdownTimer,
  Heatmap90,
  NAV,
  DAILY_HOME_WORKOUTS,
  QUICK_PROTEIN_FOODS,
};