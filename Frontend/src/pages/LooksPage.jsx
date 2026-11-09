import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
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
  discreetText,
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
  ModernDonutChart,
  ModernRadarChart,
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
} from "../shared";

const FIT_RULES_CHECKLIST = [
  {
    id: "fit-seam",
    title: "Shoulder seam sits exactly on the outer shoulder bone",
    sub: "Drooping seams make a slim frame look narrower and slouchy.",
  },
  {
    id: "fit-sleeve",
    title: "T-shirt sleeves hug mid-bicep (not flaring out like wings)",
    sub: "Roll the sleeve cuff once if it flares out.",
  },
  {
    id: "fit-length",
    title: "Shirt / T-shirt hem ends mid-fly (around hip bone)",
    sub: "Overly long tees make legs look shorter and torso thinner.",
  },
  {
    id: "fit-trouser",
    title: "Straight or slim-tapered trousers with a slight half-break on shoes",
    sub: "Avoid ultra-skinny jeans on thin legs; straight/tapered builds proportion.",
  },
];

const HEIGHT_DAILY_SESSIONS = [
  {
    id: "sess-am",
    title: "Session 1: Morning 177 cm Barefoot Lock (Subah uthte hi · 8–10 mins)",
    sub: "Bar Dead Hang (3×40s) + Wall Crown Alignment (3×30s) + Glute-Pelvic Lock (3×15) + 500ml Lemon/Amla Water.",
  },
  {
    id: "sess-mid",
    title: "Session 2: Mid-Day Anti-Shrinkage Reset (Dopahar 4 hr sitting ke baad · 4 mins)",
    sub: "Doorframe Traction (2×35s) + Standing APT Pelvic Tuck (3×25s) to prevent daytime disc loss.",
  },
  {
    id: "sess-pm",
    title: "Session 3: Evening 5-Zone Deep Uncoiling (Sham workout time · 20–22 mins)",
    sub: "All 10 Barefoot Steps: Dead Hangs, Couch/Psoas APT Release, Towel Thoracic Fulcrum, Y-T-W & Masai Jumps.",
  },
  {
    id: "sess-night",
    title: "Session 4: Night Disc Super-Swelling (Sone se theek pehle · 5 mins)",
    sub: "90/90 Calves-on-Chair Traction (5 min) + Pillow under knees all night for maximum overnight disc expansion.",
  },
];

const HEIGHT_DECOMPRESSION_STEPS = [
  {
    id: "ht-1",
    name: "1. Zone-1: Passive + Active Bar Dead Hang (23-Disc Traction)",
    durationSec: 45,
    frequency: "Din mein 3 baar (Subah, Dopahar, Sham)",
    reps: "4 sets × 40–45 sec (Rest: 40 sec)",
    gainTag: "+1.0 to 1.5 cm Barefoot (Disc Expansion)",
    instruction:
      "Pull-up bar ko shoulder-width pakad kar shoulders ko dhila chhod do. Pet andar kheench kar hips aur lower back ko bhaari latakne do. Har set ke baad zameen par koodna mana hai—step down aaram se karo taaki 23 spinal discs khuli rahein.",
  },
  {
    id: "ht-2",
    name: "2. Zone-2: Deep Kneeling Couch / Psoas Release (APT Pelvic Fix)",
    durationSec: 60,
    frequency: "Din mein 2 baar (Subah aur Sham)",
    reps: "3 sets × 45 sec / leg (Rest: 20 sec)",
    gainTag: "+0.8 to 1.2 cm Barefoot (Unfolds Lumbar S-Curve)",
    instruction:
      "22 saal bina sports/gym ke rehne se hip-flexor (Psoas) chota ho jata hai aur pelvis aage jhuk kar 1+ cm barefoot height chura leta hai. Ek ghutna zameen par rakho, belt-buckle ko naabhi ki taraf upar tuck karo, glutes 90% squeeze karo aur front hip ko kholo.",
  },
  {
    id: "ht-3",
    name: "3. Zone-3: Rolled-Towel Thoracic Fulcrum + Y-Reach",
    durationSec: 60,
    frequency: "Din mein 2 baar (Dopahar aur Sham)",
    reps: "3 sets × 60 sec lie-down hold",
    gainTag: "+0.5 to 0.8 cm Barefoot (Upper-Back Kyphosis Fix)",
    instruction:
      "Ek मोटी towel ko tight roll karke cylinder banao. Use upper-mid back (shoulder blades ke neeche) rakh kar let jao. Hips zameen par rakho aur dono haath sir ke piche le jakar ribcage ko chhat ki taraf kholo.",
  },
  {
    id: "ht-4",
    name: "4. Zone-4: Wall Suboccipital Chin-Tuck & Crown Traction",
    durationSec: 60,
    frequency: "Din mein 3 baar (Subah, Dopahar, Sham)",
    reps: "4 sets × 30 sec hold (Rest: 15 sec)",
    gainTag: "+0.4 to 0.6 cm Barefoot (Fixes Forward Neck)",
    instruction:
      "Nange pair deewar se heels, glutes, shoulder blades aur sir ka pichla hissa chipkao. Chin ko andar tuck karo aur sir ke crown (choti wale hisse) ko chhat ki taraf 1 inch upar kheench kar rakho.",
  },
  {
    id: "ht-5",
    name: "5. Zone-5: Cobra to Downward-Dog Pedal (Hamstring & Knee Un-bend)",
    durationSec: 60,
    frequency: "Din mein 2 baar (Subah aur Sham)",
    reps: "3 sets × 8 slow waves (60 sec)",
    gainTag: "+0.3 to 0.4 cm Barefoot (Full Leg Extension)",
    instruction:
      "Tight hamstrings aur calves ki wajah se khade hote waqt ghutne 2–3 degree mude rehte hain. Cobra pose se chest uthao, fir hips upar push karke Downward Dog mein heels ko zameen me dabao taaki pair piche se 100% seedhe khulein.",
  },
  {
    id: "ht-6",
    name: "6. Zone-5: Barefoot 'Short-Foot' Plantar Arch Lift",
    durationSec: 45,
    frequency: "Din mein 2 baar (Subah aur Sham)",
    reps: "3 sets × 20 sec hold",
    gainTag: "+0.2 to 0.3 cm Barefoot (Lifts Collapsed Foot Arch)",
    instruction:
      "Nange pair khade hokar bina ungliyan mode apne pair ke talwe ke beech wale arch (bridge) ko upar uthao aur ankle ko seedha align karo. Flat feet sudharne se turant 2–3 mm barefoot height badhti hai.",
  },
  {
    id: "ht-7",
    name: "7. Prone Y-T-W Scapular Raises (Upper-Spine Pillar Lock)",
    durationSec: 60,
    frequency: "Din mein 1 baar (Sham Workout)",
    reps: "3 sets × 10 reps each (Y, T, W)",
    gainTag: "Prevents Upper-Back Slouching All Day",
    instruction:
      "Pet ke bal let kar chest halka uthao aur haatho se hawa mein Y, T aur W shape banao, shoulder blades ko aapas me squeeze karo. Ye kamzor upper-back muscles ko strong banata hai taaki spine wapas na jhuke.",
  },
  {
    id: "ht-8",
    name: "8. Dead-Bug + Glute-Bridge Core Bracing (Lumbar Pillar Lock)",
    durationSec: 60,
    frequency: "Din mein 1 baar (Sham Workout)",
    reps: "3 sets × 12 Dead-Bugs + 15 Glute Bridges",
    gainTag: "Locks +1.5 cm Morning Height Till Night",
    instruction:
      "Peeth ke bal let kar lower back ko zameen me زور se press karo (zero gap) aur alternate haath-pair lamba failao. Strong deep core (TVA) aur glutes aapke pelvis ko 24/7 seedha lock rakhte hain.",
  },
  {
    id: "ht-9",
    name: "9. Barefoot Masai Pogo Jumps (On Mat · Bone & Disc Pump)",
    durationSec: 45,
    frequency: "Din mein 1 baar (Sham · Empty Stomach)",
    reps: "4 sets × 30 sec jumps (Rest: 30 sec)",
    gainTag: "Stimulates Spinal Ring Apophyses & Discs",
    instruction:
      "Yoga mat par nange pair panjo (balls of feet) par vertical jumps karo aur hawa me sir ko chhat ki taraf kheench kar rakho. Cyclic loading aur unloading se spinal discs me nutrients pump hote hain.",
  },
  {
    id: "ht-10",
    name: "10. 90/90 Nighttime Disc Super-Hydration Traction",
    durationSec: 90,
    frequency: "Roz raat sone se theek pehle",
    reps: "5 min 90/90 traction + Sleep with knee pillow",
    gainTag: "Maxes Overnight +1.6 cm Disc Re-Swelling",
    instruction:
      "Sone se pehle 5 min peeth ke bal zameen/bed par let kar pindliyon (calves) ko chair ya takiyo ke dher par 90-degree rakho. Isse lower back flat ho jati hai aur raat bhar 23 discs paani + collagen sokh kar phoolti hain.",
  },
];

const HEIGHT_DIET_ITEMS = [
  {
    id: "hd-water",
    meal: "7:00 AM · Disc Rehydration & Collagen Catalyst",
    title: "500 ml Warm Water + 1 Amla / ½ Lemon + Pinch Pink Salt",
    nutrients: "High Vitamin C + Electrolytes (Builds Type-II Disc Collagen)",
    detail:
      "Spinal discs 80% paani aur Type-II Collagen se banti hain. Subah Vitamin C lene se discs ki cartilage gaddi moti aur elastic banti hai.",
  },
  {
    id: "hd-breakfast",
    meal: "8:30 AM · Catch-Up Egg & Calcium Breakfast",
    title: "3 Whole Boiled Eggs + 2 Roti/Oats + 150g Dahi + 1 tsp White Til (Sesame)",
    nutrients: "~28g Complete Protein · Vitamin D · 350mg Calcium · B12",
    detail:
      "22 saal ki protein kami ko poora karne ke liye 3 whole eggs sabse best hain. Safed Til aur Dahi haddiyon ko high-absorption calcium dete hain.",
  },
  {
    id: "hd-lunch",
    meal: "1:30 PM · IGF-1 & Amino-Acid Complete Lunch",
    title: "1.5 Katori Gaadhi Dal + Rice/Roti + 100g Paneer (or 45g Soya) + Salad",
    nutrients: "~35g Protein · High Lysine & Arginine · Zinc",
    detail:
      "Dal + Chawal + Paneer milkar Lysine aur Arginine dete hain jo tissue repair aur spinal muscle thickness ko tezi se badhate hain.",
  },
  {
    id: "hd-preworkout",
    meal: "5:00 PM · Pre-Decompression Fuel",
    title: "1 Banana + 1 Mutthi Bhuna Chana + 2 Boiled Egg Whites",
    nutrients: "~14g Protein · Potassium · Zero-Bloat Energy",
    detail:
      "Sham ke 20-min 5-Zone Barefoot Uncoiling session aur Dead Hangs ke liye grip aur core endurance deta hai.",
  },
  {
    id: "hd-dinner",
    meal: "8:30 PM · Bone-Binding & Postural Muscle Dinner",
    title: "2 Whole Eggs Curry/Bhurji (or 100g Paneer) + 2–3 Roti + Green Leafy Sabzi",
    nutrients: "~25g Protein · Vitamin K2 · Magnesium · Iron",
    detail:
      "Hari sabziyon ka Vitamin K2 aur Eggs ka protein calcium ko spinal vertebrae aur posture muscles mein lock karta hai.",
  },
  {
    id: "hd-bedtime",
    meal: "10:30 PM · Deep-Sleep GH & Cartilage Repair",
    title: "250 ml Warm Milk + ¼ tsp Haldi + Pinch Black Pepper + 15 min Morning Sunlight",
    nutrients: "~8g Slow Casein Protein · 300mg Calcium · Vitamin D3 Sync",
    detail:
      "Raat 11 PM se 2 AM ke beech Deep Sleep mein Growth Hormone (GH) release hokar decompressed discs ko repair aur thick karta hai.",
  },
];

