// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecTrait } from "./types";

export interface RiasecQuestion {
  id: string;
  trait: RiasecTrait;
  text: string;
}

// Mock-phase bank: 18 items, 3 per trait, written at a Filipino SHS reading
// level. The production bank (30-48 items per PRD FR-3.1) replaces this list
// without changing its shape.
export const QUESTIONS: readonly RiasecQuestion[] = [
  {
    id: "r1",
    trait: "realistic",
    text: "I enjoy fixing things with my hands, like gadgets, bikes, or appliances.",
  },
  {
    id: "r2",
    trait: "realistic",
    text: "I would rather build a project than write a report about it.",
  },
  {
    id: "r3",
    trait: "realistic",
    text: "Working outdoors or with tools sounds better than sitting at a desk all day.",
  },
  {
    id: "i1",
    trait: "investigative",
    text: "I like figuring out why things happen, not just what happened.",
  },
  {
    id: "i2",
    trait: "investigative",
    text: "Solving a hard math or science problem feels satisfying to me.",
  },
  {
    id: "i3",
    trait: "investigative",
    text: "I often look things up on my own just because I am curious.",
  },
  {
    id: "a1",
    trait: "artistic",
    text: "I express myself best through art, music, writing, or design.",
  },
  {
    id: "a2",
    trait: "artistic",
    text: "I enjoy imagining new ideas more than following exact instructions.",
  },
  {
    id: "a3",
    trait: "artistic",
    text: "People say I have a creative or unique way of doing things.",
  },
  {
    id: "s1",
    trait: "social",
    text: "Friends often come to me when they need advice or someone to listen.",
  },
  {
    id: "s2",
    trait: "social",
    text: "I feel energized when I get to help someone learn something new.",
  },
  {
    id: "s3",
    trait: "social",
    text: "I would enjoy a job where I take care of or guide other people.",
  },
  {
    id: "e1",
    trait: "enterprising",
    text: "I like convincing people to support my ideas or join my plans.",
  },
  {
    id: "e2",
    trait: "enterprising",
    text: "Leading a group project excites me more than it scares me.",
  },
  {
    id: "e3",
    trait: "enterprising",
    text: "I can see myself starting my own business someday.",
  },
  {
    id: "c1",
    trait: "conventional",
    text: "I feel calm when my notes, files, and schedule are organized.",
  },
  {
    id: "c2",
    trait: "conventional",
    text: "I am good at following steps carefully without missing details.",
  },
  {
    id: "c3",
    trait: "conventional",
    text: "I enjoy tasks with clear rules, like budgeting or record keeping.",
  },
];

export interface LikertOption {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  emoji: string;
}

export const LIKERT_OPTIONS: readonly LikertOption[] = [
  { value: 1, label: "Not me at all", emoji: "😅" },
  { value: 2, label: "Not really", emoji: "🤔" },
  { value: 3, label: "Somewhat me", emoji: "😐" },
  { value: 4, label: "Mostly me", emoji: "🙂" },
  { value: 5, label: "Totally me", emoji: "🤩" },
];
