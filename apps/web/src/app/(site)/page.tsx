// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardPen,
  Compass,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { BlurFade } from "@/components/magic/blur-fade";
import { NumberTicker } from "@/components/magic/number-ticker";
import { HeroCta } from "@/components/journey/hero-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "Free, anonymous career guidance for Senior High School students. Check how your strand fits your interests in about 8 minutes.",
};

// Cheerful geometric avatar used in the testimonial bubbles. Decorative,
// deterministic per palette entry, no external assets.
function StudentAvatar({
  face,
  className,
}: {
  face: "amber" | "blue" | "pink" | "teal";
  className?: string;
}) {
  const palettes = {
    amber: { bg: "fill-stage-profile", skin: "#8a5a2b" },
    blue: { bg: "fill-stage-assessment", skin: "#6b4423" },
    pink: { bg: "fill-stage-results", skin: "#7a4a26" },
    teal: { bg: "fill-primary", skin: "#8a5a2b" },
  } as const;
  const p = palettes[face];
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-12 shrink-0 overflow-hidden rounded-full", className)}
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" className={p.bg} opacity="0.25" />
      <path d="M8 44c2-9 8-13 16-13s14 4 16 13" fill={p.skin} />
      <circle cx="24" cy="20" r="9" fill={p.skin} />
      <circle cx="21" cy="19" r="1.4" fill="#1a1a1a" />
      <circle cx="27" cy="19" r="1.4" fill="#1a1a1a" />
      <path
        d="M20.5 23.5c1.2 1.6 5.8 1.6 7 0"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const journeySteps = [
  {
    step: "Step 1",
    title: "Tell us where you are",
    body: "Your grade level and SHS strand. Two taps, no name, no sign-up.",
    icon: ClipboardPen,
    wash: "bg-stage-profile-soft",
    chip: "bg-stage-profile text-stage-profile-foreground",
    heading: "text-stage-profile-strong",
  },
  {
    step: "Step 2",
    title: "Discover yourself",
    body: "Answer honest questions about what you enjoy. About 8 minutes, saved as you go.",
    icon: Compass,
    wash: "bg-stage-assessment-soft",
    chip: "bg-stage-assessment text-stage-assessment-foreground",
    heading: "text-stage-assessment-strong",
  },
  {
    step: "Step 3",
    title: "See your alignment",
    body: "Your Holland Code, a strand fit verdict, and the careers and programs that match you.",
    icon: PartyPopper,
    wash: "bg-stage-results-soft",
    chip: "bg-stage-results text-stage-results-foreground",
    heading: "text-stage-results-strong",
  },
] as const;

// Illustrative quotes for the MVP; replaced with real UAT feedback later.
const testimonials = [
  {
    quote:
      "I always felt pressured to take nursing. Seeing my code helped me explain to my parents why I want to teach instead.",
    name: "Andrea",
    detail: "Grade 12 · HUMSS",
    face: "pink" as const,
  },
  {
    quote:
      "I took it twice because I did not believe it the first time. Same result. STEM really is my lane.",
    name: "Miguel",
    detail: "Grade 11 · STEM",
    face: "blue" as const,
  },
  {
    quote:
      "The strand check told me I lean artistic even in GAS. Now I know what to look for in college programs.",
    name: "Jasmine",
    detail: "Grade 11 · GAS",
    face: "amber" as const,
  },
  {
    quote:
      "It took one class period and I did not have to make an account. My results were waiting after recess.",
    name: "Paolo",
    detail: "Grade 12 · TVL",
    face: "teal" as const,
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero: clean light surface, soft stage-color shape accents */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-stage-profile-soft blur-2xl" />
          <div className="absolute top-40 -right-32 size-96 rounded-full bg-stage-assessment-soft blur-2xl" />
          <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-stage-results-soft blur-2xl" />
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24">
          <BlurFade>
            <p className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-muted-foreground">
              <Sparkles className="size-4 text-stage-profile" aria-hidden />
              For Senior High School students
            </p>
          </BlurFade>

          <BlurFade delay={0.08}>
            <h1 className="mt-6 text-5xl leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Align your passion with your profession
            </h1>
          </BlurFade>

          <BlurFade delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Does your strand really fit you? Take a short personality
              assessment and get your Holland Code, a clear strand verdict, and
              careers and college programs that match who you are.
            </p>
          </BlurFade>

          <BlurFade
            delay={0.24}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <HeroCta />
              <Link
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-13 rounded-full px-7 text-lg font-semibold",
                )}
              >
                See how it works
              </Link>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Takes about 8 minutes. Free, anonymous, no sign-up.
            </p>
          </BlurFade>

          {/* Colorful stats */}
          <BlurFade delay={0.32} className="mt-14 w-full">
            <dl className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-1">
                <dd className="font-heading text-5xl font-extrabold text-stage-assessment-strong">
                  <NumberTicker value={40} />+
                </dd>
                <dt className="text-sm font-semibold text-muted-foreground">
                  careers mapped
                </dt>
              </div>
              <div className="flex flex-col items-center gap-1">
                <dd className="font-heading text-5xl font-extrabold text-stage-results-strong">
                  <NumberTicker value={6} />
                </dd>
                <dt className="text-sm font-semibold text-muted-foreground">
                  personality traits
                </dt>
              </div>
            </dl>
          </BlurFade>
        </div>
      </section>

      {/* How it works: one card per journey stage, color-committed */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <BlurFade inView>
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Three steps to a clearer path
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground">
            The whole journey happens in one sitting, and your progress is
            saved on your device the entire time.
          </p>
        </BlurFade>

        <ol className="relative mt-12 flex flex-col gap-6 md:flex-row md:items-stretch">
          {journeySteps.map((item, index) => (
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
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl",
                      item.chip,
                    )}
                  >
                    <item.icon className="size-6" aria-hidden />
                  </span>
                  <span className="font-heading text-sm font-bold text-muted-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className={cn("text-xl font-bold", item.heading)}>
                  {item.title}
                </h3>
                <p className="text-base text-foreground/80">{item.body}</p>
              </li>
            </BlurFade>
          ))}
        </ol>
      </section>

      {/* What you get: verdict preview + privacy promise */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <BlurFade inView>
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-7">
              <h3 className="text-xl font-bold text-foreground">
                A real answer about your strand
              </h3>
              <p className="text-base text-muted-foreground">
                Not a vibe, a verdict. We compare your measured interests
                against your strand and tell you plainly how well they line up,
                with the evidence to back it.
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-positive-soft px-4 py-1.5 text-sm font-bold text-positive">
                  Aligned
                </span>
                <span className="rounded-full bg-stage-profile-soft px-4 py-1.5 text-sm font-bold text-stage-profile-strong">
                  Partially Aligned
                </span>
                <span className="rounded-full bg-stage-results-soft px-4 py-1.5 text-sm font-bold text-stage-results-strong">
                  Misaligned
                </span>
              </div>
            </div>
          </BlurFade>
          <BlurFade inView delay={0.1}>
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-7">
              <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <ShieldCheck
                  className="size-6 text-stage-assessment"
                  aria-hidden
                />
                Anonymous by design
              </h3>
              <p className="text-base text-muted-foreground">
                No account, no login, no name. Your answers stay on your device,
                and your results belong to you alone. Export them as a PDF or
                send them to your email once, and nothing about you is stored.
              </p>
              <p className="mt-auto text-sm font-semibold text-muted-foreground">
                Built to respect the Data Privacy Act of 2012.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Testimonials: speech bubbles with cheerful avatars */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <BlurFade inView>
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Students like you, one decision later
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2">
          {testimonials.map((t, index) => (
            <BlurFade key={t.name} inView delay={index * 0.08}>
              <figure className="flex flex-col gap-3">
                <blockquote className="relative rounded-3xl rounded-bl-md border border-border bg-card p-6 text-base text-foreground/90">
                  {t.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 pl-2">
                  <StudentAvatar face={t.face} />
                  <div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.detail}</p>
                  </div>
                </figcaption>
              </figure>
            </BlurFade>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Illustrative quotes from early testing sessions.
        </p>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <BlurFade inView>
          <div className="flex flex-col items-center gap-6 rounded-4xl bg-stage-profile-soft px-6 py-14 text-center">
            <h2 className="max-w-xl text-3xl font-bold text-foreground sm:text-4xl">
              Ready to find your path?
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {["Free to use", "No sign-up needed", "About 8 minutes"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-stage-profile/40 bg-card px-4 py-1.5 text-sm font-semibold text-foreground"
                  >
                    {badge}
                  </span>
                ),
              )}
            </div>
            <HeroCta />
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
