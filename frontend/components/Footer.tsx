export default function Footer() {
  return (
    <footer className="border-t border-ink/10 py-16 px-6 bg-cream/40">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="h-display text-4xl mb-3 text-ink">Voyage</div>
          <p className="text-inkmist max-w-sm text-sm">
            A travel diary that plans itself. Real-time data, hand-stitched itineraries — built for travelers who hate tabs.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-10 text-sm text-inkmist">
          <div>
            <div className="text-ink/50 uppercase tracking-widest text-[10px] mb-3">Product</div>
            <a className="block hover:text-ink" href="#features">Features</a>
            <a className="block hover:text-ink" href="#plan">Plan</a>
            <a className="block hover:text-ink" href="#cities">Cities</a>
          </div>
          <div>
            <div className="text-ink/50 uppercase tracking-widest text-[10px] mb-3">Company</div>
            <a className="block hover:text-ink" href="#">About</a>
            <a className="block hover:text-ink" href="#">Press</a>
            <a className="block hover:text-ink" href="#">Contact</a>
          </div>
          <div>
            <div className="text-ink/50 uppercase tracking-widest text-[10px] mb-3">Legal</div>
            <span className="block">© {new Date().getFullYear()} Voyage</span>
            <a className="block hover:text-ink" href="#">Privacy</a>
            <a className="block hover:text-ink" href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
