export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="h-display text-4xl mb-3">Voyage</div>
          <p className="text-mist/50 max-w-sm text-sm">
            A planner that actually plans. Real-time data, immersive 3D — built for travelers who hate tabs.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-10 text-sm text-mist/60">
          <div>
            <div className="text-mist/40 uppercase tracking-widest text-[10px] mb-3">Product</div>
            <a className="block hover:text-mist" href="#features">Features</a>
            <a className="block hover:text-mist" href="#plan">Plan</a>
            <a className="block hover:text-mist" href="#cities">Cities</a>
          </div>
          <div>
            <div className="text-mist/40 uppercase tracking-widest text-[10px] mb-3">Company</div>
            <a className="block hover:text-mist" href="#">About</a>
            <a className="block hover:text-mist" href="#">Press</a>
            <a className="block hover:text-mist" href="#">Contact</a>
          </div>
          <div>
            <div className="text-mist/40 uppercase tracking-widest text-[10px] mb-3">Legal</div>
            <span className="block">© {new Date().getFullYear()} Voyage</span>
            <a className="block hover:text-mist" href="#">Privacy</a>
            <a className="block hover:text-mist" href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
