import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ProfileAvatar, generateAIAvatarSvg, getEvolutionLevel } from './utils/avatar';
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
import LeaderboardRewards from './components/LeaderboardRewards';
import DatasetAnalysis from './components/DatasetAnalysis';

const STATIC_BENCHMARKS = [
  { id: 'b1', name: 'Alba Green (Vegan, Solar)', score: 712, isBenchmark: true },
  { id: 'b_krish', name: 'Krish (EV, Solar)', score: 820, isBenchmark: true },
  { id: 'b2', name: 'Julian Forest (Bike, Recycler)', score: 1044, isBenchmark: true },
  { id: 'b_rahul', name: 'Rahul (Transit, Vegetarian)', score: 1120, isBenchmark: true },
  { id: 'b3', name: 'Emma Planet (Hybrid, Electric Heat)', score: 1485, isBenchmark: true },
  { id: 'b4', name: 'Baseline Average (Nation)', score: 2269, isBenchmark: true },
  { id: 'b5', name: 'Marcus Steel (SUV, Coal Heat)', score: 4536, isBenchmark: true }
];

export const calculateRewards = (inputs, latestScore, offsetTotal) => {
  const list = [
    {
      id: 'transit_champion',
      title: 'Transit Champion',
      desc: 'Unlock by walking/biking, driving an electric car, or taking public transit.',
      unlocked: inputs ? (inputs.transport === 'walk/bicycle' || inputs.vehicleType === 'electric' || inputs.transport === 'public') : false,
      icon: 'directions_run',
      color: 'bg-emerald-500'
    },
    {
      id: 'green_diet',
      title: 'Plant Power',
      desc: 'Unlock by adopting a vegan or vegetarian diet.',
      unlocked: inputs ? (inputs.diet === 'vegan' || inputs.diet === 'vegetarian') : false,
      icon: 'local_dining',
      color: 'bg-green-600'
    },
    {
      id: 'zero_waste',
      title: 'Recycling Pro',
      desc: 'Unlock by implementing sorted recycling habits.',
      unlocked: inputs ? (inputs.recycling && inputs.recycling.length > 0) : false,
      icon: 'recycling',
      color: 'bg-teal-500'
    },
    {
      id: 'smart_home',
      title: 'Power Saver',
      desc: 'Unlock by enabling home energy efficiency improvements.',
      unlocked: inputs ? (inputs.energyEfficiency === 'Yes' || inputs.energyEfficiency === 'Sometimes') : false,
      icon: 'bolt',
      color: 'bg-amber-500'
    },
    {
      id: 'clean_boiler',
      title: 'Clean Heating',
      desc: 'Unlock by choosing electricity or natural gas heating.',
      unlocked: inputs ? (inputs.heatingEnergy === 'electricity' || inputs.heatingEnergy === 'natural gas') : false,
      icon: 'heat_pump',
      color: 'bg-purple-600'
    },
    {
      id: 'neutralizer',
      title: 'Net-Zero Hero',
      desc: 'Unlock by fully neutralizing your carbon footprint with offsets.',
      unlocked: latestScore > 0 && offsetTotal >= latestScore,
      icon: 'workspace_premium',
      color: 'bg-yellow-500'
    }
  ];

  const unlockedCount = list.filter(r => r.unlocked).length;
  const points = unlockedCount * 100;

  return { list, points, unlockedCount };
};

