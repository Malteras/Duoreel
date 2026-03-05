# Add FAQ Section + Replace CTA Section

## Scope

Two changes in `src/app/components/LandingPage.tsx`:
1. Insert a new FAQ accordion section before the CTA section
2. Replace the current CTA section with a new "Ready for movie night?" final CTA

Do not touch the Footer or any other section. No CSS file changes.

---

## Change 1 — Add useState import for FAQ accordion

At the top of the file, `useState` is likely already imported from React. If not, add it. Also ensure `ChevronDown` is imported from `lucide-react` — if not already present, add it to the lucide-react import line.

---

## Change 2 — Add FAQ state to the component

Inside the `LandingPage` function body, after the existing state declarations, add:

```tsx
const [openFaq, setOpenFaq] = React.useState<number | null>(0);
```

---

## Change 3 — Insert FAQ section before `{/* CTA Section */}`

Find:
```tsx
{/* CTA Section */}
```

Insert the entire FAQ section immediately before it:

```tsx
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
        a: "Absolutely! While we use \"couple\" language, DuoReel works for any two people who watch movies together — partners, roommates, long-distance friends, parent-child duos, you name it.",
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
          onClick={() => setOpenFaq(openFaq === i ? null : i)}
        >
          <span className="text-white font-semibold text-lg group-hover:text-pink-300 transition-colors">
            {item.q}
          </span>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 transition-transform duration-200 ${openFaq === i ? "rotate-45 border-pink-500 text-pink-400" : ""}`}>
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

```

---

## Change 4 — Replace the CTA Section

Find and replace the entire CTA section:

```tsx
{/* CTA Section */}
<div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 py-20">
  <div className="max-w-4xl mx-auto px-4 text-center">
    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
      Ready to Find Your Perfect Movie?
    </h2>
    <p className="text-xl text-slate-300 mb-8">
      Join couples who've already stopped arguing about
      what to watch
    </p>
    <Button
      onClick={onGetStarted}
      size="lg"
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-12 py-7 shadow-2xl shadow-blue-500/40"
    >
      Get Started Now
      <ArrowRight className="size-6 ml-2" />
    </Button>
  </div>
</div>
```

Replace with:

```tsx
{/* Final CTA Section */}
<div className="py-24 px-4">
  <div className="max-w-2xl mx-auto text-center">
    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
      Ready for movie night?
    </h2>
    <p className="text-lg text-slate-400 mb-10">
      Join 500+ couples who've already stopped arguing about what to watch.
    </p>
    <button
      onClick={onGetStarted}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-pink-500/30 transition-all"
    >
      Get Started Now
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
    <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
      {["Free forever", "No credit card", "2-min setup"].map(t => (
        <span key={t} className="flex items-center gap-1.5 text-sm text-slate-400">
          <svg className="size-3.5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t}
        </span>
      ))}
    </div>
  </div>
</div>
```

---

## Do NOT Change

- Footer section
- Any other section
- Any CSS files
- Any imports beyond what's noted above

## Testing Checklist

- [ ] FAQ section appears above the final CTA with pink label "FAQ" and heading "Questions?"
- [ ] First FAQ item is open by default
- [ ] Clicking a question opens it and closes any other open one
- [ ] The + icon rotates to × when open, turns pink
- [ ] Old blue/purple gradient CTA is gone
- [ ] New pink CTA has "Ready for movie night?" heading
- [ ] Three trust badges (Free forever, No credit card, 2-min setup) below the button
- [ ] No TypeScript errors