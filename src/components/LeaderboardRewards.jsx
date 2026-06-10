import React, { useState, useMemo } from 'react';
import { ProfileAvatar, generateAIAvatarSvg } from '../utils/avatar';

// Static definitions of other users on the leaderboard to show details
export const LEADERBOARD_PROFILES = {
  'b1': {
    name: 'Alba Green',
    subtitle: 'Vegan, Solar Pioneer',
    score: 712,
    xp: 500,
    traits: {
      diet: 'Vegan',
      transport: 'Walk / Bicycle',
      vehicle: 'None',
      heating: 'Electricity (Solar)',
      efficiency: 'Yes',
      airTravel: 'Never',
      recycling: ['Paper', 'Plastic', 'Glass', 'Metal']
    },
    badges: ['transit_champion', 'green_diet', 'zero_waste', 'smart_home', 'clean_boiler']
  },
  'b_krish': {
    name: 'Krish',
    subtitle: 'EV & Solar Owner',
    score: 820,
    xp: 500,
    traits: {
      diet: 'Vegan',
      transport: 'Private (EV)',
      vehicle: 'Electric',
      heating: 'Electricity (Solar)',
      efficiency: 'Yes',
      airTravel: 'Rarely',
      recycling: ['Paper', 'Plastic', 'Glass', 'Metal']
    },
    badges: ['transit_champion', 'green_diet', 'zero_waste', 'smart_home', 'clean_boiler']
  },
  'b2': {
    name: 'Julian Forest',
    subtitle: 'Active Biker, Recycler',
    score: 1044,
    xp: 400,
    traits: {
      diet: 'Pescatarian',
      transport: 'Walk / Bicycle',
      vehicle: 'None',
      heating: 'Natural Gas',
      efficiency: 'Yes',
      airTravel: 'Rarely',
      recycling: ['Paper', 'Plastic', 'Glass', 'Metal']
    },
    badges: ['transit_champion', 'zero_waste', 'smart_home', 'clean_boiler']
  },
  'b_rahul': {
    name: 'Rahul',
    subtitle: 'Transit & Veg Advocate',
    score: 1120,
    xp: 500,
    traits: {
      diet: 'Vegetarian',
      transport: 'Public Transit',
      vehicle: 'None',
      heating: 'Natural Gas',
      efficiency: 'Sometimes',
      airTravel: 'Rarely',
      recycling: ['Paper', 'Plastic']
    },
    badges: ['transit_champion', 'green_diet', 'zero_waste', 'smart_home', 'clean_boiler']
  },
  'b3': {
    name: 'Emma Planet',
    subtitle: 'Hybrid Car, Heat Pump',
    score: 1485,
    xp: 500,
    traits: {
      diet: 'Vegetarian',
      transport: 'Private (Hybrid)',
      vehicle: 'Hybrid',
      heating: 'Electricity (Heat Pump)',
      efficiency: 'Yes',
      airTravel: 'Rarely',
      recycling: ['Paper', 'Plastic']
    },
    badges: ['transit_champion', 'green_diet', 'zero_waste', 'smart_home', 'clean_boiler']
  },
  'b4': {
    name: 'Baseline Average (Nation)',
    subtitle: 'Average Consumer',
    score: 2269,
    xp: 300,
    traits: {
      diet: 'Omnivore',
      transport: 'Public Transit',
      vehicle: 'None',
      heating: 'Natural Gas',
      efficiency: 'Sometimes',
      recycling: ['Paper']
    },
    badges: ['transit_champion', 'smart_home', 'clean_boiler']
  },
  'b5': {
    name: 'Marcus Steel',
    subtitle: 'High Consumption Profile',
    score: 4536,
    xp: 0,
    traits: {
      diet: 'Omnivore',
      transport: 'Private (SUV)',
      vehicle: 'Petrol',
      heating: 'Coal',
      efficiency: 'No',
      airTravel: 'Very Frequently',
      recycling: []
    },
    badges: []
  }
};

