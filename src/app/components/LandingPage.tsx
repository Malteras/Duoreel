import { useNavigate, Navigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Film,
  ThumbsUp,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  LinkIcon,
  Star,
  FileText,
} from "lucide-react";
import { Heart } from "lucide-react";
import duoReelLogo from "figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png";
import appScreenshot from "figma:asset/b93eb9190ee818e6e3f0c5e4e02a1b41573eb5df.png";
import matchesScreenshot from "figma:asset/f99272690cff28ce969229dfd7b06bc1656eb9a2.png";
import twoHoursLater from "figma:asset/0d9cdcfe1e0abe10063defa7d62be273fa090bad.png";
import grandBudapestCard from "figma:asset/315a25f13c2a9fe5a43cfc015139edb8155d5420.png";
import duoReelMatchHeart from "figma:asset/1de8a8f1f163270e2734dea06481c2638f51aedc.png";

export function LandingPage() {
  const navigate = useNavigate();
  const { accessToken, loading } = useAuth();
  const onGetStarted = () => navigate("/login");

  const [whyDuoReelVisible, setWhyDuoReelVisible] =
    useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const whyRef = useRef<HTMLDivElement>(null);

  // Scroll animation for How It Works
  useEffect(() => {
    const elements = document.querySelectorAll(
      ".fade-on-scroll",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Dedicated observer for Why DuoReel coordinated animation
  useEffect(() => {
    const el = whyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWhyDuoReelVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Redirect logged-in users straight into the app
  if (!loading && accessToken)
    return <Navigate to="/discover" replace />;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      style={{ minHeight: "100dvh" }}
    >
      {/* Fixed Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={duoReelMatchHeart}
                alt="DuoReel"
                className="h-7 md:h-10 w-auto"
              />
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white">
                  <span className="text-pink-400">Duo</span>Reel
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  Find movies you both love
                </p>
              </div>
            </div>

            {/* Navigation Links — desktop only */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </a>
              <a
                href="#why-duoreel"
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Why DuoReel
              </a>
              <a
                href="#features"
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Features
              </a>
              <Button
                onClick={onGetStarted}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold cursor-pointer"
              >
                Sign In
              </Button>
            </nav>

            {/* Mobile — always visible Sign In button */}
            <button
              onClick={onGetStarted}
              className="md:hidden bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center min-h-[90vh]">
        {/* Left column: text + CTAs */}
        <div>
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-pink-600/10 border border-pink-500/30 text-pink-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 animate-fade-in-up"
            style={{ animationDelay: "0s" }}
          >
            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
            Free for couples
          </div>

          <h1
            className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-5 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            No more
            <br />
            &ldquo;
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #db2777, #a78bfa)",
              }}
            >
              What should
              <br />
              we watch?
            </span>
            &rdquo;
          </h1>

          <p
            className="text-lg text-slate-400 leading-relaxed mb-8 max-w-md animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Browse movies independently, match with your
            partner, and discover what you&apos;ll{" "}
            <strong className="text-slate-200">both</strong>{" "}
            love — in under 2 minutes.
          </p>

          <div
            className="flex flex-wrap items-center gap-4 mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              size="lg"
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold gap-2 cursor-pointer"
              onClick={onGetStarted}
            >
              Get Started Free <ArrowRight className="size-4" />
            </Button>
          </div>

          <div
            className="flex flex-wrap gap-3 mb-4 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {(
              [
                "Free forever",
                "No credit card",
                "2-min setup",
              ] as const
            ).map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-800/60 border border-slate-700/50 px-3 py-1 rounded-full"
              >
                <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />{" "}
                {t}
              </span>
            ))}
          </div>

          <p
            className="text-sm text-slate-400 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            Already have an account?{" "}
            <button
              onClick={onGetStarted}
              className="text-blue-400 hover:text-blue-300 hover:underline bg-transparent border-none cursor-pointer p-0 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Right column: app screenshot */}
        <div
          className="hidden md:flex items-center justify-center animate-fade-in-up"
          style={{
            animation: "fadeInUp 0.8s ease-out 0.3s both",
          }}
        >
          <div className="relative">
            {/* Diffuse glow layer — wide, soft */}
            <div className="absolute -inset-8 bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-blue-500/10 rounded-3xl blur-3xl" />
            {/* Tight inner glow for the "lit edge" feel */}
            <div className="absolute -inset-2 bg-gradient-to-br from-pink-400/20 via-purple-400/15 to-transparent rounded-2xl blur-xl" />
            {/* Gradient border wrapper */}
            <div
              className="relative p-[1.5px] rounded-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236,72,153,0.55) 0%, rgba(168,85,247,0.35) 50%, rgba(99,102,241,0.2) 100%)",
                transform:
                  "perspective(1200px) rotateY(-3deg) rotateX(1.5deg)",
                transition: "transform 0.5s ease",
                boxShadow:
                  "0 0 32px 4px rgba(236,72,153,0.18), 0 0 80px 8px rgba(168,85,247,0.10)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform =
                  "perspective(1200px) rotateY(-1deg) rotateX(0.5deg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  "perspective(1200px) rotateY(-3deg) rotateX(1.5deg)")
              }
            >
              <div className="rounded-[14px] overflow-hidden shadow-2xl shadow-slate-950/80">
                <img
                  src={appScreenshot}
                  alt="DuoReel app showing the Discover tab with movie cards featuring bookmark save buttons, genre filters, TMDb and IMDb ratings, and director filtering"
                  className="w-full block brightness-[0.92] saturate-[1.05]"
                />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-nowrap justify-center items-center gap-4 sm:gap-16">
          {/* Stat 1 — Couples */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-pink-600/15 border border-pink-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-pink-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg md:text-2xl font-bold text-white leading-none">
                  500+
                </span>
                <div className="relative group/tip">
                  <svg
                    className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-default transition-colors shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path
                      d="M12 16v-4M12 8h.01"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-60 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2.5 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 leading-relaxed shadow-xl">
                    It&apos;s actually just my girlfriend and me
                    at the moment, but 500+ looks better 🤫
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-700" />
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-slate-400 mt-0.5">
                couples matched
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-700/60" />

          {/* Stat 2 — Movies */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="2"
                />
                <path d="M7 2v20M17 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-white leading-none">
                1.3M+
              </div>
              <div className="text-xs md:text-sm text-slate-400 mt-0.5">
                movies to discover
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-700/60" />

          {/* Stat 3 — Free */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-green-600/15 border border-green-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-white leading-none">
                100%
              </div>
              <div className="text-xs md:text-sm text-slate-400 mt-0.5">
                free, forever
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
        {/* ── HOW IT WORKS ── */}
        <div
          id="how-it-works"
          className="mb-16 max-w-6xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
            Three steps to movie night
          </h2>
          <p className="text-slate-400 text-base max-w-md mb-3">
            No app install, no credit card. Share your invite
            link with your partner and start discovering.
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full" />
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto mb-32 relative">
          {/* Background glow blobs */}
          <div className="hidden lg:block absolute -left-20 top-0 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="hidden lg:block absolute -right-20 top-80 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          {/* Vertical connector line */}
          <div
            className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-pink-500/50 via-purple-500/30 to-blue-500/20 hidden md:block"
            aria-hidden="true"
          />

          {/* ── STEP 1: Connect ── */}
          <div className="relative flex gap-4 md:gap-8 mb-14">
            <div
              className="flex-shrink-0 z-10 fade-on-scroll"
              style={{ transitionDelay: "0s" }}
            >
              <div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/40">
                <span className="text-white text-sm md:text-2xl font-bold">
                  1
                </span>
              </div>
            </div>
            <div className="flex-1 pt-3">
              <h3
                className="text-2xl font-bold text-white mb-2 fade-on-scroll"
                style={{ transitionDelay: "0.08s" }}
              >
                Connect
              </h3>
              <p
                className="text-slate-300 leading-relaxed mb-5 max-w-lg fade-on-scroll"
                style={{ transitionDelay: "0.16s" }}
              >
                Create a free account and share your invite link
                with your partner. They open the link, create
                their account, and you're connected — takes 2
                minutes, no app install needed.
              </p>
              {/* Invite link mockup */}
              <div
                className="backdrop-blur-lg rounded-xl border border-slate-600/50 bg-slate-900/50 p-4 max-w-full md:max-w-sm fade-on-scroll"
                style={{ transitionDelay: "0.24s" }}
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
                  Share Your Invite Link
                </p>
                <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/40 rounded-lg px-3 py-2 text-cyan-400 font-mono text-xs mb-3">
                  <svg
                    className="size-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  duoreel.com/invite/a8f3k2...
                </div>
                <button className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-semibold cursor-default pointer-events-none">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Link
                </button>
              </div>
              <p
                className="text-xs text-slate-400 italic mt-3 fade-on-scroll"
                style={{ transitionDelay: "0.32s" }}
              >
                You're automatically connected once they join.
              </p>
            </div>
          </div>

          {/* ── STEP 2: Discover ── */}
          <div className="relative flex gap-4 md:gap-8 mb-14">
            <div
              className="flex-shrink-0 z-10 fade-on-scroll"
              style={{ transitionDelay: "0s" }}
            >
              <div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/40">
                <span className="text-white text-sm md:text-2xl font-bold">
                  2
                </span>
              </div>
            </div>
            <div className="flex-1 pt-3">
              <h3
                className="text-2xl font-bold text-white mb-2 fade-on-scroll"
                style={{ transitionDelay: "0.08s" }}
              >
                Discover
              </h3>
              <p
                className="text-slate-300 leading-relaxed mb-5 max-w-lg fade-on-scroll"
                style={{ transitionDelay: "0.16s" }}
              >
                Browse thousands of movies independently. Save
                the ones you'd watch, dismiss the ones you
                wouldn't. Filter by genre, decade, rating, etc.
              </p>
              {/* App screenshot */}
              <div
                className="relative max-w-md fade-on-scroll"
                style={{ transitionDelay: "0.24s" }}
              >
                <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 rounded-2xl blur-xl" />
                <img
                  src={appScreenshot}
                  alt="DuoReel Discover tab"
                  className="relative w-full rounded-2xl shadow-2xl shadow-slate-950/80 border border-slate-700/50"
                />
              </div>
              <p
                className="text-xs text-slate-400 italic mt-3 fade-on-scroll"
                style={{ transitionDelay: "0.32s" }}
              >
                Import your Letterboxd watchlist to get a head
                start.
              </p>
            </div>
          </div>

          {/* ── STEP 3: Match ── */}
          <div className="relative flex gap-4 md:gap-8">
            <div
              className="flex-shrink-0 z-10 fade-on-scroll"
              style={{ transitionDelay: "0s" }}
            >
              <div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/40">
                <span className="text-white text-sm md:text-2xl font-bold">
                  3
                </span>
              </div>
            </div>
            <div className="flex-1 pt-3">
              <h3
                className="text-2xl font-bold text-white mb-2 fade-on-scroll"
                style={{ transitionDelay: "0.08s" }}
              >
                Match!
              </h3>
              <p
                className="text-slate-300 leading-relaxed mb-5 max-w-lg fade-on-scroll"
                style={{ transitionDelay: "0.16s" }}
              >
                When you both save the same movie — it's a
                match! You'll get notified instantly and it's
                automatically added to your shared watchlist.
                Movie night, solved.
              </p>
              {/* Matches screenshot */}
              <div
                className="relative max-w-md fade-on-scroll"
                style={{ transitionDelay: "0.24s" }}
              >
                <div className="absolute -inset-2 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />
                <img
                  src={matchesScreenshot}
                  alt="DuoReel Matches tab"
                  className="relative w-full rounded-2xl shadow-2xl shadow-slate-950/80 border border-slate-700/50"
                />
              </div>
              <p
                className="text-xs text-slate-400 italic mt-4 fade-on-scroll"
                style={{ transitionDelay: "0.32s" }}
              >
                No more endless scrolling or debating.
              </p>
            </div>
          </div>
        </div>
        {/* ── END HOW IT WORKS ── */}

        {/* ── WHY DUOREEL ── */}
        <div
          id="why"
          className="mb-20 max-w-6xl mx-auto"
          ref={whyRef}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
            Why DuoReel
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
            Every movie night, the same story
          </h2>
          <p className="text-slate-400 text-base max-w-md mb-3">
            Sound familiar?
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* ── WITHOUT ── */}
            <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
              <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Without DuoReel
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {[
                  {
                    side: "left",
                    text: "Want to watch a movie tonight? 🍿",
                    delay: "0.3s",
                  },
                  {
                    side: "right",
                    text: "Sure! How about Barbie?",
                    delay: "1.3s",
                  },
                  {
                    side: "left",
                    text: "Already saw it twice! Oppenheimer?",
                    delay: "2.3s",
                  },
                  {
                    side: "right",
                    text: "It's 3 hours and I have work tomorrow 😅",
                    delay: "3.3s",
                  },
                  {
                    side: "left",
                    text: "The Notebook? John Wick? Inception?",
                    delay: "4.3s",
                  },
                  {
                    side: "right",
                    text: "Too sappy / a puppy dies 😭 / too confusing 🤯",
                    delay: "5.3s",
                  },
                ].map(({ side, text, delay }, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-end${side === "right" ? " justify-end" : ""}`}
                    style={{
                      opacity: whyDuoReelVisible ? 1 : 0,
                      transform: whyDuoReelVisible
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
                    }}
                  >
                    {side === "left" && (
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        S
                      </div>
                    )}
                    <div
                      className={`${side === "left" ? "bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm" : "bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm"} px-4 py-2.5 text-sm text-white max-w-[75%]`}
                    >
                      {text}
                    </div>
                    {side === "right" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        M
                      </div>
                    )}
                  </div>
                ))}

                {/* Two Hours Later image */}
                <div
                  className="my-3 flex justify-center"
                  style={{
                    opacity: whyDuoReelVisible ? 1 : 0,
                    transform: whyDuoReelVisible
                      ? "translateY(0)"
                      : "translateY(12px)",
                    transition:
                      "opacity 0.5s ease-out 6.8s, transform 0.5s ease-out 6.8s",
                  }}
                >
                  <img
                    src={twoHoursLater}
                    alt="Two hours later..."
                    className="w-48 rounded-lg opacity-90 grayscale-[40%]"
                  />
                </div>

                {[
                  {
                    side: "right",
                    text: "Did you find something? 😴",
                    delay: "7.8s",
                  },
                  {
                    side: "left",
                    text: "Ugh this is impossible 😩",
                    delay: "8.8s",
                  },
                ].map(({ side, text, delay }, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-end${side === "right" ? " justify-end" : ""}`}
                    style={{
                      opacity: whyDuoReelVisible ? 1 : 0,
                      transform: whyDuoReelVisible
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
                    }}
                  >
                    {side === "left" && (
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        S
                      </div>
                    )}
                    <div
                      className={`${side === "left" ? "bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm" : "bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm"} px-4 py-2.5 text-sm text-white max-w-[75%]`}
                    >
                      {text}
                    </div>
                    {side === "right" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        M
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Result */}
              <div
                className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-red-400 text-sm font-semibold"
                style={{
                  opacity: whyDuoReelVisible ? 1 : 0,
                  transform: whyDuoReelVisible
                    ? "translateY(0)"
                    : "translateY(12px)",
                  transition:
                    "opacity 0.5s ease-out 9.8s, transform 0.5s ease-out 9.8s",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                45 minutes wasted → no movie picked → fell
                asleep 😴
              </div>
            </div>

            {/* ── WITH ── */}
            <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
              <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                With DuoReel
              </div>

              <div className="flex flex-col gap-3 flex-1 relative">
                {/* "Wait for it…" pulsing placeholder — visible until Without finishes */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
                  style={{
                    opacity: whyDuoReelVisible ? 0 : 1,
                    transition: "opacity 0.4s ease-out 10.4s",
                  }}
                >
                  <div className="flex gap-2 items-center">
                    <span
                      className="size-3 rounded-full bg-green-400 animate-pulse"
                      style={{ animationDelay: "0s" }}
                    />
                    <span
                      className="size-3 rounded-full bg-green-400 animate-pulse"
                      style={{ animationDelay: "0.3s" }}
                    />
                    <span
                      className="size-3 rounded-full bg-green-400 animate-pulse"
                      style={{ animationDelay: "0.6s" }}
                    />
                  </div>
                  <p className="text-green-400 text-base font-semibold tracking-wide">
                    wait for it…
                  </p>
                  <p className="text-slate-400 text-xs italic max-w-[220px] text-center leading-relaxed">
                    "I find I'm so excited I can barely sit
                    still or hold a thought in my head... I hope
                    the Pacific is as blue as it has been in my
                    dreams. I hope."
                  </p>
                </div>

                {/* Chat messages — hidden until Without finishes */}
                {[
                  {
                    side: "left",
                    text: "Want to watch a movie tonight? 🍿",
                    delay: "10.6s",
                  },
                  {
                    side: "right",
                    text: "Let's check our DuoReel! 🎬",
                    delay: "11.6s",
                  },
                ].map(({ side, text, delay }, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-end${side === "right" ? " justify-end" : ""}`}
                    style={{
                      opacity: whyDuoReelVisible ? 1 : 0,
                      transform: whyDuoReelVisible
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
                    }}
                  >
                    {side === "left" && (
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        S
                      </div>
                    )}
                    <div
                      className={`${side === "left" ? "bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm" : "bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm"} px-4 py-2.5 text-sm text-white max-w-[75%]`}
                    >
                      {text}
                    </div>
                    {side === "right" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        M
                      </div>
                    )}
                  </div>
                ))}

                {/* Grand Budapest match cards */}
                <div
                  className="my-2 flex items-start justify-between gap-3"
                  style={{
                    opacity: whyDuoReelVisible ? 1 : 0,
                    transform: whyDuoReelVisible
                      ? "translateY(0)"
                      : "translateY(12px)",
                    transition:
                      "opacity 0.5s ease-out 12.6s, transform 0.5s ease-out 12.6s",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">
                      S
                    </div>
                    <img
                      src={grandBudapestCard}
                      alt="The Grand Budapest Hotel saved by S"
                      className="w-36 drop-shadow-xl"
                    />
                  </div>
                  <div className="flex items-center justify-center self-center flex-shrink-0">
                    <motion.img
                      src={duoReelMatchHeart}
                      alt="Match!"
                      className="w-10 h-10 drop-shadow-lg"
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src={grandBudapestCard}
                      alt="The Grand Budapest Hotel saved by M"
                      className="w-36 drop-shadow-xl"
                    />
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">
                      M
                    </div>
                  </div>
                </div>

                {[
                  {
                    side: "left",
                    text: "Perfect! I've been wanting to watch that! 😍",
                    delay: "13.6s",
                  },
                  {
                    side: "right",
                    text: "Same! Starting it now 🍿",
                    delay: "14.6s",
                  },
                ].map(({ side, text, delay }, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-end${side === "right" ? " justify-end" : ""}`}
                    style={{
                      opacity: whyDuoReelVisible ? 1 : 0,
                      transform: whyDuoReelVisible
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
                    }}
                  >
                    {side === "left" && (
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        S
                      </div>
                    )}
                    <div
                      className={`${side === "left" ? "bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm" : "bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm"} px-4 py-2.5 text-sm text-white max-w-[75%]`}
                    >
                      {text}
                    </div>
                    {side === "right" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        M
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Result */}
              <div
                className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-green-400 text-sm font-semibold"
                style={{
                  opacity: whyDuoReelVisible ? 1 : 0,
                  transform: whyDuoReelVisible
                    ? "translateY(0)"
                    : "translateY(12px)",
                  transition:
                    "opacity 0.5s ease-out 15.6s, transform 0.5s ease-out 15.6s",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                2 minutes → movie picked → popcorn ready 🍿
              </div>
            </div>
          </div>
        </div>
        {/* ── END WHY DUOREEL ── */}

        {/* ── WHO IS IT FOR ── */}
        <div id="audience" className="mb-20 max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
            Who Is It For
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
            Is DuoReel right for you?
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

          {/* Two-column grid */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* ── LEFT COLUMN: card + CTA ── */}
            <div className="flex flex-col gap-6">
              {/* ── PERFECT FOR YOU ── */}
              <div className="flex-1 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-slate-900/50 to-slate-900/50 p-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                  <svg
                    className="size-5 text-green-400 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Perfect for you if…
                </h3>

                <ul className="space-y-5">
                  <li className="flex gap-3 items-start">
                    <svg
                      className="size-4 text-green-400 flex-shrink-0 mt-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">
                        You're a couple or roommates
                      </strong>{" "}
                      who regularly watch movies together
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <svg
                      className="size-4 text-green-400 flex-shrink-0 mt-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">
                        You're tired of "What should we watch?"
                      </strong>{" "}
                      and want to find common ground instantly
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <svg
                      className="size-4 text-green-400 flex-shrink-0 mt-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">
                        You have different tastes
                      </strong>{" "}
                      and want to discover movies in the overlap
                    </span>
                  </li>
                </ul>
              </div>

              {/* ── CTA button pinned to bottom of left column ── */}
              <div className="flex items-center gap-4">
                <a
                  href="/auth"
                  className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-7 py-2.5 rounded-lg shadow-lg shadow-pink-500/30 transition-all cursor-pointer text-sm"
                >
                  That's me — Get Started
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            </div>
            {/* ── END LEFT COLUMN ── */}

            {/* ── NOT QUITE RIGHT ── */}
            <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/30 via-slate-900/50 to-slate-900/50 p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                <svg
                  className="size-5 text-slate-400 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Not quite right if…
              </h3>

              <ul className="space-y-5 mb-6">
                <li className="flex gap-3 items-start">
                  <svg
                    className="size-4 text-slate-500 flex-shrink-0 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span className="text-slate-400 text-sm leading-relaxed">
                    You want detailed reviews or a comprehensive
                    movie diary
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <svg
                    className="size-4 text-slate-500 flex-shrink-0 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span className="text-slate-400 text-sm leading-relaxed">
                    You want a social/community review system
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <svg
                    className="size-4 text-slate-500 flex-shrink-0 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span className="text-slate-400 text-sm leading-relaxed">
                    You mostly watch movies solo
                  </span>
                </li>
              </ul>

              {/* Letterboxd tip */}
              <div className="border-t border-slate-700/50 pt-5">
                <p className="text-slate-400 text-sm leading-relaxed">
                  💡 Looking for those features? Check out{" "}
                  <a
                    href="https://letterboxd.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Letterboxd
                  </a>{" "}
                  — it's amazing. Pro tip: Use both! Import your
                  Letterboxd watchlist into DuoReel.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ── END WHO IS IT FOR ── */}
      </div>

      {/* old Why DuoReel section removed */}
      <div className="hidden" style={{ display: "none" }}>
        {/* Movie Poster Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-0 opacity-70"
            style={{
              transform:
                "perspective(1200px) rotateY(-15deg) rotateX(10deg) scale(1.4)",
              transformOrigin: "center center",
              minHeight: "120%",
            }}
          >
            {/* Row 1 */}
            <img
              src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/npMcVR3ykKRtofGrf6rraNbwPTw.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iYypPT4bhqXTt1zOIC8FqEU2r4R.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 2 */}
            <img
              src="https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/xBKGJQsAIeweesB79KC89FpBrVr.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRN4Fugfb8.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lMyv7XAwXeJZXF9xw8JS9g3Iibb.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 3 */}
            <img
              src="https://image.tmdb.org/t/p/w500/aWeKITRFbbwY8txG5uCj4rMCfSR.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/dqK9Hag1054tghRQSqLSfrkvQnA.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef0kZjFOQ5.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lHu1wtNaczFPGFDTrjCSzeLPTKN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/db32LaOibwEliAmSL2jjDF6oDdj.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fev8UFNFFYsD5q7AcYS8LyTzqwl.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 4 */}
            <img
              src="https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fqe8v8ME0z0CiU7sf6vxToAfOCh.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/tVxDe01Zy3kZqaZRNiXFGDICdZk.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 5 */}
            <img
              src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ipc1O5rMpALxH1rJHnvvmpapo37.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89WW2Di64Ym.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/gzlJkVfWV5VEG5xK25cvFGJgkDz.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Why DuoReel Section Title */}
          <div
            id="why-duoreel"
            className="mb-12 max-w-6xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-bold text-slate-200">
                <span className="text-pink-400">Why</span>{" "}
                DuoReel?
              </h2>
            </div>
            <div className="ml-6 w-32 h-1 bg-gradient-to-r from-pink-500/50 to-transparent rounded-full"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <p className="text-slate-400 mb-16 text-lg">
              Without <span className="text-pink-400">Duo</span>
              <span className="text-white">Reel</span>, every
              movie night starts the same way... 👇
            </p>

            {/* The Old Way - Without DuoReel */}
            <div className="mb-16">
              {/* Chat conversation */}
              <div className="space-y-4 max-w-2xl">
                {/* Girlfriend message - Left */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Want to watch a movie tonight? 🍿
                    </p>
                  </div>
                </div>

                {/* Boyfriend message - Right */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Sure! How about Barbie?
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Already saw it twice! What about
                      Oppenheimer?
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Babe, it's 3 hours long and I have work
                      tomorrow 😅
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Fair point... The Notebook?
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      I've cried enough times to that movie 😭
                      How about John Wick?
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Too violent for a Tuesday night... La La
                      Land?
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      You know I don't do musicals 🙈 Inception?
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      I'm too tired to understand dreams within
                      dreams 🤯
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Fast & Furious 10?
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      I haven't seen the first 9... What about
                      Titanic?
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Spoiler alert: the ship sinks 🚢 And it's
                      3 hours again...
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Time passing indicator */}
                <div className="py-2 flex justify-center">
                  <svg
                    width="60"
                    height="200"
                    viewBox="0 0 60 200"
                    className="opacity-50"
                  >
                    <path
                      d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4,6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* 2 Hours Later Meme */}
                <div className="py-8 flex justify-center">
                  <div className="relative">
                    <img
                      src="https://i.ytimg.com/vi/fw7NJ4SWnW0/mqdefault.jpg"
                      alt="Two Hours Later"
                      className="max-w-md w-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Ugh this is impossible 😩
                    </p>
                  </div>
                </div>

                {/* Boyfriend message - yawning */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      😴 *yawning* Did you pick it?
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Time passing indicator */}
                <div className="py-2 flex justify-center">
                  <svg
                    width="60"
                    height="200"
                    viewBox="0 0 60 200"
                    className="opacity-50"
                  >
                    <path
                      d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4,6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* End message */}
                <p className="text-slate-400 mb-8 text-lg text-center">
                  ...and usually ends this way. 👇
                </p>

                {/* Cuddling cats image */}
                <div className="py-6 flex justify-center">
                  <img
                    src="https://www.publicdomainpictures.net/pictures/50000/nahled/cuddling-cats-13711468109O5.jpg"
                    alt="Cuddling cats"
                    className="max-w-xs w-full object-contain rounded-lg opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Separator between Without and With sections */}
            <div className="py-12 flex justify-center">
              <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
            </div>

            {/* The New Way - With DuoReel */}
            <div>
              <div className="mb-8">
                <span className="text-slate-400 text-2xl">
                  ✅ With{" "}
                  <span className="text-pink-400">Duo</span>
                  <span className="text-white">Reel</span>
                </span>
              </div>

              {/* Chat conversation */}
              <div className="space-y-4 max-w-2xl">
                {/* Girlfriend message - Left */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Want to watch a movie tonight? 🍿
                    </p>
                  </div>
                </div>

                {/* Girlfriend message - Left */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Let's check our DuoReel! 🎬
                    </p>
                  </div>
                </div>

                {/* Boyfriend message - Right */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Good idea! Opening it now...
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Match notification */}
                <div className="flex justify-center py-4">
                  <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm border border-pink-500/50 rounded-2xl px-6 py-4 shadow-lg shadow-pink-500/20">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-6 text-pink-400 animate-pulse" />
                      <div>
                        <div className="text-pink-400 font-semibold text-sm mb-1">
                          IT'S A MATCH! 💕
                        </div>
                        <div className="text-white font-bold">
                          The Grand Budapest Hotel
                        </div>
                        <div className="text-slate-300 text-xs">
                          You both saved this movie!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Girlfriend */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Perfect! I've been wanting to watch that!
                      😍
                    </p>
                  </div>
                </div>

                {/* Boyfriend */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                    <p className="text-white text-sm">
                      Same! Starting it now 🍿
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    M
                  </div>
                </div>

                {/* Time passing indicator */}
                <div className="py-2 flex justify-center">
                  <svg
                    width="60"
                    height="200"
                    viewBox="0 0 60 200"
                    className="opacity-50"
                  >
                    <path
                      d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4,6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Happy couple image */}
                <div className="py-6 flex justify-center">
                  <img
                    src="https://i.postimg.cc/6pn1tvbP/cats-tv.jpg"
                    alt="Cats watching TV"
                    className="max-w-xs w-full object-contain rounded-lg opacity-70"
                  />
                </div>

                {/* Puuurrrfect message */}
                <div className="flex gap-3 items-center justify-center pt-4">
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-2xl px-6 py-3">
                    <p className="text-green-400 text-center text-sm font-semibold">
                      😴 Puuurrrfect... Total time: 2 minutes!
                      😴
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div
        id="features"
        className="py-20 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4 relative">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
            Features
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
            Everything you need
          </h2>
          <p className="text-slate-400 text-base max-w-md mb-3">
            Simple by design. Powerful where it matters.
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 — Infinite Discovery (wide, col-span-2) */}
            <div className="relative md:col-span-2 rounded-2xl border border-pink-500/30 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4 overflow-hidden">
              <div className="absolute bottom-4 right-6 text-8xl font-black text-white/5 leading-none select-none pointer-events-none">
                50K
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                Infinite Discovery
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                Browse{" "}
                <span className="text-slate-300">
                  thousands
                </span>{" "}
                of movies with infinite scroll.{" "}
                <span className="text-slate-300">
                  New titles
                </span>{" "}
                added constantly from{" "}
                <span className="text-slate-300">
                  TMDb's massive database
                </span>
                .
              </p>
            </div>

            {/* Card 2 — Instant Matching (col-span-1) */}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                Instant Matching
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The{" "}
                <span className="text-slate-300">moment</span>{" "}
                you both save a movie, it{" "}
                <span className="text-slate-300">drops</span>{" "}
                into your{" "}
                <span className="text-slate-300">
                  Matches tab
                </span>
                . No manual comparison needed.
              </p>
            </div>

            {/* Card 3 — Smart Filters (col-span-1) */}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                Smart Filters
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Filter by{" "}
                <span className="text-slate-300">genre</span>,{" "}
                <span className="text-slate-300">decade</span>,{" "}
                <span className="text-slate-300">rating</span>,{" "}
                <span className="text-slate-300">
                  streaming service
                </span>
                , <span className="text-slate-300">length</span>
                ,{" "}
                <span className="text-slate-300">director</span>
                , or even by{" "}
                <span className="text-slate-300">keyword</span>{" "}
                — like zombie apocalypse, heart-throb, or
                corrupt mayor.
              </p>
            </div>

            {/* Card 4 — Streaming Filters (col-span-1) */}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="15"
                    rx="2"
                    ry="2"
                  />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                Streaming Filters
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Filter by the services you actually subscribe to
                —{" "}
                <span className="text-slate-300">Netflix</span>,{" "}
                <span className="text-slate-300">HBO Max</span>,{" "}
                <span className="text-slate-300">Prime</span>,{" "}
                <span className="text-slate-300">Disney+</span>,
                and more. No more suggesting movies you can't
                watch.
              </p>
            </div>

            {/* Card 5 — IMDb Ratings (col-span-1) */}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                IMDb Ratings
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every card shows the{" "}
                <span className="text-slate-300">
                  IMDb score
                </span>{" "}
                so you can quickly judge quality. Full details —
                cast, runtime, plot, and streaming availability
                — on tap.
              </p>
            </div>

            {/* Card 6 — Letterboxd Import (wide, col-span-2) */}
            <div className="relative md:col-span-2 rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                Letterboxd Import
              </h3>
              <ul className="text-slate-400 text-sm leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                  <span>Import your <span className="text-slate-300">watchlist</span> to add movies to your DuoReel <span className="text-slate-300">Saved</span> list.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                  <span>Import your <span className="text-slate-300">watched movies</span> to filter them out of the <span className="text-slate-300">Discover</span> feed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                  <span>Connect via your <span className="text-slate-300">Letterboxd RSS URL</span> — review a movie on Letterboxd and it's <span className="text-slate-300">automatically marked as watched</span> on DuoReel.</span>
                </li>
              </ul>
            </div>

            {/* Free banner — as a bento card (col-span-1) */}
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-sm p-8 flex flex-col items-start justify-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400">
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl leading-snug">
                100% Free
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                All features, no limits, no credit card. Ever.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 max-w-6xl mx-auto px-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
          <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
          FAQ
        </span>
        <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-12">
          Questions?
        </h2>

        <div className="flex flex-col divide-y divide-slate-800">
          {[
            {
              q: "Is DuoReel really free?",
              a: "Yes, 100% free with all features. No premium tier, no credit card, no hidden costs. We built this for ourselves and wanted to share it.",
            },
            {
              q: "Does my partner need to install an app?",
              a: "No! DuoReel is a web app that works in any browser. Just share your invite link with your partner — they open it, create a free account, and you're automatically connected. The whole thing takes about 2 minutes.",
            },
            {
              q: "Can I use it with a friend or roommate?",
              a: 'Absolutely! While we use "couple" language, DuoReel works for any two people who watch movies together — partners, roommates, long-distance friends, parent-child duos, you name it.',
            },
            {
              q: "Can my partner see what I saved?",
              a: "Your partner can browse your saved list, and you can browse theirs — so you can see what each other is interested in. But the real magic is in the Matches tab, which automatically surfaces movies you've BOTH saved. That's where movie night decisions get easy.",
            },
            {
              q: "I already use Letterboxd. Is this a replacement?",
              a: "Not at all! Letterboxd is great for tracking, reviewing, and social features. DuoReel solves a different problem: finding what to watch together. You can import your Letterboxd watchlist directly into DuoReel. Use both!",
            },
          ].map((item, i) => (
            <div key={i} className="py-5">
              <button
                className="w-full flex items-center justify-between gap-4 text-left group"
                onClick={() =>
                  setOpenFaq(openFaq === i ? null : i)
                }
              >
                <span className="text-white font-semibold text-lg group-hover:text-pink-300 transition-colors">
                  {item.q}
                </span>
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 transition-transform duration-200 ${openFaq === i ? "rotate-45 border-pink-500 text-pink-400" : ""}`}
                >
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </button>
              {openFaq === i && (
                <p className="mt-3 text-slate-400 leading-relaxed max-w-2xl">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready for movie night?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join 500+ couples who've already stopped arguing
            about what to watch.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm px-8 py-2.5 rounded-lg shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
          >
            Get Started Now
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              "Free forever",
              "No credit card",
              "2-min setup",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-sm text-slate-400"
              >
                <svg
                  className="size-3.5 text-green-400 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-3">
            {/* TMDB Attribution */}
            <div className="flex items-center gap-2">
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg"
                alt="TMDB"
                className="h-6 w-6"
              />
              <p className="text-slate-400 text-sm">
                This product uses the TMDB API but is not
                endorsed or certified by TMDB
              </p>
            </div>

            {/* Main Footer Text */}
            <p className="text-slate-500 text-sm">
              Made with ❤️ for movie lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}