const BAREFOOT_RETENTION_HABITS = [
  {
    id: "br-string",
    title: "The 'Invisible Crown String' Barefoot Walking Cue",
    sub: "Ghar mein nange pair chalte waqt hamesha feel karo ki ek dhaga aapke sir ke upari hisse (crown) ko chhat ki taraf kheench raha hai (+0.6 cm instant).",
  },
  {
    id: "br-glute",
    title: "20% Glute & Lower-Ab Engagement While Standing",
    sub: "Jab bhi khade ho, pet ko dheela mat chhodo—belt buckle ko halka upar tuck rakho taaki kamar wapas APT (arch) mein na jaye (+1.0 cm locked).",
  },
  {
    id: "br-study",
    title: "Eye-Level Laptop/Book Stand + 45-Min Micro-Hang Rule",
    sub: "Jhuk kar padhne se 1 ghante mein 0.8 cm height dab jati hai. Screen aankhon ke level par rakho aur har 45 min baad 20 sec body ko upar stretch karo.",
  },
  {
    id: "br-sleep",
    title: "Zero Stomach-Sleeping + Thin/No Pillow Under Head",
    sub: "Mota takiya gardan ko aage mod deta hai (Tech-Neck). Patla takiya sir ke neeche aur 1 takiya ghutno ke neeche rakh kar peeth ke bal soyein.",
  },
  {
    id: "br-hydration",
    title: "3.5 Liters Daily Water + Zero Heavy Overhead Axial Pressing",
    sub: "Dehydration se spinal discs pichak jati hain. Din bhar 3.5L paani piyo aur sar ke upar bhaari barbell rakh kar spine ko compress mat karo.",
  },
];

/* ============================================================================
   NEW HAIR GROWTH, ANTI-DANDRUFF, ANTI-HAIRFALL & THICKNESS CONSTANTS
   ============================================================================ */

const HAIR_WEEKLY_SCHEDULE = [
  {
    id: "hw-keto",
    title: "Mon · Wed · Fri: Ketoconazole 2% + ZPTO 1% Wash (5-Min Contact Rule)",
    sub: "Gile scalp par jhaag bana kar 5 minute chhodna zaroori hai taaki Malassezia fungus khatam ho. Fir thande/normal paani se dho lein.",
  },
  {
    id: "hw-no-overnight-oil",
    title: "Zero Overnight Heavy Oiling Rule (Stops Fungal Dandruff Feeding)",
    sub: "Dandruff fungus tel (sebum/oil) khata hai. Raat bhar tel kabhi mat lagao—sirf wash se 30–45 min pehle light Rosemary + Jojoba/Coconut oil lagao.",
  },
  {
    id: "hw-mild",
    title: "Tue · Sat: Mild Sulfate-Free Wash (After Sweat / Workout)",
    sub: "Pasina aur dhool jado ko block karte hain. Non-medicated din par gentle sulfate-free shampoo se 60 sec wash karo.",
  },
  {
    id: "hw-nightly",
    title: "Every Night: 4-Min Pinch Massage + Oil-Free Rosemary / 3% Redensyl Serum",
    sub: "Dry scalp par 4 min fingertips se scalp skin ko move karo aur 1 ml water-based hair growth serum/Rosemary water lagao.",
  },
  {
    id: "hw-helmet",
    title: "Daily Protection: Cool Water Rinse + Cotton Bandana Inside Helmet",
    sub: "Garam paani se baal kabhi mat dho. Helmet ke andar clean cotton handkerchief/balaclava pehno aur gile baalon me kanghi mat karo.",
  },
];

const HAIR_GROWTH_STEPS = [
  {
    id: "hg-1",
    name: "1. 4-Min Subgaleal Pinch & Stretch Scalp Massage (Thickness Booster)",
    durationSec: 240,
    frequency: "Roz Sham ya Raat (Dry Clean Scalp Par)",
    reps: "4 mins continuous (Fingertips only, no nails)",
    gainTag: "+15–20% Hair Shaft Thickness (Dermal Papilla Stretch)",
    instruction:
      "Ungliyon ko baalon ke andar daal kar scalp ki chamdi (skin) ko haddi ke upar aage-piche hilaon aur halka pinch karo (ragadna nahi hai, skin move honi chahiye). Crown, temples aur hairline par 4 minute tak karne se blood flow 2x hota hai aur patle baal mote (thick) bante hain.",
  },
  {
    id: "hg-2",
    name: "2. Ketoconazole 2% Antifungal 5-Minute Contact Timer",
    durationSec: 300,
    frequency: "Hafte mein 2–3 baar (Mon, Wed, Fri)",
    reps: "5 Mins Lather Hold on Scalp",
    gainTag: "Eliminates Dandruff & Fungal Hairfall in 14–21 Days",
    instruction:
      "90% log Ketoconazole shampoo laga kar 30 second me dho dete hain isliye dandruff wapas aa jata hai. Shampoo ko scalp par laga kar ye 5-minute timer chalu karo. 5 min baad thande paani se rinse karo.",
  },
  {
    id: "hg-3",
    name: "3. Nightly Oil-Free Growth Activator (Rosemary Water / 3% Redensyl-Capixyl)",
    durationSec: 90,
    frequency: "Roz Raat Sone Se Pehle",
    reps: "1 ml Dropper or 6–8 Sprays on Roots",
    gainTag: "Extends Anagen (Length Growth) Phase",
    instruction:
      "Kyunki oil dandruff badhata hai, raat ko water-based 3% Redensyl + Capixyl + Procapil (RCP) serum ya ghar par ubaala hua Rosemary + Clove water spray jado me lagao aur 60 sec tap-massage karo. Ye dormant follicles ko jagata hai.",
  },
  {
    id: "hg-4",
    name: "4. Pre-Wash 40-Min Rosemary + Carrier Oil Conditioning (No Overnight Oil)",
    durationSec: 120,
    frequency: "Hafte mein 2 baar (Shampoo se 40 min pehle)",
    reps: "1 tbsp Jojoba/Argan/Light Coconut Oil + 4 drops Rosemary Oil",
    gainTag: "Protects Hair Shaft Without Feeding Dandruff",
    instruction:
      "Shampoo karne se theek 35–45 minute pehle baalon ki length aur roots par halka Rosemary blend lagao. 45 min baad shampoo se dho lo—isse baal soft, shiny aur lambe honge bina scalp pores block kiye.",
  },
  {
    id: "hg-5",
    name: "5. Zero-Breakage Drying & Wide-Tooth Wooden Combing Protocol",
    durationSec: 60,
    frequency: "Har Hair Wash Ke Baad",
    reps: "Cotton T-Shirt Dab-Dry + Comb at 80% Dry",
    gainTag: "Stops 70% Mechanical Hair Breakage",
    instruction:
      "Gile baal sabse kamzor hote hain. Towel se jhatak kar ya ragad kar kabhi mat sukhao—purani soft cotton T-shirt se halka dabao. Jab baal 80% sukh jayein tabhi wide-tooth wooden comb se neeche se upar suljhao.",
  },
  {
    id: "hg-6",
    name: "6. Neck & Occipital Artery De-Tensioning Stretch (Scalp Blood Flow)",
    durationSec: 60,
    frequency: "Roz Dopahar aur Raat",
    reps: "30 sec / side neck release + 10 deep breaths",
    gainTag: "Opens Blood & Oxygen Supply to Top of Scalp",
    instruction:
      "Tight gardan aur trapezius muscles scalp tak jane wali khoon ki nason (occipital & temporal arteries) ko dabate hain. Kandhe neeche rakh kar gardan ko 30 sec daayein aur 30 sec baayein tilt karo taaki scalp tak poora nutrition pahunche.",
  },
];

