// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import { Compass, ShieldCheck, Users } from "lucide-react";

import { BlurFade } from "@/components/magic/blur-fade";
import { HeroCta } from "@/components/journey/hero-cta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AlignEd is a free, anonymous career-guidance tool for Filipino students, built on the Holland Code (RIASEC) interest model.",
};

const pillars = [
  {
    title: "Who it is for",
    body: "Students in Grades 7 to 12 across the Philippines: the Grade 12 student narrowing down a college program, and the younger explorer who still has time to choose a path. It is built to work on a budget Android phone and a slow connection.",
    icon: Users,
    wash: "bg-stage-profile-soft",
    chip: "bg-stage-profile text-stage-profile-foreground",
    heading: "text-stage-profile-strong",
  },
  {
    title: "What it does",
    body: "You answer 42 yes-or-no statements about what you enjoy. AlignEd scores them into your three-letter Holland Code (RIASEC), then shows the careers and college programs that match it.",
    icon: Compass,
    wash: "bg-stage-assessment-soft",
    chip: "bg-stage-assessment text-stage-assessment-foreground",
    heading: "text-stage-assessment-strong",
  },
  {
    title: "How we treat your data",
    body: "No accounts and no real names. Your nickname never leaves your device. If you save a result, it is stored without your name, nickname or school, for one year, so you can compare after a retake. We follow the Data Privacy Act of 2012 (RA 10173).",
    icon: ShieldCheck,
    wash: "bg-stage-results-soft",
    chip: "bg-stage-results text-stage-results-foreground",
    heading: "text-stage-results-strong",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-16 pb-10 text-center sm:pt-24">
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
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <ul className="flex flex-col gap-6 md:flex-row md:items-stretch">
          {pillars.map((item, index) => (
            <BlurFade
              key={item.title}
              inView
              delay={index * 0.1}
              className="flex-1"
            >
              <li
                className={cn(
                  "flex h-full flex-col gap-4 rounded-3xl p-7",
                  item.wash,
                )}
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    item.chip,
                  )}
                >
                  <item.icon className="size-6" aria-hidden />
                </span>
                <h2 className={cn("text-xl font-bold", item.heading)}>
                  {item.title}
                </h2>
                <p className="text-base text-pretty text-foreground/80">
                  {item.body}
                </p>
              </li>
            </BlurFade>
          ))}
        </ul>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 pt-6 pb-20 text-center">
        <BlurFade inView>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to see where you fit?
          </h2>
        </BlurFade>
        <BlurFade inView delay={0.08}>
          <HeroCta />
        </BlurFade>
      </section>
    </div>
  );
}
