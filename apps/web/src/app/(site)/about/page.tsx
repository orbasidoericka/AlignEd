// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, Compass, ShieldCheck, Users } from "lucide-react";

import { SectionLink } from "@/components/blocks/section-link";
import { HeroCta } from "@/components/journey/hero-cta";
import { BlurFade } from "@/components/magic/blur-fade";
import {
  HexagonPattern,
  scatterHexagons,
} from "@/components/magic/hexagon-pattern";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AlignEd is a free, anonymous career-guidance tool for Filipino students, built on the Holland Code (RIASEC) interest model by a team of BSIT students from PUP Santa Maria, Bulacan.",
};

const SCHOOL =
  "Polytechnic University of the Philippines, Santa Maria, Bulacan Campus";

// Pointy-top hexagon, the RIASEC shape the rest of the site is built on.
const HEX = "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";

const pillars = [
  {
    title: "Who it is for",
    body: "Students in Grades 7 to 12 across the Philippines: the Grade 12 student narrowing down a college program, and the younger explorer who still has time to choose a path. It is built to work on a budget Android phone and a slow connection.",
    icon: Users,
  },
  {
    title: "What it does",
    body: "You answer 42 yes-or-no statements about what you enjoy. AlignEd scores them into your three-letter Holland Code (RIASEC), then shows the careers and college programs that match it.",
    icon: Compass,
  },
  {
    title: "How we treat your data",
    body: "No accounts and no real names. Your nickname never leaves your device. If you save a result, it is stored without your name, nickname or school, for one year, so you can compare after a retake. We follow the Data Privacy Act of 2012 (RA 10173).",
    icon: ShieldCheck,
  },
] as const;

// One accent per kind of work, from the stage palette (already AA-checked in
// both themes): the frame takes the base fill, the role chip the -strong
// text on the -soft wash.
const roleAccent = {
  lead: {
    frame: "bg-stage-profile",
    chip: "bg-stage-profile-soft text-stage-profile-strong",
  },
  research: {
    frame: "bg-stage-results",
    chip: "bg-stage-results-soft text-stage-results-strong",
  },
  build: {
    frame: "bg-stage-assessment",
    chip: "bg-stage-assessment-soft text-stage-assessment-strong",
  },
} as const;

type TeamMember = {
  name: string;
  role: string;
  accent: keyof typeof roleAccent;
  photo: string;
  bio: string;
  /** Per-photo framing, so every face sits at the same height in its hex. */
  imageClassName?: string;
};

const team: readonly TeamMember[] = [
  {
    name: "Stephanie O. Dulay",
    role: "Project Manager",
    accent: "lead",
    photo: "/about us/stephanie.jpg",
    bio: "Led AlignEd from proposal to launch, keeping the schedule on track and the scope tied to what students actually need.",
  },
  {
    name: "Patricia Mariz P. Bantog",
    role: "Researcher",
    accent: "research",
    photo: "/about us/patricia.jpg",
    bio: "Studied the Holland Code (RIASEC) model and how Filipino students choose careers, grounding the assessment in research.",
  },
  {
    name: "Yvonne Denise D. Penamante",
    role: "Researcher",
    accent: "research",
    photo: "/about us/yvonne.jpg",
    bio: "Gathered and checked the career and college-program information behind each trait, so every result points to a real path.",
  },
  {
    name: "Ericka A. Orbasido",
    role: "Frontend Developer",
    accent: "build",
    photo: "/about us/ericka.png",
    bio: "Designed and built the interface students use, from the landing page to the results dashboard, with budget phones in mind.",
  },
  {
    name: "Winn Jashmir M. Sandiko",
    role: "Backend Developer",
    accent: "build",
    photo: "/about us/winn.jpg",
    bio: "Built the services behind the scenes: saving results without names, the emailed results and the admin records, all within the Data Privacy Act.",
    // His photo has extra white above the head; lift and tighten it.
    imageClassName: "scale-112 -translate-y-[5%]",
  },
];