const HAIR_DIET_ITEMS = [
  {
    id: "hrd-morning",
    meal: "7:00 AM · Natural DHT-Blocker & Ferritin Shot",
    title: "1 Raw Amla (or Juice) + 1 tsp Pumpkin Seeds + 1 tsp Flaxseeds + 5 Soaked Black Raisins",
    nutrients: "Zinc · Beta-Sitosterol (DHT Blocker) · Iron · Vitamin C",
    detail:
      "Kaddu ke beej (Pumpkin seeds) natural DHT blocker hain jo hairline patli hone se rokte hain. Amla + Kali Kishmish khoon me Ferritin (Iron storage) badha kar hairfall jad se rokte hain.",
  },
  {
    id: "hrd-breakfast",
    meal: "8:30 AM · Keratin, Biotin & B12 Power Breakfast",
    title: "3 Whole Boiled Eggs + 7–8 Raw Kadi Patta (Curry Leaves) + 150g Dahi + 2 Walnuts",
    nutrients: "~24g Keratin Protein · High Biotin (B7) · L-Cysteine · Vitamin B12",
    detail:
      "22 saal ki veg low-protein diet se jo B12 aur Cysteine kam hua tha, 3 Boiled Eggs use sabse tezi se bhar kar patle baalon ko mota (thick) banate hain. Kadi patta baalon ko kaala aur strong rakhta hai.",
  },
  {
    id: "hrd-lunch",
    meal: "1:30 PM · L-Lysine & Iron-Lock Desi Lunch",
    title: "1.5 Katori Gaadhi Dal + Palak/Methi Sabzi + 100g Paneer + ½ Lemon Squeezed on Dal",
    nutrients: "L-Lysine + Non-Heme Iron + Folate (3x Absorption with Lemon)",
    detail:
      "Bina L-Lysine (Dal/Paneer) aur Vitamin C (Nimbu) ke body Palak/Dal ka Iron absorb nahi kar paati. Dal par nimbu nichod kar khane se hair roots ko 3 guna zyada oxygen aur iron milta hai.",
  },
  {
    id: "hrd-snack",
    meal: "5:00 PM · Melanin & Follicle Mineral Snack",
    title: "1 Mutthi Bhuna Chana + 1 tsp Black/White Til (Sesame) + 2 Boiled Egg Whites",
    nutrients: "Copper · Zinc · Selenium · Clean Albumin Protein",
    detail:
      "Til (Sesame) aur Chana mein Copper aur Zinc hota hai jo baalon ki jadon ko majboot karta hai aur patle/bejaan baalon mein shine lata hai.",
  },
  {
    id: "hrd-dinner",
    meal: "8:30 PM · Sulfur Disulfide-Bond Dinner",
    title: "2 Whole Eggs Curry/Bhurji (or 45g Soya / 100g Paneer) + 2 Roti + Green Sabzi",
    nutrients: "Methionine · Cysteine · Vitamin E · Iron",
    detail:
      "Baalon ki motaai aur lambaai Sulfur amino acids (Methionine & Cysteine) ke disulfide bonds se banti hai—roz 5 total eggs (3 AM + 2 PM) aapka daily Keratin target 100% poora karte hain.",
  },
  {
    id: "hrd-night",
    meal: "10:30 PM · Anagen Phase Vitamin D3 & Sleep Sync",
    title: "250 ml Warm Haldi Milk + 15 Min Morning Sunlight (or Weekly D3 Check)",
    nutrients: "Vitamin D3 · Calcium · Melatonin (7.5–8 hrs Deep Sleep)",
    detail:
      "Vitamin D3 kam hone par hair follicles 'resting phase' mein fass jate hain. Dhoop/D3 aur raat ki 8 ghante ki neend naye baal ugane (Anagen initiation) ke liye mandatory hai.",
  },
];

function parseAvgRupeeRange(str = "") {
  const nums = String(str)
    .replace(/,/g, "")
    .match(/\d+/g);
  if (!nums || !nums.length) return 800;
  if (nums.length === 1) return Number(nums[0]);
  return Math.round((Number(nums[0]) + Number(nums[1])) / 2);
}

