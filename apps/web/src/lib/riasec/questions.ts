// Copyright (c) 2026 EdTech. All rights reserved.

import { QUESTION_TEXT_FIL } from "./questions-fil";
import type { RiasecTrait } from "./types";

export interface RiasecQuestion {
  id: string;
  trait: RiasecTrait;
  text: string;
}

// Production bank (PRD FR-3.1): the 42 statements of the printed RIASEC test,
// reproduced verbatim and kept in printed order — ids are the printed item
// numbers so each entry is checkable against the source. The trait key is
// fixed by the instrument's answer columns: do not reword, reorder, or
// re-assign traits.
export const QUESTIONS: readonly RiasecQuestion[] = [
  { id: "q1", trait: "realistic", text: "I like to work on cars" },
  { id: "q2", trait: "investigative", text: "I like to do puzzles" },
  { id: "q3", trait: "artistic", text: "I am good at working independently" },
  { id: "q4", trait: "social", text: "I like to work in teams" },
  {
    id: "q5",
    trait: "enterprising",
    text: "I am an ambitious person, I set goals for myself",
  },
  {
    id: "q6",
    trait: "conventional",
    text: "I like to organize things, (files, desks/offices)",
  },
  { id: "q7", trait: "realistic", text: "I like to build things" },
  { id: "q8", trait: "artistic", text: "I like to read about art and music" },
  {
    id: "q9",
    trait: "conventional",
    text: "I like to have clear instructions to follow",
  },
  {
    id: "q10",
    trait: "enterprising",
    text: "I like to try to influence or persuade people",
  },
  { id: "q11", trait: "investigative", text: "I like to do experiments" },
  { id: "q12", trait: "social", text: "I like to teach or train people" },
  {
    id: "q13",
    trait: "social",
    text: "I like trying to help people solve their problems",
  },
  { id: "q14", trait: "realistic", text: "I like to take care of animals" },
  {
    id: "q15",
    trait: "conventional",
    text: "I wouldn't mind working 8 hours per day in an office",
  },
  { id: "q16", trait: "enterprising", text: "I like selling things" },
  { id: "q17", trait: "artistic", text: "I enjoy creative writing" },
  { id: "q18", trait: "investigative", text: "I enjoy science" },
  {
    id: "q19",
    trait: "enterprising",
    text: "I am quick to take on new responsibilities",
  },
  { id: "q20", trait: "social", text: "I am interested in healing people" },
  {
    id: "q21",
    trait: "investigative",
    text: "I enjoy trying to figure out how things work",
  },
  {
    id: "q22",
    trait: "realistic",
    text: "I like putting things together or assembling things",
  },
  { id: "q23", trait: "artistic", text: "I am a creative person" },
  { id: "q24", trait: "conventional", text: "I pay attention to details" },
  { id: "q25", trait: "conventional", text: "I like to do filing or typing" },
  {
    id: "q26",
    trait: "investigative",
    text: "I like to analyze things (problems/ situations)",
  },
  {
    id: "q27",
    trait: "artistic",
    text: "I like to play instruments or sing",
  },
  {
    id: "q28",
    trait: "social",
    text: "I enjoy learning about other cultures",
  },
  {
    id: "q29",
    trait: "enterprising",
    text: "I would like to start my own business",
  },
  { id: "q30", trait: "realistic", text: "I like to cook" },
  { id: "q31", trait: "artistic", text: "I like acting in plays" },
  { id: "q32", trait: "realistic", text: "I am a practical person" },
  {
    id: "q33",
    trait: "investigative",
    text: "I like working with numbers or charts",
  },
  {
    id: "q34",
    trait: "social",
    text: "I like to get into discussions about issues",
  },
  {
    id: "q35",
    trait: "conventional",
    text: "I am good at keeping records of my work",
  },
  { id: "q36", trait: "enterprising", text: "I like to lead" },
  { id: "q37", trait: "realistic", text: "I like working outdoors" },
  {
    id: "q38",
    trait: "conventional",
    text: "I would like to work in an office",
  },
  { id: "q39", trait: "investigative", text: "I'm good at math" },
  { id: "q40", trait: "social", text: "I like helping people" },
  { id: "q41", trait: "artistic", text: "I like to draw" },
  { id: "q42", trait: "enterprising", text: "I like to give speeches" },
];

export type QuestionLanguage = "en" | "fil";

// Filipino is built but held back until permission to use the Filipino
// version of the instrument is granted. While false, every language toggle
// renders nothing and stored sessions are forced to English. Flip to true to
// bring the switch back; the translations themselves stay in place.
export const FILIPINO_ENABLED = false;

// The statement as shown in the chosen language. English is the instrument's
// verbatim text; Filipino falls back to it if an id has no translation.
export function questionText(
  question: RiasecQuestion,
  language: QuestionLanguage,
): string {
  if (language === "fil") return QUESTION_TEXT_FIL[question.id] ?? question.text;
  return question.text;
}

export interface AnswerOption {
  value: 0 | 1;
  label: string;
  labelFil: string;
}

// Binary answers (PRD FR-3.2): agreeing scores a point, the printed test's
// filled-in circle. "No" is stored as 0 so it still counts as answered.
export const ANSWER_OPTIONS: readonly AnswerOption[] = [
  { value: 1, label: "Yes", labelFil: "Oo" },
  { value: 0, label: "No", labelFil: "Hindi" },
];

export function answerLabel(
  option: AnswerOption,
  language: QuestionLanguage,
): string {
  return language === "fil" ? option.labelFil : option.label;
}