export default function App() {
  const [user, setUser] = useState(null); // null (not logged in), 'guest', or User object
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [offsets, setOffsets] = useState([]);
  const [leaderboard, setLeaderboard] = useState(STATIC_BENCHMARKS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sandbox active profile state
  const [activeProfile, setActiveProfile] = useState('me'); // 'me', 'krish', 'rahul' or custom profile ID

  // Dynamic profiles list state (JioCinema / Hotstar style)
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('carbonsense_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default preset profiles
    return [
      { id: 'me', name: 'Ranjeet', avatar: generateAIAvatarSvg('Ranjeet', 'warrior', 'minimalist', 'gradient-forest', 0), bg: 'gradient-forest', persona: 'warrior', style: 'minimalist', goal: 1500, type: 'me', theme: 'classic' },
      { id: 'krish', name: 'Krish', avatar: generateAIAvatarSvg('Krish', 'champion', 'futuristic', 'gradient-sunset', 500), bg: 'gradient-sunset', persona: 'champion', style: 'futuristic', goal: 1200, type: 'preset', theme: 'cyber-green' },
      { id: 'rahul', name: 'Rahul', avatar: generateAIAvatarSvg('Rahul', 'guardian', 'professional', 'gradient-ocean', 400), bg: 'gradient-ocean', persona: 'guardian', style: 'professional', goal: 1400, type: 'preset', theme: 'classic' }
    ];
  });

  // Custom user profile states
  const [profileName, setProfileName] = useState(profiles.find(p => p.id === 'me')?.name || 'Ranjeet');
  const [profileAvatar, setProfileAvatar] = useState(profiles.find(p => p.id === 'me')?.avatar || '🌳');
  const [profileGoal, setProfileGoal] = useState(profiles.find(p => p.id === 'me')?.goal || 1500);

  // Custom profile logs & offsets database
  const [customLogs, setCustomLogs] = useState(() => {
    return JSON.parse(localStorage.getItem('carbonsense_custom_logs') || '{}');
  });
  const [customOffsets, setCustomOffsets] = useState(() => {
    return JSON.parse(localStorage.getItem('carbonsense_custom_offsets') || '{}');
  });

  // Profile switcher modal control states
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Add Profile form states
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [addName, setAddName] = useState('');
  const [addGoal, setAddGoal] = useState(1500);
  const [addPersona, setAddPersona] = useState('explorer');
  const [addStyle, setAddStyle] = useState('cosmic');
  const [addBg, setAddBg] = useState('gradient-cosmic');
  const [addTheme, setAddTheme] = useState('classic');
  const [addAvatarPreview, setAddAvatarPreview] = useState(generateAIAvatarSvg('', 'explorer', 'cosmic'));

  // Edit Profile modal states
  const [editingProfileObj, setEditingProfileObj] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState(1500);
  const [editPersona, setEditPersona] = useState('explorer');
  const [editStyle, setEditStyle] = useState('cosmic');
  const [editBg, setEditBg] = useState('gradient-cosmic');
  const [editTheme, setEditTheme] = useState('classic');
  const [editAvatarPreview, setEditAvatarPreview] = useState('');

  // Sync profile configs to localStorage
  useEffect(() => {
    localStorage.setItem('carbonsense_profiles', JSON.stringify(profiles));
    localStorage.setItem('carbonsense_custom_logs', JSON.stringify(customLogs));
    localStorage.setItem('carbonsense_custom_offsets', JSON.stringify(customOffsets));
  }, [profiles, customLogs, customOffsets]);

  // Handle dynamic styling classes for Premium Profile Themes
  const currentProfileObj = profiles.find(p => p.id === activeProfile) || profiles[0];
  const activeTheme = currentProfileObj?.theme || 'classic';

  // Profile management operations
  const updateProfileDetails = (id, newName, newAvatar, newGoal, newPersona, newStyle, newBg, newTheme) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          name: newName, 
          avatar: newAvatar, 
          goal: newGoal,
          persona: newPersona || p.persona,
          style: newStyle || p.style,
          bg: newBg || p.bg,
          theme: newTheme || p.theme
        };
      }
      return p;
    }));
    
    if (id === 'me') {
      setProfileName(newName);
      setProfileAvatar(newAvatar);
      setProfileGoal(newGoal);
      localStorage.setItem('carbon_profile_name', newName);
      localStorage.setItem('carbon_profile_avatar', newAvatar);
      localStorage.setItem('carbon_profile_goal', newGoal.toString());
    }
  };

  const handleCreateProfile = () => {
    if (!addName.trim()) return;
    const newId = 'custom_' + Date.now();
    const finalAvatar = addAvatarPreview || generateAIAvatarSvg(addName.trim(), addPersona, addStyle, addBg);
    const newProfile = {
      id: newId,
      name: addName.trim(),
      avatar: finalAvatar,
      bg: addBg,
      persona: addPersona,
      style: addStyle,
      goal: addGoal,
      theme: addTheme,
      type: 'custom'
    };
    
    setProfiles(prev => [...prev, newProfile]);
    
    // Seed standard lifestyle logs for this new profile so they have calculation averages immediately
    setCustomLogs(prev => ({
      ...prev,
      [newId]: [{
        id: 'c_log_init_' + Date.now(),
        timestamp: Date.now(),
        score: 1850,
        inputs: {
          vehicleDistance: 800,
          transport: 'public',
          vehicleType: 'None',
          airTravel: 'rarely',
          diet: 'omnivore',
          heatingEnergy: 'natural gas',
          energyEfficiency: 'Sometimes',
          recycling: ['Paper'],
          groceryBill: 160,
          wasteBagCount: 2,
          tvPcHours: 4,
          newClothes: 2,
          internetHours: 5,
          bodyType: 'normal',
          sex: 'male',
          showerFrequency: 'daily',
          socialActivity: 'sometimes',
          cooking: ['Stove']
        }
      }]
    }));

    setIsAddingProfile(false);
    setAddName('');
    setAddGoal(1500);
  };

  const handleProfileSelect = (profile) => {
    if (isManageMode) {
      setEditingProfileObj(profile);
      setEditName(profile.name);
      setEditGoal(profile.goal || 1500);
      setEditPersona(profile.persona || 'explorer');
      setEditStyle(profile.style || 'cosmic');
      setEditBg(profile.bg || 'gradient-cosmic');
      setEditTheme(profile.theme || 'classic');
      setEditAvatarPreview(profile.avatar);
    } else {
      setActiveProfile(profile.id);
      setIsProfileSwitcherOpen(false);
    }
  };

  const handleSaveProfileFromSwitcher = () => {
    if (!editName.trim()) return;
    updateProfileDetails(
      editingProfileObj.id,
      editName.trim(),
      editAvatarPreview,
      editGoal,
      editPersona,
      editStyle,
      editBg,
      editTheme
    );
    setEditingProfileObj(null);
  };

  const handleDeleteProfile = () => {
    if (!editingProfileObj) return;
    setProfiles(prev => prev.filter(p => p.id !== editingProfileObj.id));
    if (activeProfile === editingProfileObj.id) {
      setActiveProfile('me');
    }
    setEditingProfileObj(null);
  };

  // In-memory states for mock profiles so they are fully reactive and editable!
  const [krishLogs, setKrishLogs] = useState([{
    id: 'k_log1',
    timestamp: Date.now(),
    score: 820,
    inputs: {
      vehicleDistance: 500,
      transport: 'private',
      vehicleType: 'electric',
      airTravel: 'rarely',
      diet: 'vegan',
      heatingEnergy: 'electricity',
      energyEfficiency: 'Yes',
      recycling: ['Paper', 'Plastic', 'Glass', 'Metal'],
      groceryBill: 120,
      wasteBagCount: 1,
      tvPcHours: 3,
      newClothes: 1,
      internetHours: 4,
      bodyType: 'normal',
      sex: 'male',
      showerFrequency: 'daily',
      socialActivity: 'sometimes',
      cooking: ['Stove', 'Microwave']
    }
  }]);

  const [krishOffsets, setKrishOffsets] = useState([
    { id: 'k_o1', type: 'Reforestation', amountKg: 150, date: '2026-05-15', provider: 'TreeNation', cost: 15, timestamp: Date.now() - 86400000 * 25 },
    { id: 'k_o2', type: 'Community Solar', amountKg: 200, date: '2026-06-01', provider: 'ClearEnergy', cost: 20, timestamp: Date.now() - 86400000 * 9 }
  ]);

  const [rahulLogs, setRahulLogs] = useState([{
    id: 'r_log1',
    timestamp: Date.now(),
    score: 1120,
    inputs: {
      vehicleDistance: 0,
      transport: 'public',
      vehicleType: 'None',
      airTravel: 'rarely',
      diet: 'vegetarian',
      heatingEnergy: 'natural gas',
      energyEfficiency: 'Sometimes',
      recycling: ['Paper', 'Plastic'],
      groceryBill: 180,
      wasteBagCount: 2,
      tvPcHours: 4,
      newClothes: 2,
      internetHours: 5,
      bodyType: 'normal',
      sex: 'male',
      showerFrequency: 'daily',
      socialActivity: 'often',
      cooking: ['Stove', 'Oven']
    }
  }]);

  const [rahulOffsets, setRahulOffsets] = useState([
    { id: 'r_o1', type: 'Wind Power', amountKg: 100, date: '2026-05-20', provider: 'GoldStandard', cost: 10, timestamp: Date.now() - 86400000 * 20 }
  ]);

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

  // Compute overridden active variables
  const activeLogs = activeProfile === 'krish' 
    ? krishLogs 
    : activeProfile === 'rahul' 
    ? rahulLogs 
    : (activeProfile === 'me' 
        ? logs 
        : (customLogs[activeProfile] || []));

  const activeOffsets = activeProfile === 'krish' 
    ? krishOffsets 
    : activeProfile === 'rahul' 
    ? rahulOffsets 
    : (activeProfile === 'me' 
        ? offsets 
        : (customOffsets[activeProfile] || []));

  const activeOffsetTotal = activeOffsets.reduce((acc, curr) => acc + (curr.amountKg || 0), 0);
  const activeCurrentLog = activeLogs.length > 0 ? activeLogs[0] : null;

  const activeRewards = useMemo(() => {
    return calculateRewards(
      activeCurrentLog ? activeCurrentLog.inputs : null,
      activeCurrentLog ? activeCurrentLog.score : 0,
      activeOffsetTotal
    );
  }, [activeCurrentLog, activeOffsetTotal]);

  // Compute dynamic leaderboard by merging static benchmarks and all dynamic profiles
  const dynamicLeaderboard = useMemo(() => {
    const krishLatestScore = krishLogs.length > 0 ? krishLogs[0].score : 820;
    const rahulLatestScore = rahulLogs.length > 0 ? rahulLogs[0].score : 1120;

    // Filter out benchmarks that match preset ids so we don't duplicate
    const benchmarkUsers = leaderboard.filter(item => 
      item.id !== 'b_krish' && 
      item.id !== 'b_rahul' && 
      item.id !== 'guest_user' && 
      item.userId !== user?.uid
    );

    const profileEntries = profiles.map(profile => {
      let score = 1580; // default benchmark if no logs
      let logList = [];
      if (profile.id === 'me') {
        logList = logs;
      } else if (profile.id === 'krish') {
        logList = krishLogs;
      } else if (profile.id === 'rahul') {
        logList = rahulLogs;
      } else {
        logList = customLogs[profile.id] || [];
      }
      
      if (logList.length > 0) {
        score = logList[0].score;
      }

      return {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        score: score,
        isCurrentUser: activeProfile === profile.id,
        isCustom: profile.id !== 'me' && profile.id !== 'krish' && profile.id !== 'rahul'
      };
    });

    // Merge benchmark users with dynamic profiles, sorting by score ascending (lower is better!)
    return [...profileEntries, ...benchmarkUsers].sort((a, b) => a.score - b.score);
  }, [leaderboard, logs, krishLogs, rahulLogs, customLogs, profiles, activeProfile, user]);

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
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      inputs,
      score
    };

    if (activeProfile === 'krish') {
      setKrishLogs([newLog, ...krishLogs]);
      setActiveView('dashboard');
      return;
    }
    if (activeProfile === 'rahul') {
      setRahulLogs([newLog, ...rahulLogs]);
      setActiveView('dashboard');
      return;
    }
    if (activeProfile !== 'me') {
      setCustomLogs(prev => ({
        ...prev,
        [activeProfile]: [newLog, ...(prev[activeProfile] || [])]
      }));
      setActiveView('dashboard');
      return;
    }

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
    const newOffset = {
      id: 'offset_' + Date.now(),
      ...offsetRecord,
      timestamp: Date.now()
    };

    if (activeProfile === 'krish') {
      setKrishOffsets([newOffset, ...krishOffsets]);
      return;
    }
    if (activeProfile === 'rahul') {
      setRahulOffsets([newOffset, ...rahulOffsets]);
      return;
    }
    if (activeProfile !== 'me') {
      setCustomOffsets(prev => ({
        ...prev,
        [activeProfile]: [newOffset, ...(prev[activeProfile] || [])]
      }));
      return;
    }

    if (user === 'guest') {
      const updatedOffsets = [newOffset, ...offsets];
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
    if (activeProfile === 'krish') {
      setKrishLogs(krishLogs.filter(l => l.id !== logId));
      return;
    }
    if (activeProfile === 'rahul') {
      setRahulLogs(rahulLogs.filter(l => l.id !== logId));
      return;
    }
    if (activeProfile !== 'me') {
      setCustomLogs(prev => ({
        ...prev,
        [activeProfile]: (prev[activeProfile] || []).filter(l => l.id !== logId)
      }));
      return;
    }

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

  const renderProfileDropdown = (positionClasses = "right-0 top-12") => {
    const points = activeRewards.points;
    const evolution = getEvolutionLevel(points);
    return (
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on content click
        className={`absolute ${positionClasses} w-56 bg-surface-container-highest border border-outline-variant/80 rounded-2xl shadow-xl z-50 p-sm text-left animate-scale-up text-on-surface`}
      >
        {/* Profile Header */}
        <div className="px-md py-sm border-b border-outline-variant/40 flex items-center gap-sm">
          <ProfileAvatar avatar={currentProfileObj.avatar} className="w-8 h-8" />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{currentProfileObj.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">spa</span>
              {evolution.title}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-xs space-y-[2px]">
          <button 
            onClick={() => {
              setActiveView('rewards');
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-sm mr-md text-outline">account_circle</span>
            <span className="text-xs font-semibold">My Profile</span>
          </button>
          <button 
            onClick={() => {
              setActiveView('dashboard');
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-sm mr-md text-outline">dashboard</span>
            <span className="text-xs font-semibold">Dashboard</span>
          </button>
          <button 
            onClick={() => {
              setActiveView('rewards');
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-sm mr-md text-outline">emoji_events</span>
            <span className="text-xs font-semibold">Achievements</span>
          </button>
          <button 
            onClick={() => {
              setActiveView('rewards');
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-sm mr-md text-outline">settings</span>
            <span className="text-xs font-semibold">Settings</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="border-t border-outline-variant/40 pt-xs mt-xs space-y-[2px]">
          <button 
            onClick={() => {
              setIsProfileSwitcherOpen(true);
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg text-secondary transition-colors text-left font-bold"
          >
            <span className="material-symbols-outlined text-sm mr-md">switch_account</span>
            <span className="text-xs">Switch User</span>
          </button>
          <button 
            onClick={() => {
              setIsProfileSwitcherOpen(true);
              setIsAddingProfile(true);
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg text-emerald-600 transition-colors text-left font-bold"
          >
            <span className="material-symbols-outlined text-sm mr-md">person_add</span>
            <span className="text-xs">Add Account</span>
          </button>
          <button 
            onClick={() => {
              handleSignOut();
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-md py-sm hover:bg-surface-container-high rounded-lg text-error transition-colors text-left font-bold"
          >
            <span className="material-symbols-outlined text-sm mr-md">logout</span>
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </div>
    );
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

          {/* Community Spotlight & LinkedIn Demo Showcase */}
          <section id="demo" className="py-2xl bg-surface-container-low">
            <div className="max-w-container-max mx-auto px-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center bg-surface p-xl md:p-2xl rounded-[32px] border border-outline-variant relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="lg:col-span-6 flex flex-col gap-lg relative z-10">
                  <div className="inline-flex items-center gap-xs px-md py-xs bg-secondary-container text-on-secondary-container rounded-full w-fit font-label-md text-label-md">
                    <span className="material-symbols-outlined text-sm">share</span>
                    LIVE DEMO SHOWCASE
                  </div>
                  <h2 className="font-headline-xl text-headline-xl lg:text-[40px] lg:leading-[48px] text-on-surface font-bold">
                    See CarbonSense AI in <span className="text-secondary">Action!</span>
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                    Discover how our AI-powered carbon emission calculator and reward ecosystem drives meaningful lifestyle shifts. Check out the community showcase update and join the global movement for a sustainable tomorrow.
                  </p>
                  <div className="flex flex-col gap-sm">
                    <div className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                      Interactive dashboard highlights & metrics
                    </div>
                    <div className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                      Gamified rewards & social leaderboards
                    </div>
                    <div className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                      AI Coach tailored offsets & recommendations
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 flex justify-center items-center relative z-10 w-full">
                  <div className="w-full max-w-[504px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl transition-all hover:shadow-2xl">
                    <div className="p-sm bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-xs">
                        <span className="w-3 h-3 rounded-full bg-error"></span>
                        <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      </div>
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">LinkedIn Spotlight</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-md">public</span>
                    </div>
                    <iframe 
                      src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7470379385959890944?compact=1" 
                      height="399" 
                      className="w-full"
                      style={{ border: 'none', minHeight: '399px' }} 
                      allowFullScreen={true}
                      title="Embedded post"
                    ></iframe>
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
  const currentLog = activeCurrentLog;
  const logsToRender = activeLogs;
  const offsetsToRender = activeOffsets;
  const offsetTotalToRender = activeOffsetTotal;
  const leaderboardToRender = dynamicLeaderboard;
  const rewardsToRender = activeRewards;

  // Render Portal layout if authenticated / guest sandbox
  return (
    <div className={`flex min-h-screen bg-background text-on-surface overflow-x-hidden theme-${activeTheme}`}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-surface-container shadow-sm p-md gap-base z-50">
        <div className="px-md py-lg flex items-center gap-3 border-b border-outline-variant/30">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed relative flex items-center justify-center bg-white/10 shadow-sm">
            <ProfileAvatar avatar={currentProfileObj.avatar} className="w-full h-full" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">CarbonSense</h1>
            <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">
              {user === 'guest' ? 'Guest Sandbox' : 'Eco Portal'}
            </p>
          </div>
        </div>

        {/* Sandbox Profile Switcher (JioCinema / Hotstar Style) */}
        <div className="px-md py-sm border-b border-outline-variant/30 mb-sm">
          <button
            onClick={() => setIsProfileSwitcherOpen(true)}
            className="w-full flex items-center justify-between bg-primary-container text-white hover:bg-primary transition-all duration-200 rounded-xl px-md py-sm font-bold text-[12px] shadow-sm shadow-primary/20"
          >
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">switch_account</span>
              <span>Switch Profile</span>
            </div>
            <span className="bg-white/20 px-xs py-1 rounded text-[9px] uppercase tracking-wider font-bold">
              {currentProfileObj.name}
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {[
            { view: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
            { view: 'calculator', name: 'Carbon Tracker', icon: 'analytics' },
            { view: 'rewards', name: 'Leaderboard & Rewards', icon: 'emoji_events' },
            { view: 'aiCoach', name: 'AI Coach', icon: 'psychology' },
            { view: 'learningHub', name: 'Learning Hub', icon: 'school' },
            { view: 'offsets', name: 'Carbon Offsets', icon: 'public' },
            { view: 'analysis', name: 'Dataset Analysis', icon: 'bar_chart' },
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
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-sm px-md py-sm rounded-xl hover:bg-surface-container-high transition-all cursor-pointer relative"
          >
            <div className="flex items-center gap-md min-w-0">
              <ProfileAvatar avatar={currentProfileObj.avatar} className="w-10 h-10" />
              <div className="min-w-0">
                <p className="font-label-md text-on-surface text-[13px] font-bold truncate">
                  {currentProfileObj.name}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  {activeProfile === 'me' ? (user === 'guest' ? 'Guest Sandbox' : user.email) : 'Simulated Account'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline">more_vert</span>
            
            {isDropdownOpen && renderProfileDropdown('left-0 bottom-14')}
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (Hidden on Desktop) */}
      <header className="md:hidden h-16 flex items-center justify-between px-margin-mobile bg-surface shadow-[0px_4px_20px_rgba(45,90,39,0.08)] fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed relative flex items-center justify-center bg-white/10 shadow-sm">
            <ProfileAvatar avatar={currentProfileObj.avatar} className="w-full h-full" />
          </div>
          <h1 className="font-headline-lg text-primary font-bold">CarbonSense AI</h1>
        </div>
        <div className="flex items-center gap-xs relative">
          <button 
            onClick={() => setIsProfileSwitcherOpen(true)}
            className="bg-secondary-container/85 border border-outline-variant/30 rounded-full px-sm py-xs text-[10px] font-bold text-on-secondary-container flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-xs">switch_account</span>
            <span>Switch</span>
          </button>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed relative flex items-center justify-center bg-white/10 cursor-pointer shadow-sm"
          >
            <ProfileAvatar avatar={currentProfileObj.avatar} className="w-full h-full" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-on-surface cursor-pointer p-xs hover:bg-surface-container-high rounded-full"
          >
            <span className="material-symbols-outlined text-[28px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          {isDropdownOpen && renderProfileDropdown('right-0 top-12')}
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed md:hidden top-16 left-0 right-0 bottom-16 bg-surface-container/95 backdrop-blur-lg z-35 p-lg flex flex-col justify-between border-b border-outline-variant">
          <nav className="space-y-md overflow-y-auto">
            {[
              { view: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
              { view: 'calculator', name: 'Carbon Tracker', icon: 'analytics' },
              { view: 'rewards', name: 'Leaderboard & Rewards', icon: 'emoji_events' },
              { view: 'aiCoach', name: 'AI Coach', icon: 'psychology' },
              { view: 'learningHub', name: 'Learning Hub', icon: 'school' },
              { view: 'offsets', name: 'Carbon Offsets', icon: 'public' },
              { view: 'analysis', name: 'Dataset Analysis', icon: 'bar_chart' },
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
            <div 
              onClick={() => { setIsMobileMenuOpen(false); setIsDropdownOpen(true); }}
              className="flex items-center gap-md cursor-pointer"
            >
              <ProfileAvatar avatar={currentProfileObj.avatar} className="w-10 h-10" />
              <div>
                <p className="font-label-md text-on-surface font-bold">
                  {currentProfileObj.name}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {activeProfile === 'me' ? (user === 'guest' ? 'Guest Sandbox' : user.email) : 'Simulated Account'}
                </p>
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

      {/* Theme Overrides Stylesheet */}
      <style>{`
        /* Premium Dark Neon Theme Styles */
        .theme-cyber-green {
          --background: #061208;
          --on-surface: #a3ffd1;
          --outline-variant: #082d13;
        }
        .theme-cyber-green.flex {
          background-color: #061208 !important;
          color: #a3ffd1 !important;
        }
        .theme-cyber-green .text-on-surface {
          color: #a3ffd1 !important;
        }
        .theme-cyber-green .text-on-surface-variant {
          color: #72a38a !important;
        }
        .theme-cyber-green aside {
          background-color: #0c1f0f !important;
          border-right: 1px solid #143e1d !important;
        }
        .theme-cyber-green .bg-surface {
          background-color: #091a0c !important;
        }
        .theme-cyber-green .bg-surface-container {
          background-color: #0c1f0f !important;
        }
        .theme-cyber-green .bg-surface-container-high {
          background-color: #122c16 !important;
        }
        .theme-cyber-green .bg-surface-container-lowest {
          background-color: #040e05 !important;
        }
        .theme-cyber-green .bg-primary {
          background-color: #00ff66 !important;
          color: #000000 !important;
        }
        .theme-cyber-green .bg-primary-container {
          background-color: #0b3d17 !important;
          color: #00ff66 !important;
        }
        .theme-cyber-green .text-primary {
          color: #00ff66 !important;
        }
        .theme-cyber-green .border-outline-variant {
          border-color: #143e1d !important;
        }
        .theme-cyber-green .glass-card {
          background: rgba(12, 31, 15, 0.7) !important;
          border-color: rgba(0, 255, 102, 0.25) !important;
          box-shadow: 0 0 20px rgba(0, 255, 102, 0.1) !important;
        }

        /* Premium Gold Theme Styles */
        .theme-gold {
          --background: #15110c;
          --on-surface: #fcecd7;
          --outline-variant: #3a2e1d;
        }
        .theme-gold.flex {
          background-color: #15110c !important;
          color: #fcecd7 !important;
        }
        .theme-gold .text-on-surface {
          color: #fcecd7 !important;
        }
        .theme-gold .text-on-surface-variant {
          color: #bfa88c !important;
        }
        .theme-gold aside {
          background-color: #261f15 !important;
          border-right: 1px solid #453825 !important;
        }
        .theme-gold .bg-surface {
          background-color: #1e1810 !important;
        }
        .theme-gold .bg-surface-container {
          background-color: #261f15 !important;
        }
        .theme-gold .bg-surface-container-high {
          background-color: #352c1e !important;
        }
        .theme-gold .bg-surface-container-lowest {
          background-color: #100c08 !important;
        }
        .theme-gold .bg-primary {
          background-color: #bf953f !important;
          color: #000000 !important;
        }
        .theme-gold .bg-primary-container {
          background-color: #463718 !important;
          color: #bf953f !important;
        }
        .theme-gold .text-primary {
          color: #bf953f !important;
        }
        .theme-gold .border-outline-variant {
          border-color: #453825 !important;
        }
        .theme-gold .glass-card {
          background: rgba(38, 31, 21, 0.75) !important;
          border-color: rgba(191, 149, 63, 0.25) !important;
          box-shadow: 0 0 20px rgba(191, 149, 63, 0.1) !important;
        }
        
        /* Dark Neon Theme Styles */
        .theme-dark-neon {
          --background: #070b13;
          --on-surface: #e2e8f0;
          --outline-variant: #1e293b;
        }
        .theme-dark-neon.flex {
          background-color: #070b13 !important;
          color: #e2e8f0 !important;
        }
        .theme-dark-neon .text-on-surface {
          color: #e2e8f0 !important;
        }
        .theme-dark-neon .text-on-surface-variant {
          color: #94a3b8 !important;
        }
        .theme-dark-neon aside {
          background-color: #0f172a !important;
          border-right: 1px solid #1e293b !important;
        }
        .theme-dark-neon .bg-surface {
          background-color: #0d1321 !important;
        }
        .theme-dark-neon .bg-surface-container {
          background-color: #0f172a !important;
        }
        .theme-dark-neon .bg-surface-container-high {
          background-color: #1e293b !important;
        }
        .theme-dark-neon .bg-surface-container-lowest {
          background-color: #030710 !important;
        }
        .theme-dark-neon .bg-primary {
          background-color: #10b981 !important;
          color: #000000 !important;
        }
        .theme-dark-neon .bg-primary-container {
          background-color: #064e3b !important;
          color: #34d399 !important;
        }
        .theme-dark-neon .text-primary {
          color: #34d399 !important;
        }
        .theme-dark-neon .border-outline-variant {
          border-color: #1e293b !important;
        }
        .theme-dark-neon .glass-card {
          background: rgba(15, 23, 42, 0.7) !important;
          border-color: rgba(52, 211, 153, 0.2) !important;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.1) !important;
        }
      `}</style>

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen bg-background relative overflow-hidden pt-16 pb-20 md:pt-0 md:pb-0">
        
        {/* Global Desktop Top Bar */}
        <header className="hidden md:flex h-16 items-center justify-end px-xl bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-35">
          <div className="flex items-center gap-md relative">
            <button 
              onClick={() => alert(`Stars Achievement Level: Level ${activeRewards.unlockedCount} ${activeRewards.unlockedCount >= 5 ? 'Eco Champion' : 'Eco Explorer'}`)} 
              className="material-symbols-outlined text-primary hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-100"
            >
              stars
            </button>

            {/* Profile Dropdown Trigger */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-full pl-xs pr-md py-xs shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary-fixed relative flex items-center justify-center bg-white/10 shadow-sm">
                <ProfileAvatar avatar={currentProfileObj.avatar} className="w-full h-full" />
              </div>
              <span className="font-label-md text-label-md text-on-surface font-semibold max-w-[120px] truncate">
                {currentProfileObj.name}
              </span>
              <span className="material-symbols-outlined text-sm text-outline">arrow_drop_down</span>
            </button>
            
            {/* Desktop Profile Dropdown Menu */}
            {isDropdownOpen && renderProfileDropdown('right-0 top-12')}
          </div>
        </header>

        {activeView === 'dashboard' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <Dashboard 
              currentLog={currentLog} 
              leaderboard={leaderboardToRender} 
              onNavigate={setActiveView}
              offsetTotal={offsetTotalToRender}
              rewards={rewardsToRender}
              activeProfileObj={currentProfileObj}
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
        {activeView === 'rewards' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <LeaderboardRewards 
              activeProfile={activeProfile}
              setActiveProfile={setActiveProfile}
              leaderboard={leaderboardToRender}
              rewards={rewardsToRender}
              currentLog={currentLog}
              offsetTotal={offsetTotalToRender}
              profileName={profileName}
              setProfileName={setProfileName}
              profileAvatar={profileAvatar}
              setProfileAvatar={setProfileAvatar}
              profileGoal={profileGoal}
              setProfileGoal={setProfileGoal}
              dynamicProfilesList={profiles}
              customLogsData={customLogs}
              onUpdateProfile={updateProfileDetails}
            />
          </div>
        )}
        {activeView === 'aiCoach' && (
          <div className="flex-1 flex flex-col h-[calc(100dvh-128px)] md:h-screen overflow-hidden">
            <AICoach currentLog={currentLog} profileName={currentProfileObj.name} />
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
              offsetTotal={offsetTotalToRender}
            />
          </div>
        )}
        {activeView === 'analysis' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <DatasetAnalysis />
          </div>
        )}
        {activeView === 'history' && (
          <div className="p-lg md:p-xl flex-1 flex flex-col">
            <History 
              logs={logsToRender} 
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

      {/* JioCinema / Hotstar Style "Who's Tracking?" Switch User Gate Modal */}
      {isProfileSwitcherOpen && (
        <div className="fixed inset-0 bg-[#0c111b]/95 backdrop-blur-xl z-[100] flex flex-col justify-center items-center p-lg animate-fade-in text-white">
          <div className="max-w-2xl w-full text-center space-y-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-md">
              {isManageMode ? "Manage Profiles" : "Who's Tracking Carbon Today?"}
            </h2>
            
            {/* Profiles Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg justify-center items-center py-md">
              {profiles.map(profile => {
                const isSelected = activeProfile === profile.id;
                return (
                  <button 
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    aria-label={`Select profile ${profile.name}`}
                    className="flex flex-col items-center gap-base group cursor-pointer relative focus:outline-none"
                  >
                    {/* Avatar Ring Container */}
                    <div className={`w-24 h-24 rounded-full p-1 relative transition-all duration-300 transform group-hover:scale-110 ${
                      isSelected 
                        ? 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
                        : 'ring-2 ring-white/20 hover:ring-white/80'
                    }`}>
                      <ProfileAvatar avatar={profile.avatar} className="w-full h-full" />
                      
                      {/* Manage mode overlay pencil icon */}
                      {isManageMode && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-xl">edit</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Name */}
                    <span className="text-sm font-bold tracking-wide text-white/90 group-hover:text-white mt-xs">
                      {profile.name}
                    </span>
                  </button>
                );
              })}

              {/* Add Account Card */}
              <button 
                onClick={() => setIsAddingProfile(true)}
                aria-label="Add a new sandbox profile"
                className="flex flex-col items-center gap-base group cursor-pointer focus:outline-none"
              >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 hover:border-white flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 bg-white/5 hover:bg-white/10">
                  <span className="material-symbols-outlined text-white/60 group-hover:text-white text-3xl">add</span>
                </div>
                <span className="text-sm font-bold tracking-wide text-white/60 group-hover:text-white mt-xs">Add Profile</span>
              </button>
            </div>

            {/* Switch Action Buttons */}
            <div className="flex justify-center gap-md pt-lg">
              <button 
                onClick={() => setIsManageMode(!isManageMode)}
                className="px-xl py-sm rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold tracking-wider uppercase transition-all"
              >
                {isManageMode ? "Done Managing" : "Manage Profiles"}
              </button>
              <button 
                onClick={() => {
                  setIsProfileSwitcherOpen(false);
                  setIsManageMode(false);
                }}
                className="px-xl py-sm rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold tracking-wider uppercase transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Profile Sub-Modal */}
      {isAddingProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-md">
          <div 
            className="bg-[#182030] rounded-3xl border border-outline-variant/20 p-xl max-w-md w-full shadow-2xl space-y-md animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-emerald-500">person_add</span>
              Create Sandbox Profile
            </h3>
            
            <div className="space-y-sm text-left">
              <div>
                <label htmlFor="add-name-input" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Profile Name</label>
                <input 
                  id="add-name-input"
                  type="text" 
                  value={addName}
                  onChange={(e) => {
                    setAddName(e.target.value);
                    setAddAvatarPreview(generateAIAvatarSvg(e.target.value, addPersona, addStyle, addBg, 0));
                  }}
                  placeholder="e.g. Priya"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-md py-sm text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label htmlFor="add-persona-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Persona</label>
                  <select 
                    id="add-persona-select"
                    value={addPersona}
                    onChange={(e) => {
                      setAddPersona(e.target.value);
                      setAddAvatarPreview(generateAIAvatarSvg(addName, e.target.value, addStyle, addBg, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="explorer">Eco Explorer</option>
                    <option value="scientist">Climate Scientist</option>
                    <option value="warrior">Green Warrior</option>
                    <option value="guardian">Nature Guardian</option>
                    <option value="champion">Sustainability Champion</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="add-style-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Visual Style</label>
                  <select 
                    id="add-style-select"
                    value={addStyle}
                    onChange={(e) => {
                      setAddStyle(e.target.value);
                      setAddAvatarPreview(generateAIAvatarSvg(addName, addPersona, e.target.value, addBg, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="cosmic">Cosmic Space</option>
                    <option value="nature">Neon Forest</option>
                    <option value="cyber">Cyberpunk HUD</option>
                    <option value="geometry">Crystal Geometry</option>
                    <option value="minimalist">Minimalist Fine Line</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label htmlFor="add-bg-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Background</label>
                  <select 
                    id="add-bg-select"
                    value={addBg}
                    onChange={(e) => {
                      setAddBg(e.target.value);
                      setAddAvatarPreview(generateAIAvatarSvg(addName, addPersona, addStyle, e.target.value, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="gradient-cosmic">Cosmic Purple</option>
                    <option value="gradient-forest">Forest Green</option>
                    <option value="gradient-ocean">Ocean Blue</option>
                    <option value="gradient-sunset">Sunset Gold</option>
                    <option value="gradient-cyber">Cyber Pink</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="add-theme-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Premium Theme</label>
                  <select 
                    id="add-theme-select"
                    value={addTheme}
                    onChange={(e) => setAddTheme(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="classic">Classic Emerald</option>
                    <option value="cyber-green">Cyber Green</option>
                    <option value="dark-neon">Dark Neon</option>
                    <option value="gold">Premium Gold</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="add-goal-input" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Target Carbon Goal (kg/mo)</label>
                <input 
                  id="add-goal-input"
                  type="number" 
                  value={addGoal}
                  onChange={(e) => setAddGoal(parseInt(e.target.value) || 1500)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-md py-sm text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                />
              </div>

              {/* Dynamic Preview Box */}
              <div className="flex flex-col items-center bg-white/5 p-md rounded-2xl border border-white/10 gap-xs">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">AI DP Preview</span>
                <ProfileAvatar avatar={addAvatarPreview} className="w-20 h-20" />
              </div>
            </div>

            <div className="flex gap-sm pt-md">
              <button 
                onClick={() => setIsAddingProfile(false)}
                className="flex-1 px-md py-sm rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold tracking-wider uppercase transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProfile}
                className="flex-1 px-md py-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold tracking-wider uppercase transition-all"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Sub-Modal */}
      {editingProfileObj && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-md">
          <div 
            className="bg-[#182030] rounded-3xl border border-outline-variant/20 p-xl max-w-md w-full shadow-2xl space-y-md animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-emerald-500">edit</span>
              Edit Profile Settings
            </h3>
            
            <div className="space-y-sm text-left">
              <div>
                <label htmlFor="edit-name-input" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Profile Name</label>
                <input 
                  id="edit-name-input"
                  type="text" 
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditAvatarPreview(generateAIAvatarSvg(e.target.value, editPersona, editStyle, editBg, 0));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-md py-sm text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label htmlFor="edit-persona-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Persona</label>
                  <select 
                    id="edit-persona-select"
                    value={editPersona}
                    onChange={(e) => {
                      setEditPersona(e.target.value);
                      setEditAvatarPreview(generateAIAvatarSvg(editName, e.target.value, editStyle, editBg, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="explorer">Eco Explorer</option>
                    <option value="scientist">Climate Scientist</option>
                    <option value="warrior">Green Warrior</option>
                    <option value="guardian">Nature Guardian</option>
                    <option value="champion">Sustainability Champion</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-style-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Visual Style</label>
                  <select 
                    id="edit-style-select"
                    value={editStyle}
                    onChange={(e) => {
                      setEditStyle(e.target.value);
                      setEditAvatarPreview(generateAIAvatarSvg(editName, editPersona, e.target.value, editBg, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="cosmic">Cosmic Space</option>
                    <option value="nature">Neon Forest</option>
                    <option value="cyber">Cyberpunk HUD</option>
                    <option value="geometry">Crystal Geometry</option>
                    <option value="minimalist">Minimalist Fine Line</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label htmlFor="edit-bg-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Background</label>
                  <select 
                    id="edit-bg-select"
                    value={editBg}
                    onChange={(e) => {
                      setEditBg(e.target.value);
                      setEditAvatarPreview(generateAIAvatarSvg(editName, editPersona, editStyle, e.target.value, 0));
                    }}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="gradient-cosmic">Cosmic Purple</option>
                    <option value="gradient-forest">Forest Green</option>
                    <option value="gradient-ocean">Ocean Blue</option>
                    <option value="gradient-sunset">Sunset Gold</option>
                    <option value="gradient-cyber">Cyber Pink</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-theme-select" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Premium Theme</label>
                  <select 
                    id="edit-theme-select"
                    value={editTheme}
                    onChange={(e) => setEditTheme(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-sm py-sm text-xs outline-none text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="classic">Classic Emerald</option>
                    <option value="cyber-green">Cyber Green</option>
                    <option value="dark-neon">Dark Neon</option>
                    <option value="gold">Premium Gold</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-goal-input" className="text-[11px] font-bold text-white/60 uppercase block mb-xs">Target Carbon Goal (kg/mo)</label>
                <input 
                  id="edit-goal-input"
                  type="number" 
                  value={editGoal}
                  onChange={(e) => setEditGoal(parseInt(e.target.value) || 1500)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-md py-sm text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                />
              </div>

              {/* Dynamic Preview Box */}
              <div className="flex flex-col items-center bg-white/5 p-md rounded-2xl border border-white/10 gap-xs">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">AI DP Preview</span>
                <ProfileAvatar avatar={editAvatarPreview} className="w-20 h-20" />
              </div>
            </div>

            <div className="flex gap-sm pt-md">
              {editingProfileObj.id !== 'me' && (
                <button 
                  onClick={handleDeleteProfile}
                  className="px-md py-sm rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold tracking-wider uppercase transition-all"
                >
                  Delete
                </button>
              )}
              <button 
                onClick={() => setEditingProfileObj(null)}
                className="flex-1 px-md py-sm rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold tracking-wider uppercase transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfileFromSwitcher}
                className="flex-1 px-md py-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold tracking-wider uppercase transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
