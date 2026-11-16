import React, { useState, useEffect } from "react";
import {
  todayISO,
  uid,
  safeNum,
  URGE_STEPS,
  URGE_TRIGGERS,
  URGE_LOCATIONS,
  Button,
  Field,
  Modal,
  CountdownTimer,
} from "../shared";

function UrgeSOSModal({ setData, today, dm, updateDay, onClose, notify }) {
  const [mode, setMode] = useState("sos"); // sos | slip
  const [trigger, setTrigger] = useState(URGE_TRIGGERS[0]);
  const [location, setLocation] = useState(URGE_LOCATIONS[0]);
  const [breathTick, setBreathTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setBreathTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = (() => {
    const c = breathTick % 14;
    return c < 4 ? "Inhale (4s)" : c < 8 ? "Hold (4s)" : "Slow Exhale (6s)";
  })();

  const saveOutcome = (isSlip) => {
    const entry = {
      id: uid(),
      ts: Date.now(),
      trigger,
      location,
      before: 8,
      after: isSlip ? 8 : 2,
      slip: isSlip,
    };
    setData((old) => ({ ...old, urges: [entry, ...(old.urges || [])] }));
    if (isSlip) {
      updateDay(today, (prev) => ({
        ...prev,
        slip: true,
        c: { ...(prev.c || {}), noPorn: false },
      }));
      notify("Reset logged honestly. Start fresh right now.");
    } else {
      notify("Urge surfed! Streak protected.");
    }
    onClose();
  };

  return (
    <Modal title={dm("🛡 10-Minute Urge SOS")} onClose={onClose}>
      <div className="record-form">
        <div className="tabs jsx-a0d4a037">
          <button
            type="button"
            className={mode === "sos" ? "selected" : ""}
            onClick={() => setMode("sos")}
          >
            Ride Out the Wave
          </button>
          <button
            type="button"
            className={mode === "slip" ? "selected" : ""}
            onClick={() => setMode("slip")}
          >
            {dm("Log a Reset")}
          </button>
        </div>

        {mode === "sos" ? (
          <div className="stack-col">
            <CountdownTimer defaultSeconds={600} label="10-Minute Wave Timer" />
            <div className="breath-box">
              <div className="breath-orb">
                <strong>{phase}</strong>
                <small>4-4-6 Calming Rhythm</small>
              </div>
            </div>
            <div className="habit-list">
              {URGE_STEPS.slice(0, 4).map((s) => (
                <div className="habit-row" key={s.step}>
                  <span className="status-pill complete">0{s.step}</span>
                  <div className="habit-info">
                    <strong>{dm(s.title)}</strong>
                    <small>{dm(s.detail)}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="form-grid">
              <Field label="Trigger">
                <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                  {URGE_TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Location">
                <select value={location} onChange={(e) => setLocation(e.target.value)}>
                  {URGE_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div className="form-actions">
              <Button onClick={onClose}>Close</Button>
              <Button kind="primary" onClick={() => saveOutcome(false)}>
                ✓ Urge Passed (Save)
              </Button>
            </div>
          </div>
        ) : (
          <div className="stack-col">
            <p className="muted-text">
              One slip never erases your progress. Leave the room, drink water, and move on.
            </p>
            <Field label="Trigger">
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                {URGE_TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div className="form-actions">
              <Button onClick={onClose}>Cancel</Button>
              <Button kind="primary" onClick={() => saveOutcome(true)}>
                Log Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile.name || "Bhai",
    startDate: profile.startDate || todayISO(),
    heightCm: profile.heightCm || 172,
    weightKg: profile.weightKg || 56,
    discreet: Boolean(profile.discreet),
    steps: profile.targets?.steps || 8000,
    waterL: profile.targets?.waterL || 3,
    screenH: profile.targets?.screenH || 3,
  });

  return (
    <Modal title="Profile & 90-Day Setup" onClose={onClose}>
      <form
        className="record-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            name: form.name.trim() || "Bhai",
            startDate: form.startDate,
            heightCm: safeNum(form.heightCm, 172),
            weightKg: safeNum(form.weightKg, 56),
            discreet: form.discreet,
            targets: {
              steps: safeNum(form.steps, 8000),
              waterL: safeNum(form.waterL, 3),
              screenH: safeNum(form.screenH, 3),
            },
          });
        }}
      >
        <div className="form-grid">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="90-Day Start Date">
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="Height (cm)">
            <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
          </Field>
          <Field label="Steps Target">
            <input type="number" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          </Field>
          <Field label="Water Target (L)">
            <input type="number" step="0.5" value={form.waterL} onChange={(e) => setForm({ ...form, waterL: e.target.value })} />
          </Field>
        </div>
        <label className="archive-toggle jsx-dffc4db2">
          <input
            type="checkbox"
            checked={form.discreet}
            onChange={(e) => setForm({ ...form, discreet: e.target.checked })}
          />{" "}
          Enable Discreet Mode
        </label>
        <div className="form-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function LifestyleLogModal({ onClose }) {
  useEffect(() => { onClose(); }, [onClose]);
  return null;
}

function RecordForm({ title, fields, initial, submitLabel, onCancel, onSubmit }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.defaultValue ?? ""]))
  );
  const [error, setError] = useState("");
  const change = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <Modal title={title} onClose={onCancel}>
      <form
        className="record-form"
        onSubmit={(e) => {
          e.preventDefault();
          for (const f of fields) {
            if (f.required && !String(values[f.name] ?? "").trim()) {
              setError(`${f.label} is required.`);
              return;
            }
          }
          setError("");
          onSubmit(values);
        }}
      >
        <div className="form-grid">
          {fields.map((f) => (
            <Field key={f.name} label={f.label} hint={f.hint}>
              {f.type === "select" ? (
                <select required={f.required} value={values[f.name]} onChange={(e) => change(f.name, e.target.value)}>
                  {(f.options || []).map(([v, l]) => <option value={v} key={v}>{l}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea required={f.required} rows={3} value={values[f.name]} onChange={(e) => change(f.name, e.target.value)} />
              ) : (
                <input
                  required={f.required}
                  type={f.type || "text"}
                  step={f.type === "number" ? "any" : undefined}
                  value={values[f.name]}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => change(f.name, e.target.value)}
                />
              )}
            </Field>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button kind="primary" type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

export { UrgeSOSModal, ProfileModal, LifestyleLogModal, RecordForm };