function LooksPage({ data, setData, notify }) {
  const [subTab, setSubTab] = useState("face"); // face | height | hair | skin | groom
  const [doneRoutineSteps, setDoneRoutineSteps] = useState({});
  const [doneHeightSteps, setDoneHeightSteps] = useState({});
  const [doneHairSteps, setDoneHairSteps] = useState({});
  const [budgetTier, setBudgetTier] = useState("low"); // low | mid
  const [shapeQuiz, setShapeQuiz] = useState({
    lengthVsWidth: "balanced",
    jawShape: "rounded",
    foreheadVsJaw: "equal",
  });

  /* 100% Barefoot 5-Zone Reclaimable Height Estimator State (No Shoes/Slippers) */
  const [heightAudit, setHeightAudit] = useState({
    sittingHours: "high", // low | med | high (Zone 1: 23 Discs)
    aptLevel: "high", // none | moderate | high (Zone 2: Pelvic Tilt)
    thoracicRound: "high", // low | high (Zone 3: Upper Back & Ribcage)
    neckSlouch: "yes", // no | yes (Zone 4: Cervical Tech-Neck)
    untrainedHistory: "yes", // yes | no (Zone 5: Knee-Hamstring & Foot Arch + Catch-up Nutrition)
  });

  /* Hairfall, Dandruff & Thickness Diagnostic State */
  const [hairAudit, setHairAudit] = useState({
    dandruffType: "oilyFlakes", // none | dryFlakes | oilyFlakes
    dailyShedding: "high", // normal | moderate | high
    oilingHabit: "overnight", // none | prewash | overnight
    dietHistory: "lowProtein", // lowProtein | optimal
    waterAndHelmet: "yes", // yes | no
  });

  const today = todayISO();
  const p = data.profile || {};
  const groom = data.groom || {};
  const auditAnswers = (data.faceAudit && data.faceAudit.answers) || {};
  const todayDayObj = (data.days && data.days[today]) || createEmptyDay();

  const [heightForm, setHeightForm] = useState({
    morningCm:
      groom.morningHeightCm || +(safeNum(p.heightCm, 173) + 1.8).toFixed(1),
    eveningCm: groom.eveningHeightCm || safeNum(p.heightCm, 173),
  });

  const setGroom = (patch) =>
    setData((old) => ({
      ...old,
      groom: { ...(old.groom || {}), ...patch },
    }));

  const handleAuditChange = (qId, val) => {
    setData((old) => ({
      ...old,
      faceAudit: {
        answers: {
          ...((old.faceAudit && old.faceAudit.answers) || {}),
          [qId]: val,
        },
        updatedAt: todayISO(),
      },
    }));
  };

  const selectedSkinType = SKIN_ROUTINES[groom.skinType]
    ? groom.skinType
    : "oily";
  const selectedFaceShape = FACE_SHAPES_GUIDE[groom.faceShape]
    ? groom.faceShape
    : "oval";

  /* Face Audit Analytics & Dentist Alert */
  const auditSummary = useMemo(() => {
    let healthyCount = 0;
    let answeredCount = 0;
    const dentistAlerts = [];

    FACE_AUDIT_QUESTIONS.forEach((q) => {
      const ans = auditAnswers[q.id];
      if (ans) {
        answeredCount += 1;
        if (ans === q.options[0].value) {
          healthyCount += 1;
        }
        if (q.dentistOn && ans === q.dentistOn) {
          dentistAlerts.push(q);
        }
      }
    });

    return { healthyCount, answeredCount, dentistAlerts };
  }, [auditAnswers]);

  /* Sync Face Routine with Daily Tracker */
  const isFaceRoutineLoggedToday = Boolean(
    todayDayObj.face && todayDayObj.face.faceRoutineDone
  );

  const toggleFaceStepDone = (stepId) => {
    const next = { ...doneRoutineSteps, [stepId]: !doneRoutineSteps[stepId] };
    setDoneRoutineSteps(next);
    const completedCount = Object.values(next).filter(Boolean).length;
    if (completedCount >= FACE_ROUTINE_STEPS.length) {
      markFullFaceRoutineToday(true);
    }
  };

  const markFullFaceRoutineToday = (val = true) => {
    const nextSteps = {};
    if (val) {
      FACE_ROUTINE_STEPS.forEach((s) => {
        nextSteps[s.id] = true;
      });
    }
    setDoneRoutineSteps(nextSteps);

    setData((old) => {
      const prevDay = (old.days && old.days[today]) || createEmptyDay();
      return {
        ...old,
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            face: {
              ...(prevDay.face || {}),
              faceRoutineDone: val,
              lipsTogether: val ? true : prevDay.face?.lipsTogether,
            },
          },
        },
      };
    });
    if (val && typeof notify === "function") {
      notify("5–8 min Face & Posture routine logged for today!");
    }
  };

  /* Height Decompression Routine, 4-Session & Diet Sync */
  const isHeightRoutineDoneToday = Boolean(
    todayDayObj.life &&
      todayDayObj.life.eyePosture &&
      groom.heightDoneDate === today
  );

  const todayHeightSessions =
    groom.heightSessionsDate === today ? groom.heightSessions || {} : {};
  const todayHeightDiet =
    groom.heightDietDate === today ? groom.heightDiet || {} : {};

  const toggleHeightSession = (sessId) => {
    const next = {
      ...todayHeightSessions,
      [sessId]: !todayHeightSessions[sessId],
    };
    setGroom({
      heightSessionsDate: today,
      heightSessions: next,
    });
  };

  const toggleHeightDietItem = (dietId) => {
    const next = {
      ...todayHeightDiet,
      [dietId]: !todayHeightDiet[dietId],
    };
    setGroom({
      heightDietDate: today,
      heightDiet: next,
    });
    const doneDietCount = Object.values(next).filter(Boolean).length;
    if (
      doneDietCount === HEIGHT_DIET_ITEMS.length &&
      typeof notify === "function"
    ) {
      notify("Full Egg + Veg Barefoot Height Nutrition completed today!");
    }
  };

  const toggleHeightStepDone = (stepId) => {
    const next = { ...doneHeightSteps, [stepId]: !doneHeightSteps[stepId] };
    setDoneHeightSteps(next);
    const doneCount = Object.values(next).filter(Boolean).length;
    if (doneCount >= 5) {
      markFullHeightRoutineToday(true, next);
    }
  };

  const markFullHeightRoutineToday = (val = true, customMap = null) => {
    const nextMap = customMap || {};
    if (val && !customMap) {
      HEIGHT_DECOMPRESSION_STEPS.forEach((s) => {
        nextMap[s.id] = true;
      });
    }
    setDoneHeightSteps(nextMap);

    setData((old) => {
      const prevDay = (old.days && old.days[today]) || createEmptyDay();
      return {
        ...old,
        groom: {
          ...(old.groom || {}),
          heightDoneDate: val ? today : "",
        },
        days: {
          ...(old.days || {}),
          [today]: {
            ...prevDay,
            life: {
              ...(prevDay.life || {}),
              eyePosture: val ? true : prevDay.life?.eyePosture,
            },
          },
        },
      };
    });

    if (val && typeof notify === "function") {
      notify("10-Step Barefoot Height Uncoiling Protocol logged for today!");
    }
  };

  /* 100% Barefoot 5-Zone Height Calculation (Without Shoes or Slippers) */
  const heightPotential = useMemo(() => {
    let discGain = 0.8;
    if (heightAudit.sittingHours === "high") discGain = 1.5;
    else if (heightAudit.sittingHours === "med") discGain = 1.1;

    let aptGain = 0.4;
    if (heightAudit.aptLevel === "high") aptGain = 1.2;
    else if (heightAudit.aptLevel === "moderate") aptGain = 0.8;

    const thoracicGain = heightAudit.thoracicRound === "high" ? 0.8 : 0.4;
    const neckGain = heightAudit.neckSlouch === "yes" ? 0.6 : 0.2;
    const untrainedGain = heightAudit.untrainedHistory === "yes" ? 0.4 : 0.1;

    const totalReclaimCm = +(
      discGain +
      aptGain +
      thoracicGain +
      neckGain +
      untrainedGain
    ).toFixed(1);

    const baseHeight = safeNum(p.heightCm, 173);
    const potentialHeight = +(baseHeight + totalReclaimCm).toFixed(1);
    const lockedEveningBarefoot = +(potentialHeight - 0.4).toFixed(1);

    return {
      discGain,
      aptGain,
      thoracicGain,
      neckGain,
      untrainedGain,
      totalReclaimCm,
      baseHeight,
      potentialHeight,
      lockedEveningBarefoot,
    };
  }, [heightAudit, p.heightCm]);

  const handleSaveHeightLog = () => {
    const mCm = Math.max(
      130,
      Math.min(220, safeNum(heightForm.morningCm, 174.8))
    );
    const eCm = Math.max(
      130,
      Math.min(220, safeNum(heightForm.eveningCm, 173))
    );
    const entry = {
      id: uid(),
      date: today,
      morningCm: mCm,
      eveningCm: eCm,
      dropCm: +Math.max(0, mCm - eCm).toFixed(1),
    };

    setData((old) => ({
      ...old,
      profile: {
        ...(old.profile || {}),
        heightCm: eCm,
      },
      groom: {
        ...(old.groom || {}),
        morningHeightCm: mCm,
        eveningHeightCm: eCm,
        heightLogs: [entry, ...(old.groom?.heightLogs || []).slice(0, 14)],
      },
    }));

    if (typeof notify === "function") {
      notify(`Barefoot Height logged: Morning ${mCm} cm · Evening ${eCm} cm`);
    }
  };

  /* Hair Protocol, Weekly Schedule & Hair Diet Sync */
  const isHairRoutineDoneToday = groom.hairDoneDate === today;
  const todayHairSchedule =
    groom.hairSchedDate === today ? groom.hairSchedule || {} : {};
  const todayHairDiet =
    groom.hairDietDate === today ? groom.hairDiet || {} : {};

  const toggleHairScheduleItem = (id) => {
    const next = { ...todayHairSchedule, [id]: !todayHairSchedule[id] };
    setGroom({
      hairSchedDate: today,
      hairSchedule: next,
    });
  };

  const toggleHairDietItem = (id) => {
    const next = { ...todayHairDiet, [id]: !todayHairDiet[id] };
    setGroom({
      hairDietDate: today,
      hairDiet: next,
    });
    const count = Object.values(next).filter(Boolean).length;
    if (count === HAIR_DIET_ITEMS.length && typeof notify === "function") {
      notify("All 6 Hair Keratin, Biotin & DHT-Blocker meals logged today!");
    }
  };

  const toggleHairStepDone = (stepId) => {
    const next = { ...doneHairSteps, [stepId]: !doneHairSteps[stepId] };
    setDoneHairSteps(next);
    const doneCount = Object.values(next).filter(Boolean).length;
    if (doneCount >= 3) {
      markFullHairRoutineToday(true, next);
    }
  };

  const markFullHairRoutineToday = (val = true, customMap = null) => {
    const nextMap = customMap || {};
    if (val && !customMap) {
      HAIR_GROWTH_STEPS.forEach((s) => {
        nextMap[s.id] = true;
      });
    }
    setDoneHairSteps(nextMap);
    setGroom({
      hairDoneDate: val ? today : "",
    });
    if (val && typeof notify === "function") {
      notify("Hair Thickness & Anti-Dandruff Routine logged for today!");
    }
  };

  /* Hair Diagnostic & Recovery Calculator */
  const hairRecoveryPlan = useMemo(() => {
    let dandruffClearDays = 14;
    let ketoFreq = "2x / week (Mon & Thu)";
    if (hairAudit.dandruffType === "oilyFlakes") {
      dandruffClearDays = 21;
      ketoFreq = "3x / week (Mon, Wed, Fri · 5-min hold)";
    } else if (hairAudit.dandruffType === "none") {
      dandruffClearDays = 7;
      ketoFreq = "1x / week (Preventive scalp reset)";
    }

    let sheddingReductionPct = 65;
    if (hairAudit.oilingHabit === "overnight") sheddingReductionPct += 15;
    if (hairAudit.dietHistory === "lowProtein") sheddingReductionPct += 10;

    let thicknessGainPct = 18;
    if (hairAudit.dietHistory === "lowProtein") thicknessGainPct = 28;

    const growthRateCmMonth =
      hairAudit.dietHistory === "lowProtein" ? "1.4 to 1.6 cm/mo" : "1.3 cm/mo";

    return {
      dandruffClearDays,
      ketoFreq,
      sheddingReductionPct: Math.min(92, sheddingReductionPct),
      thicknessGainPct,
      growthRateCmMonth,
    };
  }, [hairAudit]);

  /* Face Shape Quiz Recommender */
  const applyRecommendedFaceShape = () => {
    let rec = "oval";
    if (shapeQuiz.lengthVsWidth === "long") {
      rec = "oblong";
    } else if (shapeQuiz.foreheadVsJaw === "widerForehead") {
      rec = "heart";
    } else if (shapeQuiz.jawShape === "angular") {
      rec = "square";
    } else if (
      shapeQuiz.lengthVsWidth === "wide" &&
      shapeQuiz.jawShape === "soft"
    ) {
      rec = "round";
    }
    setGroom({ faceShape: rec });
    if (typeof notify === "function") {
      notify(`Matched face shape: ${FACE_SHAPES_GUIDE[rec].label}`);
    }
  };

  /* Haircut Cycle Calculator */
  const haircutStatus = useMemo(() => {
    if (!groom.lastHaircutDate) return null;
    const daysSince = Math.max(0, dayDiff(groom.lastHaircutDate, today));
    const nextIdealISO = addDaysISO(groom.lastHaircutDate, 28);
    const daysLeft = dayDiff(today, nextIdealISO);
    return { daysSince, nextIdealISO, daysLeft };
  }, [groom.lastHaircutDate, today]);

  const copyBarberInstructions = async () => {
    const guide = FACE_SHAPES_GUIDE[selectedFaceShape];
    const text = `Barber Notes (${guide.label}):\nHaircut: ${guide.haircut}\nSides: Low/Mid taper fade (#1.5 to #3 guard), keep upper-side structure.\nBeard: ${guide.beard} (Neckline 1 finger above Adam's apple).`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        notify("Barber cheat-sheet copied to clipboard!");
      }
    } catch {
      notify("Copy manually from the card.");
    }
  };

  /* Daily AM/PM Skincare Tracker (Synced with +5 pts in todayDayObj.c.skincare) */
  const todaySkinLog = todayDayObj.skinCareSteps || {
    amCleanse: false,
    amSpf: false,
    pmWash: false,
    pmMoist: false,
  };

  const toggleSkinStepToday = (key) => {
    const nextLog = { ...todaySkinLog, [key]: !todaySkinLog[key] };
    const bothDone =
      (nextLog.amCleanse || nextLog.amSpf) &&
      (nextLog.pmWash || nextLog.pmMoist);

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
      notify("AM + PM Skincare complete! (+5 Comeback pts unlocked)");
    }
  };

  /* Capsule Wardrobe Closet & Cost Estimator */
  const ownedWardrobe = groom.ownedWardrobe || {};
  const fitChecks = groom.fitChecks || {};
  const visualHeightChecks = groom.visualHeightChecks || {};

  const wardrobeSummary = useMemo(() => {
    let ownedCount = 0;
    let remainingCost = 0;

    WARDROBE_CAPSULE.forEach((row, idx) => {
      const isOwned = Boolean(ownedWardrobe[idx]);
      if (isOwned) {
        ownedCount += 1;
      } else {
        const rangeStr = budgetTier === "low" ? row.low : row.mid;
        remainingCost += parseAvgRupeeRange(rangeStr);
      }
    });

    return {
      ownedCount,
      totalItems: WARDROBE_CAPSULE.length,
      pct: percent(ownedCount, WARDROBE_CAPSULE.length),
      remainingCost,
    };
  }, [ownedWardrobe, budgetTier]);

  const quickWinsDoneCount = WEEK1_QUICK_WINS.filter((qw) =>
    Boolean(groom.quickWins && groom.quickWins[qw.id])
  ).length;

  const weeklyGroomDoneCount = WEEKLY_GROOM_CHECKS.filter((wg) =>
    Boolean(groom.weeklyChecks && groom.weeklyChecks[wg.id])
  ).length;

  const completedDietCount = Object.values(todayHeightDiet).filter(Boolean).length;
  const completedSessionCount = Object.values(todayHeightSessions).filter(Boolean).length;
  const completedHairDietCount = Object.values(todayHairDiet).filter(Boolean).length;
  const completedHairSchedCount = Object.values(todayHairSchedule).filter(Boolean).length;

  return (
    <>
      <Heading
        title="Looks, barefoot height uncoiling, hair density & style"
        description="100% Barefoot 5-Zone Kinetic Uncoiling (173 → 177–177.5 cm without shoes), Anti-Dandruff & Hair Thickness Protocol, Egg + Collagen nutrition, skin clarity, and well-fitted clothes."
      />

      <div className="stats-grid jsx-2f23af6b">
        <Stat
          icon="◌"
          label="Today's Face Routine"
          value={isFaceRoutineLoggedToday ? "Done ✓" : "5–8 mins"}
          detail={`${
            Object.values(doneRoutineSteps).filter(Boolean).length
          }/${FACE_ROUTINE_STEPS.length} steps checked today`}
          color="sage"
        />
        <Stat
          icon="↕"
          label="Barefoot Height Target"
          value={`+${heightPotential.totalReclaimCm} cm (Barefoot)`}
          detail={`${heightPotential.baseHeight} → ${heightPotential.potentialHeight} cm without shoes`}
          color="blue"
        />
        <Stat
          icon="✂"
          label="Hair & Dandruff Protocol"
          value={
            isHairRoutineDoneToday
              ? "Done ✓"
              : `+${hairRecoveryPlan.thicknessGainPct}% Thickness`
          }
          detail={`Hair Diet: ${completedHairDietCount}/${HAIR_DIET_ITEMS.length} · Wash: ${hairRecoveryPlan.ketoFreq}`}
          color="peach"
        />
        <Stat
          icon="👕"
          label="Capsule Wardrobe"
          value={`${wardrobeSummary.ownedCount}/${wardrobeSummary.totalItems} Owned`}
          detail={`Week-1 Quick Wins: ${quickWinsDoneCount}/${WEEK1_QUICK_WINS.length}`}
          color="lavender"
        />
      </div>

      <div className="tabs large-tabs">
        {[
          ["face", "Face & Posture Routine"],
          ["height", "Barefoot Height (173 → 177+ cm)"],
          ["hair", "Hair Growth, Dandruff & Beard"],
          ["skin", "Skin & Tan Control"],
          ["groom", "Wardrobe & Quick Wins"],
        ].map(([k, lbl]) => (
          <button
            type="button"
            key={k}
            className={subTab === k ? "selected" : ""}
            onClick={() => setSubTab(k)}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: FACE & POSTURE ROUTINE + 7-QUESTION HABIT AUDIT
          ===================================================================== */}
      {subTab === "face" && (
        <div className="stack-col">
          <div className="intro-callout">
            <div className="callout-icon">◌</div>
            <div>
              <strong>The truth about facial symmetry</strong>
              <p>{FACE_SACH_CARD.intro}</p>
            </div>
          </div>

          <div className="dashboard-grid">
            <Card>
              <div className="section-head">
                <div>
                  <div className="eyebrow">DAILY 5–8 MIN ROUTINE</div>
                  <h2>Gentle neck, jaw &amp; posture stepper</h2>
                  <p>Stop immediately if you feel any jaw clicking or pain.</p>
                </div>
                <Button
                  kind={isFaceRoutineLoggedToday ? "secondary" : "primary"}
                  onClick={() =>
                    markFullFaceRoutineToday(!isFaceRoutineLoggedToday)
                  }
                >
                  {isFaceRoutineLoggedToday
                    ? "✓ Logged for Today"
                    : "✓ Complete All 5 Steps"}
                </Button>
              </div>

              <div className="stack-col jsx-dffc4db2">
                {FACE_ROUTINE_STEPS.map((s) => {
                  const stepDone =
                    Boolean(doneRoutineSteps[s.id]) || isFaceRoutineLoggedToday;
                  return (
                    <div
                      key={s.id}
                      className={`routine-step-box ${
                        stepDone ? "routine-step-complete" : ""
                      }`}
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
                        onComplete={() => {
                          setDoneRoutineSteps((prev) => ({
                            ...prev,
                            [s.id]: true,
                          }));
                          if (typeof notify === "function") {
                            notify(`${s.name} completed!`);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="stack-col">
              <Card>
                <div className="eyebrow">ORDERED BY REAL IMPACT</div>
                <h2>What actually improves your face</h2>
                <div className="habit-list jsx-4bb90035">
                  {FACE_SACH_CARD.impactOrder.map((item) => (
                    <div className="habit-row" key={item.rank}>
                      <span className="status-pill complete">#{item.rank}</span>
                      <div className="habit-info">
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {auditSummary.dentistAlerts.length > 0 && (
                <div className="intro-callout jsx-50435ff2">
                  <div className="callout-icon">⚠️</div>
                  <div>
                    <strong>
                      TMJ / Dental Check Recommended (
                      {auditSummary.dentistAlerts.length} flag
                      {auditSummary.dentistAlerts.length > 1 ? "s" : ""})
                    </strong>
                    <p>
                      You noted jaw clicking, teeth clenching, or an uneven
                      bite. Skip all jaw-resistance exercises and consult a
                      dentist for a safe evaluation.
                    </p>
                  </div>
                </div>
              )}

              <Accordion
                title={`Interactive 7-Question Face & Jaw Habit Audit (${auditSummary.healthyCount}/7 Optimal)`}
                badge="Audit"
                defaultOpen={auditSummary.answeredCount < 7}
              >
                <div className="stack-col">
                  {FACE_AUDIT_QUESTIONS.map((q) => {
                    const currentAns = auditAnswers[q.id] || "";
                    const isDentistFlag =
                      q.dentistOn && currentAns === q.dentistOn;
                    return (
                      <div key={q.id} className="audit-q-box">
                        <strong>{q.question}</strong>
                        <div className="category-pills jsx-0d69e4b1">
                          {q.options.map((opt) => (
                            <button
                              type="button"
                              key={opt.value}
                              className={
                                currentAns === opt.value ? "selected" : ""
                              }
                              onClick={() => handleAuditChange(q.id, opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {currentAns && (
                          <small
                            className={`muted-text ${
                              isDentistFlag ? "dentist-flag-note" : ""
                            }`}
                          >
                            {isDentistFlag ? "⚠️ Dentist Note: " : "💡 Tip: "}
                            {q.tip}
                          </small>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2 (100% BAREFOOT): 173 -> 177-177.5 CM WITHOUT SHOES OR SLIPPERS
          ===================================================================== */}
      {subTab === "height" && (
        <div className="stack-col">
          <div className="intro-callout">
            <div className="callout-icon">↕</div>
            <div>
              <strong>
                100% Barefoot (Bina Shoes/Slippers) 173 → 177–177.5 cm Blueprint
              </strong>
              <p>
                Kyunki aapne 22 saal tak kabhi gym, running ya sports nahi khela
                aur bachpan me low-protein diet rahi, aapke शरीर ke{" "}
                <strong>5 Barefoot Kinetic Zones</strong>—
                <strong>1) 23 Spinal Discs (+1.5 cm)</strong>,{" "}
                <strong>2) APT Pelvic Tilt (+1.2 cm)</strong>,{" "}
                <strong>3) Thoracic Upper-Back Curve (+0.8 cm)</strong>,{" "}
                <strong>4) Forward Neck (+0.6 cm)</strong>, aur{" "}
                <strong>5) Knee-Hamstring &amp; Foot Arch (+0.4 cm)</strong>
                —mein kul milakar{" "}
                <strong>+3.6 se +4.5 cm asli Barefoot Height</strong> dabi ho
                sakti hai. Agle 90–120 din roz{" "}
                <strong>4 Micro-Sessions + 5 Whole Eggs/Collagen Diet</strong>{" "}
                follow karke aap bina jooto ke{" "}
                <strong>176.6 se 177.5 cm (Barefoot)</strong> tak pahunch sakte
                ho.
              </p>
            </div>
          </div>

          {/* 4-SESSION DAILY BAREFOOT FREQUENCY TRACKER */}
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  DIN MEIN 4 BAAR BAREFOOT DECOMPRESSION (MICRO-SESSIONS)
                </div>
                <h2>
                  Daily Barefoot Schedule ({completedSessionCount}/
                  {HEIGHT_DAILY_SESSIONS.length} Sessions Done Today)
                </h2>
                <p>
                  Nange pair 177+ cm lock karne ke liye spine ko din bhar shrink
                  hone se bachana zaroori hai. Ye 4 sessions roz tick karo:
                </p>
              </div>
              <span className="status-pill complete">
                ~35–40 Mins Total / Day
              </span>
            </div>

            <div className="form-grid jsx-4bb90035">
              {HEIGHT_DAILY_SESSIONS.map((sess) => {
                const checked = Boolean(todayHeightSessions[sess.id]);
                return (
                  <div
                    key={sess.id}
                    className={`habit-row ${checked ? "checked" : ""}`}
                  >
                    <button
                      type="button"
                      className={`check-circle ${checked ? "checked" : ""}`}
                      onClick={() => toggleHeightSession(sess.id)}
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{sess.title}</strong>
                      <small>{sess.sub}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="dashboard-grid">
            {/* LEFT: 10-STEP BAREFOOT 5-ZONE UNCOILING PROTOCOL */}
            <Card>
              <div className="section-head">
                <div>
                  <div className="eyebrow">
                    10-EXERCISE BAREFOOT 5-ZONE UNCOILING PROTOCOL
                  </div>
                  <h2>Exact Sets, Reps, Timers &amp; Anatomical Zones</h2>
                  <p>
                    Sabhi exercises yoga mat par nange pair (barefoot) karein.
                    Complete at least 5 steps to log today&apos;s streak.
                  </p>
                </div>
                <Button
                  kind={isHeightRoutineDoneToday ? "secondary" : "primary"}
                  onClick={() =>
                    markFullHeightRoutineToday(!isHeightRoutineDoneToday)
                  }
                >
                  {isHeightRoutineDoneToday
                    ? "✓ Logged Today"
                    : "✓ Complete All 10 Steps"}
                </Button>
              </div>

              <div className="stack-col jsx-4bb90035">
                {HEIGHT_DECOMPRESSION_STEPS.map((s) => {
                  const stepDone =
                    Boolean(doneHeightSteps[s.id]) || isHeightRoutineDoneToday;
                  return (
                    <div
                      key={s.id}
                      className={`routine-step-box ${
                        stepDone ? "routine-step-complete" : ""
                      }`}
                    >
                      <div className="row-between">
                        <div className="jsx-f265ed37">
                          <button
                            type="button"
                            className={`check-circle ${
                              stepDone ? "checked" : ""
                            }`}
                            onClick={() => toggleHeightStepDone(s.id)}
                          >
                            {stepDone ? "✓" : ""}
                          </button>
                          <strong>{s.name}</strong>
                        </div>
                        <span className="status-pill complete">
                          {s.gainTag}
                        </span>
                      </div>

                      <small className="muted-text">
                        Sets &amp; Reps: <strong>{s.reps}</strong> · Frequency:{" "}
                        <strong>{s.frequency}</strong>
                      </small>
                      <p>{s.instruction}</p>

                      <CountdownTimer
                        defaultSeconds={s.durationSec}
                        label={s.name}
                        onComplete={() => {
                          toggleHeightStepDone(s.id);
                          if (typeof notify === "function") {
                            notify(`${s.name} set complete!`);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* RIGHT: 100% BAREFOOT 5-ZONE CALCULATOR + EGG DIET + DIURNAL TRACKER + 24/7 LOCK */}
            <div className="stack-col">
              <Card>
                <div className="eyebrow">
                  100% BAREFOOT 5-ZONE HEIGHT CALCULATOR (NO SHOES/SLIPPERS)
                </div>
                <h2>
                  Barefoot Target: {heightPotential.baseHeight} cm →{" "}
                  {heightPotential.potentialHeight} cm (+
                  {heightPotential.totalReclaimCm} cm Barefoot)
                </h2>
                <p>
                  Check your compression across all 5 anatomical zones below
                  (100% without footwear):
                </p>

                <div className="stack-col jsx-4bb90035">
                  <Field label="Zone 1 (23 Spinal Discs): Roz kitne ghante chair/bed par baith kar padhte ho?">
                    <select
                      value={heightAudit.sittingHours}
                      onChange={(e) =>
                        setHeightAudit({
                          ...heightAudit,
                          sittingHours: e.target.value,
                        })
                      }
                    >
                      <option value="high">
                        6–10+ hours/day (+1.5 cm barefoot disc decompression)
                      </option>
                      <option value="med">
                        3–6 hours/day (+1.1 cm barefoot disc decompression)
                      </option>
                      <option value="low">
                        Under 3 hours/day (+0.8 cm barefoot disc decompression)
                      </option>
                    </select>
                  </Field>

                  <Field label="Zone 2 (Pelvic Tilt - APT): Kya kamar andar arch hoti hai aur pet aage nikalta hai?">
                    <select
                      value={heightAudit.aptLevel}
                      onChange={(e) =>
                        setHeightAudit({
                          ...heightAudit,
                          aptLevel: e.target.value,
                        })
                      }
                    >
                      <option value="high">
                        Yes, noticeable lower-back arch / untrained hips (+1.2 cm barefoot)
                      </option>
                      <option value="moderate">
                        Moderate pelvic tilt from sitting (+0.8 cm barefoot)
                      </option>
                      <option value="none">
                        Flat neutral pelvis (+0.4 cm barefoot)
                      </option>
                    </select>
                  </Field>

                  <Field label="Zone 3 (Upper Back & Ribcage): Kya kandhe aur upper back thode aage gol (slouch) rehte hain?">
                    <select
                      value={heightAudit.thoracicRound}
                      onChange={(e) =>
                        setHeightAudit({
                          ...heightAudit,
                          thoracicRound: e.target.value,
                        })
                      }
                    >
                      <option value="high">
                        Yes, rounded upper back / ribcage drop (+0.8 cm barefoot)
                      </option>
                      <option value="low">
                        Mostly upright chest (+0.4 cm barefoot)
                      </option>
                    </select>
                  </Field>

                  <Field label="Zone 4 (Tech-Neck): Phone/Laptop dekhte waqt gardan aage jhukti hai?">
                    <select
                      value={heightAudit.neckSlouch}
                      onChange={(e) =>
                        setHeightAudit({
                          ...heightAudit,
                          neckSlouch: e.target.value,
                        })
                      }
                    >
                      <option value="yes">
                        Yes, forward head / tech-neck (+0.6 cm barefoot)
                      </option>
                      <option value="no">
                        No, neck aligned with spine (+0.2 cm barefoot)
                      </option>
                    </select>
                  </Field>

                  <Field label="Zone 5 (Hamstrings, Foot Arch & Untrained History): Kabhi gym/sports nahi khela?">
                    <select
                      value={heightAudit.untrainedHistory}
                      onChange={(e) =>
                        setHeightAudit({
                          ...heightAudit,
                          untrainedHistory: e.target.value,
                        })
                      }
                    >
                      <option value="yes">
                        Never played sports/gym + tight hamstrings (+0.4 cm barefoot)
                      </option>
                      <option value="no">
                        Already flexible &amp; trained (+0.1 cm barefoot)
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mini-stat-row jsx-99bf9265">
                  <div>
                    <span className="mini-stat-number">
                      {heightPotential.baseHeight} cm
                    </span>
                    <span>Current Barefoot Height</span>
                  </div>
                  <div>
                    <span className="mini-stat-number">
                      +{heightPotential.totalReclaimCm} cm
                    </span>
                    <span>5-Zone Barefoot Gain</span>
                  </div>
                  <div>
                    <span className="mini-stat-number">
                      {heightPotential.potentialHeight} cm
                    </span>
                    <span>
                      Peak Barefoot ({heightPotential.lockedEveningBarefoot} cm PM)
                    </span>
                  </div>
                </div>
              </Card>

              {/* DAILY EGG + VEG CATCH-UP NUTRITION TRACKER */}
              <Card>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">
                      ROZ KYA KHANA HAI? (BAREFOOT DISC &amp; BONE CATCH-UP DIET)
                    </div>
                    <h2>
                      Daily 5-Egg + Desi Veg Nutrition ({completedDietCount}/
                      {HEIGHT_DIET_ITEMS.length} Meals)
                    </h2>
                    <p>
                      Bachpan ki protein kami poori karne aur 23 spinal discs ki
                      gaddi (Type-II Collagen) ko mota karne ke liye roz ye 6
                      meals poori karo:
                    </p>
                  </div>
                  <span className="status-pill complete">
                    ~100g Protein / Day
                  </span>
                </div>

                <div className="habit-list jsx-4bb90035">
                  {HEIGHT_DIET_ITEMS.map((item) => {
                    const checked = Boolean(todayHeightDiet[item.id]);
                    return (
                      <div
                        key={item.id}
                        className={`habit-row ${checked ? "checked" : ""}`}
                      >
                        <button
                          type="button"
                          className={`check-circle ${checked ? "checked" : ""}`}
                          onClick={() => toggleHeightDietItem(item.id)}
                        >
                          {checked ? "✓" : ""}
                        </button>
                        <div className="habit-info">
                          <small className="muted-text">
                            <strong>{item.meal}</strong> · {item.nutrients}
                          </small>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <div className="eyebrow">
                  BAREFOOT DIURNAL TRACKER (MORNING VS. NIGHT)
                </div>
                <h2>Track your barefoot morning vs. night height</h2>
                <p>
                  Deewar ke sahare <strong>nange pair (without slippers)</strong>{" "}
                  subah uthte hi aur raat ko sone se pehle apni height napo.
                  Jaise-jaise aapki core/back strong hogi aur discs hydrate
                  hongi, aapki subah aur raat dono ki barefoot height 177 cm ke
                  paas lock hone lagegi.
                </p>

                <div className="form-grid jsx-4bb90035">
                  <Field label="Barefoot Morning Height (Right after waking up - cm)">
                    <input
                      type="number"
                      step="0.1"
                      value={heightForm.morningCm}
                      onChange={(e) =>
                        setHeightForm({
                          ...heightForm,
                          morningCm: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Barefoot Evening Height (Before bed - cm)">
                    <input
                      type="number"
                      step="0.1"
                      value={heightForm.eveningCm}
                      onChange={(e) =>
                        setHeightForm({
                          ...heightForm,
                          eveningCm: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="row-between jsx-b08e79e1">
                  <Button kind="primary" onClick={handleSaveHeightLog}>
                    Save Barefoot Measurement
                  </Button>
                  <span className="status-pill complete">
                    Daytime Shrinkage:{" "}
                    {Math.max(
                      0,
                      safeNum(heightForm.morningCm, 174.8) -
                        safeNum(heightForm.eveningCm, 173)
                    ).toFixed(1)}{" "}
                    cm (Target: &lt;0.5 cm)
                  </span>
                </div>

                {(groom.heightLogs || []).length > 0 && (
                  <div className="habit-list jsx-4bb90035">
                    {(groom.heightLogs || []).slice(0, 4).map((hl) => (
                      <div key={hl.id} className="habit-row checked">
                        <div className="habit-info">
                          <strong>
                            ☀ Barefoot AM: {hl.morningCm} cm · ☾ Barefoot PM:{" "}
                            {hl.eveningCm} cm
                          </strong>
                          <small>{fmtDate(hl.date)}</small>
                        </div>
                        <span className="status-pill">
                          Δ {hl.dropCm} cm loss
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="eyebrow">
                  24/7 BAREFOOT HEIGHT RETENTION RULES
                </div>
                <h2>5 Daily Habits to Lock Your 177 cm Barefoot Posture</h2>
                <div className="habit-list jsx-4bb90035">
                  {BAREFOOT_RETENTION_HABITS.map((vh) => {
                    const checked = Boolean(visualHeightChecks[vh.id]);
                    return (
                      <div
                        key={vh.id}
                        className={`habit-row ${checked ? "checked" : ""}`}
                      >
                        <button
                          type="button"
                          className="check-circle"
                          onClick={() =>
                            setGroom({
                              visualHeightChecks: {
                                ...visualHeightChecks,
                                [vh.id]: !checked,
                              },
                            })
                          }
                        >
                          {checked ? "✓" : ""}
                        </button>
                        <div className="habit-info">
                          <strong>{vh.title}</strong>
                          <small>{vh.sub}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3 (UPGRADED): HAIR GROWTH, ANTI-DANDRUFF, ANTI-HAIRFALL & BEARD
          ===================================================================== */}
      {subTab === "hair" && (
        <div className="stack-col">
          <div className="intro-callout">
            <div className="callout-icon">✂</div>
            <div>
              <strong>
                Zero-Dandruff, Zero-Hairfall &amp; Thick Hair Scientific Blueprint
              </strong>
              <p>
                <strong>1) Dandruff Ka Sach:</strong> Dandruff dryness se nahi,{" "}
                <em>Malassezia</em> fungus se hota hai jo aapke scalp ke tel
                (oil) ko khata hai—isliye dandruff mein{" "}
                <strong>raat bhar tel (overnight oiling) 100% band karo</strong>{" "}
                aur <strong>Ketoconazole 2% + ZPTO shampoo (5-min hold)</strong>{" "}
                use karo.{" "}
                <strong>2) Baal Mota &amp; Lamba Karne Ka Sach:</strong> 22 saal
                low-protein rehne se baal patle ho jate hain. Roz{" "}
                <strong>3–5 Boiled Eggs (Biotin + L-Cysteine)</strong>,{" "}
                <strong>Amla + Pumpkin Seeds (DHT Blocker)</strong>, aur{" "}
                <strong>4-Min Subgaleal Pinch Massage</strong> se 60–90 din mein
                hairfall ruk kar baal mote aur ghane (dense) hote hain.
              </p>
            </div>
          </div>

          {/* WEEKLY WASH & ANTI-DANDRUFF SCHEDULE TRACKER */}
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  WEEKLY ANTI-DANDRUFF &amp; FOLLICLE CARE SCHEDULE
                </div>
                <h2>
                  5 Golden Hair Rules ({completedHairSchedCount}/
                  {HAIR_WEEKLY_SCHEDULE.length} Checked Today)
                </h2>
                <p>
                  Follow this exact wash, oiling, and helmet hygiene schedule to
                  kill dandruff fungus and stop root inflammation:
                </p>
              </div>
              <span className="status-pill complete">
                {hairRecoveryPlan.ketoFreq}
              </span>
            </div>

            <div className="form-grid jsx-4bb90035">
              {HAIR_WEEKLY_SCHEDULE.map((item) => {
                const checked = Boolean(todayHairSchedule[item.id]);
                return (
                  <div
                    key={item.id}
                    className={`habit-row ${checked ? "checked" : ""}`}
                  >
                    <button
                      type="button"
                      className={`check-circle ${checked ? "checked" : ""}`}
                      onClick={() => toggleHairScheduleItem(item.id)}
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{item.title}</strong>
                      <small>{item.sub}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="dashboard-grid">
            {/* LEFT: 6-STEP HAIR THICKNESS, MASSAGE & KETOCONAZOLE TIMER PROTOCOL */}
            <Card>
              <div className="section-head">
                <div>
                  <div className="eyebrow">
                    6-STEP SCALP ACTIVATION &amp; ANTI-DANDRUFF PROTOCOL
                  </div>
                  <h2>Daily 4-Min Pinch Massage, 5-Min Keto Wash &amp; Serum</h2>
                  <p>
                    Use the built-in timers below (especially for the 4-min
                    Dermal Papilla massage and 5-min Ketoconazole contact wash).
                  </p>
                </div>
                <Button
                  kind={isHairRoutineDoneToday ? "secondary" : "primary"}
                  onClick={() =>
                    markFullHairRoutineToday(!isHairRoutineDoneToday)
                  }
                >
                  {isHairRoutineDoneToday
                    ? "✓ Logged Today"
                    : "✓ Complete Hair Routine"}
                </Button>
              </div>

              <div className="stack-col jsx-4bb90035">
                {HAIR_GROWTH_STEPS.map((s) => {
                  const stepDone =
                    Boolean(doneHairSteps[s.id]) || isHairRoutineDoneToday;
                  return (
                    <div
                      key={s.id}
                      className={`routine-step-box ${
                        stepDone ? "routine-step-complete" : ""
                      }`}
                    >
                      <div className="row-between">
                        <div className="jsx-f265ed37">
                          <button
                            type="button"
                            className={`check-circle ${
                              stepDone ? "checked" : ""
                            }`}
                            onClick={() => toggleHairStepDone(s.id)}
                          >
                            {stepDone ? "✓" : ""}
                          </button>
                          <strong>{s.name}</strong>
                        </div>
                        <span className="status-pill complete">
                          {s.gainTag}
                        </span>
                      </div>

                      <small className="muted-text">
                        Prescription: <strong>{s.reps}</strong> · Frequency:{" "}
                        <strong>{s.frequency}</strong>
                      </small>
                      <p>{s.instruction}</p>

                      <CountdownTimer
                        defaultSeconds={s.durationSec}
                        label={s.name}
                        onComplete={() => {
                          toggleHairStepDone(s.id);
                          if (typeof notify === "function") {
                            notify(`${s.name} completed!`);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* RIGHT: HAIR DIAGNOSTIC CALCULATOR + DAILY EGG/KERATIN DIET TRACKER */}
            <div className="stack-col">
              <Card>
                <div className="eyebrow">
                  DANDRUFF, HAIRFALL &amp; THICKNESS DIAGNOSTIC
                </div>
                <h2>
                  Root-Cause Analyzer ({hairRecoveryPlan.dandruffClearDays}-Day
                  Dandruff Clear · +{hairRecoveryPlan.thicknessGainPct}% Shaft
                  Thickness)
                </h2>
                <p>
                  Select your current scalp condition and habits below to get
                  your exact recovery timeline:
                </p>

                <div className="stack-col jsx-4bb90035">
                  <Field label="1. Aapke scalp par kis tarah ka dandruff aata hai?">
                    <select
                      value={hairAudit.dandruffType}
                      onChange={(e) =>
                        setHairAudit({
                          ...hairAudit,
                          dandruffType: e.target.value,
                        })
                      }
                    >
                      <option value="oilyFlakes">
                        Oily, sticky/yellowish flakes + itching (Fungal Seborrheic)
                      </option>
                      <option value="dryFlakes">
                        Small white powdery flakes (Mild Dandruff / Dry Scalp)
                      </option>
                      <option value="none">
                        No visible flakes (Focus on thickness &amp; length)
                      </option>
                    </select>
                  </Field>

                  <Field label="2. Nahate ya kanghi karte waqt roz kitne baal tut-te/girte hain?">
                    <select
                      value={hairAudit.dailyShedding}
                      onChange={(e) =>
                        setHairAudit({
                          ...hairAudit,
                          dailyShedding: e.target.value,
                        })
                      }
                    >
                      <option value="high">
                        High shedding (50–100+ hairs on pillow/comb · Telogen Effluvium)
                      </option>
                      <option value="moderate">
                        Moderate shedding (30–50 hairs/day + thin hair strands)
                      </option>
                      <option value="normal">
                        Normal (&lt;25 hairs/day · want thicker density)
                      </option>
                    </select>
                  </Field>

                  <Field label="3. Abhi aap sir mein tel (hair oil) kaise lagate ho?">
                    <select
                      value={hairAudit.oilingHabit}
                      onChange={(e) =>
                        setHairAudit({
                          ...hairAudit,
                          oilingHabit: e.target.value,
                        })
                      }
                    >
                      <option value="overnight">
                        Overnight / Din bhar tel laga kar chhod deta hun (Feeds Dandruff!)
                      </option>
                      <option value="prewash">
                        Only 30–45 mins before shampoo (Optimal)
                      </option>
                      <option value="none">
                        No oiling (Use water-based serum)
                      </option>
                    </select>
                  </Field>

                  <Field label="4. Pichle 5–10 saal ki Diet History (Protein, B12, Iron)?">
                    <select
                      value={hairAudit.dietHistory}
                      onChange={(e) =>
                        setHairAudit({
                          ...hairAudit,
                          dietHistory: e.target.value,
                        })
                      }
                    >
                      <option value="lowProtein">
                        Mostly Roti + Dal-Chawal (Started Eggs at age 22 · High catch-up potential)
                      </option>
                      <option value="optimal">
                        Already eating 90g+ protein + Eggs/Paneer daily
                      </option>
                    </select>
                  </Field>

                  <Field label="5. Kya aap roz Helmet pehente ho ya Borewell/Hard water se sir dhote ho?">
                    <select
                      value={hairAudit.waterAndHelmet}
                      onChange={(e) =>
                        setHairAudit({
                          ...hairAudit,
                          waterAndHelmet: e.target.value,
                        })
                      }
                    >
                      <option value="yes">
                        Yes, daily helmet sweat / hard water (Use cotton bandana + RO final rinse)
                      </option>
                      <option value="no">
                        No, soft water &amp; minimal helmet friction
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mini-stat-row jsx-99bf9265">
                  <div>
                    <span className="mini-stat-number">
                      {hairRecoveryPlan.dandruffClearDays} Days
                    </span>
                    <span>100% Dandruff Clearance</span>
                  </div>
                  <div>
                    <span className="mini-stat-number">
                      -{hairRecoveryPlan.sheddingReductionPct}%
                    </span>
                    <span>Hairfall Reduction (6–8 Wks)</span>
                  </div>
                  <div>
                    <span className="mini-stat-number">
                      +{hairRecoveryPlan.thicknessGainPct}%
                    </span>
                    <span>
                      Shaft Thickness ({hairRecoveryPlan.growthRateCmMonth})
                    </span>
                  </div>
                </div>
              </Card>

              {/* DAILY KERATIN, BIOTIN & DHT-BLOCKER DIET TRACKER */}
              <Card>
                <div className="section-head">
                  <div>
                    <div className="eyebrow">
                      ROZ KYA KHANA HAI? (KERATIN, BIOTIN &amp; IRON DIET)
                    </div>
                    <h2>
                      Daily Hair Growth &amp; Thickness Diet (
                      {completedHairDietCount}/{HAIR_DIET_ITEMS.length} Meals)
                    </h2>
                    <p>
                      Baal 90% Keratin protein hote hain. Patle baalon ko mota,
                      kaala aur lamba karne ke liye roz ye 6 cheezein khao:
                    </p>
                  </div>
                  <span className="status-pill complete">
                    Eggs + Seeds + Amla
                  </span>
                </div>

                <div className="habit-list jsx-4bb90035">
                  {HAIR_DIET_ITEMS.map((item) => {
                    const checked = Boolean(todayHairDiet[item.id]);
                    return (
                      <div
                        key={item.id}
                        className={`habit-row ${checked ? "checked" : ""}`}
                      >
                        <button
                          type="button"
                          className={`check-circle ${checked ? "checked" : ""}`}
                          onClick={() => toggleHairDietItem(item.id)}
                        >
                          {checked ? "✓" : ""}
                        </button>
                        <div className="habit-info">
                          <small className="muted-text">
                            <strong>{item.meal}</strong> · {item.nutrients}
                          </small>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* EXISTING FACE SHAPE SELECTOR, QUIZ, BARBER CHEAT-SHEET & 28-DAY TRIM TRACKER */}
          <div className="dashboard-grid">
            <Card>
              <div className="section-head">
                <div>
                  <div className="eyebrow">FACE SHAPE SELECTOR</div>
                  <h2>Haircut &amp; beard framing guide</h2>
                </div>
                <Button onClick={copyBarberInstructions}>
                  📋 Copy Barber Notes
                </Button>
              </div>

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

              <div className="intro-callout jsx-a0d4a037">
                <div className="callout-icon">✂</div>
                <div>
                  <strong>{FACE_SHAPES_GUIDE[selectedFaceShape].label}</strong>
                  <p>
                    <strong>Haircut:</strong>{" "}
                    {FACE_SHAPES_GUIDE[selectedFaceShape].haircut}
                  </p>
                  <p>
                    <strong>Beard:</strong>{" "}
                    {FACE_SHAPES_GUIDE[selectedFaceShape].beard}
                  </p>
                </div>
              </div>

              <Accordion
                title="Not sure about your face shape? Take the 30-sec Finder"
                badge="Quiz"
              >
                <div className="stack-col">
                  <Field label="1. Face Length vs. Cheekbone Width">
                    <select
                      value={shapeQuiz.lengthVsWidth}
                      onChange={(e) =>
                        setShapeQuiz({
                          ...shapeQuiz,
                          lengthVsWidth: e.target.value,
                        })
                      }
                    >
                      <option value="balanced">
                        Slightly longer than wide (Balanced)
                      </option>
                      <option value="long">
                        Noticeably long / narrow cheeks
                      </option>
                      <option value="wide">
                        Almost as wide as it is long
                      </option>
                    </select>
                  </Field>

                  <Field label="2. Jawline Angle">
                    <select
                      value={shapeQuiz.jawShape}
                      onChange={(e) =>
                        setShapeQuiz({ ...shapeQuiz, jawShape: e.target.value })
                      }
                    >
                      <option value="rounded">
                        Slightly curved / balanced chin
                      </option>
                      <option value="angular">
                        Sharp, wide, boxy jaw corners
                      </option>
                      <option value="soft">Soft / full cheeks</option>
                    </select>
                  </Field>

                  <Field label="3. Forehead vs. Jaw Width">
                    <select
                      value={shapeQuiz.foreheadVsJaw}
                      onChange={(e) =>
                        setShapeQuiz({
                          ...shapeQuiz,
                          foreheadVsJaw: e.target.value,
                        })
                      }
                    >
                      <option value="equal">
                        Forehead &amp; jaw are similar width
                      </option>
                      <option value="widerForehead">
                        Forehead is wider; chin is narrower/pointed
                      </option>
                    </select>
                  </Field>

                  <Button kind="primary" onClick={applyRecommendedFaceShape}>
                    Detect My Face Shape
                  </Button>
                </div>
              </Accordion>
            </Card>

            <div className="stack-col">
              <Card>
                <div className="eyebrow">BARBER CHEAT-SHEET</div>
                <h2>What to tell your barber</h2>
                <div className="habit-list jsx-4bb90035">
                  <div className="habit-row">
                    <div className="habit-info">
                      <strong>Show 2 clear photos (front &amp; side)</strong>
                      <small>
                        Visuals work better than technical English hairstyle
                        names.
                      </small>
                    </div>
                  </div>
                  <div className="habit-row">
                    <div className="habit-info">
                      <strong>Low taper fade on sides (#1.5 to #3)</strong>
                      <small>
                        Avoid high skin-zero fades if you have a long or thin
                        face.
                      </small>
                    </div>
                  </div>
                  <div className="habit-row">
                    <div className="habit-info">
                      <strong>
                        Beard neckline 1 finger above Adam&apos;s apple
                      </strong>
                      <small>
                        Creates a clean shadow under the jaw that sharpens your
                        profile.
                      </small>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="eyebrow">28-DAY GROOMING CYCLE</div>
                <h2>Haircut &amp; neckline tracker</h2>
                <div className="form-grid jsx-4bb90035">
                  <Field label="Last Haircut Date">
                    <input
                      type="date"
                      max={today}
                      value={groom.lastHaircutDate || ""}
                      onChange={(e) =>
                        setGroom({ lastHaircutDate: e.target.value })
                      }
                    />
                  </Field>
                </div>
                {haircutStatus && (
                  <p className="jsx-4bb90035">
                    • Days since last haircut:{" "}
                    <strong>{haircutStatus.daysSince} days</strong>
                    <br />
                    Recommended next trim (4-week cycle):{" "}
                    <strong>{fmtDate(haircutStatus.nextIdealISO)}</strong>{" "}
                    {haircutStatus.daysLeft <= 0 ? (
                      <span className="status-pill peach-pill">
                        Due for a trim!
                      </span>
                    ) : (
                      <span className="status-pill complete">
                        In {haircutStatus.daysLeft} days
                      </span>
                    )}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: SKIN & TAN CONTROL + DAILY AM/PM SKINCARE CHECKLIST
          ===================================================================== */}
      {subTab === "skin" && (
        <div className="stack-col">
          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  TODAY&apos;S SKINCARE LOG (+5 COMEBACK PTS)
                </div>
                <h2>Interactive AM &amp; PM daily check-in ({fmtDate(today)})</h2>
                <p>
                  Complete at least 1 Morning and 1 Night step to automatically
                  earn your +5 daily skincare points.
                </p>
              </div>
              <span
                className={`status-pill ${
                  todayDayObj.c?.skincare ? "complete" : ""
                }`}
              >
                {todayDayObj.c?.skincare ? "✓ +5 pts Unlocked" : "Pending"}
              </span>
            </div>

            <div className="form-grid jsx-4bb90035">
              {[
                [
                  "amCleanse",
                  "AM: Gentle Face Cleanser + Moisturizer",
                  "Wash off night oil; never use harsh body soap on your face",
                ],
                [
                  "amSpf",
                  "AM: 2-Finger SPF 50 PA+++ Sunscreen",
                  "Apply 15 mins before stepping out to prevent UV tan & dark spots",
                ],
                [
                  "pmWash",
                  "PM: Evening Face Wash (Remove sweat & dust)",
                  "Crucial after evening workout or dusty commute",
                ],
                [
                  "pmMoist",
                  "PM: Night Barrier Moisturizer + Lip Care",
                  "Repairs skin barrier overnight while you sleep",
                ],
              ].map(([key, title, sub]) => {
                const checked = Boolean(todaySkinLog[key]);
                return (
                  <div
                    key={key}
                    className={`habit-row ${checked ? "checked" : ""}`}
                  >
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() => toggleSkinStepToday(key)}
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{title}</strong>
                      <small>{sub}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="eyebrow">AM &amp; PM SKINCARE BUILDER</div>
            <h2>Select your skin type</h2>
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
            <div className="record-grid">
              <div className="routine-step-box">
                <strong>Morning (AM) Routine</strong>
                {SKIN_ROUTINES[selectedSkinType].am.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="routine-step-box">
                <strong>Night (PM) &amp; Weekly Care</strong>
                {SKIN_ROUTINES[selectedSkinType].pm.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <p className="jsx-0d69e4b1">
                  <strong>Weekly:</strong>{" "}
                  {SKIN_ROUTINES[selectedSkinType].weekly}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 5: WARDROBE CAPSULE, FIT AUDIT & QUICK WINS
          ===================================================================== */}
      {subTab === "groom" && (
        <div className="stack-col">
          <div className="dashboard-grid">
            <Card>
              <div className="section-head">
                <div>
                  <div className="eyebrow">FAST VISIBLE RESULTS</div>
                  <h2>Week-1 quick wins</h2>
                </div>
                <span className="status-pill complete">
                  {quickWinsDoneCount}/{WEEK1_QUICK_WINS.length}
                </span>
              </div>
              <div className="habit-list jsx-4bb90035">
                {WEEK1_QUICK_WINS.map((qw) => {
                  const checked = Boolean(
                    groom.quickWins && groom.quickWins[qw.id]
                  );
                  return (
                    <div
                      className={`habit-row ${checked ? "checked" : ""}`}
                      key={qw.id}
                    >
                      <button
                        type="button"
                        className="check-circle"
                        onClick={() =>
                          setGroom({
                            quickWins: {
                              ...(groom.quickWins || {}),
                              [qw.id]: !checked,
                            },
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
                  <div className="eyebrow">WEEKLY HYGIENE CHECKLIST</div>
                  <h2>Sunday grooming reset</h2>
                </div>
                <div className="heading-btn-group">
                  <span className="status-pill complete">
                    {weeklyGroomDoneCount}/{WEEKLY_GROOM_CHECKS.length}
                  </span>
                  {weeklyGroomDoneCount > 0 && (
                    <Button onClick={() => setGroom({ weeklyChecks: {} })}>
                      Reset Week
                    </Button>
                  )}
                </div>
              </div>
              <div className="habit-list jsx-4bb90035">
                {WEEKLY_GROOM_CHECKS.map((wg) => {
                  const checked = Boolean(
                    groom.weeklyChecks && groom.weeklyChecks[wg.id]
                  );
                  return (
                    <div
                      className={`habit-row ${checked ? "checked" : ""}`}
                      key={wg.id}
                    >
                      <button
                        type="button"
                        className="check-circle"
                        onClick={() =>
                          setGroom({
                            weeklyChecks: {
                              ...(groom.weeklyChecks || {}),
                              [wg.id]: !checked,
                            },
                          })
                        }
                      >
                        {checked ? "✓" : ""}
                      </button>
                      <div className="habit-info">
                        <strong>{wg.title}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card>
            <div className="section-head">
              <div>
                <div className="eyebrow">SLIM FRAME CAPSULE WARDROBE</div>
                <h2>
                  Essential pieces &amp; Indian skin tone colours (
                  {wardrobeSummary.ownedCount}/{wardrobeSummary.totalItems}{" "}
                  Owned)
                </h2>
                <p>
                  Best colours:{" "}
                  <strong>
                    Navy Blue, Olive Green, Crisp White, Maroon, Charcoal, Beige
                  </strong>
                  . Check off items you already own to estimate your upgrade
                  budget.
                </p>
              </div>
              <div className="tabs">
                <button
                  type="button"
                  className={budgetTier === "low" ? "selected" : ""}
                  onClick={() => setBudgetTier("low")}
                >
                  Budget Tier
                </button>
                <button
                  type="button"
                  className={budgetTier === "mid" ? "selected" : ""}
                  onClick={() => setBudgetTier("mid")}
                >
                  Mid-Range Tier
                </button>
              </div>
            </div>

            <div className="jsx-a1836c1d">
              <div className="row-between jsx-e7b13069">
                <strong>Closet Readiness ({wardrobeSummary.pct}%)</strong>
                <span>
                  Est. Remaining Upgrade Cost:{" "}
                  <strong>
                    ₹{wardrobeSummary.remainingCost.toLocaleString("en-IN")}
                  </strong>{" "}
                  ({budgetTier === "low" ? "Budget" : "Mid-Range"})
                </span>
              </div>
              <Progress value={wardrobeSummary.pct} />
            </div>

            <div className="table-wrap jsx-4bb90035">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th className="jsx-09bcefcf">Owned</th>
                    <th>
                      Capsule Item (Shoulder seam must sit on shoulder bone)
                    </th>
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
                            className={`check-circle ${
                              isOwned ? "checked" : ""
                            }`}
                            onClick={() =>
                              setGroom({
                                ownedWardrobe: {
                                  ...ownedWardrobe,
                                  [i]: !isOwned,
                                },
                              })
                            }
                          >
                            {isOwned ? "✓" : ""}
                          </button>
                        </td>
                        <td>
                          <strong className={isOwned ? "struck" : ""}>
                            {row.item}
                          </strong>
                        </td>
                        <td>{row.low}</td>
                        <td>{row.mid}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="eyebrow">PROPORTION &amp; VISUAL STRUCTURE</div>
            <h2>4-Point clothing fit audit for slim frames</h2>
            <div className="habit-list jsx-4bb90035">
              {FIT_RULES_CHECKLIST.map((rule) => {
                const checked = Boolean(fitChecks[rule.id]);
                return (
                  <div
                    key={rule.id}
                    className={`habit-row ${checked ? "checked" : ""}`}
                  >
                    <button
                      type="button"
                      className="check-circle"
                      onClick={() =>
                        setGroom({
                          fitChecks: {
                            ...fitChecks,
                            [rule.id]: !checked,
                          },
                        })
                      }
                    >
                      {checked ? "✓" : ""}
                    </button>
                    <div className="habit-info">
                      <strong>{rule.title}</strong>
                      <small>{rule.sub}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export { LooksPage };