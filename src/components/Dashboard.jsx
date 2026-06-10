import React, { useMemo } from 'react';
import coefficients from '../coefficients.json';
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard({ currentLog, leaderboard, onNavigate, offsetTotal = 0 }) {
  const latestScore = currentLog ? currentLog.score : 0;
  const inputs = currentLog ? currentLog.inputs : null;
  const netEmissions = Math.max(0, latestScore - offsetTotal);

  // 1. Calculate Category breakdown
  const categoryData = useMemo(() => {
    if (!currentLog || !inputs) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(0,0,0,0.05)'],
          borderWidth: 0
        }]
      };
    }

    let transport = 0;
    let diet = 0;
    let housing = 0;
    let lifestyle = coefficients.intercept;

    transport += (parseFloat(inputs.vehicleDistance) || 0) * coefficients.numerical_coefficients["Vehicle Monthly Distance Km"];
    if (inputs.transport) transport += coefficients.categorical_coefficients["Transport"][inputs.transport] || 0;
    const actualVehicleType = inputs.transport === 'private' ? inputs.vehicleType : 'None';
    if (actualVehicleType) transport += coefficients.categorical_coefficients["Vehicle Type"][actualVehicleType] || 0;
    if (inputs.airTravel) transport += coefficients.categorical_coefficients["Frequency of Traveling by Air"][inputs.airTravel] || 0;

    if (inputs.diet) diet += coefficients.categorical_coefficients["Diet"][inputs.diet] || 0;

    if (inputs.heatingEnergy) housing += coefficients.categorical_coefficients["Heating Energy Source"][inputs.heatingEnergy] || 0;
    if (inputs.energyEfficiency) housing += coefficients.categorical_coefficients["Energy efficiency"][inputs.energyEfficiency] || 0;
    if (inputs.cooking) {
      inputs.cooking.forEach(item => {
        housing += coefficients.cooking_coefficients[item] || 0;
      });
    }

    lifestyle += (parseFloat(inputs.groceryBill) || 0) * coefficients.numerical_coefficients["Monthly Grocery Bill"];
    lifestyle += (parseFloat(inputs.wasteBagCount) || 0) * coefficients.numerical_coefficients["Waste Bag Weekly Count"];
    lifestyle += (parseFloat(inputs.tvPcHours) || 0) * coefficients.numerical_coefficients["How Long TV PC Daily Hour"];
    lifestyle += (parseFloat(inputs.newClothes) || 0) * coefficients.numerical_coefficients["How Many New Clothes Monthly"];
    lifestyle += (parseFloat(inputs.internetHours) || 0) * coefficients.numerical_coefficients["How Long Internet Daily Hour"];
    
    if (inputs.bodyType) lifestyle += coefficients.categorical_coefficients["Body Type"][inputs.bodyType] || 0;
    if (inputs.sex) lifestyle += coefficients.categorical_coefficients["Sex"][inputs.sex] || 0;
    if (inputs.showerFrequency) lifestyle += coefficients.categorical_coefficients["How Often Shower"][inputs.showerFrequency] || 0;
    if (inputs.socialActivity) lifestyle += coefficients.categorical_coefficients["Social Activity"][inputs.socialActivity] || 0;
    if (inputs.recycling) {
      inputs.recycling.forEach(item => {
        lifestyle += coefficients.recycling_coefficients[item] || 0;
      });
    }

    const totalCalc = transport + diet + housing + lifestyle;
    const errorDiff = latestScore - totalCalc;
    const correction = errorDiff / 4;

    const tScore = Math.max(50, Math.round(transport + correction));
    const dScore = Math.max(50, Math.round(diet + correction));
    const hScore = Math.max(50, Math.round(housing + correction));
    const lScore = Math.max(50, Math.round(lifestyle + correction));

    return {
      labels: ['Transport', 'Diet', 'Housing', 'Lifestyle & Waste'],
      datasets: [{
        data: [tScore, dScore, hScore, lScore],
        backgroundColor: [
          '#3a6758', // Transport (medium green/sage)
          '#154212', // Diet (dark green/primary)
          '#ffe179', // Housing (yellow/tertiary)
          '#72796e'  // Lifestyle & Waste (slate/outline)
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }, [currentLog, inputs, latestScore]);

  // 2. Generate Action Recommendations
  const recommendations = useMemo(() => {
    if (!inputs) return [];
    const recs = [];

    if (inputs.transport === 'private' && ['petrol', 'diesel', 'lpg'].includes(inputs.vehicleType)) {
      const fuelCost = inputs.vehicleType === 'petrol' ? 829 : inputs.vehicleType === 'lpg' ? 346 : 224;
      const electricSavings = Math.round(fuelCost - (-1036)); 
      const hybridSavings = Math.round(fuelCost - (-228));

      recs.push({
        id: 'ev_transition',
        title: 'Transition to Electric/Hybrid Vehicle',
        desc: `Switching your private ${inputs.vehicleType} vehicle to electric saves up to ${electricSavings} kg CO₂/mo, while hybrid saves ${hybridSavings} kg CO₂/mo.`,
        saving: electricSavings,
        impact: 'High',
        icon: 'electric_car'
      });

      const publicSavings = Math.round(fuelCost + 32.5 - (-83.6)); 
      recs.push({
        id: 'public_transit',
        title: 'Increase Public Transit Usage',
        desc: 'Opting for public transportation or carpooling for regular commutes instead of solo driving significantly offsets transport emissions.',
        saving: publicSavings,
        impact: 'High',
        icon: 'directions_bus'
      });
    }

    if (inputs.airTravel === 'very frequently' || inputs.airTravel === 'frequently') {
      const airCost = inputs.airTravel === 'very frequently' ? 761 : 110;
      const saving = Math.round(airCost - (-530)); 
      recs.push({
        id: 'air_offset',
        title: 'Reduce Flight Frequency & Offset',
        desc: 'Reduce short-haul flights by opting for rail, or purchase verified carbon offsets for necessary travel.',
        saving: saving,
        impact: 'High',
        icon: 'flight'
      });
    }

    if (inputs.heatingEnergy === 'coal' || inputs.heatingEnergy === 'wood') {
      const heatCost = inputs.heatingEnergy === 'coal' ? 205 : 10;
      const saving = Math.round(heatCost - (-220)); 
      recs.push({
        id: 'heat_pump',
        title: 'Switch to Electric Heating/Heat Pump',
        desc: `Upgrading from ${inputs.heatingEnergy} heating to clean electric heat pumps lowers residential emissions substantially.`,
        saving: saving,
        impact: 'Medium',
        icon: 'heat_pump'
      });
    }

    if (inputs.energyEfficiency === 'No' || inputs.energyEfficiency === 'Sometimes') {
      const saving = inputs.energyEfficiency === 'No' ? 54 : 27; 
      recs.push({
        id: 'home_efficiency',
        title: 'Improve Home Insulation & Smart Thermostats',
        desc: 'Seal air leaks, upgrade insulation, and install LED lighting or a smart thermostat to lower heating/cooling loads.',
        saving: saving,
        impact: 'Medium',
        icon: 'thermostat'
      });
    }

    const missingRecycling = ['Paper', 'Plastic', 'Glass', 'Metal'].filter(item => !(inputs.recycling || []).includes(item));
    if (missingRecycling.length > 0) {
      let totalSaving = 0;
      missingRecycling.forEach(item => {
        totalSaving += Math.abs(coefficients.recycling_coefficients[item]);
      });

      recs.push({
        id: 'recycle_more',
        title: `Start Recycling ${missingRecycling.join(', ')}`,
        desc: `Implementing sorting and recycling for ${missingRecycling.join(', ')} decreases methane output from landfills.`,
        saving: Math.round(totalSaving),
        impact: 'Medium',
        icon: 'recycle'
      });
    }

    if (inputs.diet === 'omnivore') {
      const saving = Math.round(96 - (-65)); 
      const vegSaving = Math.round(96 - (-38)); 
      recs.push({
        id: 'diet_shift',
        title: 'Incorporate Plant-Based Meals',
        desc: `Reducing meat consumption and adopting a vegan diet saves up to ${saving} kg CO₂/mo, while a vegetarian diet saves ${vegSaving} kg CO₂/mo.`,
        saving: saving,
        impact: 'Medium',
        icon: 'local_dining'
      });
    }

    return recs.sort((a, b) => b.saving - a.saving);
  }, [inputs]);

  // 3. Rewards & Achievements System
  const rewards = useMemo(() => {
    const list = [
      {
        id: 'transit_champion',
        title: 'Transit Champion',
        desc: 'Choose EV, public transport, or active biking/walking.',
        unlocked: inputs ? (inputs.transport === 'walk/bicycle' || inputs.vehicleType === 'electric' || inputs.transport === 'public') : false,
        icon: 'directions_run',
        color: 'bg-emerald-500'
      },
      {
        id: 'green_diet',
        title: 'Plant Power',
        desc: 'Choose a vegetarian or vegan carbon profile.',
        unlocked: inputs ? (inputs.diet === 'vegan' || inputs.diet === 'vegetarian') : false,
        icon: 'local_dining',
        color: 'bg-green-600'
      },
      {
        id: 'zero_waste',
        title: 'Recycling Pro',
        desc: 'Implement sorted recycling practices.',
        unlocked: inputs ? (inputs.recycling && inputs.recycling.length > 0) : false,
        icon: 'recycling',
        color: 'bg-teal-500'
      },
      {
        id: 'smart_home',
        title: 'Power Saver',
        desc: 'Enable sometimes/yes for home energy efficiency.',
        unlocked: inputs ? (inputs.energyEfficiency === 'Yes' || inputs.energyEfficiency === 'Sometimes') : false,
        icon: 'bolt',
        color: 'bg-amber-500'
      },
      {
        id: 'clean_boiler',
        title: 'Clean Heating',
        desc: 'Switch fuel to electricity or natural gas.',
        unlocked: inputs ? (inputs.heatingEnergy === 'electricity' || inputs.heatingEnergy === 'natural gas') : false,
        icon: 'heat_pump',
        color: 'bg-purple-600'
      },
      {
        id: 'neutralizer',
        title: 'Net-Zero Hero',
        desc: 'Neutralize your carbon footprint with offsets.',
        unlocked: latestScore > 0 && offsetTotal >= latestScore,
        icon: 'workspace_premium',
        color: 'bg-yellow-500'
      }
    ];

    const unlockedCount = list.filter(r => r.unlocked).length;
    const points = unlockedCount * 100;

    return { list, points, unlockedCount };
  }, [inputs, latestScore, offsetTotal]);

  // Baseline comparison
  const natAverage = Math.round(coefficients.mean_emission);
  const diffFromMean = netEmissions - natAverage;
  const pctDiff = Math.abs(Math.round((diffFromMean / natAverage) * 100));

  const strokeDashoffset = useMemo(() => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    if (latestScore === 0) return circumference;
    const ratio = Math.min(1.5, netEmissions / natAverage); 
    return circumference - (ratio * circumference);
  }, [netEmissions, natAverage, latestScore]);

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#0b1c30',
          font: {
            family: 'Inter',
            size: 12
          },
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} kg CO₂/mo`
        }
      }
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="flex flex-col gap-lg pb-12">
      {/* Top Header Row */}
      <div className="flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">CarbonSense Dashboard</h1>
          <p className="font-body-md text-on-surface-variant">AI-driven analytics tracking of your gross emissions and offset balances.</p>
        </div>
        {!currentLog && (
          <button 
            onClick={() => onNavigate('calculator')} 
            className="px-lg py-sm bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Calculate Carbon Footprint
          </button>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="glass-card p-md rounded-2xl flex flex-col gap-base">
          <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <span>Gross Footprint</span>
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>eco</span>
          </div>
          <div className="font-headline-lg text-[28px] font-bold text-on-surface">
            {latestScore > 0 ? `${latestScore} kg` : 'N/A'}
          </div>
          <div className="font-body-sm text-[12px] text-outline">
            Monthly CO₂ equivalent
          </div>
        </div>

        <div className="glass-card p-md rounded-2xl flex flex-col gap-base">
          <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <span>Total Offsets</span>
            <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div className="font-headline-lg text-[28px] font-bold text-emerald-600">
            {offsetTotal > 0 ? `-${offsetTotal} kg` : '0 kg'}
          </div>
          <div className="font-body-sm text-[12px] text-outline">
            Emissions neutralized
          </div>
        </div>

        <div className="glass-card p-md rounded-2xl flex flex-col gap-base">
          <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <span>Net Footprint</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>monitoring</span>
          </div>
          <div className="font-headline-lg text-[28px] font-bold text-on-surface">
            {latestScore > 0 ? `${netEmissions} kg` : 'N/A'}
          </div>
          <div className="font-body-sm text-[12px] text-outline">
            {netEmissions === 0 && latestScore > 0 ? '🎉 Carbon Neutral Balanced!' : 'Net carbon emissions'}
          </div>
        </div>

        <div className="glass-card p-md rounded-2xl flex flex-col gap-base">
          <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <span>Climate Rating</span>
            <span className="material-symbols-outlined text-purple-600" style={{ fontSize: '18px' }}>verified</span>
          </div>
          <div className="font-headline-lg text-[20px] font-bold text-on-surface pt-base">
            {latestScore === 0 ? 'Unrated' : 
              netEmissions === 0 ? 'Carbon Neutral (A+)' :
              netEmissions < 1500 ? 'Eco Champion (A)' : 
              netEmissions < 2200 ? 'Moderate (B)' : 
              netEmissions < 3000 ? 'Heavy Emitter (C)' : 'Climate Risk (D)'
            }
          </div>
          <div className="font-body-sm text-[12px] text-outline">
            Based on net emission indices
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Columns (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* Carbon Progress Ring */}
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center gap-md">
            <h3 className="font-headline-md text-headline-md self-start text-on-surface">
              {offsetTotal > 0 ? 'Net Carbon Emission Balance Meter' : 'Gross Carbon Footprint Meter'}
            </h3>
            
            <div className="relative flex justify-center items-center my-md">
              <svg className="w-[200px] h-[200px] -rotate-90">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="12" />
                <circle 
                  cx="100" 
                  cy="100" 
                  r="90" 
                  fill="none" 
                  className="transition-all duration-1000 ease-out"
                  stroke={netEmissions > 2500 ? '#ba1a1a' : netEmissions < 1500 ? '#154212' : '#3a6758'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="font-headline-xl text-[36px] font-extrabold text-on-surface">{latestScore > 0 ? netEmissions : '—'}</span>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">
                  {offsetTotal > 0 ? 'net kg / mo' : 'kg CO₂ / mo'}
                </span>
              </div>
            </div>

            <div className="text-center max-w-md flex flex-col gap-base">
              <p className="font-headline-md text-headline-md text-on-surface">
                {latestScore === 0 ? 'No carbon footprint logged yet' : 
                 netEmissions === 0 ? 'Outstanding! You are Carbon Neutral!' :
                 netEmissions < natAverage ? 'Great job! You are below average.' : 'Your carbon footprint is higher than average.'
                }
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {latestScore === 0 
                  ? 'Complete the Carbon Tracker questionnaire to map your metrics and train predictions.'
                  : offsetTotal > 0 
                    ? `Your gross emissions are ${latestScore} kg CO₂/mo, offset by ${offsetTotal} kg. Your net footprint balance is ${netEmissions} kg CO₂/mo.`
                    : `Your footprint is ${latestScore} kg CO₂ per month. The global target is below 200 kg/month per person, while the local baseline is ${natAverage} kg/mo.`
                }
              </p>
              {latestScore > 0 && (
                <div className="flex gap-md justify-center mt-md">
                  <button onClick={() => onNavigate('calculator')} className="px-md py-sm border-2 border-outline-variant hover:bg-surface-container rounded-lg font-label-md transition-all">
                    Recalculate
                  </button>
                  <button onClick={() => onNavigate('offsets')} className="px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 transition-all">
                    Support Offsets
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rewards & Achievements Section */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <div className="flex justify-between items-center flex-wrap gap-xs">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-amber-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Rewards & Achievements</h3>
              </div>
              <div className="bg-secondary-container text-on-secondary-container px-md py-xs rounded-full font-bold text-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">stars</span>
                {rewards.points} / 600 XP
              </div>
            </div>
            
            <p className="font-body-sm text-on-surface-variant">
              Earn carbon badges by adopting green habits and neutralizing your footprint.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
              {rewards.list.map(badge => (
                <div 
                  key={badge.id}
                  className={`p-md border rounded-xl flex flex-col items-center text-center gap-xs transition-all relative overflow-hidden ${
                    badge.unlocked 
                      ? 'border-primary bg-secondary-container/10' 
                      : 'border-outline-variant opacity-40 bg-surface-container-low'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                    badge.unlocked ? badge.color : 'bg-outline-variant'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: badge.unlocked ? "'FILL' 1" : "'FILL' 0" }}>{badge.icon}</span>
                  </div>
                  <div>
                    <span className="font-body-md block font-bold text-on-surface text-[14px] leading-tight">{badge.title}</span>
                    <span className="text-[10px] text-on-surface-variant block leading-tight mt-1">{badge.desc}</span>
                  </div>
                  {badge.unlocked && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category Share Donut */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md text-on-surface">Emission Category Share</h3>
            {latestScore > 0 ? (
              <div className="h-[280px] relative">
                <Doughnut data={categoryData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-body-md">
                Complete the carbon tracker to view category analytics.
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          {/* AI Recommendations */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">AI Action Coach</h3>
              {latestScore > 0 && (
                <span className="font-label-md text-label-md bg-tertiary-fixed text-on-tertiary-fixed px-sm py-xs rounded-full font-bold">
                  Active
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-md">
              {latestScore > 0 ? (
                recommendations.length > 0 ? (
                  recommendations.slice(0, 3).map(rec => (
                    <div key={rec.id} className="p-md bg-surface-container rounded-xl flex gap-md items-start border border-outline-variant/60 hover:shadow transition-all">
                      <div className="p-sm bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{rec.icon}</span>
                      </div>
                      <div className="flex-1 space-y-xs">
                        <div className="flex justify-between items-center flex-wrap gap-xs">
                          <span className="font-headline-md text-body-md font-bold text-on-surface">{rec.title}</span>
                          <span className={`text-[10px] font-label-md px-sm py-xs rounded ${
                            rec.impact === 'High' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-secondary-container'
                          }`}>
                            {rec.impact}
                          </span>
                        </div>
                        <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">{rec.desc}</p>
                        <div className="flex items-center gap-xs font-label-md text-[12px] text-secondary font-bold">
                          <span className="material-symbols-outlined text-sm">trending_down</span>
                          Reduces footprint by {rec.saving} kg/mo
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-xl flex flex-col items-center gap-sm">
                    <span className="material-symbols-outlined text-[40px] text-emerald-600">check_circle</span>
                    <span className="font-headline-md text-body-md font-bold">Footprint fully optimized!</span>
                    <p className="font-body-sm text-on-surface-variant">You are maintaining a highly sustainable profile.</p>
                  </div>
                )
              ) : (
                <div className="py-xl text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant font-body-md">
                  Log calculator scores to generate custom AI recommendations.
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Green Leaderboard</h3>
            </div>
            
            <div className="flex flex-col gap-sm">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, idx) => (
                  <div 
                    key={user.id || idx} 
                    className={`flex items-center justify-between p-sm rounded-xl border transition-all ${
                      user.isCurrentUser 
                        ? 'bg-secondary-container border-secondary/40 text-on-secondary-container font-bold' 
                        : 'bg-surface-container border-outline-variant/40'
                    }`}
                  >
                    <div className="flex items-center gap-md min-w-0">
                      <span className={`font-bold w-6 text-center ${
                        idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-outline'
                      }`}>{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'AN'}
                      </div>
                      <span className="text-[14px] truncate">
                        {user.name || 'Anonymous User'}
                        {user.isCurrentUser && ' (You)'}
                      </span>
                    </div>
                    <div className="text-right font-label-md text-body-sm flex-shrink-0">
                      {user.score} <span className="text-[10px] text-outline font-normal block">kg/mo</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-md text-center text-on-surface-variant font-body-sm">
                  Leaderboard empty.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