export default function LeaderboardRewards({ 
  activeProfile, 
  setActiveProfile, 
  leaderboard, 
  rewards, 
  currentLog, 
  offsetTotal = 0,
  profileName,
  setProfileName,
  profileAvatar,
  setProfileAvatar,
  profileGoal,
  setProfileGoal,
  dynamicProfilesList = [],
  customLogsData = {},
  onUpdateProfile
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Profile Customization States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(profileName || '');
  const [tempAvatar, setTempAvatar] = useState(profileAvatar || '🌳');
  const [tempGoal, setTempGoal] = useState(profileGoal || 1500);
  const [aiStyle, setAiStyle] = useState('cosmic');

  const handleGenerateAIAvatar = () => {
    const seed = tempName.trim() || 'user';
    const svg = generateAIAvatarSvg(seed, aiStyle);
    setTempAvatar(svg);
  };

  const handleSaveProfileChange = () => {
    if (!tempName.trim()) return;
    setProfileName(tempName.trim());
    setProfileAvatar(tempAvatar);
    setProfileGoal(parseInt(tempGoal) || 1500);
    setIsEditingProfile(false);
    
    if (onUpdateProfile) {
      onUpdateProfile(selectedUser.id, tempName.trim(), tempAvatar, parseInt(tempGoal) || 1500);
    }
    
    // Dynamically update the selected user modal state
    setSelectedUser(prev => prev ? { ...prev, name: tempName.trim(), avatar: tempAvatar } : null);
  };

  const activePoints = rewards.points;
  const activeLevel = Math.floor(activePoints / 100) + 1;
  const levelProgress = (activePoints % 100);

  // Badge list definition
  const badgeDefinitions = [
    {
      id: 'transit_champion',
      title: 'Transit Champion',
      desc: 'Unlock by walking/biking, driving an electric car, or taking public transit.',
      icon: 'directions_run',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700'
    },
    {
      id: 'green_diet',
      title: 'Plant Power',
      desc: 'Unlock by adopting a vegan or vegetarian diet.',
      icon: 'local_dining',
      color: 'bg-green-600',
      textColor: 'text-green-700'
    },
    {
      id: 'zero_waste',
      title: 'Recycling Pro',
      desc: 'Unlock by implementing sorted recycling habits (Paper, Plastic, Glass, or Metal).',
      icon: 'recycling',
      color: 'bg-teal-500',
      textColor: 'text-teal-700'
    },
    {
      id: 'smart_home',
      title: 'Power Saver',
      desc: 'Unlock by enabling home energy efficiency improvements.',
      icon: 'bolt',
      color: 'bg-amber-500',
      textColor: 'text-amber-700'
    },
    {
      id: 'clean_boiler',
      title: 'Clean Heating',
      desc: 'Unlock by choosing electricity or natural gas heating sources over wood/coal.',
      icon: 'heat_pump',
      color: 'bg-purple-600',
      textColor: 'text-purple-700'
    },
    {
      id: 'neutralizer',
      title: 'Net-Zero Hero',
      desc: 'Unlock by fully neutralizing your gross carbon emissions using offsets.',
      icon: 'workspace_premium',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700'
    }
  ];

  // Helper to open details for a user row
  const handleUserClick = (userRow) => {
    // If it's one of our dynamic sandbox profiles (active or not)
    const matchedProfile = dynamicProfilesList?.find(p => p.id === userRow.id);
    if (matchedProfile) {
      let pLog = null;
      let pXP = 300;
      let pBadges = ['transit_champion'];
      
      if (userRow.id === 'me') {
        pLog = currentLog;
        pXP = activePoints;
        pBadges = rewards.list.filter(b => b.unlocked).map(b => b.id);
      } else if (userRow.id === 'krish') {
        pXP = 500;
        pBadges = ['transit_champion', 'green_diet', 'zero_waste', 'smart_home', 'clean_boiler'];
      } else if (userRow.id === 'rahul') {
        pXP = 400;
        pBadges = ['transit_champion', 'green_diet', 'zero_waste'];
      } else {
        // dynamic custom profile
        const customPLogs = customLogsData?.[userRow.id] || [];
        pLog = customPLogs.length > 0 ? customPLogs[0] : null;
        pXP = 300;
        pBadges = ['transit_champion', 'zero_waste'];
      }

      setSelectedUser({
        id: userRow.id,
        name: userRow.name,
        avatar: userRow.avatar,
        subtitle: userRow.id === activeProfile ? 'Active Session' : 'Sandbox User Profile',
        score: userRow.score,
        xp: pXP,
        traits: {
          diet: pLog?.inputs?.diet ? pLog.inputs.diet.charAt(0).toUpperCase() + pLog.inputs.diet.slice(1) : 'Omnivore',
          transport: pLog?.inputs?.transport ? (pLog.inputs.transport === 'walk/bicycle' ? 'Walk / Bicycle' : pLog.inputs.transport === 'public' ? 'Public' : 'Private') : 'Private',
          vehicle: pLog?.inputs?.vehicleType ? pLog.inputs.vehicleType.charAt(0).toUpperCase() + pLog.inputs.vehicleType.slice(1) : 'Petrol',
          heating: pLog?.inputs?.heatingEnergy ? pLog.inputs.heatingEnergy.charAt(0).toUpperCase() + pLog.inputs.heatingEnergy.slice(1) : 'Gas',
          efficiency: pLog?.inputs?.energyEfficiency || 'Sometimes',
          airTravel: pLog?.inputs?.airTravel ? pLog.inputs.airTravel.charAt(0).toUpperCase() + pLog.inputs.airTravel.slice(1) : 'Rarely',
          recycling: pLog?.inputs?.recycling || []
        },
        badges: pBadges
      });
    } else {
      // Find matching benchmark static profile
      const staticProfile = LEADERBOARD_PROFILES[userRow.id];
      if (staticProfile) {
        setSelectedUser({
          id: userRow.id,
          avatar: userRow.avatar,
          ...staticProfile
        });
      } else {
        // Fallback profile
        setSelectedUser({
          id: userRow.id,
          name: userRow.name,
          avatar: userRow.avatar,
          subtitle: 'Sustainable Peer',
          score: userRow.score,
          xp: 200,
          traits: {
            diet: 'Vegetarian',
            transport: 'Public Transit',
            vehicle: 'None',
            heating: 'Electricity',
            efficiency: 'Yes',
            recycling: ['Paper', 'Plastic']
          },
          badges: ['transit_champion', 'smart_home']
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-lg pb-12">
      {/* Top Banner Row */}
      <div className="flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Leaderboard & Rewards</h1>
          <p className="font-body-md text-on-surface-variant">Track green accomplishments, earn level tiers, and compare lifestyle metrics.</p>
        </div>
      </div>

      {/* Profile Switcher Card */}
      <div className="glass-card p-md rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-md border-primary/20 bg-secondary-container/10">
        <div className="flex items-center gap-md">
          <ProfileAvatar 
            avatar={dynamicProfilesList.find(p => p.id === activeProfile)?.avatar || profileAvatar} 
            className="w-12 h-12" 
          />
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Active Sandbox Profile</h3>
            <p className="font-body-sm text-on-surface-variant">Switch accounts to test dynamic calculators, badges, and recommendations.</p>
          </div>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          {dynamicProfilesList.map(profile => (
            <button 
              key={profile.id}
              onClick={() => setActiveProfile(profile.id)}
              className={`flex items-center gap-xs px-md py-sm rounded-full font-label-md transition-all duration-200 ${
                activeProfile === profile.id 
                  ? 'bg-primary text-on-primary shadow-sm font-bold scale-105' 
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <ProfileAvatar avatar={profile.avatar} className="w-5 h-5 text-[10px]" />
              <span>{profile.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        
        {/* Left Column: Leaderboard (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-amber-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <h3 className="font-headline-md text-headline-md font-bold text-primary">Green Leaderboard</h3>
              </div>
              <span className="font-body-sm text-[12px] text-on-surface-variant italic">Click row to view profile</span>
            </div>

            <div className="flex flex-col gap-sm">
              {leaderboard.map((user, idx) => {
                const isCurrentActiveRow = activeProfile === user.id;

                let rankBadgeColor = 'text-outline';
                if (idx === 0) rankBadgeColor = 'text-amber-500';
                else if (idx === 1) rankBadgeColor = 'text-slate-400';
                else if (idx === 2) rankBadgeColor = 'text-amber-700';

                return (
                  <button 
                    key={user.id || idx}
                    onClick={() => handleUserClick(user)}
                    className={`flex items-center justify-between p-md rounded-xl border text-left transition-all hover:scale-[1.01] hover:shadow-sm ${
                      isCurrentActiveRow 
                        ? 'bg-primary-container/30 border-primary/50 text-on-primary-container font-bold' 
                        : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-md min-w-0">
                      <span className={`font-bold w-6 text-center ${rankBadgeColor}`}>{idx + 1}</span>
                      <ProfileAvatar avatar={user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : '👤')} className="w-9 h-9" />
                      <div className="min-w-0 flex flex-col">
                        <span className="text-[14px] truncate flex items-center gap-xs">
                          {user.name || 'Anonymous User'}
                          {isCurrentActiveRow && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-normal">Active</span>
                          )}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-normal">
                          {user.id.startsWith('b') ? 'Benchmark Profile' : 'Local Sandbox User'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-label-md text-body-sm flex-shrink-0 flex items-center gap-md">
                      <div className="text-right">
                        <span className="font-bold block text-sm">{user.score}</span>
                        <span className="text-[10px] text-outline font-normal">kg CO₂/mo</span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">arrow_forward_ios</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Rewards & Progression (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Progression Card */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Progression Hub</h3>
            
            <div className="flex items-center gap-md">
              <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container border-2 border-primary">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Level</span>
                  <span className="font-headline-xl text-[28px] font-extrabold leading-none">{activeLevel}</span>
                </div>
              </div>
              <div className="flex-1 space-y-xs">
                <div className="flex justify-between font-label-md text-[13px] text-on-surface">
                  <span className="font-bold">Eco Level {activeLevel}</span>
                  <span className="text-on-surface-variant">{activePoints} XP Total</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
                  <div 
                    className="h-full bg-primary transition-all duration-500 rounded-full" 
                    style={{ width: `${levelProgress}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-on-surface-variant flex justify-between">
                  <span>{activePoints % 100} / 100 XP to next level</span>
                  <span>{rewards.unlockedCount} / 6 Badges unlocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Your Green Badges</h3>
            <p className="font-body-sm text-on-surface-variant">Earn 100 XP for each unlocked badge. Click a badge to view unlock details.</p>

            <div className="grid grid-cols-2 gap-md">
              {badgeDefinitions.map(badge => {
                const isUnlocked = rewards.list.find(b => b.id === badge.id)?.unlocked;
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`p-md border rounded-xl flex flex-col items-center text-center gap-xs transition-all relative ${
                      isUnlocked 
                        ? 'border-primary bg-secondary-container/10 cursor-pointer hover:bg-secondary-container/20' 
                        : 'border-outline-variant/50 bg-surface-container-low opacity-50 cursor-pointer hover:opacity-75'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      isUnlocked ? badge.color : 'bg-outline'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isUnlocked ? "'FILL' 1" : "'FILL' 0" }}>{badge.icon}</span>
                    </div>
                    <div>
                      <span className="font-body-md block font-bold text-on-surface text-[13px] leading-tight mt-sm">{badge.title}</span>
                      <span className="text-[10px] text-on-surface-variant block mt-1">{isUnlocked ? 'Unlocked (100 XP)' : 'Locked'}</span>
                    </div>
                    {isUnlocked && (
                      <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm font-bold bg-secondary-container rounded-full p-0.5" style={{ fontSize: '12px' }}>check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Comparison Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-lg border border-outline-variant shadow-2xl flex flex-col gap-md animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-outline-variant/30 pb-md">
              <div className="flex items-center gap-md">
                <ProfileAvatar avatar={selectedUser.avatar} className="w-12 h-12" />
                <div>
                  <h3 className="font-headline-md text-headline-md font-bold text-primary">{selectedUser.name}</h3>
                  <p className="text-[12px] text-on-surface-variant font-medium">{selectedUser.subtitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-md">
              
              {/* Carbon Footprint vs You */}
              <div className="bg-surface-container-low p-md rounded-xl space-y-sm">
                <h4 className="font-label-md text-xs text-outline uppercase tracking-wider">Carbon Footprint Metrics</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-bold text-on-surface">{selectedUser.score}</span>
                    <span className="text-xs text-on-surface-variant ml-xs">kg CO₂/mo</span>
                  </div>
                  <div className="text-right text-[12px]">
                    <span className="font-bold text-secondary">{selectedUser.xp} XP</span>
                    <span className="text-on-surface-variant block">Level {Math.floor(selectedUser.xp / 100) + 1} Eco Champion</span>
                  </div>
                </div>

                {/* Score Comparison visualization */}
                {selectedUser.id !== activeProfile && (
                  <div className="pt-sm border-t border-outline-variant/30">
                    <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                      <span>{selectedUser.name}'s Score</span>
                      <span>Target: &lt; 200 kg</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden relative">
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (selectedUser.score / 2500) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Eco Traits or Editing form */}
              {isEditingProfile ? (
                <div className="space-y-md border border-primary/20 bg-primary-container/10 p-md rounded-xl text-left">
                  <h4 className="font-headline-md text-body-md font-bold text-primary">Customize Your Profile</h4>
                  
                  {/* Name field */}
                  <div className="space-y-xs">
                    <label className="text-[11px] font-bold text-outline uppercase">Display Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-outline-variant rounded-md px-md py-sm text-sm outline-none focus:ring-1 focus:ring-primary text-on-surface" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                    />
                  </div>

                  {/* Avatar selection */}
                  <div className="space-y-xs">
                    <label className="text-[11px] font-bold text-outline uppercase">Select Avatar Badge</label>
                    <div className="grid grid-cols-6 gap-xs">
                      {['🌳', '⚡', '🚲', '🥗', '♻️', '💧'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTempAvatar(emoji)}
                          className={`w-10 h-10 text-xl flex items-center justify-center rounded-lg border transition-all ${
                            tempAvatar === emoji 
                              ? 'border-primary bg-primary-container text-on-primary-container scale-105 font-bold shadow-sm' 
                              : 'border-outline-variant/30 bg-surface hover:bg-surface-container'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Generated Avatar Section */}
                  <div className="space-y-xs pt-xs border-t border-outline-variant/30">
                    <label className="text-[11px] font-bold text-outline uppercase block">AI Avatar Generator (JioCinema / Hotstar DP Style)</label>
                    <div className="flex gap-sm">
                      <select
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value)}
                        className="bg-white border border-outline-variant rounded-md px-sm py-xs text-xs outline-none focus:ring-1 focus:ring-primary text-on-surface"
                      >
                        <option value="cosmic">Cosmic Space</option>
                        <option value="nature">Neon Forest</option>
                        <option value="cyber">Cyberpunk HUD</option>
                        <option value="geometry">Crystal Geometry</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateAIAvatar}
                        className="flex-1 bg-secondary text-white hover:bg-secondary/90 transition-all rounded-md px-md py-xs text-xs font-bold"
                      >
                        Generate AI DP
                      </button>
                    </div>
                    {tempAvatar.startsWith('<svg') && (
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-xs mt-1">
                        <span className="material-symbols-outlined text-xs">done</span>
                        AI generated avatar active!
                      </div>
                    )}
                  </div>

                  {/* Carbon Goal field */}
                  <div className="space-y-xs">
                    <label className="text-[11px] font-bold text-outline uppercase">Target Carbon Budget (kg/mo)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border border-outline-variant rounded-md px-md py-sm text-sm outline-none focus:ring-1 focus:ring-primary text-on-surface" 
                      value={tempGoal}
                      onChange={(e) => setTempGoal(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-sm">
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <span className="text-[10px] text-outline uppercase block font-bold">Diet</span>
                    <span className="text-sm font-semibold text-on-surface">{selectedUser.traits.diet || 'Omnivore'}</span>
                  </div>
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <span className="text-[10px] text-outline uppercase block font-bold">Transit Mode</span>
                    <span className="text-sm font-semibold text-on-surface">{selectedUser.traits.transport || 'Private'}</span>
                  </div>
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <span className="text-[10px] text-outline uppercase block font-bold">Fuel / Vehicle</span>
                    <span className="text-sm font-semibold text-on-surface">{selectedUser.traits.vehicle || 'Petrol'}</span>
                  </div>
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <span className="text-[10px] text-outline uppercase block font-bold">Heating energy</span>
                    <span className="text-sm font-semibold text-on-surface">{selectedUser.traits.heating || 'Electricity'}</span>
                  </div>
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <span className="text-[10px] text-outline uppercase block font-bold">Efficiency Check</span>
                    <span className="text-sm font-semibold text-on-surface">Insulation: {selectedUser.traits.efficiency || 'Sometimes'}</span>
                  </div>
                  <div className="p-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg col-span-2">
                    <span className="text-[10px] text-outline uppercase block font-bold">Recycling Habit</span>
                    <span className="text-sm font-semibold text-on-surface">
                      {selectedUser.traits.recycling && selectedUser.traits.recycling.length > 0
                        ? selectedUser.traits.recycling.join(', ')
                        : 'None'}
                    </span>
                  </div>
                </div>
              )}

              {/* Badges Earned */}
              <div className="space-y-sm">
                <h4 className="font-label-md text-xs text-outline uppercase tracking-wider">Unlocked Badges</h4>
                <div className="grid grid-cols-2 gap-sm">
                  {badgeDefinitions.map(badge => {
                    const isUnlocked = selectedUser.badges.includes(badge.id);
                    return (
                      <div 
                        key={badge.id} 
                        className={`flex items-center gap-sm p-sm border rounded-lg ${
                          isUnlocked ? 'border-primary/30 bg-primary-container/10' : 'border-outline-variant/40 opacity-40'
                        }`}
                      >
                        <span className={`material-symbols-outlined p-1 rounded-full text-sm ${
                          isUnlocked ? `${badge.color} text-white` : 'bg-outline text-white'
                        }`} style={{ fontSize: '14px' }}>
                          {badge.icon}
                        </span>
                        <span className="text-xs font-semibold text-on-surface">{badge.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
              {(() => {
                const isEditableProfile = dynamicProfilesList.some(p => p.id === selectedUser.id);
                const matchedProfileObj = dynamicProfilesList.find(p => p.id === selectedUser.id);
                return isEditableProfile && (
                  isEditingProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="px-md py-sm border border-outline-variant hover:bg-surface-container rounded-lg font-label-md transition-all text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfileChange}
                        className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all text-xs font-bold"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setTempName(matchedProfileObj?.name || selectedUser.name);
                        setTempAvatar(matchedProfileObj?.avatar || selectedUser.avatar);
                        setTempGoal(matchedProfileObj?.goal || 1500);
                        setIsEditingProfile(true);
                      }}
                      className="px-md py-sm border border-primary/30 text-primary hover:bg-primary/5 rounded-lg font-label-md transition-all text-xs font-bold flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Profile
                    </button>
                  )
                );
              })()}
              <button 
                onClick={() => { setSelectedUser(null); setIsEditingProfile(false); }}
                className="px-lg py-sm bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all text-xs"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Badge Info / Explanation Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-lg border border-outline-variant shadow-2xl flex flex-col gap-md animate-scale-up">
            <div className="flex justify-between items-start">
              <h3 className="font-headline-md text-headline-md font-bold text-primary">{selectedBadge.title} Badge</h3>
              <button 
                onClick={() => setSelectedBadge(null)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-md py-sm">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl ${selectedBadge.color}`}>
                <span className="material-symbols-outlined text-[36px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>{selectedBadge.icon}</span>
              </div>
              <p className="font-body-md text-on-surface text-center leading-relaxed">
                {selectedBadge.desc}
              </p>
            </div>

            <div className="flex justify-center border-t border-outline-variant/30 pt-md mt-xs">
              <button 
                onClick={() => setSelectedBadge(null)}
                className="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
