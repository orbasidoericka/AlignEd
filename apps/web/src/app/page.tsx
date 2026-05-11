import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit, Building2, ExternalLink, Play, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#F0F8FA] dark:bg-slate-950 overflow-hidden font-sans">
      {/* Background Mesh & Grid (simplified setup) */}
      <div className="absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-amber-100/40 dark:bg-amber-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-teal-200/30 dark:bg-teal-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Navbar */}
      <header className="relative z-50 flex justify-center pt-6 px-4">
        <nav className="flex items-center justify-between w-full max-w-3xl px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-full shadow-lg shadow-slate-200/20 dark:shadow-none">
          <Link href="/" className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Align<span className="text-amber-500">Ed</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/assessment" className="hover:text-brand transition-colors">Assessment</Link>
            <Link href="/directory" className="hover:text-brand transition-colors">University Directory</Link>
            <Link href="/recommendations" className="hover:text-brand transition-colors">Simulations</Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex flex-col items-center px-4 pt-16 pb-24 gap-24">
        {/* 1. Hero Section */}
        <section className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-teal-900/5 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-10 md:p-16">
            <div className="flex flex-col items-start gap-6 justify-center">
              <Badge variant="secondary" className="bg-brand/10 text-brand hover:bg-brand/20 font-semibold px-3 py-1 gap-1.5 border-0">
                <Sparkles className="w-3.5 h-3.5" />
                CAREER DECISION SUPPORT
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                Align Your <span className="text-brand">Passion</span>{" "}
                with Your <span className="text-brand">Profession</span>
              </h1>
              
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                Take a guided assessment, compare universities, and explore realistic career simulations all in one platform built for students.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 w-full sm:w-auto">
                <Link href="/assessment" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto rounded-full bg-brand hover:bg-brand/90 text-white font-semibold" })}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Assessment
                </Link>
                <Link href="/directory" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto rounded-full font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800" })}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse Universities
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[300px]">
              {/* Visual Placeholder */}
              <p className="text-sm font-medium text-slate-400 flex flex-col items-center gap-3">
                <BrainCircuit className="w-10 h-10 opacity-20" />
                [ 3D Scene / Illustration ]
              </p>
            </div>
          </div>
        </section>

        {/* 2. Features Section */}
        <section className="w-full max-w-5xl flex flex-col items-center gap-12">
          <div className="text-center space-y-4 max-w-2xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Everything you need to decide.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Explore the three tools that help you choose your college and career path with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 w-full">
            {/* Asset 1 */}
            <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur text-center flex flex-col items-center pt-8">
              <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">RIASEC Assessment</CardTitle>
                <div className="flex justify-center pt-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 pointer-events-none shadow-none border-0">5 to 10 min quiz</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  Discover if you are Realistic, Investigative, Artistic, Social, Enterprising, or Conventional.
                </CardDescription>
              </CardContent>
              <CardFooter className="w-full pb-8">
                <Link href="/assessment" className={buttonVariants({ variant: "outline", className: "w-full rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" })}>Try Now</Link>
              </CardFooter>
            </Card>

            {/* Asset 2 */}
            <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur text-center flex flex-col items-center pt-8">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">University Directory</CardTitle>
                <div className="flex justify-center pt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 pointer-events-none shadow-none border-0">120+ schools listed</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  Localized database of HEIs in Central Luzon with tuition estimates and course lists.
                </CardDescription>
              </CardContent>
              <CardFooter className="w-full pb-8">
                <Link href="/directory" className={buttonVariants({ variant: "outline", className: "w-full rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" })}>Learn More</Link>
              </CardFooter>
            </Card>

            {/* Asset 3 */}
            <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur text-center flex flex-col items-center pt-8">
              <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Career Simulations</CardTitle>
                <div className="flex justify-center pt-2">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 pointer-events-none shadow-none border-0">Realistic previews</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  Experience your &quot;Future Self&quot; through text narratives and AR previews of professional settings.
                </CardDescription>
              </CardContent>
              <CardFooter className="w-full pb-8">
                <Link href="/recommendations" className={buttonVariants({ variant: "outline", className: "w-full rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" })}>Explore</Link>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 3. CTA Banner */}
        <section className="w-full max-w-4xl bg-slate-900 dark:bg-slate-800/80 rounded-3xl p-10 lg:p-16 text-center flex flex-col items-center gap-8 relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ready to find your path?</h2>
            <p className="text-slate-400 max-w-lg mx-auto text-lg">
              Join other SHS learners in Central Luzon and start your career journey today.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50 backdrop-blur">Free to use</Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50 backdrop-blur">No Sign Up required</Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50 backdrop-blur">5 to 10 minutes</Badge>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
            <Link href="/assessment" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto rounded-full bg-brand hover:bg-brand/90 text-white font-semibold border-0" })}>Get Started Now</Link>
            <Link href="/directory" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto rounded-full font-semibold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white" })}>Learn More</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-200/40 dark:border-slate-800/40 bg-white/50 dark:bg-slate-950/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © 2026 AlignEd | Polytechnic University of the Philippines - Santa Maria Campus
        </p>
      </footer>
    </div>
  );
}