const heroCells = scatterHexagons({
  count: 8,
  cols: 20,
  rows: 8,
  classNames: [
    "fill-stage-profile dark:fill-stage-profile/60",
    "fill-stage-assessment",
    "fill-stage-results",
  ],
  seed: 11,
});

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="relative isolate overflow-hidden">
        <HexagonPattern
          radius={40}
          gap={4}
          hexagons={heroCells}
          className="-z-10 stroke-primary/35 mask-[linear-gradient(to_bottom,white,white_40%,transparent_92%)] print:hidden dark:stroke-primary/20"
        />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-16 pb-16 text-center sm:pt-24 sm:pb-20">
          <BlurFade>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl">
              Career guidance that starts with you
            </h1>
          </BlurFade>
          <BlurFade delay={0.1}>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
              AlignEd is a free, anonymous web tool that helps Filipino students
              see how their interests line up with careers and college programs.
              It offers options to talk over, not a verdict on your future.
            </p>
          </BlurFade>
          <BlurFade delay={0.18}>
            <SectionLink
              href="#team"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-heading text-sm font-semibold text-foreground shadow-bento transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="hidden sm:inline">
                Built by five BSIT students.
              </span>
              Meet the team
              <ArrowDown className="size-4" aria-hidden />
            </SectionLink>
          </BlurFade>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <BlurFade inView>
          <h2 className="text-3xl font-bold text-balance text-foreground sm:text-4xl">
            What AlignEd is
          </h2>
          <p className="mt-4 max-w-sm text-lg text-pretty text-muted-foreground">
            Three things to know before you start: who it serves, how it works,
            and what happens to your answers.
          </p>
        </BlurFade>

        <BlurFade inView delay={0.08}>
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-bento">
            {pillars.map((item) => (
              <li key={item.title} className="flex gap-5 p-6 sm:p-7">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center bg-stage-assessment text-stage-assessment-foreground",
                    HEX,
                  )}
                >
                  <item.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-base text-pretty text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </BlurFade>
      </section>

      <section
        id="team"
        className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 py-16 outline-none sm:px-6"
      >
        <BlurFade inView>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-balance text-foreground sm:text-4xl">
              Meet the team
            </h2>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">
              Five 4th-year BS Information Technology students from the{" "}
              {SCHOOL}: the people behind AlignEd.
            </p>
          </div>
        </BlurFade>

        <ul className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-14">
          {team.map((member, index) => {
            const accent = roleAccent[member.accent];
            return (
              <li key={member.name} className="w-full max-w-72 sm:w-72">
                <BlurFade inView delay={index * 0.08}>
                  <div className="group flex flex-col items-center text-center">
                    {/* Double hex: clip-path drops borders, so the frame is
                        an accent hex with the photo inset inside it. */}
                    <div
                      className={cn(
                        "relative size-44 p-1.5 transition-[translate,filter] duration-300 ease-out motion-safe:group-hover:-translate-y-1 group-hover:brightness-105",
                        HEX,
                        accent.frame,
                      )}
                    >
                      <div
                        className={cn(
                          "relative size-full overflow-hidden bg-card",
                          HEX,
                        )}
                      >
                        <Image
                          src={member.photo}
                          alt={`Portrait of ${member.name}`}
                          fill
                          sizes="176px"
                          className={cn(
                            "object-cover object-top",
                            member.imageClassName,
                          )}
                        />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-balance text-foreground">
                      {member.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 rounded-full px-3 py-1 font-heading text-sm font-semibold",
                        accent.chip,
                      )}
                    >
                      {member.role}
                    </p>
                    <p className="mt-4 text-base text-pretty text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                </BlurFade>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">
        <BlurFade inView>
          <div className="flex flex-col items-center gap-6 rounded-4xl bg-stage-profile-soft px-6 py-14 text-center">
            <h2 className="max-w-xl text-3xl font-bold text-balance text-foreground sm:text-4xl">
              Ready to see where you fit?
            </h2>
            <HeroCta />
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
