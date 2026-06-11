import { useState, useEffect } from 'react';

const ECO_TIPS = [
  "A single mature tree absorbs about 22kg (48 lbs) of CO₂ per year.",
  "Switching to LED bulbs uses 75% less energy than incandescent lighting.",
  "Washing clothes in cold water saves up to 90% of a washing machine's energy.",
  "Public transit reduces your daily travel emissions by up to 76%!",
  "Going meat-free just one day a week can save up to 360 kg of CO₂ per year.",
  "Composting organic waste prevents methane emissions in landfills.",
  "Unplugging 'vampire' electronics can save up to 10% on your electricity bill.",
  "Reducing food waste by 20% saves hundreds of kilograms of carbon dioxide annually."
];

export default function LoadingScreen({ isLoading, onFinished }) {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);

  // 1. Simulate progress bar counting up
  useEffect(() => {
    let interval;
    if (!fadingOut) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (isLoading) {
            // Pause at 92% if auth/data is still loading
            if (prev < 92) {
              const inc = Math.floor(Math.random() * 8) + 2; // increment by 2-9%
              return Math.min(prev + inc, 92);
            }
            return prev;
          } else {
            // Speed up to 100% once loading has completed
            if (prev < 100) {
              const inc = Math.floor(Math.random() * 15) + 10; // increment by 10-24%
              return Math.min(prev + inc, 100);
            }
            return 100;
          }
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isLoading, fadingOut]);

  // 2. Trigger fade out and finished callback
  useEffect(() => {
    if (progress === 100 && !isLoading) {
      setFadingOut(true);
      const timer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 500); // 500ms matches transition duration-500
      return () => clearTimeout(timer);
    }
  }, [progress, isLoading, onFinished]);

  // 3. Cycle eco-tips with a crossfade effect
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipFade(false); // fade out current tip
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % ECO_TIPS.length);
        setTipFade(true); // fade in new tip
      }, 400); // short wait for fade-out to complete
    }, 4500);

    return () => clearInterval(tipInterval);
  }, []);

  // Determine helper text based on progress
  const getStatusText = () => {
    if (progress < 25) return "Initializing tracker...";
    if (progress < 55) return "Loading climate database...";
    if (progress < 80) return "Syncing profile credentials...";
    if (progress < 100) return "Applying AI OLS regression models...";
    return "Ready!";
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background backdrop-blur-md transition-all duration-500 ease-in-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow decorations */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-80 h-80 rounded-full bg-primary blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-secondary blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex flex-col items-center gap-8 relative z-10 max-w-md w-full px-8">
        {/* Animated Logo with Concentric Circles */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Outer rotating circle */}
          <div className="absolute inset-0 rounded-full border-2 border-outline-variant/60 animate-spin-slow"></div>
          
          {/* Middle circle pulsing */}
          <div className="absolute inset-6 rounded-full border border-primary/30 animate-pulse"></div>
          
          {/* Inner white circle with shadow */}
          <div className="absolute inset-12 rounded-full bg-surface-container-lowest shadow-xl flex items-center justify-center border border-outline-variant/20">
            {/* Leaf icon */}
            <svg width="60" height="60" viewBox="0 0 64 64" fill="none" className="transform hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M52 12C52 12 36 12 28 28C20 12 12 12 12 12C12 12 12 28 20 36C12 36 12 52 12 52C12 52 28 52 36 44C44 52 52 52 52 52C52 52 52 36 44 28C52 28 52 12 52 12Z" 
                className="fill-primary stroke-primary" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path d="M28 28C28 28 32 32 36 36" className="stroke-surface-container-lowest" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Rotating dot indicator */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary shadow-md shadow-primary/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest"></div>
            </div>
          </div>
        </div>
        
        {/* Title & Brand */}
        <div className="text-center space-y-2">
          <h1 className="font-headline-xl text-[32px] font-extrabold text-primary tracking-tight">CarbonSense AI</h1>
          <p className="font-body-md text-on-surface-variant font-medium tracking-wide uppercase text-xs">{getStatusText()}</p>
        </div>
        
        {/* Progress Bar with Percentage */}
        <div className="w-full space-y-3">
          <div className="relative h-2.5 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
            {/* Shiny progress fill */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary via-secondary to-primary-fixed rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            >
              {/* Sweep light effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-loading-bar"></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-primary text-[14px]">{progress}%</span>
            <span className="text-on-surface-variant tracking-wider uppercase text-[10px]">Processing</span>
          </div>
        </div>

        {/* Dynamic Sustainability Tip Box */}
        <div className="w-full mt-2 min-h-[72px] flex items-center justify-center bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-md text-center transition-all duration-300 hover:bg-surface-container/60 shadow-[0px_4px_12px_rgba(0,0,0,0.02)]">
          <div className={`transition-all duration-300 flex items-start gap-sm ${tipFade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-[2px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed text-left">
              <strong className="text-primary font-bold block mb-[2px]">Eco-Tip</strong>
              {ECO_TIPS[tipIndex]}
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <div className="flex items-center gap-1.5 text-[11px] text-outline mt-4 font-semibold uppercase tracking-widest">
          <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <span>Powered by CarbonSense AI</span>
        </div>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
