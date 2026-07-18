"use client";

import { useMemo, useState, useEffect, useRef, useCallback, type ElementType, type ReactNode, type Dispatch, type SetStateAction } from "react";
import {
Search, ChevronUp, ChevronRight, ChevronLeft, Bookmark,
  Share2, Link2, Play, Check, Flame, X, ArrowLeft, BookOpen, Brain, FileText,
  Layers, SlidersHorizontal, Clock, Users, Star, Stethoscope, Microscope,
  Activity, Bone, HeartPulse, ClipboardList, Sparkles, Flag, Settings, Plus,
  ListChecks, Send, Upload,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */
const C = {
  green: "#58CC02", greenDark: "#46A302",
  blue: "#1CB0F6", blueDark: "#1899D6",
  purple: "#CE82FF", purpleDark: "#A855D6",
  yellow: "#FFC800", yellowDark: "#E0A800",
  red: "#FF4B4B", teal: "#14B8A6",
  ink: "#3C3C3C", sub: "#777777", faint: "#AFAFAF",
  line: "#E5E5E5", bg: "#FFFFFF", wash: "#F7F7F7",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
type Filter = "today" | "week" | "month" | "all" | "bookmarked";
type Tab = "Read" | "Quiz" | "Review" | "Summary" | "Flashcards" | "Custom";
type Reveal = "immediate" | "later";
type Msg = { role: "ai" | "user"; text: string };

interface Exam { id: string; name: string; blurb: string; files: number; color: string; icon: ElementType; }
interface ExamFile { id: string; name: string; author: string; pages: number; color: string; votes: Record<Exclude<Filter, "bookmarked">, number>; }

const EXAMS: Exam[] = [
  { id: "e1", name: "USMLE Step 1", blurb: "Foundations & basic sciences", files: 1284, color: C.purple, icon: Microscope },
  { id: "e2", name: "USMLE Step 2 CK", blurb: "Clinical knowledge", files: 2041, color: C.green, icon: Stethoscope },
  { id: "e3", name: "USMLE Step 3", blurb: "Practice & management", files: 612, color: C.blue, icon: Activity },
  { id: "e4", name: "Shelf Exams", blurb: "Clerkship subject exams", files: 938, color: C.yellow, icon: ClipboardList },
  { id: "e5", name: "COMLEX Level 1", blurb: "Osteopathic foundations", files: 421, color: C.red, icon: Bone },
  { id: "e6", name: "COMLEX Level 2", blurb: "Osteopathic clinical", files: 357, color: C.teal, icon: HeartPulse },
];

const FILES: ExamFile[] = [
  { id: "f1", name: "March Combined", author: "dr_mina", pages: 148, color: C.green, votes: { today: 128, week: 512, month: 1840, all: 6120 } },
  { id: "f2", name: "UWorld IM — Rapid Notes", author: "shelf_slayer", pages: 96, color: C.blue, votes: { today: 96, week: 604, month: 2210, all: 8890 } },
  { id: "f3", name: "Divine Intervention Notes", author: "step2_kween", pages: 72, color: C.purple, votes: { today: 84, week: 431, month: 1975, all: 7402 } },
  { id: "f4", name: "AMBOSS High-Yield Tables", author: "night_float", pages: 54, color: C.yellow, votes: { today: 71, week: 389, month: 1602, all: 5540 } },
  { id: "f5", name: "Emma Holliday IM Review", author: "call_room", pages: 38, color: C.red, votes: { today: 63, week: 502, month: 1710, all: 9120 } },
  { id: "f6", name: "Ethics & Biostats One Pager", author: "p_value", pages: 12, color: C.teal, votes: { today: 58, week: 244, month: 980, all: 3310 } },
  { id: "f7", name: "Surgery Shelf Buzzwords", author: "scrub_tech", pages: 44, color: C.blue, votes: { today: 41, week: 356, month: 1288, all: 4870 } },
  { id: "f8", name: "OME Rapid Review OB/GYN", author: "match_2027", pages: 61, color: C.purple, votes: { today: 33, week: 198, month: 1104, all: 4020 } },
];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Today" }, { key: "week", label: "This week" },
  { key: "month", label: "Last month" }, { key: "all", label: "All time" },
  { key: "bookmarked", label: "Bookmarked" },
];

const TABS: { key: Tab; icon: ElementType }[] = [
  { key: "Read", icon: BookOpen }, { key: "Quiz", icon: Brain }, { key: "Review", icon: ListChecks },
  { key: "Summary", icon: FileText }, { key: "Flashcards", icon: Layers }, { key: "Custom", icon: SlidersHorizontal },
];

const QUESTIONS = [
  { stem: "A 58-year-old man has crushing chest pain and 2 mm ST-elevation in II, III, aVF. Best next step?", options: ["Aspirin + PCI within 90 minutes", "Fibrinolysis regardless of PCI access", "Beta-blocker alone", "Serial troponins only"], correct: 0, explain: "Inferior STEMI with timely PCI available → primary PCI plus aspirin." },
  { stem: "Which ECG finding best localizes an inferior wall MI?", options: ["ST-elevation in V1–V4", "ST-elevation in I and aVL", "ST-elevation in II, III, aVF", "Diffuse ST-depression"], correct: 2, explain: "Leads II, III, aVF face the inferior wall." },
  { stem: "First-line rate control in stable atrial fibrillation with preserved EF?", options: ["IV adenosine", "Beta-blocker", "Digoxin loading", "Immediate DC cardioversion"], correct: 1, explain: "Beta-blockers (or non-DHP calcium channel blockers) are first-line." },
  { stem: "Best step for suspected PE with a low pretest probability?", options: ["CT pulmonary angiography", "V/Q scan", "D-dimer", "Empiric heparin"], correct: 2, explain: "Low pretest probability → D-dimer to rule out." },
  { stem: "Preferred long-term therapy after NSTEMI?", options: ["Aspirin alone", "Dual antiplatelet therapy + high-intensity statin", "Warfarin", "Calcium channel blocker only"], correct: 1, explain: "DAPT plus a high-intensity statin is standard secondary prevention." },
  { stem: "Classic ECG pattern of acute pericarditis?", options: ["Diffuse ST-elevation with PR depression", "Regional ST-elevation", "Peaked T waves", "Delta wave"], correct: 0, explain: "Diffuse ST-elevation with PR depression is characteristic." },
  { stem: "Fastest symptom relief for stable angina?", options: ["Sublingual nitroglycerin", "Oral beta-blocker", "Ranolazine", "Aspirin"], correct: 0, explain: "Sublingual nitroglycerin gives rapid relief of anginal symptoms." },
  { stem: "Warfarin reversal in a patient with major bleeding?", options: ["Vitamin K alone", "4-factor PCC + vitamin K", "Fresh frozen plasma alone", "Protamine"], correct: 1, explain: "Major bleeding → 4-factor PCC plus IV vitamin K." },
  { stem: "Recommended AAA screening?", options: ["CT in all adults over 50", "One-time ultrasound in men 65–75 who ever smoked", "Annual MRI", "No screening"], correct: 1, explain: "One-time ultrasound for men 65–75 with any smoking history." },
  { stem: "Murmur that intensifies with the Valsalva maneuver?", options: ["Aortic stenosis", "Mitral regurgitation", "Hypertrophic cardiomyopathy", "Pulmonic stenosis"], correct: 2, explain: "Reduced preload from Valsalva increases the HOCM murmur." },
  { stem: "First-line antihypertensive in a Black patient without CKD?", options: ["ACE inhibitor", "Thiazide or calcium channel blocker", "Beta-blocker", "Alpha-blocker"], correct: 1, explain: "Thiazides or CCBs are preferred initial agents here." },
  { stem: "Lipid target strategy for secondary prevention?", options: ["Low-intensity statin", "High-intensity statin", "Fibrate", "Niacin"], correct: 1, explain: "High-intensity statin therapy is used for secondary prevention." },
];

const CARDS = [
  { t: "Inferior STEMI — leads?", d: "II, III, aVF" },
  { t: "PCI window vs fibrinolysis", d: "Within 90 minutes" },
  { t: "Anterior STEMI — leads?", d: "V1 – V4" },
  { t: "Warfarin reversal (major bleed)", d: "4-factor PCC + vitamin K" },
  { t: "Acute pericarditis ECG", d: "Diffuse ST-elevation, PR depression" },
  { t: "Valsalva increases which murmur?", d: "Hypertrophic cardiomyopathy" },
  { t: "AAA screening", d: "Ultrasound, men 65–75 ever-smokers" },
  { t: "Stable angina — fast relief", d: "Sublingual nitroglycerin" },
];

const READ_PAGES = [
  { h: "Chapter 1 · Cardiology", body: ["Acute coronary syndromes span unstable angina, NSTEMI, and STEMI along a continuum of plaque rupture and thrombus formation.", "First-line management prioritizes reperfusion. Where PCI is reachable within 90 minutes, it is preferred over fibrinolysis."], key: "ST-elevation in leads II, III, aVF localizes to the inferior wall — check a right-sided ECG for RV involvement." },
  { h: "Chapter 2 · Reperfusion", body: ["Primary PCI restores flow fastest and is the standard of care when a catheterization lab is available in time.", "Adjuncts include dual antiplatelet therapy, anticoagulation, and beta-blockade once the patient is hemodynamically stable."], key: "Door-to-balloon under 90 minutes is the benchmark for primary PCI." },
  { h: "Chapter 3 · Secondary prevention", body: ["After an event, high-intensity statins, DAPT, ACE inhibitors, and beta-blockers reduce recurrence.", "Cardiac rehabilitation and risk-factor control anchor long-term outcomes."], key: "High-intensity statin therapy is standard for secondary prevention." },
];

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
function Chunky({ children, bg, shadow, fg = "#fff", onClick, full, disabled }: {
  children: ReactNode; bg: string; shadow: string; fg?: string; onClick?: () => void; full?: boolean; disabled?: boolean;
}) {
  const [down, setDown] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)} onMouseLeave={() => setDown(false)}
      className="dn-chunky"
      style={{ width: full ? "100%" : undefined, background: disabled ? "#E5E5E5" : bg, color: disabled ? "#AFAFAF" : fg,
        boxShadow: disabled ? "0 4px 0 #CFCFCF" : `0 ${down ? 2 : 4}px 0 ${shadow}`, transform: down ? "translateY(2px)" : "none", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
function LetterTile({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return <span className="dn-tile" style={{ background: color, width: size, height: size, fontSize: size * 0.42, borderRadius: size * 0.28 }}>{name.charAt(0).toUpperCase()}</span>;
}
function AskChip({ onClick }: { onClick: () => void }) {
  return <button className="dn-askchip" onClick={onClick} title="Ask AI" aria-label="Ask AI"><Sparkles size={16} strokeWidth={2.4} /></button>;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.dn-root, .dn-root * { box-sizing: border-box; font-family: 'Nunito', system-ui, -apple-system, sans-serif; }
.dn-root button { font-family: inherit; }
.dn-chunky { border: none; border-radius: 16px; font-weight: 800; font-size: 15px; padding: 12px 20px; letter-spacing: .2px; transition: transform .04s, box-shadow .04s; }
.dn-inline { display: inline-flex; align-items: center; gap: 8px; }
.dn-tile { flex-shrink: 0; display: grid; place-items: center; color: #fff; font-weight: 900; }
.dn-askchip { border: none; background: #F3E8FF; color: ${C.purple}; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
.dn-askchip:hover { background: #EAD9FF; }

/* header */
.dn-header { position: fixed; top: 0; left: 0; right: 0; z-index: 40; background: #fff; border-bottom: 2px solid ${C.line}; }
.dn-header-inner { max-width: 1200px; margin: 0 auto; height: 66px; padding: 0 18px; display: flex; align-items: center; }
.dn-brand { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; }
.dn-logo { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; }
.dn-brand-name { font-size: 21px; font-weight: 900; color: ${C.green}; letter-spacing: -.5px; }
.dn-header-right { display: flex; align-items: center; gap: 14px; margin-left: auto; }
.dn-streak { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; color: ${C.ink}; }
.dn-avatar { width: 36px; height: 36px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 13px; display: grid; place-items: center; }

/* main / hero */
.dn-main { max-width: min(1120px, calc(100% - 36px)); margin: 0 auto; padding: 92px 18px 120px; }
.dn-hero { text-align: center; margin-bottom: 26px; display: flex; flex-direction: column; align-items: center; }
.dn-hero-ic { width: 56px; height: 56px; border-radius: 18px; display: grid; place-items: center; margin-bottom: 14px; }
.dn-title { font-size: 40px; font-weight: 900; letter-spacing: -1px; margin: 0 0 8px; color: ${C.ink}; }
.dn-hero-sub { color: ${C.sub}; font-weight: 700; margin: 0 0 18px; }
.dn-crumb-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: ${C.sub}; font-weight: 800; font-size: 14px; margin-bottom: 8px; }
.dn-crumb-back:hover { color: ${C.ink}; }
.dn-search { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 520px; margin: 8px auto 0; background: #fff; border: 2px solid ${C.line}; border-radius: 18px; padding: 14px 16px; transition: border-color .12s, box-shadow .12s; }
.dn-search:focus-within { border-color: ${C.blue}; box-shadow: 0 0 0 4px #DDF4FF; }
.dn-search input { flex: 1; min-width: 0; border: none; outline: none; font-size: 16px; font-weight: 700; color: ${C.ink}; background: none; }
.dn-search input::placeholder { color: ${C.faint}; font-weight: 600; }
.dn-search-clear { border: none; background: ${C.wash}; border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; cursor: pointer; color: ${C.sub}; flex-shrink: 0; }

/* exam grid */
.dn-exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.dn-exam-card { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; background: #fff; border: 2px solid ${C.line}; border-radius: 20px; padding: 20px; cursor: pointer; transition: transform .06s; }
.dn-exam-card:hover { transform: translateY(-2px); }
.dn-exam-card:active { transform: translateY(2px); box-shadow: 0 2px 0 ${C.line} !important; }
.dn-exam-accent { position: absolute; top: 0; left: 0; right: 0; height: 6px; }
.dn-exam-ic { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; margin: 10px 0 8px; }
.dn-exam-name { font-size: 18px; font-weight: 900; color: ${C.ink}; }
.dn-exam-blurb { font-size: 13px; font-weight: 700; color: ${C.sub}; }
.dn-exam-stat { margin-top: 8px; font-size: 12px; font-weight: 800; color: ${C.faint}; display: inline-flex; align-items: center; gap: 3px; }

/* fab */
.dn-fab { position: fixed; bottom: 26px; right: 26px; z-index: 45; width: 60px; height: 60px; border-radius: 20px; border: none; cursor: pointer; display: grid; place-items: center; transition: transform .05s; }
.dn-fab:active { transform: translateY(3px); }

/* modal */
.dn-modal-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.28); display: grid; place-items: center; padding: 20px; }
.dn-modal { width: 100%; max-width: 400px; background: #fff; border-radius: 22px; padding: 22px; }
.dn-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dn-modal-head b { font-size: 19px; font-weight: 900; }
.dn-drop { border: 2px dashed ${C.line}; border-radius: 16px; padding: 30px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: ${C.sub}; font-weight: 700; font-size: 14px; margin-bottom: 14px; }
.dn-modal-input { width: 100%; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 14px; font-size: 15px; font-weight: 700; color: ${C.ink}; outline: none; margin-bottom: 16px; }
.dn-modal-input:focus { border-color: ${C.blue}; }

/* filter bar */
.dn-filterbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
.dn-periods { display: flex; gap: 4px; background: #fff; border: 2px solid ${C.line}; border-radius: 16px; padding: 4px; overflow-x: auto; scrollbar-width: none; }
.dn-periods::-webkit-scrollbar { display: none; }
.dn-period { border: none; cursor: pointer; padding: 8px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 800; transition: all .1s; white-space: nowrap; }
.dn-selectall { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13.5px; color: ${C.sub}; cursor: pointer; background: none; border: none; white-space: nowrap; flex-shrink: 0; }
.dn-check { width: 20px; height: 20px; border: 2px solid ${C.line}; border-radius: 6px; display: grid; place-items: center; transition: all .1s; }

/* rows */
.dn-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.dn-row { position: relative; display: flex; align-items: center; gap: 14px; border: 2px solid ${C.line}; border-radius: 18px; padding: 12px 14px; background: #fff; transition: border-color .12s, background .12s, box-shadow .12s; }
.dn-row:hover { box-shadow: 0 4px 14px rgba(0,0,0,.05); }
.dn-upvote { flex-shrink: 0; width: 54px; border: 2px solid ${C.line}; border-radius: 14px; background: #fff; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 6px 0; transition: all .1s; }
.dn-upvote:hover { border-color: ${C.green}; }
.dn-upvote b { font-size: 13px; font-weight: 900; }
.dn-file { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; background: none; border: none; cursor: pointer; text-align: left; padding: 0; }
.dn-file-text { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dn-file-name { font-weight: 800; font-size: 16px; color: ${C.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dn-file-meta { font-size: 12.5px; color: ${C.faint}; font-weight: 700; }
.dn-actions { display: flex; align-items: center; gap: 4px; opacity: 0; transform: translateX(6px); transition: opacity .14s, transform .14s; flex-shrink: 0; }
.dn-row:hover .dn-actions { opacity: 1; transform: none; }
.dn-icon-btn { border: none; background: ${C.wash}; color: ${C.sub}; cursor: pointer; width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; transition: background .1s; }
.dn-icon-btn:hover { background: #ECECEC; }
.dn-selbox { flex-shrink: 0; width: 22px; height: 22px; border: 2px solid ${C.line}; border-radius: 7px; display: grid; place-items: center; cursor: pointer; opacity: 0; transition: opacity .12s; }
.dn-row:hover .dn-selbox, .dn-selbox.on { opacity: 1; }
.dn-empty { text-align: center; padding: 50px 20px; color: ${C.sub}; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 10px; }

/* bulk + toast */
.dn-bulk { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 50; background: #fff; border: 2px solid ${C.line}; border-radius: 20px; padding: 12px 12px 12px 20px; display: flex; align-items: center; gap: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
.dn-bulk > span { font-weight: 800; color: ${C.ink}; }
.dn-bulk-actions { display: flex; align-items: center; gap: 10px; }
.dn-bulk-clear { border: none; background: none; color: ${C.sub}; font-weight: 800; cursor: pointer; font-size: 14px; }
.dn-toast { position: fixed; bottom: 22px; right: 22px; z-index: 200; background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 16px; font-weight: 800; color: ${C.ink}; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.12); }

/* ============ full-screen study ============ */
.dn-fs { position: fixed; inset: 0; z-index: 100; background: #fff; display: flex; flex-direction: column; }
.dn-fs-head { flex-shrink: 0; border-bottom: 2px solid ${C.line}; }
.dn-fs-row1 { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.dn-fs-close { width: 40px; height: 40px; border-radius: 12px; border: 2px solid ${C.line}; background: #fff; cursor: pointer; display: grid; place-items: center; color: ${C.sub}; flex-shrink: 0; }
.dn-fs-close:hover { background: ${C.wash}; }
.dn-fs-bk { width: 36px; height: 36px; border: none; background: none; border-radius: 10px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
.dn-fs-bk:hover { background: ${C.wash}; }
.dn-fs-search { flex: 1; max-width: 460px; margin-left: auto; display: flex; align-items: center; gap: 8px; background: ${C.wash}; border: 2px solid transparent; border-radius: 14px; padding: 9px 14px; transition: border-color .12s, background .12s; }
.dn-fs-search:focus-within { background: #fff; border-color: ${C.blue}; }
.dn-fs-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-size: 15px; font-weight: 700; color: ${C.ink}; }
.dn-fs-search input::placeholder { color: ${C.faint}; font-weight: 600; }
.dn-fs-clear { border: none; background: #E5E5E5; border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center; cursor: pointer; color: ${C.sub}; flex-shrink: 0; }
.dn-fs-tabs { display: flex; gap: 4px; padding: 0 14px 10px; overflow-x: auto; scrollbar-width: none; }
.dn-fs-tabs::-webkit-scrollbar { display: none; }
.dn-fs-tab { display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; padding: 9px 14px; border-radius: 12px; font-size: 14px; font-weight: 800; white-space: nowrap; }
.dn-fs-tab:hover { background: ${C.wash}; }
.dn-fs-body { flex: 1; min-height: 0; display: flex; position: relative; }

/* bottom tab bar (mobile/ipad) */
.dn-tabbar { display: none; flex-shrink: 0; border-top: 2px solid ${C.line}; background: #fff; padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); }
.dn-tabbar-btn { flex: 1; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 2px; font-size: 10px; font-weight: 800; border-radius: 12px; }

/* ai fab + chat */
.dn-ai-fab { position: fixed; right: 22px; bottom: 22px; z-index: 110; width: 54px; height: 54px; border-radius: 18px; border: none; cursor: pointer; display: grid; place-items: center; transition: transform .05s; }
.dn-ai-fab:active { transform: translateY(3px); }
.dn-ask-pop { position: fixed; z-index: 130; transform: translate(-50%, -100%); background: ${C.ink}; color: #fff; border: none; border-radius: 12px; padding: 8px 12px; font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.dn-chat { position: fixed; top: 0; right: 0; bottom: 0; z-index: 140; width: 380px; max-width: 100%; background: #fff; border-left: 2px solid ${C.line}; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,.12); }
.dn-chat-head { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 2px solid ${C.line}; }
.dn-chat-head b { font-size: 16px; font-weight: 900; }
.dn-chat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.dn-msg { max-width: 85%; padding: 11px 14px; border-radius: 16px; font-weight: 600; font-size: 14.5px; line-height: 1.5; }
.dn-msg.ai { background: ${C.wash}; color: ${C.ink}; align-self: flex-start; border-bottom-left-radius: 5px; }
.dn-msg.user { background: ${C.blue}; color: #fff; align-self: flex-end; border-bottom-right-radius: 5px; }
.dn-chat-quote { flex-shrink: 0; display: flex; align-items: center; gap: 8px; margin: 0 16px; padding: 8px 12px; background: #F3E8FF; border-left: 3px solid ${C.purple}; border-radius: 8px; font-size: 13px; font-weight: 700; color: ${C.purpleDark}; }
.dn-chat-quote span { flex: 1; }
.dn-chat-quote button { border: none; background: none; cursor: pointer; color: ${C.purpleDark}; display: grid; place-items: center; }
.dn-chat-input { flex-shrink: 0; display: flex; gap: 8px; padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 2px solid ${C.line}; }
.dn-chat-input input { flex: 1; border: 2px solid ${C.line}; border-radius: 14px; padding: 11px 14px; font-size: 15px; font-weight: 600; outline: none; }
.dn-chat-input input:focus { border-color: ${C.purple}; }
.dn-chat-send { width: 44px; height: 44px; border-radius: 14px; border: none; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }

/* read */
.dn-read-fs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dn-progress { height: 8px; background: ${C.wash}; }
.dn-progress span { display: block; height: 100%; border-radius: 0 6px 6px 0; transition: width .3s; }
.dn-read-scroll { flex: 1; overflow-y: auto; }
.dn-read-col { max-width: 680px; margin: 0 auto; padding: 44px 24px; }
.dn-read-col h1 { font-size: 30px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 20px; color: ${C.ink}; }
.dn-read-col p { font-size: 18px; line-height: 1.7; font-weight: 600; color: ${C.ink}; margin: 0 0 18px; }
.dn-read-lead { font-size: 19px !important; }
.dn-callout { border-left: 5px solid; background: ${C.wash}; border-radius: 12px; padding: 16px 18px; margin: 0 0 18px; }
.dn-callout b { display: block; font-size: 12px; letter-spacing: .5px; color: ${C.sub}; margin-bottom: 4px; }
.dn-callout p { font-size: 17px !important; margin: 0 !important; }
.dn-read-foot { flex-shrink: 0; border-top: 2px solid ${C.line}; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; gap: 14px; max-width: 728px; margin: 0 auto; width: 100%; }
.dn-foot-back { display: inline-flex; align-items: center; gap: 4px; border: 2px solid ${C.line}; background: #fff; border-radius: 14px; padding: 11px 16px; font-weight: 800; color: ${C.sub}; cursor: pointer; }
.dn-foot-back:disabled { opacity: .4; cursor: not-allowed; }
.dn-foot-count { font-weight: 800; color: ${C.faint}; font-size: 14px; }
.dn-foot-icon { width: 44px; height: 44px; border-radius: 14px; border: 2px solid ${C.line}; background: #fff; cursor: pointer; display: grid; place-items: center; color: ${C.sub}; flex-shrink: 0; }
.dn-foot-nav { display: flex; align-items: center; gap: 8px; }

/* quiz */
.dn-quiz-fs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dn-quiz-scroll { flex: 1; overflow-y: auto; padding: 22px 24px; }
.dn-q-card { max-width: 680px; margin: 0 auto 18px; border: 2px solid ${C.line}; border-radius: 18px; padding: 20px; }
.dn-q-top { display: flex; align-items: center; justify-content: space-between; }
.dn-q-num { font-size: 12px; font-weight: 900; letter-spacing: 1px; color: ${C.faint}; margin: 0 0 8px; }
.dn-q-flag { border: none; background: none; cursor: pointer; padding: 4px; }
.dn-q-stem { font-size: 17px; font-weight: 800; line-height: 1.45; color: ${C.ink}; margin: 0 0 16px; }
.dn-q-options { display: flex; flex-direction: column; gap: 10px; }
.dn-q-opt { display: flex; align-items: center; gap: 12px; text-align: left; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 14px; font-weight: 700; font-size: 15px; color: ${C.ink}; background: #fff; transition: all .1s; }
.dn-q-key { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; font-weight: 900; font-size: 13px; flex-shrink: 0; }
.dn-q-explain { margin-top: 14px; background: ${C.wash}; border-radius: 12px; padding: 12px 14px; }
.dn-q-explain-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
.dn-q-explain span { font-weight: 600; line-height: 1.5; color: ${C.ink}; }
.dn-reveal-bar { flex-shrink: 0; padding: 12px 24px; border-top: 2px solid ${C.line}; max-width: 728px; margin: 0 auto; width: 100%; }
.dn-quiz-foot { flex-shrink: 0; border-top: 2px solid ${C.line}; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 24px; max-width: 728px; margin: 0 auto; width: 100%; }
.dn-dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.dn-dot { width: 9px; height: 9px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background .1s; }

/* sheet */
.dn-sheet-wrap { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,.28); display: flex; align-items: flex-end; justify-content: center; }
.dn-sheet { width: 100%; max-width: 460px; background: #fff; border-radius: 24px 24px 0 0; padding: 12px 22px calc(22px + env(safe-area-inset-bottom)); }
.dn-sheet-grip { width: 40px; height: 5px; border-radius: 3px; background: ${C.line}; margin: 4px auto 14px; }
.dn-sheet-title { font-size: 18px; font-weight: 900; display: block; margin-bottom: 14px; }
.dn-sheet-label, .nt-sub-label { font-size: 13px; font-weight: 800; color: ${C.sub}; margin: 12px 0 8px; }
.dn-seg { display: flex; gap: 8px; margin-bottom: 8px; }
.dn-seg-btn { flex: 1; border: 2px solid ${C.line}; border-radius: 13px; padding: 11px 10px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all .1s; }
.dn-sheet .dn-chunky { margin-top: 14px; }

/* review */
.dn-rv-filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.dn-rv-filter { display: inline-flex; align-items: center; gap: 7px; border: 2px solid ${C.line}; border-radius: 13px; padding: 8px 12px; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all .1s; }
.dn-rv-count { font-size: 12px; font-weight: 900; padding: 1px 7px; border-radius: 7px; }
.dn-rv-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dn-rv-item { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 13px 14px; cursor: pointer; transition: border-color .12s, box-shadow .12s; }
.dn-rv-item:hover { border-color: ${C.blue}; box-shadow: 0 3px 10px rgba(0,0,0,.05); }
.dn-rv-badge { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.dn-rv-stem { flex: 1; font-weight: 700; font-size: 14.5px; color: ${C.ink}; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dn-rv-viewer { position: fixed; inset: 0; z-index: 120; background: #fff; display: flex; flex-direction: column; }
.dn-rv-vtop { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 2px solid ${C.line}; }
.dn-rv-vbody { flex: 1; overflow-y: auto; padding: 22px 24px; }

/* notion */
.nt-scroll { flex: 1; overflow-y: auto; }
.nt-doc { max-width: 720px; margin: 0 auto; padding: 40px 28px 90px; }
.nt-pageicon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 12px; }
.nt-h1 { font-size: 32px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 4px; color: ${C.ink}; }
.nt-meta { color: ${C.faint}; font-weight: 700; font-size: 13px; margin: 0 0 22px; }
.nt-h2 { font-size: 20px; font-weight: 900; margin: 28px 0 12px; color: ${C.ink}; }
.nt-callout { display: flex; gap: 12px; background: ${C.wash}; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
.nt-callout-ic { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.nt-callout p { margin: 0; font-weight: 700; line-height: 1.5; color: ${C.ink}; }
.nt-bullets { margin: 0; padding-left: 20px; }
.nt-bullets li { font-weight: 600; line-height: 1.6; color: ${C.ink}; margin-bottom: 6px; }
.nt-toggle-head { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; font-weight: 800; color: ${C.ink}; font-size: 15px; }
.nt-toggle-head:hover { background: ${C.wash}; }
.nt-toggle-body { padding: 2px 8px 12px 30px; }
.nt-toggle-body p { margin: 0; font-weight: 600; line-height: 1.6; color: ${C.sub}; }
.nt-checks { list-style: none; margin: 0; padding: 0; }
.nt-checks li { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; font-weight: 700; }
.nt-checks li:hover { background: ${C.wash}; }
.nt-check { width: 20px; height: 20px; border: 2px solid; border-radius: 6px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }

/* quizlet */
.ql-scroll { flex: 1; overflow-y: auto; }
.ql-wrap { max-width: 680px; margin: 0 auto; padding: 32px 24px 90px; }
.ql-card { position: relative; width: 100%; height: 260px; border: none; background: none; cursor: pointer; perspective: 1400px; margin-bottom: 16px; }
.ql-face { position: absolute; inset: 0; border-radius: 22px; display: grid; place-items: center; padding: 28px; font-size: 24px; font-weight: 800; text-align: center; backface-visibility: hidden; transition: transform .5s; }
.ql-face.front { background: #fff; border: 2px solid ${C.line}; color: ${C.ink}; }
.ql-face.back { color: #fff; transform: rotateY(180deg); }
.ql-card.flipped .front { transform: rotateY(180deg); }
.ql-card.flipped .back { transform: rotateY(360deg); }
.ql-tag { position: absolute; top: 18px; left: 0; right: 0; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; color: ${C.faint}; }
.ql-controls { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 34px; }
.ql-count { font-weight: 900; color: ${C.sub}; font-size: 15px; }
.dn-ghost { width: 46px; height: 46px; border-radius: 14px; border: 2px solid ${C.line}; background: #fff; cursor: pointer; display: grid; place-items: center; color: ${C.ink}; }
.ql-list-h { font-size: 18px; font-weight: 900; margin: 0 0 14px; color: ${C.ink}; }
.ql-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.ql-row { display: flex; align-items: center; gap: 18px; background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 16px 18px; }
.ql-term { width: 42%; font-weight: 800; color: ${C.ink}; font-size: 15px; }
.ql-div { width: 2px; align-self: stretch; background: ${C.line}; }
.ql-def { flex: 1; font-weight: 600; color: ${C.sub}; font-size: 15px; }
.ql-fav { border: none; background: none; cursor: pointer; flex-shrink: 0; }

/* custom */
.dn-custom { max-width: 560px; margin: 0 auto; padding: 40px 24px 90px; }
.dn-mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
.dn-mode { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; border: 2px solid ${C.line}; border-radius: 16px; padding: 18px 10px; cursor: pointer; font-weight: 800; color: ${C.ink}; transition: all .1s; }
.dn-mode-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; }
.dn-mode-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 6px; border: 2px solid; display: grid; place-items: center; }
.dn-row-field { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-top: 2px solid ${C.line}; font-weight: 800; color: ${C.ink}; }
.dn-row-field > span { display: inline-flex; align-items: center; gap: 8px; }
.dn-stepper { display: flex; align-items: center; gap: 14px; }
.dn-stepper button { width: 34px; height: 34px; border-radius: 10px; border: 2px solid ${C.line}; background: #fff; font-size: 18px; font-weight: 900; cursor: pointer; color: ${C.ink}; }
.dn-stepper b { min-width: 28px; text-align: center; font-size: 16px; }
.dn-switch { width: 46px; height: 26px; border-radius: 20px; border: none; cursor: pointer; padding: 3px; transition: background .15s; }
.dn-switch span { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .15s; }
.dn-custom .dn-chunky { margin-top: 18px; }


@media (min-width: 900px) {
  .dn-title { font-size: 44px; }
}
/* ---------- responsive: tablets & phones ---------- */
@media (max-width: 1024px) {
  .dn-fs-tabs { display: none; }
  .dn-tabbar { display: flex; }
  .dn-ai-fab { bottom: 84px; }
  .dn-chat { width: 100%; border-left: none; }
}
@media (max-width: 640px) {
  .dn-exam-grid { grid-template-columns: 1fr; }
  .dn-title { font-size: 32px; }
  .dn-filterbar { flex-direction: column; align-items: stretch; gap: 10px; }
  .dn-selectall { justify-content: flex-end; }
  .dn-actions { opacity: 1; transform: none; }
  .dn-hide-sm { display: none; }
  .dn-mode-grid { grid-template-columns: 1fr; }
  .dn-read-col h1 { font-size: 25px; }
  .dn-read-col p, .dn-read-lead { font-size: 16px !important; }
}
`;

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */
export function DrNoteHome() {
  const [page, setPage] = useState<"home" | "exam" | "study">("home");
  const [exam, setExam] = useState<Exam | null>(null);
  const [file, setFile] = useState<ExamFile | null>(null);

  const [filter, setFilter] = useState<Filter>("today");
  const [query, setQuery] = useState("");
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set(["f1", "f4"]));
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const flash = useCallback((m: string) => {
    setToast(m);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1700);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  const openExam = (e: Exam) => { setExam(e); setQuery(""); setPicked(new Set()); setFilter("today"); setPage("exam"); window.scrollTo(0, 0); };
  const openFile = (f: ExamFile) => { setFile(f); setPage("study"); };
  const toggleSaved = (id: string) => { const n = new Set(saved); n.has(id) ? n.delete(id) : n.add(id); setSaved(n); };

  return (
    <div className="dn-root" style={{ background: C.wash, color: C.ink, minHeight: "100vh" }}>
      <style>{styles}</style>

      {page !== "study" && (
        <header className="dn-header">
          <div className="dn-header-inner">
            <button type="button" className="dn-brand" onClick={() => setPage("home")} aria-label="DrNote home">
              <DrNoteLogo showWordmark forceWordmark />
            </button>
            <div className="dn-header-right">
              <span className="dn-streak"><Flame size={18} color={C.yellow} fill={C.yellow} strokeWidth={2} /><b>14</b></span>
              <span className="dn-avatar" style={{ background: C.purple }}>MA</span>
            </div>
          </div>
        </header>
      )}

      {page === "home" && <Home onOpen={openExam} onAdd={() => setAdding(true)} />}

      {page === "exam" && exam && (
        <ExamPage exam={exam} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery}
          voted={voted} setVoted={setVoted} saved={saved} toggleSaved={toggleSaved}
          picked={picked} setPicked={setPicked} onBack={() => setPage("home")} onOpen={openFile} flash={flash} />
      )}

      {page === "study" && file && (
        <Study file={file} saved={saved.has(file.id)} onToggleSave={() => { toggleSaved(file.id); flash(saved.has(file.id) ? "Removed bookmark" : "Bookmarked"); }}
          onClose={() => setPage("exam")} flash={flash} />
      )}

      {adding && <AddFile onClose={() => setAdding(false)} onDone={() => { setAdding(false); flash("File added to review"); }} />}
      {toast && <div className="dn-toast"><Check size={16} strokeWidth={3} color={C.green} /> {toast}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                               */
/* ------------------------------------------------------------------ */
function Home({ onOpen, onAdd }: { onOpen: (e: Exam) => void; onAdd: () => void }) {
  return (
    <main className="dn-main">
      <section className="dn-hero"><h1 className="dn-title">Choose your exam</h1><p className="dn-hero-sub">Browse the community's top files for each board.</p></section>
      <div className="dn-exam-grid">
        {EXAMS.map((e) => {
          const Icon = e.icon;
          return (
            <button key={e.id} className="dn-exam-card" onClick={() => onOpen(e)} style={{ boxShadow: `0 4px 0 ${C.line}` }}>
              <span className="dn-exam-accent" style={{ background: e.color }} />
              <span className="dn-exam-ic" style={{ background: e.color }}><Icon size={26} color="#fff" strokeWidth={2.2} /></span>
              <span className="dn-exam-name">{e.name}</span>
              <span className="dn-exam-blurb">{e.blurb}</span>
              <span className="dn-exam-stat">{e.files.toLocaleString()} files<ChevronRight size={15} strokeWidth={2.6} /></span>
            </button>
          );
        })}
      </div>
      <button className="dn-fab" onClick={onAdd} title="Add a file" aria-label="Add a file" style={{ background: C.green, boxShadow: `0 5px 0 ${C.greenDark}` }}>
        <Plus size={26} color="#fff" strokeWidth={3} />
      </button>
    </main>
  );
}

function AddFile({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="dn-modal-wrap" onClick={onClose}>
      <div className="dn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dn-modal-head"><b>Add a file</b><button className="dn-fs-close" onClick={onClose}><X size={18} strokeWidth={2.8} /></button></div>
        <div className="dn-drop"><Upload size={26} color={C.faint} strokeWidth={2.2} /><span>Drop a PDF here or tap to browse</span></div>
        <input className="dn-modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="File name (e.g. March Combined)" />
        <Chunky bg={C.green} shadow={C.greenDark} full disabled={!name.trim()} onClick={onDone}><span className="dn-inline"><Upload size={16} strokeWidth={2.6} /> Upload file</span></Chunky>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exam page                                                          */
/* ------------------------------------------------------------------ */
function ExamPage(props: {
  exam: Exam; filter: Filter; setFilter: (f: Filter) => void; query: string; setQuery: (s: string) => void;
  voted: Set<string>; setVoted: (s: Set<string>) => void; saved: Set<string>; toggleSaved: (id: string) => void;
  picked: Set<string>; setPicked: (s: Set<string>) => void; onBack: () => void; onOpen: (f: ExamFile) => void; flash: (m: string) => void;
}) {
  const { exam, filter, setFilter, query, setQuery, voted, setVoted, saved, toggleSaved, picked, setPicked, onBack, onOpen, flash } = props;
  const Icon = exam.icon;

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = FILES.filter((f) => !q || f.name.toLowerCase().includes(q) || f.author.toLowerCase().includes(q));
    if (filter === "bookmarked") list = list.filter((f) => saved.has(f.id));
    const per: Exclude<Filter, "bookmarked"> = filter === "bookmarked" ? "all" : filter;
    return list.sort((a, b) => b.votes[per] + (voted.has(b.id) ? 1 : 0) - (a.votes[per] + (voted.has(a.id) ? 1 : 0)));
  }, [query, filter, voted, saved]);

  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); fn(n); };
  const allPicked = picked.size > 0 && picked.size === ranked.length;
  const per: Exclude<Filter, "bookmarked"> = filter === "bookmarked" ? "all" : filter;

  return (
    <main className="dn-main">
      <button className="dn-crumb-back" onClick={onBack}><ArrowLeft size={16} strokeWidth={2.6} /> All exams</button>
      <section className="dn-hero">
        <span className="dn-hero-ic" style={{ background: exam.color }}><Icon size={26} color="#fff" strokeWidth={2.2} /></span>
        <h1 className="dn-title">{exam.name}</h1>
        <div className="dn-search">
          <Search size={20} color={C.faint} strokeWidth={2.4} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search an exam or file…" aria-label="Search files" />
          {query && <button className="dn-search-clear" onClick={() => setQuery("")}><X size={16} strokeWidth={2.6} /></button>}
        </div>
      </section>

      <div className="dn-filterbar">
        <div className="dn-periods">
          {FILTERS.map((p) => (
            <button key={p.key} onClick={() => setFilter(p.key)} className="dn-period"
              style={{ color: filter === p.key ? "#fff" : C.sub, background: filter === p.key ? (p.key === "bookmarked" ? C.blue : C.green) : "transparent", boxShadow: filter === p.key ? `0 3px 0 ${p.key === "bookmarked" ? C.blueDark : C.greenDark}` : "none" }}>
              {p.key === "bookmarked" && <Bookmark size={13} strokeWidth={2.6} fill={filter === p.key ? "#fff" : "none"} style={{ marginRight: 4, verticalAlign: -1 }} />}{p.label}
            </button>
          ))}
        </div>
        <button className="dn-selectall" onClick={() => setPicked(allPicked ? new Set() : new Set(ranked.map((f) => f.id)))}>
          <span className="dn-check" style={{ borderColor: allPicked ? C.green : C.line, background: allPicked ? C.green : "#fff" }}>{allPicked && <Check size={13} color="#fff" strokeWidth={3.5} />}</span>Select all
        </button>
      </div>

      <ul className="dn-list">
        {ranked.map((f) => {
          const isVoted = voted.has(f.id), isSaved = saved.has(f.id), isPicked = picked.has(f.id);
          const count = f.votes[per] + (isVoted ? 1 : 0);
          return (
            <li key={f.id} className="dn-row" style={{ borderColor: isPicked ? C.blue : isSaved ? "#CFE9FF" : C.line, background: isPicked ? "#F0FAFF" : "#fff" }}>
              <button className="dn-upvote" onClick={() => toggle(voted, f.id, setVoted)} style={{ borderColor: isVoted ? C.green : C.line, background: isVoted ? "#EAFBD9" : "#fff", color: isVoted ? C.greenDark : C.sub }} aria-label="Upvote">
                <ChevronUp size={19} strokeWidth={3} /><b>{count.toLocaleString()}</b>
              </button>
              <button className="dn-file" onClick={() => onOpen(f)}>
                <LetterTile name={f.name} color={f.color} />
                <span className="dn-file-text">
                  <span className="dn-file-name">{isSaved && <Bookmark size={13} color={C.blue} fill={C.blue} strokeWidth={2} style={{ marginRight: 5, verticalAlign: -1 }} />}{f.name}</span>
                  <span className="dn-file-meta">{f.author} · {f.pages} pages</span>
                </span>
              </button>
              <div className="dn-actions">
                <button className="dn-icon-btn" onClick={() => onOpen(f)} title="Study"><Play size={16} strokeWidth={2.4} /></button>
                <button className="dn-icon-btn dn-bk" onClick={() => { toggleSaved(f.id); flash(isSaved ? "Removed bookmark" : "Bookmarked"); }} title={isSaved ? "Remove bookmark" : "Bookmark"} style={{ color: isSaved ? C.blueDark : C.sub }}>
                  <Bookmark size={16} strokeWidth={2.4} fill={isSaved ? C.blue : "none"} />
                </button>
                <button className="dn-icon-btn dn-hide-sm" onClick={() => flash("Share link copied")} title="Share"><Share2 size={16} strokeWidth={2.4} /></button>
                <button className="dn-icon-btn dn-hide-sm" onClick={() => flash("Link copied")} title="Copy link"><Link2 size={16} strokeWidth={2.4} /></button>
              </div>
              <button className={`dn-selbox ${isPicked ? "on" : ""}`} onClick={() => toggle(picked, f.id, setPicked)} style={{ borderColor: isPicked ? C.blue : C.line, background: isPicked ? C.blue : "#fff" }} aria-label="Select">
                {isPicked && <Check size={13} color="#fff" strokeWidth={3.5} />}
              </button>
            </li>
          );
        })}
        {ranked.length === 0 && <div className="dn-empty"><Search size={26} color={C.faint} /><p>{filter === "bookmarked" ? "No bookmarked files yet." : `No files match “${query}”.`}</p></div>}
      </ul>

      {picked.size > 0 && (
        <div className="dn-bulk">
          <span><b>{picked.size}</b> selected</span>
          <div className="dn-bulk-actions">
            <button className="dn-bulk-clear" onClick={() => setPicked(new Set())}>Clear</button>
            <Chunky bg={C.green} shadow={C.greenDark} onClick={() => { const first = ranked.find((f) => picked.has(f.id)); if (first) onOpen(first); }}>
              <span className="dn-inline"><Play size={16} fill="#fff" strokeWidth={2.6} /> Study selected</span>
            </Chunky>
          </div>
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Study (full screen)                                                */
/* ------------------------------------------------------------------ */
function Study({ file, saved, onToggleSave, onClose, flash }: {
  file: ExamFile; saved: boolean; onToggleSave: () => void; onClose: () => void; flash: (m: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Read");
  const [query, setQuery] = useState("");

  // shared quiz state (Quiz + Review + Custom)
  const [answers, setAnswers] = useState<Record<number, number>>({ 0: 0, 2: 1, 4: 3 });
  const [flagged, setFlagged] = useState<Set<number>>(new Set([5]));
  const [perPage, setPerPage] = useState(1);
  const [reveal, setReveal] = useState<Reveal>("immediate");

  // AI chat
  const [chatOpen, setChatOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: "Hi! Ask anything about this file — highlight text anywhere or type below." }]);
  const openChat = (q?: string) => { setQuote(q ?? null); setChatOpen(true); };

  // highlight-to-ask
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);
  const onBodyMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length > 2 && sel && sel.rangeCount) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setAsk({ x: r.left + r.width / 2, y: r.top - 6, text });
    } else setAsk(null);
  };

  const searchable = tab === "Quiz" || tab === "Flashcards";

  return (
    <div className="dn-fs">
      <header className="dn-fs-head">
        <div className="dn-fs-row1">
          <button className="dn-fs-close" onClick={onClose} aria-label="Close"><X size={20} strokeWidth={2.8} /></button>
          <LetterTile name={file.name} color={file.color} size={30} />
          <button className="dn-fs-bk" onClick={onToggleSave} title={saved ? "Bookmarked" : "Bookmark"} style={{ color: saved ? C.blueDark : C.sub }}>
            <Bookmark size={18} strokeWidth={2.4} fill={saved ? C.blue : "none"} />
          </button>
          <div className="dn-fs-search">
            <Search size={18} color={C.faint} strokeWidth={2.4} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchable ? `Search ${tab.toLowerCase()}…` : "Search this file…"} aria-label="Search" />
            {query && <button className="dn-fs-clear" onClick={() => setQuery("")}><X size={15} strokeWidth={2.8} /></button>}
          </div>
        </div>
        <nav className="dn-fs-tabs">
          {TABS.map(({ key, icon: Icon }) => (
            <button key={key} className="dn-fs-tab" onClick={() => setTab(key)} style={{ color: tab === key ? C.blueDark : C.faint, background: tab === key ? "#DDF4FF" : "transparent" }}>
              <Icon size={16} strokeWidth={2.4} /><span>{key}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="dn-fs-body" onMouseUp={onBodyMouseUp}>
        {tab === "Read" && <ReadFull file={file} />}
        {tab === "Quiz" && <QuizList query={query} answers={answers} setAnswers={setAnswers} flagged={flagged} setFlagged={setFlagged} perPage={perPage} setPerPage={setPerPage} reveal={reveal} setReveal={setReveal} onAsk={openChat} />}
        {tab === "Review" && <ReviewPane answers={answers} flagged={flagged} setFlagged={setFlagged} onAsk={openChat} />}
        {tab === "Summary" && <SummaryNotion file={file} />}
        {tab === "Flashcards" && <FlashcardsQuizlet query={query} />}
        {tab === "Custom" && <CustomPane reveal={reveal} setReveal={setReveal} flash={flash} />}
      </div>

      {/* iOS-style bottom tab bar (mobile / iPad) */}
      <nav className="dn-tabbar">
        {TABS.map(({ key, icon: Icon }) => (
          <button key={key} className="dn-tabbar-btn" onClick={() => setTab(key)} style={{ color: tab === key ? C.blue : C.faint }}>
            <Icon size={22} strokeWidth={2.3} /><span>{key}</span>
          </button>
        ))}
      </nav>

      {/* Ask-AI floating button (all content) */}
      {!chatOpen && <button className="dn-ai-fab" onClick={() => openChat()} title="Ask AI" aria-label="Ask AI" style={{ background: C.purple, boxShadow: `0 4px 0 ${C.purpleDark}` }}><Sparkles size={22} color="#fff" strokeWidth={2.4} /></button>}

      {/* highlight-to-ask popover */}
      {ask && (
        <button className="dn-ask-pop" style={{ left: ask.x, top: ask.y }} onMouseDown={(e) => e.preventDefault()}
          onClick={() => { openChat(ask.text); setAsk(null); window.getSelection()?.removeAllRanges(); }}>
          <Sparkles size={14} strokeWidth={2.6} /> Ask AI
        </button>
      )}

      {chatOpen && <ChatPanel quote={quote} clearQuote={() => setQuote(null)} msgs={msgs} setMsgs={setMsgs} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

/* ---- AI chat panel ---- */
function ChatPanel({ quote, clearQuote, msgs, setMsgs, onClose }: {
  quote: string | null; clearQuote: () => void; msgs: Msg[]; setMsgs: Dispatch<SetStateAction<Msg[]>>; onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    const q = draft.trim(); if (!q && !quote) return;
    const full = quote ? `“${quote}” — ${q || "explain this"}` : q;
    setMsgs((m) => [...m, { role: "user", text: full }]);
    setDraft(""); clearQuote();
    // TODO: replace this mock with a real call to your AI endpoint.
    setTimeout(() => setMsgs((m) => [...m, { role: "ai", text: "Here's the short version: focus on the highest-yield mechanism first, then the exception. Want me to turn this into a flashcard or a practice question?" }]), 350);
  };

  return (
    <aside className="dn-chat">
      <div className="dn-chat-head"><span className="dn-inline"><Sparkles size={18} color={C.purple} strokeWidth={2.4} /><b>Ask AI</b></span><button className="dn-fs-close" onClick={onClose}><X size={18} strokeWidth={2.8} /></button></div>
      <div className="dn-chat-body">
        {msgs.map((m, i) => <div key={i} className={`dn-msg ${m.role}`}>{m.text}</div>)}
        <div ref={endRef} />
      </div>
      {quote && <div className="dn-chat-quote"><span>{quote.length > 90 ? quote.slice(0, 90) + "…" : quote}</span><button onClick={clearQuote}><X size={13} strokeWidth={3} /></button></div>}
      <div className="dn-chat-input">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a follow-up…" />
        <button className="dn-chat-send" onClick={send} style={{ background: C.purple }} aria-label="Send"><Send size={16} color="#fff" strokeWidth={2.4} /></button>
      </div>
    </aside>
  );
}

/* ---- Read ---- */
function ReadFull({ file }: { file: ExamFile }) {
  const [i, setI] = useState(0);
  const p = READ_PAGES[i];
  const pct = ((i + 1) / READ_PAGES.length) * 100;
  return (
    <div className="dn-read-fs">
      <div className="dn-progress"><span style={{ width: `${pct}%`, background: C.green }} /></div>
      <div className="dn-read-scroll">
        <article className="dn-read-col">
          <h1>{p.h}</h1>
          <p className="dn-read-lead">{p.body[0]}</p>
          <div className="dn-callout" style={{ borderColor: file.color }}><b>Key point</b><p>{p.key}</p></div>
          {p.body.slice(1).map((t, k) => <p key={k}>{t}</p>)}
        </article>
      </div>
      <div className="dn-read-foot">
        <button className="dn-foot-back" disabled={i === 0} onClick={() => setI((v) => v - 1)}><ChevronLeft size={18} strokeWidth={2.8} /> Back</button>
        <span className="dn-foot-count">Page {i + 1} of {READ_PAGES.length}</span>
        <Chunky bg={C.green} shadow={C.greenDark} disabled={i === READ_PAGES.length - 1} onClick={() => setI((v) => v + 1)}><span className="dn-inline">Continue <ChevronRight size={16} strokeWidth={2.8} /></span></Chunky>
      </div>
    </div>
  );
}

/* ---- Quiz ---- */
function QuizList({ query, answers, setAnswers, flagged, setFlagged, perPage, setPerPage, reveal, setReveal, onAsk }: {
  query: string; answers: Record<number, number>; setAnswers: Dispatch<SetStateAction<Record<number, number>>>;
  flagged: Set<number>; setFlagged: Dispatch<SetStateAction<Set<number>>>;
  perPage: number; setPerPage: (n: number) => void; reveal: Reveal; setReveal: (r: Reveal) => void; onAsk: (q: string) => void;
}) {
  const [pageIdx, setPageIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [settings, setSettings] = useState(false);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => QUESTIONS.map((qq, i) => ({ ...qq, idx: i })).filter((qq) => !q || qq.stem.toLowerCase().includes(q)), [q]);
  useEffect(() => { setPageIdx(0); setRevealed(false); }, [q, perPage, reveal]);

  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const start = pageIdx * perPage;
  const slice = list.slice(start, start + perPage);
  const showResult = reveal === "immediate" || revealed;
  const toggleFlag = (i: number) => setFlagged((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div className="dn-quiz-fs">
      <div className="dn-quiz-scroll">
        {slice.length === 0 && <div className="dn-empty" style={{ paddingTop: 40 }}><Search size={26} color={C.faint} /><p>No questions match “{query}”.</p></div>}
        {slice.map((qq) => {
          const idx = qq.idx, picked = answers[idx], answered = picked !== undefined, show = answered && showResult, isFlag = flagged.has(idx);
          return (
            <div key={idx} className="dn-q-card">
              <div className="dn-q-top">
                <p className="dn-q-num">Question {idx + 1}</p>
                <button className="dn-q-flag" onClick={() => toggleFlag(idx)} style={{ color: isFlag ? C.red : C.faint }} title="Flag"><Flag size={16} strokeWidth={2.4} fill={isFlag ? C.red : "none"} /></button>
              </div>
              <h3 className="dn-q-stem">{qq.stem}</h3>
              <div className="dn-q-options">
                {qq.options.map((o, oi) => {
                  const rev = show && oi === qq.correct, wrong = show && picked === oi && oi !== qq.correct, chosen = picked === oi;
                  return (
                    <button key={oi} className="dn-q-opt" disabled={answered && reveal === "immediate"} onClick={() => setAnswers((a) => ({ ...a, [idx]: oi }))}
                      style={{ borderColor: rev ? C.green : wrong ? C.red : chosen ? C.blue : C.line, background: rev ? "#EAFBD9" : wrong ? "#FFECEC" : chosen ? "#EAF7FF" : "#fff", cursor: answered && reveal === "immediate" ? "default" : "pointer" }}>
                      <span className="dn-q-key" style={{ background: rev ? C.green : wrong ? C.red : chosen ? C.blue : C.wash, color: rev || wrong || chosen ? "#fff" : C.sub }}>{String.fromCharCode(65 + oi)}</span>{o}
                    </button>
                  );
                })}
              </div>
              {show && (
                <div className="dn-q-explain">
                  <div className="dn-q-explain-top"><b style={{ color: picked === qq.correct ? C.greenDark : C.red }}>{picked === qq.correct ? "Correct" : "Not quite"}</b><AskChip onClick={() => onAsk(`${qq.stem} — ${qq.explain}`)} /></div>
                  <span>{qq.explain}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reveal === "later" && !revealed && Object.keys(answers).length > 0 && (
        <div className="dn-reveal-bar"><Chunky bg={C.green} shadow={C.greenDark} full onClick={() => setRevealed(true)}>Show answers</Chunky></div>
      )}

      <div className="dn-quiz-foot">
        <button className="dn-foot-icon" onClick={() => setSettings(true)} title="Quiz settings"><Settings size={20} strokeWidth={2.4} /></button>
        <div className="dn-dots">{Array.from({ length: pages }).map((_, d) => <button key={d} onClick={() => setPageIdx(d)} className="dn-dot" style={{ background: d === pageIdx ? C.blue : C.line }} aria-label={`Page ${d + 1}`} />)}</div>
        <div className="dn-foot-nav">
          <button className="dn-foot-back" disabled={pageIdx === 0} onClick={() => setPageIdx((p) => p - 1)}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          <Chunky bg={C.blue} shadow={C.blueDark} disabled={pageIdx === pages - 1} onClick={() => setPageIdx((p) => p + 1)}><span className="dn-inline">Next <ChevronRight size={16} strokeWidth={2.8} /></span></Chunky>
        </div>
      </div>

      {settings && (
        <div className="dn-sheet-wrap" onClick={() => setSettings(false)}>
          <div className="dn-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dn-sheet-grip" />
            <b className="dn-sheet-title">Quiz settings</b>
            <p className="dn-sheet-label">Questions per page</p>
            <div className="dn-seg">{[1, 5, 10].map((n) => <button key={n} onClick={() => setPerPage(n)} className="dn-seg-btn" style={{ background: perPage === n ? C.blue : "#fff", color: perPage === n ? "#fff" : C.sub, borderColor: perPage === n ? C.blue : C.line }}>{n}</button>)}</div>
            <p className="dn-sheet-label">Show answers</p>
            <div className="dn-seg">
              <button onClick={() => setReveal("immediate")} className="dn-seg-btn" style={{ background: reveal === "immediate" ? C.green : "#fff", color: reveal === "immediate" ? "#fff" : C.sub, borderColor: reveal === "immediate" ? C.green : C.line }}>Immediately</button>
              <button onClick={() => setReveal("later")} className="dn-seg-btn" style={{ background: reveal === "later" ? C.green : "#fff", color: reveal === "later" ? "#fff" : C.sub, borderColor: reveal === "later" ? C.green : C.line }}>At the end</button>
            </div>
            <Chunky bg={C.green} shadow={C.greenDark} full onClick={() => setSettings(false)}>Done</Chunky>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Review ---- */
function ReviewPane({ answers, flagged, setFlagged, onAsk }: {
  answers: Record<number, number>; flagged: Set<number>; setFlagged: Dispatch<SetStateAction<Set<number>>>; onAsk: (q: string) => void;
}) {
  type RF = "all" | "correct" | "incorrect" | "flagged";
  const [rf, setRf] = useState<RF>("all");
  const [open, setOpen] = useState<number | null>(null);

  const attempted = QUESTIONS.map((q, i) => ({ ...q, idx: i })).filter((q) => answers[q.idx] !== undefined || flagged.has(q.idx));
  const list = attempted.filter((q) => {
    const a = answers[q.idx];
    if (rf === "correct") return a === q.correct;
    if (rf === "incorrect") return a !== undefined && a !== q.correct;
    if (rf === "flagged") return flagged.has(q.idx);
    return true;
  });
  const counts = {
    all: attempted.length,
    correct: attempted.filter((q) => answers[q.idx] === q.correct).length,
    incorrect: attempted.filter((q) => answers[q.idx] !== undefined && answers[q.idx] !== q.correct).length,
    flagged: attempted.filter((q) => flagged.has(q.idx)).length,
  };
  const filters: { k: RF; label: string }[] = [{ k: "all", label: "All" }, { k: "correct", label: "Correct" }, { k: "incorrect", label: "Incorrect" }, { k: "flagged", label: "Flagged" }];

  // full-screen viewer
  if (open !== null) {
    const pos = list.findIndex((q) => q.idx === open);
    const cur = list[pos] ?? list[0];
    const a = answers[cur.idx];
    const move = (d: number) => { const n = list[(pos + d + list.length) % list.length]; setOpen(n.idx); };
    const isFlag = flagged.has(cur.idx);
    return (
      <div className="dn-rv-viewer">
        <div className="dn-rv-vtop">
          <button className="dn-foot-back" onClick={() => setOpen(null)}><ChevronLeft size={18} strokeWidth={2.8} /> Back to list</button>
          <span className="dn-foot-count">{pos + 1} of {list.length}</span>
          <button className="dn-q-flag" onClick={() => setFlagged((s) => { const n = new Set(s); n.has(cur.idx) ? n.delete(cur.idx) : n.add(cur.idx); return n; })} style={{ color: isFlag ? C.red : C.faint }}><Flag size={18} strokeWidth={2.4} fill={isFlag ? C.red : "none"} /></button>
        </div>
        <div className="dn-rv-vbody">
          <div className="dn-q-card" style={{ maxWidth: 680, margin: "0 auto" }}>
            <p className="dn-q-num">Question {cur.idx + 1}</p>
            <h3 className="dn-q-stem">{cur.stem}</h3>
            <div className="dn-q-options">
              {cur.options.map((o, oi) => {
                const rev = oi === cur.correct, wrong = a === oi && oi !== cur.correct;
                return (
                  <div key={oi} className="dn-q-opt" style={{ borderColor: rev ? C.green : wrong ? C.red : C.line, background: rev ? "#EAFBD9" : wrong ? "#FFECEC" : "#fff" }}>
                    <span className="dn-q-key" style={{ background: rev ? C.green : wrong ? C.red : C.wash, color: rev || wrong ? "#fff" : C.sub }}>{String.fromCharCode(65 + oi)}</span>{o}
                  </div>
                );
              })}
            </div>
            <div className="dn-q-explain"><div className="dn-q-explain-top"><b style={{ color: a === cur.correct ? C.greenDark : C.red }}>{a === undefined ? "Not answered" : a === cur.correct ? "You got it right" : "You missed this"}</b><AskChip onClick={() => onAsk(`${cur.stem} — ${cur.explain}`)} /></div><span>{cur.explain}</span></div>
          </div>
        </div>
        <div className="dn-read-foot">
          <button className="dn-foot-back" onClick={() => move(-1)}><ChevronLeft size={18} strokeWidth={2.8} /> Prev</button>
          <span className="dn-foot-count">Browse</span>
          <Chunky bg={C.blue} shadow={C.blueDark} onClick={() => move(1)}><span className="dn-inline">Next <ChevronRight size={16} strokeWidth={2.8} /></span></Chunky>
        </div>
      </div>
    );
  }

  return (
    <div className="nt-scroll">
      <div className="nt-doc">
        <h1 className="nt-h1">Review</h1>
        <p className="nt-meta">{attempted.length} attempted · tap one to open</p>
        <div className="dn-rv-filters">
          {filters.map((f) => (
            <button key={f.k} onClick={() => setRf(f.k)} className="dn-rv-filter" style={{ background: rf === f.k ? C.ink : "#fff", color: rf === f.k ? "#fff" : C.sub, borderColor: rf === f.k ? C.ink : C.line }}>
              {f.label}<span className="dn-rv-count" style={{ background: rf === f.k ? "rgba(255,255,255,.22)" : C.wash, color: rf === f.k ? "#fff" : C.faint }}>{counts[f.k]}</span>
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="dn-empty" style={{ paddingTop: 30 }}><ListChecks size={26} color={C.faint} /><p>Nothing here yet — answer or flag questions in the Quiz tab.</p></div>
        ) : (
          <ul className="dn-rv-list">
            {list.map((q) => {
              const a = answers[q.idx], right = a === q.correct, isFlag = flagged.has(q.idx);
              return (
                <li key={q.idx}><button className="dn-rv-item" onClick={() => setOpen(q.idx)}>
                  <span className="dn-rv-badge" style={{ background: a === undefined ? C.faint : right ? C.green : C.red }}>{a === undefined ? <Flag size={13} color="#fff" strokeWidth={2.6} /> : right ? <Check size={14} color="#fff" strokeWidth={3.5} /> : <X size={14} color="#fff" strokeWidth={3.5} />}</span>
                  <span className="dn-rv-stem">{q.stem}</span>
                  {isFlag && <Flag size={15} color={C.red} fill={C.red} strokeWidth={2} style={{ flexShrink: 0 }} />}
                  <ChevronRight size={17} color={C.faint} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                </button></li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---- Summary (Notion-style) ---- */
function NotionToggle({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nt-toggle">
      <button className="nt-toggle-head" onClick={() => setOpen((o) => !o)}><ChevronRight size={16} strokeWidth={2.6} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} /><span>{title}</span></button>
      {open && <div className="nt-toggle-body">{children}</div>}
    </div>
  );
}
function SummaryNotion({ file }: { file: ExamFile }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const checks = ["Localize STEMI by lead groups", "Know the 90-minute PCI window", "Recall DAPT + statin for prevention", "Right-sided ECG in inferior MI"];
  return (
    <div className="nt-scroll">
      <div className="nt-doc">
        <div className="nt-pageicon" style={{ background: file.color }}><FileText size={22} color="#fff" strokeWidth={2.2} /></div>
        <h1 className="nt-h1">{file.name} — Summary</h1>
        <p className="nt-meta">Auto-generated · {file.pages} pages condensed</p>
        <div className="nt-callout"><span className="nt-callout-ic" style={{ background: C.yellow }}><Star size={14} color="#fff" fill="#fff" /></span><p>Reperfusion timing is the single highest-yield concept in this set — anchor everything else to it.</p></div>
        <h2 className="nt-h2">Key takeaways</h2>
        <ul className="nt-bullets">
          <li>ST-elevation localizes by lead group: inferior (II, III, aVF), anterior (V1–V4), lateral (I, aVL, V5–V6).</li>
          <li>PCI within 90 minutes beats fibrinolysis when a cath lab is reachable.</li>
          <li>Dual antiplatelet therapy plus anticoagulation is standard adjunctive care.</li>
        </ul>
        <h2 className="nt-h2">Expand for detail</h2>
        <NotionToggle title="STEMI vs NSTEMI — how to tell"><p>STEMI shows persistent ST-elevation and needs emergent reperfusion. NSTEMI shows ST-depression or T-wave changes with positive troponin, managed with early invasive or ischemia-guided strategies.</p></NotionToggle>
        <NotionToggle title="Adjunctive medications at a glance"><p>Aspirin, a P2Y12 inhibitor, anticoagulation, high-intensity statin, and beta-blockade once stable — plus an ACE inhibitor when EF is reduced.</p></NotionToggle>
        <h2 className="nt-h2">Checklist</h2>
        <ul className="nt-checks">
          {checks.map((c, i) => { const on = done.has(i); return (
            <li key={i}><button className="nt-check" onClick={() => { const n = new Set(done); on ? n.delete(i) : n.add(i); setDone(n); }} style={{ borderColor: on ? C.green : C.faint, background: on ? C.green : "#fff" }}>{on && <Check size={12} color="#fff" strokeWidth={3.5} />}</button><span style={{ color: on ? C.faint : C.ink, textDecoration: on ? "line-through" : "none" }}>{c}</span></li>
          ); })}
        </ul>
      </div>
    </div>
  );
}

/* ---- Flashcards (Quizlet-style) ---- */
function FlashcardsQuizlet({ query }: { query: string }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fav, setFav] = useState<Set<number>>(new Set());
  const q = query.trim().toLowerCase();
  const list = useMemo(() => CARDS.map((c, orig) => ({ ...c, orig })).filter((c) => !q || c.t.toLowerCase().includes(q) || c.d.toLowerCase().includes(q)), [q]);
  useEffect(() => { setI(0); setFlipped(false); }, [q]);
  if (list.length === 0) return <div className="ql-scroll"><div className="ql-wrap"><div className="dn-empty" style={{ paddingTop: 60 }}><Search size={26} color={C.faint} /><p>No cards match “{query}”.</p></div></div></div>;
  const cur = list[Math.min(i, list.length - 1)];
  const next = (d: number) => { setFlipped(false); setI((v) => (v + d + list.length) % list.length); };
  return (
    <div className="ql-scroll">
      <div className="ql-wrap">
        <button className={`ql-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
          <span className="ql-face front"><span className="ql-tag">TERM</span>{cur.t}</span>
          <span className="ql-face back" style={{ background: C.green }}><span className="ql-tag" style={{ color: "#DFFFC2" }}>DEFINITION</span>{cur.d}</span>
        </button>
        <div className="ql-controls"><button className="dn-ghost" onClick={() => next(-1)}><ChevronLeft size={20} strokeWidth={2.6} /></button><span className="ql-count">{Math.min(i, list.length - 1) + 1} / {list.length}</span><button className="dn-ghost" onClick={() => next(1)}><ChevronRight size={20} strokeWidth={2.6} /></button></div>
        <h3 className="ql-list-h">Terms in this set ({list.length})</h3>
        <ul className="ql-list">
          {list.map((c) => { const on = fav.has(c.orig); return (
            <li key={c.orig} className="ql-row"><span className="ql-term">{c.t}</span><span className="ql-div" /><span className="ql-def">{c.d}</span>
              <button className="ql-fav" onClick={() => { const n = new Set(fav); on ? n.delete(c.orig) : n.add(c.orig); setFav(n); }} style={{ color: on ? C.yellowDark : C.faint }} aria-label="Favorite"><Star size={17} strokeWidth={2.2} fill={on ? C.yellow : "none"} /></button>
            </li>
          ); })}
        </ul>
      </div>
    </div>
  );
}

/* ---- Custom ---- */
function CustomPane({ reveal, setReveal, flash }: { reveal: Reveal; setReveal: (r: Reveal) => void; flash: (m: string) => void }) {
  const modes = [{ k: "Quiz", icon: Brain, c: C.blue }, { k: "Flashcards", icon: Layers, c: C.purple }, { k: "Summary", icon: FileText, c: C.yellow }];
  const [on, setOn] = useState<Set<string>>(new Set(["Quiz"]));
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(true);
  return (
    <div className="nt-scroll">
      <div className="dn-custom">
        <h2 className="nt-h2" style={{ marginTop: 0 }}>Build a session</h2>
        <div className="dn-mode-grid">
          {modes.map(({ k, icon: Icon, c }) => { const active = on.has(k); return (
            <button key={k} className="dn-mode" onClick={() => { const n = new Set(on); n.has(k) ? n.delete(k) : n.add(k); setOn(n); }} style={{ borderColor: active ? c : C.line, background: active ? "#fff" : C.wash }}>
              <span className="dn-mode-ic" style={{ background: c }}><Icon size={18} color="#fff" strokeWidth={2.4} /></span>{k}
              <span className="dn-mode-check" style={{ borderColor: active ? c : C.line, background: active ? c : "#fff" }}>{active && <Check size={12} color="#fff" strokeWidth={3.5} />}</span>
            </button>
          ); })}
        </div>
        <p className="nt-sub-label">Show answers</p>
        <div className="dn-seg" style={{ marginBottom: 4 }}>
          <button onClick={() => setReveal("immediate")} className="dn-seg-btn" style={{ background: reveal === "immediate" ? C.green : "#fff", color: reveal === "immediate" ? "#fff" : C.sub, borderColor: reveal === "immediate" ? C.green : C.line }}>Directly</button>
          <button onClick={() => setReveal("later")} className="dn-seg-btn" style={{ background: reveal === "later" ? C.green : "#fff", color: reveal === "later" ? "#fff" : C.sub, borderColor: reveal === "later" ? C.green : C.line }}>Later</button>
        </div>
        <div className="dn-row-field"><span><Users size={16} strokeWidth={2.4} /> Questions</span><div className="dn-stepper"><button onClick={() => setCount((c) => Math.max(5, c - 5))}>−</button><b>{count}</b><button onClick={() => setCount((c) => Math.min(60, c + 5))}>+</button></div></div>
        <div className="dn-row-field"><span><Clock size={16} strokeWidth={2.4} /> Timed mode</span><button className="dn-switch" onClick={() => setTimed((t) => !t)} style={{ background: timed ? C.green : C.line }}><span style={{ transform: timed ? "translateX(20px)" : "translateX(0)" }} /></button></div>
        <Chunky bg={C.green} shadow={C.greenDark} full disabled={on.size === 0} onClick={() => flash("Custom session started")}><span className="dn-inline"><Play size={16} fill="#fff" strokeWidth={2.6} /> Start session</span></Chunky>
      </div>
    </div>
  );
}

