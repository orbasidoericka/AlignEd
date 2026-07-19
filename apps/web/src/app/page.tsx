import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  Compass,
  Play,
  Sparkles,
} from "lucide-react";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import {
  HeroHighlight,
  Highlight,
} from "@/components/aceternity/hero-highlight";
import { InfiniteMovingCards } from "@/components/aceternity/infinite-moving-cards";
import { AnimatedShinyText } from "@/components/magic/animated-shiny-text";
import { BlurFade } from "@/components/magic/blur-fade";
import { NumberTicker } from "@/components/magic/number-ticker";
import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const stats = [
  { value: 120, suffix: "+", label: "Central Luzon HEIs" },
  { value: 40, suffix: "+", label: "Courses mapped" },
  { value: 6, suffix: "", label: "Personality traits" },
] as const;

// Illustrative quotes for the MVP; replaced with real UAT feedback later.
const testimonials = [
  {
    quote:
      "I always thought I had to take nursing because of my parents. The assessment showed me why architecture kept pulling at me — and my parents finally understood.",
    name: "Bea, Grade 12",
    title: "STEM strand · Pampanga",
  },
  {
    quote:
      "The directory saved me weeks. I found two universities near Tarlac offering the exact program I was matched with, with tuition I could actually afford.",
    name: "Miguel, Grade 12",
    title: "GAS strand · Tarlac",
  },
  {
    quote:
      "Reading a 'day in the life' of a software developer made it real for me. It stopped being an abstract dream and became a plan.",
    name: "Janella, Grade 11",
    title: "ICT strand · Bulacan",
  },
  {
    quote:
      "I did not even have to sign up. I took the quiz on my phone during break and got my results emailed to me the same day.",
    name: "Carlo, Grade 12",
    title: "HUMSS strand · Nueva Ecija",
  },
  {
    quote:
      "Our counselor recommended it to the whole batch. It gives us a starting point for conversations that used to go nowhere.",
    name: "Denise, Grade 12",
    title: "ABM strand · Zambales",
  },
] as const;

export default function HomePage() {
  return (
    <main className="relative z-10 flex flex-col items-center gap-24 px-4 pt-10 pb-24">
      {/* 1. Hero */}
      <HeroHighlight containerClassName="w-full rounded-3xl py-16 md:py-24">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <AnimatedShinyText className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-3.5 text-accent-strong" />
              Career decision support for SHS students
            </AnimatedShinyText>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground md:text-6xl">
            Align your <Highlight>passion</Highlight> with your{" "}
            <Highlight>profession</Highlight>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Take a guided RIASEC assessment, compare Central Luzon
            universities, and explore realistic career simulations — no account
            needed, results sent straight to your email.
          </p>

          <div className="mt-2 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
            <ShimmerButton
              href="/assessment"
              className="w-full font-semibold sm:w-auto"
            >
              <Play className="size-4" />
              Start the assessment
            </ShimmerButton>
            <Link
              href="/directory"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "w-full rounded-full font-semibold sm:w-auto",
              })}
            >
              Browse universities
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <BlurFade inView delay={0.2} className="mt-8 w-full">
            <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card/80 px-6 py-5 backdrop-blur">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-brand md:text-3xl">
                    <NumberTicker value={stat.value} />
                    {stat.suffix}
                  </dd>
                  <p className="mt-1 text-center text-xs text-muted-foreground md:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </BlurFade>
        </section>
      </HeroHighlight>

      {/* 2. Features bento */}
      <section className="w-full max-w-5xl">
        <BlurFade inView className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need to decide.
          </h2>
          <p className="text-lg text-muted-foreground">
            Three tools that turn confusion into a concrete plan for college
            and beyond.
          </p>
        </BlurFade>

        <BentoGrid>
          <BentoGridItem
            className="md:col-span-2"
            header={
              <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl bg-linear-to-br from-brand/15 via-brand/5 to-transparent">
                <BrainCircuit className="size-10 text-brand" />
              </div>
            }
            icon={<Badge variant="secondary">5–10 minute quiz</Badge>}
            title="RIASEC Personality Assessment"
            description="Answer a short, science-backed questionnaire and discover whether you are Realistic, Investigative, Artistic, Social, Enterprising, or Conventional — and what that means for your future."
          />
          <BentoGridItem
            header={
              <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/15 via-emerald-500/5 to-transparent">
                <Building2 className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            }
            icon={<Badge variant="secondary">120+ schools</Badge>}
            title="University Directory"
            description="A localized database of Central Luzon HEIs with course offerings and tuition estimates."
          />
          <BentoGridItem
            header={
              <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/15 via-purple-500/5 to-transparent">
                <Sparkles className="size-10 text-purple-600 dark:text-purple-400" />
              </div>
            }
            icon={<Badge variant="secondary">Realistic previews</Badge>}
            title="Career Simulations"
            description="Meet your Future Self through day-in-the-life narratives and AR career previews."
          />
          <BentoGridItem
            className="md:col-span-2"
            header={
              <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl bg-linear-to-br from-accent-strong/20 via-accent-strong/5 to-transparent">
                <Compass className="size-10 text-accent-strong" />
              </div>
            }
            icon={<Badge variant="secondary">Anonymous by design</Badge>}
            title="No account. No pressure."
            description="Everything works without signing up. Your answers stay on your device, and your results are forwarded to the email you choose — nothing else is stored about you."
          />
        </BentoGrid>
      </section>

      {/* 3. Testimonials */}
      <section className="w-full max-w-6xl">
        <BlurFade inView className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Students like you, one decision later.
          </h2>
        </BlurFade>
        <InfiniteMovingCards items={[...testimonials]} speed="slow" />
      </section>

      {/* 4. CTA banner */}
      <section className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-foreground p-10 text-center lg:p-16 dark:bg-card">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand/25 to-transparent" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-background md:text-4xl dark:text-foreground">
              Ready to find your path?
            </h2>
            <p className="mx-auto max-w-lg text-lg text-background/70 dark:text-muted-foreground">
              Join other SHS learners in Central Luzon and start your career
              journey today.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {["Free to use", "No sign-up required", "5–10 minutes"].map(
              (label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="border-background/30 bg-background/10 text-background/90 backdrop-blur dark:border-border dark:bg-muted/50 dark:text-foreground"
                >
                  {label}
                </Badge>
              ),
            )}
          </div>

          <ShimmerButton href="/assessment" className="font-semibold">
            Get started now
            <ArrowRight className="size-4" />
          </ShimmerButton>
        </div>
      </section>
    </main>
  );
}
