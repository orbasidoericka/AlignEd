// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecLetter } from "./types";

// Official mapping from the "Which Career Pathway is right for you? /
// Results of the RIASEC Test" sheet, transcribed in full. Only two source
// typos were corrected: "persuading and and performing" (E) and
// "detail oriented,organized" (C).
//
// Silent sorting: arrays keep the sheet's own top-to-bottom order. That order
// is not a ranking; the UI renders every item with equal weight and never
// labels any item as a stronger or weaker match.

export interface RiasecPathwayProfile {
  letter: RiasecLetter;
  name: string;
  description: string;
  majors: readonly string[];
  relatedPathways: readonly string[];
}

export const PATHWAYS_SOURCE_TITLE = "Which Career Pathway is right for you?";

export const RIASEC_PATHWAYS: Readonly<
  Record<RiasecLetter, RiasecPathwayProfile>
> = {
  R: {
    letter: "R",
    name: "Realistic",
    description:
      "These people are often good at mechanical or athletic jobs. Good college majors for Realistic people are…",
    majors: [
      "Agriculture",
      "Health Assistant",
      "Computers",
      "Construction",
      "Mechanic/Machinist",
      "Engineering",
      "Food and Hospitality",
    ],
    relatedPathways: [
      "Natural Resources",
      "Health Services",
      "Industrial and Engineering Technology",
      "Arts and Communication",
    ],
  },
  I: {
    letter: "I",
    name: "Investigative",
    description:
      "These people like to watch, learn, analyze and solve problems. Good college majors for Investigative people are…",
    majors: [
      "Marine Biology",
      "Engineering",
      "Chemistry",
      "Zoology",
      "Medicine/Surgery",
      "Consumer Economics",
      "Psychology",
    ],
    relatedPathways: [
      "Health Services",
      "Business",
      "Public and Human Services",
      "Industrial and Engineering Technology",
    ],
  },
  A: {
    letter: "A",
    name: "Artistic",
    description:
      "These people like to work in unstructured situations where they can use their creativity. Good majors for Artistic people are…",
    majors: [
      "Communications",
      "Cosmetology",
      "Fine and Performing Arts",
      "Photography",
      "Radio and TV",
      "Interior Design",
      "Architecture",
    ],
    relatedPathways: ["Public and Human Services", "Arts and Communication"],
  },
  S: {
    letter: "S",
    name: "Social",
    description:
      "These people like to work with other people, rather than things. Good college majors for Social people are…",
    majors: [
      "Counseling",
      "Nursing",
      "Physical Therapy",
      "Travel",
      "Advertising",
      "Public Relations",
      "Education",
    ],
    relatedPathways: ["Health Services", "Public and Human Services"],
  },
  E: {
    letter: "E",
    name: "Enterprising",
    description:
      "These people like to work with others and enjoy persuading and performing. Good college majors for Enterprising people are:",
    majors: [
      "Fashion Merchandising",
      "Real Estate",
      "Marketing/Sales",
      "Law",
      "Political Science",
      "International Trade",
      "Banking/Finance",
    ],
    relatedPathways: [
      "Business",
      "Public and Human Services",
      "Arts and Communication",
    ],
  },
  C: {
    letter: "C",
    name: "Conventional",
    description:
      "These people are very detail oriented, organized and like to work with data. Good college majors for Conventional people are…",
    majors: [
      "Accounting",
      "Court Reporting",
      "Insurance",
      "Administration",
      "Medical Records",
      "Banking",
      "Data Processing",
    ],
    relatedPathways: [
      "Health Services",
      "Business",
      "Industrial and Engineering Technology",
    ],
  },
};

/** Profiles for the given letters, in the order given (the Holland code order). */
export function pathwaysForCode(
  letters: readonly RiasecLetter[],
): RiasecPathwayProfile[] {
  return letters.map((letter) => RIASEC_PATHWAYS[letter]);
}
