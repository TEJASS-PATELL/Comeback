import { useRef } from "react";
import {
  getDayIndex,
  QUESTS,
  Button,
  Card,
  Heading,
  Progress,
} from "../shared";
import { getClassForLevel, getLevelProgress } from "../progression.js";

function QuestPage({ data, game, setGame, today, notify }) {
  const claimLockRef = useRef(new Set());

  const startDate = (data.profile && data.profile.startDate) || today;
  const dayNumber = getDayIndex(startDate, today);
  const quest = QUESTS[(dayNumber - 1) % QUESTS.length];
  const completedToday = Boolean(game.completed && game.completed[today]);
  const completedSideQuests = Array.isArray(game.sideCompleted?.[today])
    ? game.sideCompleted[today]
    : [];
  const xp = Number(game.xp) || 0;
  const levelProgress = getLevelProgress(xp);
  const currentClass = getClassForLevel(levelProgress.level);
  const completedDays = Object.keys(game.days || {}).filter(
    (d) => game.days[d]
  ).length;

  const completeQuest = (qItem = quest) => {
    const isMain = qItem.id === quest.id;
    const claimKey = `${today}:${qItem.id}`;
    if (completedToday && isMain) {
      notify("Main quest already claimed today");
      return;
    }
    if (
      claimLockRef.current.has(claimKey) ||
      (!isMain && completedSideQuests.includes(qItem.id))
    ) {
      notify("Already claimed today");
      return;
    }
    claimLockRef.current.add(claimKey);

    setGame((prev) => {
      const previousSideQuests =
        prev.sideCompleted && typeof prev.sideCompleted === "object"
          ? prev.sideCompleted
          : {};
      const previousSideList = Array.isArray(previousSideQuests[today])
        ? previousSideQuests[today]
        : [];
      return {
        ...prev,
        xp: (Number(prev.xp) || 0) + qItem.xp,
        completed: isMain
          ? { ...(prev.completed || {}), [today]: qItem.id }
          : prev.completed,
        days: { ...(prev.days || {}), [today]: true },
        sideCompleted: isMain
          ? previousSideQuests
          : {
              ...previousSideQuests,
              [today]: [...previousSideList, qItem.id],
            },
      };
    });
    notify(`+${qItem.xp} XP · ${qItem.title}`);
  };

  return (
    <>
      <Heading
        title="Daily Quests & Rank"
        description="Real-world missions that earn XP and level up your rank."
        action={
          <Button
            onClick={() => {
              if (window.confirm("Reset Quest XP and rank?")) {
                setGame({
                  xp: 0,
                  completed: {},
                  days: {},
                  sideCompleted: {},
                  dailyWinRewards: {},
                  levelRewards: {},
                });
                notify("XP reset");
              }
            }}
          >
            Reset XP
          </Button>
        }
      />

      {/* COMPACT RANK & LEVEL BANNER */}
      <div className="lifestyle-banner">
        <div>
          <span className="eyebrow">
            {currentClass.rank}-RANK · {currentClass.title.toUpperCase()} · LEVEL {levelProgress.level}
          </span>
          <h2>
            {xp.toLocaleString()} Total XP <em>({completedDays} active days)</em>
          </h2>
          <p>
            {(
              levelProgress.levelRequirementXP - levelProgress.levelProgressXP
            ).toLocaleString()}{" "}
            XP to Level {levelProgress.level + 1}
          </p>
          <div className="jsx-07db415b">
            <Progress value={levelProgress.progressPercent} />
          </div>
        </div>
        <div className="lifestyle-orbit">
          <span>RANK</span>
          <i>{currentClass.rank}</i>
          <b>LVL {levelProgress.level}</b>
        </div>
      </div>

      {/* TODAY'S MAIN QUEST */}
      <Card className="jsx-2f23af6b">
        <div className="section-head">
          <div>
            <div className="eyebrow">TODAY&apos;S MAIN MISSION</div>
            <h2>{quest.title}</h2>
            <p>{quest.detail}</p>
          </div>
          <span className="status-pill complete">+{quest.xp} XP</span>
        </div>

        <Button
          kind="primary"
          disabled={completedToday}
          onClick={() => completeQuest(quest)}
        >
          {completedToday
            ? "✓ Completed today"
            : `${quest.action} (+${quest.xp} XP)`}
        </Button>
      </Card>

      {/* SIDE QUESTS */}
      <Card>
        <div className="section-head">
          <div>
            <div className="eyebrow">SIDE QUESTS</div>
            <h2>Quick bonus actions</h2>
          </div>
        </div>
        <div className="record-grid">
          {QUESTS.filter((q) => q.id !== quest.id).map((item) => {
            const claimed = completedSideQuests.includes(item.id);
            return (
              <div className="side-quest-card" key={item.id}>
                <span className="record-symbol sage">{item.icon}</span>
                <div className="habit-info">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <Button disabled={claimed} onClick={() => completeQuest(item)}>
                  {claimed ? "✓ Claimed" : `+${item.xp} XP`}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

export { QuestPage };