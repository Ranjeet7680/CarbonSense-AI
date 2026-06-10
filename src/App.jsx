import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs 
} from 'firebase/firestore';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import History from './components/History';
import Offsets from './components/Offsets';
import AICoach from './components/AICoach';
import LearningHub from './components/LearningHub';

const STATIC_BENCHMARKS = [
  { id: 'b1', name: 'Alba Green (Vegan, Solar)', score: 712, isBenchmark: true },
  { id: 'b_krish', name: 'Krish (EV, Solar)', score: 820, isBenchmark: true },
  { id: 'b2', name: 'Julian Forest (Bike, Recycler)', score: 1044, isBenchmark: true },
  { id: 'b_rahul', name: 'Rahul (Transit, Vegetarian)', score: 1120, isBenchmark: true },
  { id: 'b3', name: 'Emma Planet (Hybrid, Electric Heat)', score: 1485, isBenchmark: true },
  { id: 'b4', name: 'Baseline Average (Nation)', score: 2269, isBenchmark: true },
  { id: 'b5', name: 'Marcus Steel (SUV, Coal Heat)', score: 4536, isBenchmark: true }
];

export default function App() {
  const [user, setUser] = useState(null); // null (not logged in), 'guest', or User object
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [offsets, setOffsets] = useState([]);
  const [leaderboard, setLeaderboard] = useState(STATIC_BENCHMARKS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 'landing' by default when user is null, or can switch to 'auth'
  const [authView, setAuthView] = useState(false); // true shows auth screen, false shows landing page

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoadingAuth(false);
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthView(false);
        migrateGuestLogsToCloud(firebaseUser.uid);
      } else {
        const wasGuest = localStorage.getItem('carbon_tracker_is_guest');
        if (wasGuest === 'true') {
          setUser('guest');
          setAuthView(false);
        } else {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Logs & Offsets (Firestore vs Local Storage)
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setOffsets([]);
      return;
    }

    if (user === 'guest') {
      const localLogs = JSON.parse(localStorage.getItem('carbon_tracker_logs') || '[]');
      setLogs(localLogs.sort((a, b) => b.timestamp - a.timestamp));

      const localOffsets = JSON.parse(localStorage.getItem('carbon_tracker_offsets') || '[]');
      setOffsets(localOffsets);
    } else {
      // Load logs
      const qLogs = query(
        collection(db, 'users', user.uid, 'logs'),
        orderBy('timestamp', 'desc')
      );

      const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const cloudLogs = [];
        snapshot.forEach((doc) => {
          cloudLogs.push({ id: doc.id, ...doc.data() });
        });
        setLogs(cloudLogs);
        
        if (cloudLogs.length > 0) {
          updateLeaderboardScore(user, cloudLogs[0].score);
        }
      }, (err) => {
        console.error("Firestore logs read error: ", err);
      });

      // Load offsets
      const qOffsets = query(
        collection(db, 'users', user.uid, 'offsets'),
        orderBy('timestamp', 'desc')
      );

      const unsubOffsets = onSnapshot(qOffsets, (snapshot) => {
        const cloudOffsets = [];
        snapshot.forEach((doc) => {
          cloudOffsets.push({ id: doc.id, ...doc.data() });
        });
        setOffsets(cloudOffsets);
      }, (err) => {
        console.error("Firestore offsets read error: ", err);
      });

      return () => {
        unsubLogs();
        unsubOffsets();
      };
    }
  }, [user]);

  // Compute offset total
  const offsetTotal = offsets.reduce((acc, curr) => acc + (curr.amountKg || 0), 0);

  // Sync / Listen to Leaderboard
  useEffect(() => {
    if (user && user !== 'guest') {
      const qLeaderboard = query(
        collection(db, 'leaderboard'),
        orderBy('score', 'asc'),
        limit(8)
      );

      const unsubscribe = onSnapshot(qLeaderboard, (snapshot) => {
        const board = [];
        snapshot.forEach((doc) => {
          board.push({ id: doc.id, ...doc.data() });
        });

        const merged = [...board];
        STATIC_BENCHMARKS.forEach(bench => {
          if (!merged.find(item => item.id === bench.id)) {
            merged.push(bench);
          }
        });

        const finalBoard = merged
          .map(item => ({
            ...item,
            isCurrentUser: item.userId === user.uid
          }))
          .sort((a, b) => a.score - b.score)
          .slice(0, 10);

        setLeaderboard(finalBoard);
      }, (err) => {
        console.error(err);
      });

      return () => unsubscribe();
    } else {
      let board = [...STATIC_BENCHMARKS];
      const localLogs = JSON.parse(localStorage.getItem('carbon_tracker_logs') || '[]');
      if (localLogs.length > 0) {
        board.push({
          id: 'guest_user',
          name: 'You (Guest)',
          score: localLogs[0].score,
          isCurrentUser: true
        });
      }
      setLeaderboard(board.sort((a, b) => a.score - b.score));
    }
  }, [user, logs]);

  // Migration logic
  const migrateGuestLogsToCloud = async (uid) => {
    // Logs migration
    const localLogs = JSON.parse(localStorage.getItem('carbon_tracker_logs') || '[]');
    if (localLogs.length > 0) {
      for (const log of localLogs) {
        try {
          const { id, ...logData } = log;
          await addDoc(collection(db, 'users', uid, 'logs'), logData);
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.removeItem('carbon_tracker_logs');
    }

    // Offsets migration
    const localOffsets = JSON.parse(localStorage.getItem('carbon_tracker_offsets') || '[]');
    if (localOffsets.length > 0) {
      for (const offset of localOffsets) {
        try {
          const { id, ...offsetData } = offset;
          await addDoc(collection(db, 'users', uid, 'offsets'), offsetData);
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.removeItem('carbon_tracker_offsets');
    }

    localStorage.removeItem('carbon_tracker_is_guest');
  };

  const updateLeaderboardScore = async (currentUser, score) => {
    try {
      const emailName = currentUser.email ? currentUser.email.split('@')[0] : 'Eco User';
      const name = currentUser.displayName || emailName;
      await setDoc(doc(db, 'leaderboard', currentUser.uid), {
        userId: currentUser.uid,
        name: name,
        score: score,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Error updating leaderboard: ", e);
    }
  };

  const handleSaveCalculation = async (inputs, score) => {
    const newLog = {
      timestamp: Date.now(),
      inputs,
      score
    };

    if (user === 'guest') {
      const updatedLogs = [newLog, ...logs];
      localStorage.setItem('carbon_tracker_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      setActiveView('dashboard');
    } else {
      try {
        await addDoc(collection(db, 'users', user.uid, 'logs'), newLog);
        setActiveView('dashboard');
      } catch (e) {
        console.error(e);
        alert("Failed to save carbon footprint entry.");
      }
    }
  };

  const handleAddOffset = async (offsetRecord) => {
    if (user === 'guest') {
      const updatedOffsets = [offsetRecord, ...offsets];
      localStorage.setItem('carbon_tracker_offsets', JSON.stringify(updatedOffsets));
      setOffsets(updatedOffsets);
    } else {
      try {
        await addDoc(collection(db, 'users', user.uid, 'offsets'), offsetRecord);
      } catch (e) {
        console.error(e);
        alert("Failed to save carbon offset details.");
      }
    }
  };

  const handleDeleteLog = async (logId) => {
    if (user === 'guest') {
      const updatedLogs = logs.filter(l => l.id !== logId);
      localStorage.setItem('carbon_tracker_logs', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
    } else {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'logs', logId));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem('carbon_tracker_is_guest', 'true');
    setUser('guest');
    setAuthView(false);
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('carbon_tracker_is_guest');
      await signOut(auth);
      setUser(null);
      setAuthView(false);
      setActiveView('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  // Loading screen
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">sync</span>
          <span className="font-headline-md">Synchronizing CarbonSense AI...</span>
        </div>
      </div>
    );
  }

  // Not Logged In View Options: Landing page or Auth modal/split-screen
  if (!user) {
    if (authView) {
      return (
        <div className="relative">
          {/* Back button overlay */}
          <button 
            onClick={() => setAuthView(false)} 
            className="absolute top-4 left-4 z-50 flex items-center gap-xs px-md py-sm bg-white/80 hover:bg-white border border-outline-variant rounded-lg font-label-md text-secondary shadow"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </button>
          <Auth onGuestAccess={handleGuestAccess} />
        </div>
      );
    }

    // Renders Public Landing Page from the Mockup Design
    return (
      <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen flex flex-col justify-between">
        {/* Header navigation */}
        <header className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 left-0 w-full z-50">
          <nav className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16">
            <div className="flex items-center gap-base">
              <span className="font-headline-md text-headline-md font-bold text-on-surface">CarbonSense AI</span>
            </div>
            <div className="hidden md:flex items-center gap-xl">
              <a className="font-body-md text-body-md text-secondary border-b-2 border-secondary font-bold pb-1" href="#hero">Features</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary" href="#bento">Solutions</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary" href="#testimonials">Testimonials</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary" href="#cta">Goal</a>
            </div>
            <div className="flex items-center gap-md">
              <button onClick={() => setAuthView(true)} className="font-label-md text-label-md px-md py-sm text-secondary hover:opacity-80 transition-all">Login</button>
              <button onClick={() => setAuthView(true)} className="font-label-md text-label-md px-lg py-sm bg-secondary text-on-secondary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">Register</button>
            </div>
          </nav>
        </header>

        {/* Main Sections */}
        <main className="pt-16 flex-1">
          {/* Hero Section */}
          <section id="hero" className="relative min-h-[700px] flex items-center overflow-hidden bg-surface py-xl">
            <div className="max-w-container-max mx-auto px-lg grid grid-cols-1 lg:grid-cols-2 gap-xl items-center relative z-10 w-full">
              <div className="flex flex-col gap-lg">
                <div className="inline-flex items-center gap-sm px-md py-base bg-surface-container-high rounded-full w-fit">
                  <span className="material-symbols-outlined text-secondary text-sm">auto_awesome</span>
                  <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">Next-Gen Carbon ESG</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl lg:text-[64px] lg:leading-[72px] tracking-tight">
                  Measure, Reduce, and <br/>
                  <span className="text-gradient">Master Your Carbon Footprint</span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                  Leverage high-fidelity AI regression to track personal lifestyle emissions, fund carbon offset projects, and shape a net-zero future.
                </p>
                <div className="flex flex-wrap gap-md mt-md">
                  <button onClick={() => setAuthView(true)} className="px-xl py-md bg-secondary text-on-secondary rounded-xl font-headline-md flex items-center gap-sm hover:shadow-lg transition-all">
                    Start Your Green Journey Today
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <button onClick={handleGuestAccess} className="px-xl py-md border-2 border-outline-variant text-on-surface rounded-xl font-headline-md hover:bg-surface-container-low transition-all">
                    View Demo (Guest)
                  </button>
                </div>
              </div>
              <div className="relative flex justify-center items-center">
                <div className="absolute w-[120%] h-[120%] bg-secondary-container/20 blur-[100px] rounded-full"></div>
                <div className="animated-float relative z-10 w-full max-w-sm aspect-square">
                  <img 
                    alt="Green Tech Globe" 
                    className="w-full h-full object-cover rounded-full shadow-2xl border-4 border-surface-container-highest" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsOtUG1TDsj0iYiBzJDdC-Of2u_dY8gXsveXkyy2D_W-QwZMypHEswkRy0JEa22cXHpJbNDtWsLSzLHE2ED4ma8Kf4vouQyWxINdWK5Ny8O8OCvWL9_Y_YUk1ZLQgQVSBd5NlSd-xiPj4FT2C6AOWEwE0gR5x0mYs5zHIaF9yjshfu0IZtFBKs_Q5uk8n48U54icAV-5iNlCK1YLTvwWpecpmsOinDbCRUFCDZysgVzEjtdTznbRx_3S0dLiPjgv51JT4GT84HH3w2"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Counter */}
          <section className="py-xl bg-surface-container-low">
            <div className="max-w-container-max mx-auto px-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="glass-card p-xl rounded-2xl text-center flex flex-col gap-sm">
                  <span className="font-headline-xl text-[48px] text-secondary font-extrabold">1.5k Tons+</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Co₂ Offset</span>
                </div>
                <div className="glass-card p-xl rounded-2xl text-center flex flex-col gap-sm">
                  <span className="font-headline-xl text-[48px] text-secondary font-extrabold">50k+</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Active Users</span>
                </div>
                <div className="glass-card p-xl rounded-2xl text-center flex flex-col gap-sm">
                  <span className="font-headline-xl text-[48px] text-secondary font-extrabold">200+</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Eco Benchmarks</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid */}
          <section id="bento" className="py-2xl bg-surface">
            <div className="max-w-container-max mx-auto px-lg">
              <div className="text-center mb-2xl">
                <h2 className="font-headline-xl text-headline-xl mb-md">Personal Sustainability Suite</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">Precision tools designed to bridge the gap between carbon awareness and real ecological impact.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                {/* Carbon Tracking */}
                <div className="md:col-span-8 group relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl hover:shadow-xl transition-all h-[400px]">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className="material-symbols-outlined text-secondary text-[40px] mb-md">monitoring</span>
                      <h3 class="font-headline-lg text-headline-lg mb-sm">Regression Footprint AI</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Our calculator matches your profile details against an Ordinary Least Squares (OLS) trained model of 10,000 observations.</p>
                    </div>
                    <div className="mt-auto">
                      <button onClick={handleGuestAccess} className="flex items-center gap-xs font-label-md text-label-md text-secondary group-hover:gap-sm transition-all uppercase">
                        Explore Data Tracker <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                  <img 
                    alt="Analytics Dashboard mockup" 
                    className="absolute bottom-0 right-0 w-2/3 h-2/3 object-cover rounded-tl-3xl opacity-20 group-hover:opacity-100 transition-opacity duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj6Bdq8vJDLhzP5bEsm1VV7d0cRmHogf0YnlufPl17foe7_N0LImyU1LytzOpDaGW8jxzeIthfcA3IJWOoNEqEZI5AoOWfopKAwJDTjlm1NdJ2dXX7SKb-ydsXIZljpTXmc7MpzbKSllxVPspqwP7vQIAS01QKOXs0moto0i9goed-ynxp1Sud1n2ztwIN7XYJE5xTuiQoE-KPsvMTWn9lPefosNVazM-H6umU9eZwQxv9ee_sgbBxHI8KTYAvNHYNy1EfB7DViYG1"
                  />
                </div>

                {/* AI Coach */}
                <div className="md:col-span-4 bg-primary-container text-on-primary rounded-2xl p-xl flex flex-col justify-between overflow-hidden relative">
                  <div className="relative z-10">
                    <span className="material-symbols-outlined text-secondary-container text-[40px] mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <h3 className="font-headline-md text-headline-md mb-sm text-surface-bright">AI Sustainability Coach</h3>
                    <p className="font-body-sm text-body-sm text-on-primary-container">Receive personalized, actionable recommendations powered by machine learning algorithms to reduce your footprint.</p>
                  </div>
                  <div className="mt-md p-md bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 relative z-10 text-left">
                    <p className="font-body-sm italic text-tertiary-fixed-dim">"Switching your home boiler energy to electric reduces emissions by 425 kg CO₂/mo."</p>
                  </div>
                  <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
                    <span className="material-symbols-outlined text-[180px]">auto_awesome</span>
                  </div>
                </div>

                {/* Community */}
                <div className="md:col-span-4 glass-card rounded-2xl p-xl flex flex-col gap-md border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-[40px]">groups</span>
                  <h3 className="font-headline-md text-headline-md">Climate Leaderboards</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Log scores and match your footprint against peers, local targets, and sustainable champions on Firestore.</p>
                </div>

                {/* ESG Offset */}
                <div className="md:col-span-8 group relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-xl hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row gap-xl items-center">
                    <div className="flex-1">
                      <h3 className="font-headline-lg text-headline-lg mb-sm">Carbon Offset Portfolios</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-md">Direct support for certified reforestation, renewable energy expansions, and methane captures.</p>
                      <ul className="flex flex-col gap-sm">
                        <li className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
                          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                          Verified ecological captures
                        </li>
                        <li className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
                          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                          Real-time Net Footprint sync
                        </li>
                      </ul>
                    </div>
                    <div className="w-full md:w-1/3 h-48 bg-surface-container-high rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-outline-variant">public</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section id="testimonials" className="py-2xl bg-surface-container-lowest">
            <div className="max-w-container-max mx-auto px-lg">
              <div className="bg-surface p-xl md:p-2xl rounded-[32px] border border-outline-variant relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col items-center text-center gap-lg">
                  <span className="material-symbols-outlined text-secondary text-5xl opacity-50">format_quote</span>
                  <blockquote className="font-headline-xl text-headline-xl lg:text-[32px] lg:leading-[40px] max-w-4xl text-on-surface italic">
                    "CarbonSense transformed my environmental awareness from guessing into real, calculated data. The AI Coach recommendations alone saved me 300 kg in utility and transit offsets."
                  </blockquote>
                  <div className="flex flex-col items-center gap-sm">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden border-2 border-secondary">
                      <img 
                        alt="CEO testimonial profile headshot" 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4oGizN7aGrcUlqweseZm24-jvwjghVhnVSB__D5Ovoer9GUfFcgofPMFbhPaeC7c-pp34zxmenYHS8cW9RKjcx70KMUgnf3ttD6UCkxkrWZnBDaPUyebtgi46DKKzh2ympVcT3-hxOGK_Wjq0G5HFtY7_H3oW5V4a_CA_KTfm0rZdCaodoQhJ6szhSmnJqHIM5DHA7z-ry2gF18wP0lC6Ino-zys3LuTHtcmst0bDG0z2A9OyBwdPkAAOw8Jv3w6VfFmd4YQ2D35c"
                      />
                    </div>
                    <div className="flex flex-col">
                      <cite className="font-headline-md text-headline-md not-italic font-bold">Sarah Jenkins</cite>
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase">Environmental Lead</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section id="cta" className="py-2xl relative">
            <div className="max-w-container-max mx-auto px-lg">
              <div className="bg-primary-container rounded-[40px] p-xl md:p-2xl flex flex-col items-center text-center gap-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>
                <h2 className="font-headline-xl text-[48px] leading-tight text-white relative z-10">Ready to Lead the <span className="text-tertiary-fixed">Green Revolution?</span></h2>
                <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl relative z-10">Join thousands of global citizens achieving carbon neutrality with precision and AI intelligence.</p>
                <div className="flex flex-col sm:flex-row gap-md relative z-10">
                  <button onClick={() => setAuthView(true)} className="px-2xl py-lg bg-secondary text-on-secondary rounded-xl font-headline-md hover:scale-105 transition-all shadow-xl shadow-secondary/20">
                    Start Your Green Journey Today
                  </button>
                  <button onClick={handleGuestAccess} className="px-2xl py-lg border border-primary-fixed text-white rounded-xl font-headline-md hover:bg-white/10 transition-all">
                    Test Guest Sandbox
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-highest border-t border-outline-variant">
          <div className="w-full py-xl px-lg flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-xl">
            <div className="flex flex-col gap-sm items-center md:items-start">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">CarbonSense AI</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">© 2026 CarbonSense AI Tracker. All rights reserved.</span>
            </div>
            <div className="flex gap-xl text-center md:text-left flex-wrap justify-center">
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary" href="#">Privacy Policy</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary" href="#">Terms of Service</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary" href="#">Cookie Policy</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary" href="#">Contact Us</a>
            </div>
            <div className="flex gap-md">
              <a className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-secondary transition-all group" href="#">
                <span className="material-symbols-outlined text-on-surface group-hover:text-white">language</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-secondary transition-all group" href="#">
                <span className="material-symbols-outlined text-on-surface group-hover:text-white">public</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Determine latest calculation log
  const currentLog = logs.length > 0 ? logs[0] : null;

  // Render Portal layout if authenticated / guest sandbox
  return (
    <div className="flex min-h-screen bg-background text-on-surface overflow-x-hidden">
      {/* Sidebar for Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-container shadow-sm p-md gap-base z-50">
        <div className="px-md py-lg flex items-center gap-3 border-b border-outline-variant/30 mb-md">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
            <img 
              alt="User Status" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvGMxZCe9hqf_P9lP97vBNezRFUjQRR3mRVqTgCyzOl4TAVy_OoGSRbmOT7Fw9-Qupm4MzjQkxXRUph91sRBjBaeLSWPbiZ1p9rqHC9rHN7iJ7OZih7LJGeXQbAHayvnhB24D2419pHibt8WGMBeAovm9ncf1fX5GyGg5QWrPwM6NxjF2O_RmRYAa9Ttz9fDQxli2bmPOSVEo-b7RpwsqjGx0EchY5QRtPgk3xSDErglRMi6uuvjTiNOMHQFZvBQ17gX-sX16uMo4"
            />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">CarbonSense</h1>
            <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">
              {user === 'guest' ? 'Guest Sandbox' : 'Eco Portal'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { view: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
            { view: 'calculator', name: 'Carbon Tracker', icon: 'analytics' },
            { view: 'aiCoach', name: 'AI Coach', icon: 'psychology' },
            { view: 'learningHub', name: 'Learning Hub', icon: 'school' },
            { view: 'offsets', name: 'Carbon Offsets', icon: 'public' },
            { view: 'history', name: 'History Logs', icon: 'insert_chart' }
          ].map(item => (
            <button 
              key={item.view}
              onClick={() => { setActiveView(item.view); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-md py-sm transition-all duration-200 ease-in-out rounded-lg group ${
                activeView === item.view
                  ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined mr-md" style={{ fontVariationSettings: activeView === item.view ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="font-label-md text-label-md">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-outline-variant pt-md flex flex-col gap-md">
          <div className="flex items-center gap-md px-md">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container text-[14px]">
              {user === 'guest' ? 'G' : (user.email ? user.email[0].toUpperCase() : 'U')}
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-on-surface text-[13px] truncate">{user === 'guest' ? 'Guest User' : 'Authenticated'}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{user === 'guest' ? 'Sandbox data' : user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg w-full text-left"
          >
            <span className="material-symbols-outlined mr-md">logout</span>
            <span className="font-label-md text-label-md">
              {user === 'guest' ? 'Logout Sandbox' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Hidden on Desktop) */}
      <header className="md:hidden h-16 flex items-center justify-between px-margin-mobile bg-surface shadow-[0px_4px_20px_rgba(45,90,39,0.08)] fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
            <img 
              alt="Eco Warrior Status" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvGMxZCe9hqf_P9lP97vBNezRFUjQRR3mRVqTgCyzOl4TAVy_OoGSRbmOT7Fw9-Qupm4MzjQkxXRUph91sRBjBaeLSWPbiZ1p9rqHC9rHN7iJ7OZih7LJGeXQbAHayvnhB24D2419pHibt8WGMBeAovm9ncf1fX5GyGg5QWrPwM6NxjF2O_RmRYAa9Ttz9fDQxli2bmPOSVEo-b7RpwsqjGx0EchY5QRtPgk3xSDErglRMi6uuvjTiNOMHQFZvBQ17gX-sX16uMo4"
            />
          </div>
          <h1 className="font-headline-lg text-primary font-bold">CarbonSense AI</h1>
        </div>
        <div className="flex items-center gap-xs">
          <button 
            onClick={() => alert("Stars Achievement Badge Level: Eco Explorer (Level 3)")} 
            className="material-symbols-outlined text-primary hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-100"
          >
            stars
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-on-surface cursor-pointer p-xs hover:bg-surface-container-high rounded-full"
          >
            <span className="material-symbols-outlined text-[28px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed md:hidden top-16 left-0 right-0 bottom-16 bg-surface-container/95 backdrop-blur-lg z-35 p-lg flex flex-col justify-between border-b border-outline-variant">
          <nav className="space-y-md">
            {[
              { view: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
              { view: 'calculator', name: 'Carbon Tracker', icon: 'analytics' },
              { view: 'aiCoach', name: 'AI Coach', icon: 'psychology' },
              { view: 'learningHub', name: 'Learning Hub', icon: 'school' },
              { view: 'offsets', name: 'Carbon Offsets', icon: 'public' },
              { view: 'history', name: 'History Logs', icon: 'insert_chart' }
            ].map(item => (
              <button
                key={item.view}
                onClick={() => { setActiveView(item.view); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center px-md py-sm transition-all duration-200 ease-in-out rounded-lg ${
                  activeView === item.view 
                    ? 'bg-secondary-container text-on-secondary-container font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined mr-md" style={{ fontVariationSettings: activeView === item.view ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="font-label-md text-label-md">{item.name}</span>
              </button>
            ))}
          </nav>
          
          <div className="border-t border-outline-variant pt-md flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container">
                {user === 'guest' ? 'G' : (user.email ? user.email[0].toUpperCase() : 'U')}
              </div>
              <div>
                <p className="font-label-md text-on-surface">{user === 'guest' ? 'Guest User' : 'Authenticated'}</p>
                <p className="text-[11px] text-on-surface-variant">{user === 'guest' ? 'Sandbox data' : user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg w-full text-left"
            >
              <span className="material-symbols-outlined mr-md">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen bg-background relative overflow-hidden pt-16 pb-20 md:pt-0 md:pb-0">
        {activeView === 'dashboard' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <Dashboard 
              currentLog={currentLog} 
              leaderboard={leaderboard} 
              onNavigate={setActiveView}
              offsetTotal={offsetTotal}
            />
          </div>
        )}
        {activeView === 'calculator' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <Calculator 
              onSave={handleSaveCalculation} 
              initialData={currentLog ? currentLog.inputs : null}
            />
          </div>
        )}
        {activeView === 'aiCoach' && (
          <div className="flex-1 flex flex-col h-[calc(100dvh-128px)] md:h-screen overflow-hidden">
            <AICoach currentLog={currentLog} />
          </div>
        )}
        {activeView === 'learningHub' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <LearningHub onNavigate={setActiveView} />
          </div>
        )}
        {activeView === 'offsets' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <Offsets 
              grossEmissions={currentLog ? currentLog.score : 0} 
              onAddOffset={handleAddOffset} 
              offsetTotal={offsetTotal}
            />
          </div>
        )}
        {activeView === 'history' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <History 
              logs={logs} 
              onDeleteLog={handleDeleteLog}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-outline-variant z-40 flex justify-around items-center px-4 py-2 rounded-t-xl">
        {[
          { view: 'dashboard', name: 'Home', icon: 'dashboard' },
          { view: 'calculator', name: 'Calculator', icon: 'calculate' },
          { view: 'aiCoach', name: 'AI Coach', icon: 'psychology' },
          { view: 'learningHub', name: 'Hub', icon: 'school' },
          { view: 'offsets', name: 'Offsets', icon: 'public' }
        ].map(item => {
          const isActive = activeView === item.view;
          return (
            <button 
              key={item.view}
              onClick={() => { setActiveView(item.view); setIsMobileMenuOpen(false); }}
              className={`flex flex-col items-center justify-center transition-all duration-200 ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 translate-y-[-2px]' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="text-[10px] font-label-md uppercase tracking-wider mt-0.5">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
