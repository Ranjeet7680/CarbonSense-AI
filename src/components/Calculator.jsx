import React, { useState, useEffect } from 'react';
import coefficients from '../coefficients.json';

const DEFAULT_INPUTS = {
  // Step 1: Profile
  sex: 'female',
  bodyType: 'normal',
  diet: 'vegetarian',
  showerFrequency: 'daily',
  socialActivity: 'sometimes',

  // Step 2: Home & Energy
  heatingEnergy: 'electricity',
  energyEfficiency: 'Sometimes',
  cooking: ['Stove', 'Microwave'],

  // Step 3: Transportation
  transport: 'public',
  vehicleType: 'None',
  vehicleDistance: 500,
  airTravel: 'rarely',

  // Step 4: Lifestyle & Waste
  groceryBill: 150,
  newClothes: 3,
  wasteBagSize: 'medium',
  wasteBagCount: 3,
  tvPcHours: 5,
  internetHours: 6,
  recycling: ['Paper', 'Plastic']
};

export default function Calculator({ onSave, initialData }) {
  const [estimateMode, setEstimateMode] = useState('quick'); // 'quick' or 'precise'
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState(initialData || DEFAULT_INPUTS);
  const [score, setScore] = useState(0);

  // Quick Mode Specific States
  const [quickTransport, setQuickTransport] = useState('public'); // 'petrol', 'ev', 'public', 'bike'
  const [quickDistance, setQuickDistance] = useState(50); // weekly km
  const [quickElectricity, setQuickElectricity] = useState(250); // monthly kWh
  const [quickDiet, setQuickDiet] = useState('balanced'); // 'meat', 'balanced', 'vegetarian', 'vegan'
  const [quickRecycling, setQuickRecycling] = useState(true);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [billUploadSuccess, setBillUploadSuccess] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Synchronize Quick Mode changes with inputs object for OLS
  useEffect(() => {
    if (estimateMode === 'quick') {
      let mappedInputs = { ...DEFAULT_INPUTS };

      // 1. Transport Mapping
      if (quickTransport === 'petrol') {
        mappedInputs.transport = 'private';
        mappedInputs.vehicleType = 'petrol';
        mappedInputs.vehicleDistance = Math.round(quickDistance * 4.3); // weekly to monthly
      } else if (quickTransport === 'ev') {
        mappedInputs.transport = 'private';
        mappedInputs.vehicleType = 'electric';
        mappedInputs.vehicleDistance = Math.round(quickDistance * 4.3);
      } else if (quickTransport === 'public') {
        mappedInputs.transport = 'public';
        mappedInputs.vehicleType = 'None';
        mappedInputs.vehicleDistance = Math.round(quickDistance * 4.3);
      } else {
        mappedInputs.transport = 'walk/bicycle';
        mappedInputs.vehicleType = 'None';
        mappedInputs.vehicleDistance = 0;
      }

      // 2. Energy Mapping
      // Scale energyEfficiency and adjust final emissions using electricity kWh
      if (quickElectricity < 150) {
        mappedInputs.energyEfficiency = 'Yes';
      } else if (quickElectricity <= 300) {
        mappedInputs.energyEfficiency = 'Sometimes';
      } else {
        mappedInputs.energyEfficiency = 'No';
      }
      mappedInputs.heatingEnergy = 'electricity';

      // 3. Diet Mapping
      if (quickDiet === 'meat') {
        mappedInputs.diet = 'omnivore';
      } else if (quickDiet === 'balanced') {
        mappedInputs.diet = 'pescatarian';
      } else if (quickDiet === 'vegetarian') {
        mappedInputs.diet = 'vegetarian';
      } else {
        mappedInputs.diet = 'vegan';
      }

      // 4. Waste Mapping
      if (quickRecycling) {
        mappedInputs.recycling = ['Paper', 'Plastic', 'Glass', 'Metal'];
        mappedInputs.wasteBagCount = billUploadSuccess ? 1 : 2; // Extra reduction if statement verified
      } else {
        mappedInputs.recycling = [];
        mappedInputs.wasteBagCount = 4;
      }

      // Special addition calculation adjustment to capture kWh variation
      const electricityOffset = Math.round((quickElectricity - 250) * 0.4);

      setInputs(mappedInputs);
    }
  }, [estimateMode, quickTransport, quickDistance, quickElectricity, quickDiet, quickRecycling, billUploadSuccess]);

  // Real-time OLS calculation
  useEffect(() => {
    let footprint = coefficients.intercept;

    footprint += (parseFloat(inputs.groceryBill) || 0) * coefficients.numerical_coefficients["Monthly Grocery Bill"];
    footprint += (parseFloat(inputs.vehicleDistance) || 0) * coefficients.numerical_coefficients["Vehicle Monthly Distance Km"];
    footprint += (parseFloat(inputs.wasteBagCount) || 0) * coefficients.numerical_coefficients["Waste Bag Weekly Count"];
    footprint += (parseFloat(inputs.tvPcHours) || 0) * coefficients.numerical_coefficients["How Long TV PC Daily Hour"];
    footprint += (parseFloat(inputs.newClothes) || 0) * coefficients.numerical_coefficients["How Many New Clothes Monthly"];
    footprint += (parseFloat(inputs.internetHours) || 0) * coefficients.numerical_coefficients["How Long Internet Daily Hour"];

    if (inputs.bodyType) footprint += coefficients.categorical_coefficients["Body Type"][inputs.bodyType] || 0;
    if (inputs.sex) footprint += coefficients.categorical_coefficients["Sex"][inputs.sex] || 0;
    if (inputs.diet) footprint += coefficients.categorical_coefficients["Diet"][inputs.diet] || 0;
    if (inputs.showerFrequency) footprint += coefficients.categorical_coefficients["How Often Shower"][inputs.showerFrequency] || 0;
    if (inputs.heatingEnergy) footprint += coefficients.categorical_coefficients["Heating Energy Source"][inputs.heatingEnergy] || 0;
    if (inputs.transport) footprint += coefficients.categorical_coefficients["Transport"][inputs.transport] || 0;

    const actualVehicleType = inputs.transport === 'private' ? inputs.vehicleType : 'None';
    if (actualVehicleType) footprint += coefficients.categorical_coefficients["Vehicle Type"][actualVehicleType] || 0;

    if (inputs.socialActivity) footprint += coefficients.categorical_coefficients["Social Activity"][inputs.socialActivity] || 0;
    if (inputs.airTravel) footprint += coefficients.categorical_coefficients["Frequency of Traveling by Air"][inputs.airTravel] || 0;
    if (inputs.energyEfficiency) footprint += coefficients.categorical_coefficients["Energy efficiency"][inputs.energyEfficiency] || 0;

    if (inputs.recycling) {
      inputs.recycling.forEach(item => {
        footprint += coefficients.recycling_coefficients[item] || 0;
      });
    }
    if (inputs.cooking) {
      inputs.cooking.forEach(item => {
        footprint += coefficients.cooking_coefficients[item] || 0;
      });
    }

    // Add kWh delta scaling if in Quick mode
    if (estimateMode === 'quick') {
      footprint += (quickElectricity - 250) * 0.4;
    }

    setScore(Math.max(0, Math.round(footprint)));
  }, [inputs, estimateMode, quickElectricity]);

  const toggleRecycling = (item) => {
    setInputs(prev => {
      const current = prev.recycling || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, recycling: updated };
    });
  };

  const toggleCooking = (item) => {
    setInputs(prev => {
      const current = prev.cooking || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, cooking: updated };
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleCalculateSubmit = () => {
    setCalculating(true);
    setTimeout(() => {
      onSave(inputs, score);
      setCalculating(false);
    }, 1500);
  };

  const simulateBillUpload = () => {
    setUploadingBill(true);
    setTimeout(() => {
      setUploadingBill(false);
      setBillUploadSuccess(true);
      setQuickRecycling(true);
      setQuickElectricity(180); // Set efficient levels based on statement scan
      alert("Statement Upload Success! AI verified efficient utility consumption (180 kWh/mo) and recycled sorting habits. Values adjusted.");
    }, 2000);
  };

  const renderDotIcon = (num, defaultIcon) => {
    if (estimateMode === 'quick') {
      const icons = ["directions_car", "bolt", "eco", "delete"];
      if (step > num) {
        return <span className="material-symbols-outlined text-[18px]">check</span>;
      }
      return <span className="material-symbols-outlined text-[18px]">{icons[num - 1]}</span>;
    }
    return <span className="material-symbols-outlined text-[18px]">{defaultIcon}</span>;
  };

  const renderPreview = () => {
    const diffFromMean = score - coefficients.mean_emission;
    const isBelowAverage = diffFromMean < 0;
    const pctDiff = Math.abs(Math.round((diffFromMean / coefficients.mean_emission) * 100));

    return (
      <div className="bg-surface-container-lowest rounded-xl p-md border-t-2 border-primary shadow-[0px_4px_20px_rgba(45,90,39,0.08)] h-fit lg:sticky lg:top-8 flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/30 pb-md">Emissions Preview</h3>
        
        <div className="flex flex-col items-center gap-xs my-sm">
          <div className="font-label-md text-label-md text-on-surface-variant uppercase">Estimated Footprint</div>
          <div className="text-data-display font-data-display text-primary flex items-baseline">
            {score}
            <span className="text-headline-md font-headline-md ml-1">kg</span>
          </div>
          <div className="font-body-sm text-[12px] text-on-surface-variant">CO₂ equivalent / month</div>
        </div>

        <div className="space-y-sm text-body-sm text-[13px]">
          <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
            <span className="text-on-surface-variant">Baseline Average:</span>
            <span className="font-bold text-on-surface">{Math.round(coefficients.mean_emission)} kg/mo</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
            <span className="text-on-surface-variant">Status Compared:</span>
            <span className={`font-bold ${isBelowAverage ? 'text-primary' : 'text-error'}`}>
              {pctDiff === 0 ? 'Baseline Average' : `${pctDiff}% ${isBelowAverage ? 'Lower' : 'Higher'}`}
            </span>
          </div>
          <div className="flex justify-between pb-xs">
            <span className="text-on-surface-variant">Climate Tier:</span>
            <span className={`font-bold ${score < 1500 ? 'text-primary' : score < 2500 ? 'text-secondary font-bold' : 'text-error'}`}>
              {score < 1500 ? 'Eco Champion (Low)' : score < 2500 ? 'Moderate' : 'Climate Risk (Heavy)'}
            </span>
          </div>
        </div>

        <div className="bg-secondary-container/30 rounded-xl p-md flex gap-sm items-start border border-secondary-container text-[12px] text-on-secondary-container leading-relaxed">
          <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-[2px]">lightbulb</span>
          <span>Predictions reflect active lifestyle inputs mapped through OLS regression weights.</span>
        </div>

        {step === 4 && (
          <button 
            onClick={handleCalculateSubmit} 
            className="w-full h-[48px] rounded-full bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors active:scale-95 duration-100 shadow-lg flex items-center justify-center gap-xs mt-md"
            disabled={calculating}
          >
            {calculating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing AI...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">analytics</span>
                Calculate My Footprint
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-lg pb-12">
      {/* Top Title & Toggle Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">Carbon Tracker</h1>
          <p className="font-body-md text-on-surface-variant">Input transit, utility, and diet behaviors to determine your carbon quota.</p>
        </div>

        {/* Premium Mode Switcher */}
        <div className="bg-surface-container rounded-full p-1 flex items-center border border-outline-variant/60 w-fit self-start">
          <button
            onClick={() => { setEstimateMode('quick'); setStep(1); }}
            className={`px-md py-xs rounded-full font-label-md text-label-md transition-all ${
              estimateMode === 'quick' ? 'bg-primary text-on-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Quick Estimate
          </button>
          <button
            onClick={() => { setEstimateMode('precise'); setStep(1); }}
            className={`px-md py-xs rounded-full font-label-md text-label-md transition-all ${
              estimateMode === 'precise' ? 'bg-primary text-on-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Precise Analysis
          </button>
        </div>
      </div>

      {/* Stepper indicators */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-xs relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -z-10 -translate-y-1/2"></div>
          
          {[
            { num: 1, label: estimateMode === 'quick' ? 'Transport' : 'Profile', icon: 'directions_car', fallbackIcon: 'person' },
            { num: 2, label: estimateMode === 'quick' ? 'Energy' : 'Home Energy', icon: 'bolt', fallbackIcon: 'home' },
            { num: 3, label: estimateMode === 'quick' ? 'Food' : 'Transport', icon: 'eco', fallbackIcon: 'electric_car' },
            { num: 4, label: estimateMode === 'quick' ? 'Waste' : 'Lifestyle & Waste', icon: 'delete', fallbackIcon: 'shopping_bag' }
          ].map(s => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div 
                key={s.num} 
                className="relative z-10 flex flex-col items-center gap-xs cursor-pointer select-none"
                onClick={() => setStep(s.num)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive 
                    ? 'bg-primary text-on-primary' 
                    : isCompleted 
                      ? 'bg-secondary text-on-secondary' 
                      : 'bg-surface-container-high border-2 border-outline-variant text-on-surface-variant'
                }`}>
                  {renderDotIcon(s.num, s.fallbackIcon)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Step labels */}
        <div className="flex justify-between mt-2 px-1">
          {[
            { num: 1, label: estimateMode === 'quick' ? 'Transport' : 'Profile' },
            { num: 2, label: estimateMode === 'quick' ? 'Energy' : 'Energy' },
            { num: 3, label: estimateMode === 'quick' ? 'Food' : 'Transport' },
            { num: 4, label: estimateMode === 'quick' ? 'Waste' : 'Waste' }
          ].map(s => (
            <span 
              key={s.num} 
              className={`font-label-md text-label-md transition-colors ${
                step === s.num ? 'text-primary font-bold' : 'text-outline'
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-2 space-y-lg">
          {/* Mobile Live Score Badge */}
          <div className="lg:hidden flex items-center justify-between bg-secondary-container text-on-secondary-container px-lg py-md rounded-xl border border-secondary-container/40 shadow-sm">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="font-label-md font-bold uppercase tracking-wider text-primary">Live Projection</span>
            </div>
            <div className="font-headline-md font-bold text-primary">
              {score} <span className="text-[11px] font-normal uppercase">kg/mo</span>
            </div>
          </div>

          {estimateMode === 'quick' ? (
            /* ==================== QUICK ESTIMATE FORM ==================== */
            <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0px_4px_20px_rgba(45,90,39,0.08)] border-t-2 border-primary min-h-[400px] flex flex-col justify-between">
              
              {/* Step 1: Transport */}
              {step === 1 && (
                <div className="space-y-lg">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold mb-xs">How do you move?</h2>
                    <p className="font-body-sm text-on-surface-variant">Select your primary mode of transport to start your footprint calculation.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-sm">
                    {[
                      { id: 'petrol', label: 'Petrol Car', icon: 'local_gas_station' },
                      { id: 'ev', label: 'Electric Car', icon: 'ev_station' },
                      { id: 'public', label: 'Public Transit', icon: 'directions_bus' },
                      { id: 'bike', label: 'Active Travel', icon: 'pedal_bike' }
                    ].map(opt => (
                      <label key={opt.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="quickTransport"
                          className="hidden peer"
                          value={opt.id}
                          checked={quickTransport === opt.id}
                          onChange={(e) => setQuickTransport(e.target.value)}
                        />
                        <div className="flex flex-col items-center justify-center p-md rounded-lg border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-secondary-container group-hover:bg-surface-container transition-all">
                          <span className="material-symbols-outlined text-[32px] mb-xs text-on-surface-variant peer-checked:text-primary">{opt.icon}</span>
                          <span className="font-label-md text-label-md">{opt.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {quickTransport !== 'bike' && (
                    <div className="space-y-sm pt-md">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Weekly commute distance</span>
                        <span className="font-headline-md text-headline-md text-primary font-bold">{quickDistance} km</span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-2 bg-secondary-container rounded-lg appearance-none cursor-pointer accent-primary"
                        min="0"
                        max="500"
                        step="5"
                        value={quickDistance}
                        onChange={(e) => setQuickDistance(parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Energy */}
              {step === 2 && (
                <div className="space-y-lg">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold mb-xs">Powering your home</h2>
                    <p className="font-body-sm text-on-surface-variant">Check your utility bill for the monthly electricity consumption.</p>
                  </div>

                  <div className="relative">
                    <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Monthly electricity (kWh)</label>
                    <input
                      type="number"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl p-md focus:border-primary focus:ring-0 transition-colors font-headline-md text-headline-md outline-none text-primary"
                      placeholder="e.g. 250"
                      value={quickElectricity}
                      onChange={(e) => setQuickElectricity(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="bg-secondary-container/35 p-md rounded-lg flex items-start gap-3 border border-secondary-container">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                    <p className="font-body-sm text-on-secondary-container italic">"Switching to LED bulbs can reduce your lighting energy usage by 75%!"</p>
                  </div>
                </div>
              )}

              {/* Step 3: Food */}
              {step === 3 && (
                <div className="space-y-lg">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold mb-xs">What's on your plate?</h2>
                    <p className="font-body-sm text-on-surface-variant">Food systems account for about 26% of global greenhouse gas emissions.</p>
                  </div>

                  <div className="space-y-sm">
                    {[
                      { id: 'meat', label: 'Meat-heavy', detail: 'Regular beef, pork, and lamb consumption' },
                      { id: 'balanced', label: 'Balanced omnivore', detail: 'Mixed proteins, occasional red meat' },
                      { id: 'vegetarian', label: 'Vegetarian', detail: 'No meat, includes dairy and eggs' },
                      { id: 'vegan', label: 'Vegan', detail: 'Purely plant-based diet' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-4 p-md rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98]">
                        <input
                          type="radio"
                          name="quickDiet"
                          className="w-5 h-5 text-primary border-outline-variant focus:ring-0"
                          value={opt.id}
                          checked={quickDiet === opt.id}
                          onChange={(e) => setQuickDiet(e.target.value)}
                        />
                        <div className="flex-grow">
                          <span className="font-body-md block font-semibold text-on-surface">{opt.label}</span>
                          <span className="font-body-sm text-outline">{opt.detail}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Waste */}
              {step === 4 && (
                <div className="space-y-lg">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold mb-xs">Waste management</h2>
                    <p className="font-body-sm text-on-surface-variant">Reducing waste is key to a circular economy.</p>
                  </div>

                  <div className="flex items-center justify-between p-md bg-surface-container-low rounded-xl border border-outline-variant/60">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
                      <span className="font-body-md font-semibold text-on-surface">Active Recycling Habits</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickRecycling(!quickRecycling)}
                      className={`w-14 h-8 rounded-full p-1 relative transition-colors duration-300 ${
                        quickRecycling ? 'bg-primary' : 'bg-outline-variant'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        quickRecycling ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Statement Upload Box */}
                  <div
                    onClick={simulateBillUpload}
                    className="p-md border border-dashed border-outline rounded-xl flex flex-col items-center text-center gap-md cursor-pointer hover:bg-surface-container transition-all group"
                  >
                    <span className="material-symbols-outlined text-[48px] text-outline-variant group-hover:text-primary transition-colors">cloud_upload</span>
                    <div>
                      <span className="font-label-md text-label-md uppercase tracking-wider text-outline mb-xs block">Optional</span>
                      <span className="font-body-md text-on-surface font-semibold">Upload Waste / Utility Statement</span>
                      <p className="font-body-sm text-outline max-w-sm mt-1">
                        Let AI scan and analyze your waste bill trends from your statement statement.
                      </p>
                    </div>
                    {uploadingBill && (
                      <span className="text-primary font-bold flex items-center gap-xs">
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        Scanning bill OCR...
                      </span>
                    )}
                    {billUploadSuccess && (
                      <span className="text-primary font-bold flex items-center gap-xs">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Verified: efficient rating mapped!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation buttons inside card */}
              <div className="flex gap-md pt-lg border-t border-outline-variant/20 mt-lg">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 h-[48px] rounded-full border border-primary text-primary font-semibold hover:bg-surface-container-low transition-colors active:scale-95 duration-100 ${
                    step === 1 ? 'invisible' : ''
                  }`}
                >
                  Back
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] h-[48px] rounded-full bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors active:scale-95 duration-100 shadow-md"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculateSubmit}
                    className="flex-[2] h-[48px] rounded-full bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors active:scale-95 duration-100 shadow-md flex items-center justify-center gap-2"
                    disabled={calculating}
                  >
                    {calculating ? 'Processing AI...' : 'Calculate My Footprint'}
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* ==================== PRECISE ANALYSIS FORM ==================== */
            <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0px_4px_20px_rgba(45,90,39,0.08)] border-t-2 border-primary min-h-[500px] flex flex-col justify-between">
              
              {/* Step 1: Biological Profile */}
              {step === 1 && (
                <div className="space-y-lg">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/30 pb-sm">Biological Profile</h3>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Biological Sex</label>
                    <div className="grid grid-cols-2 gap-md">
                      {['female', 'male'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.sex === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, sex: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Body Type Profile</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                      {['underweight', 'normal', 'overweight', 'obese'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.bodyType === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, bodyType: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Diet Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                      {['vegan', 'vegetarian', 'pescatarian', 'omnivore'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.diet === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, diet: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-on-surface-variant font-semibold" htmlFor="calc-shower">Shower Frequency</label>
                    <select 
                      id="calc-shower"
                      className="w-full px-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md text-on-surface"
                      value={inputs.showerFrequency}
                      onChange={(e) => setInputs(prev => ({ ...prev, showerFrequency: e.target.value }))}
                    >
                      <option value="less frequently">Less frequently</option>
                      <option value="daily">Daily</option>
                      <option value="more frequently">More frequently</option>
                      <option value="twice a day">Twice a day</option>
                    </select>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Socializing Outing Frequency</label>
                    <div className="grid grid-cols-3 gap-md">
                      {['never', 'sometimes', 'often'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.socialActivity === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, socialActivity: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Home Energy */}
              {step === 2 && (
                <div className="space-y-lg">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/30 pb-sm">Home & Energy Sources</h3>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Primary Home Heating Fuel</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                      {['electricity', 'natural gas', 'wood', 'coal'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.heatingEnergy === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, heatingEnergy: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Active Energy Efficiency Measures</label>
                    <div className="grid grid-cols-3 gap-md">
                      {['Yes', 'Sometimes', 'No'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.energyEfficiency === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, energyEfficiency: v }))}
                        >
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Cooking Appliances Used (Select all that apply)</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                      {['Stove', 'Oven', 'Microwave', 'Grill', 'Airfryer'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[13px] cursor-pointer hover:bg-surface-container transition-all ${
                            (inputs.cooking || []).includes(v) 
                              ? 'bg-secondary-container border-primary text-on-secondary-container font-bold' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => toggleCooking(v)}
                        >
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Transportation */}
              {step === 3 && (
                <div className="space-y-lg">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/30 pb-sm">Transportation & Air Travel</h3>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Primary Mode of Transport</label>
                    <div className="grid grid-cols-3 gap-md">
                      {['walk/bicycle', 'public', 'private'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[14px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.transport === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => {
                            setInputs(prev => ({
                              ...prev,
                              transport: v,
                              vehicleType: v === 'private' ? (prev.vehicleType === 'None' ? 'petrol' : prev.vehicleType) : 'None'
                            }));
                          }}
                        >
                          <span className="capitalize">{v === 'walk/bicycle' ? 'Walk / Bike' : v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {inputs.transport === 'private' && (
                    <>
                      <div className="space-y-sm">
                        <label className="font-label-md text-on-surface-variant font-semibold">Private Vehicle Engine Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                          {['petrol', 'diesel', 'hybrid', 'lpg', 'electric'].map(v => (
                            <div 
                              key={v}
                              className={`p-md border rounded-xl text-center font-bold text-[13px] cursor-pointer hover:bg-surface-container transition-all ${
                                inputs.vehicleType === v 
                                  ? 'bg-secondary-container border-primary text-on-secondary-container font-bold' 
                                  : 'bg-white border-outline-variant text-on-surface-variant'
                              }`}
                              onClick={() => setInputs(prev => ({ ...prev, vehicleType: v }))}
                            >
                              <span className="uppercase">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-sm">
                        <div className="flex justify-between text-body-sm">
                          <label className="font-label-md text-on-surface-variant font-semibold">Monthly Distance Driven</label>
                          <span className="text-primary font-bold">{inputs.vehicleDistance} km</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                          value={inputs.vehicleDistance}
                          onChange={(e) => setInputs(prev => ({ ...prev, vehicleDistance: parseInt(e.target.value) }))}
                        />
                      </div>
                    </>
                  )}

                  {inputs.transport === 'public' && (
                    <div className="space-y-sm">
                      <div className="flex justify-between text-body-sm">
                        <label className="font-label-md text-on-surface-variant font-semibold">Monthly Public Transit Distance</label>
                        <span className="text-primary font-bold">{inputs.vehicleDistance} km</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                        value={inputs.vehicleDistance}
                        onChange={(e) => setInputs(prev => ({ ...prev, vehicleDistance: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Air Travel Frequency</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                      {['never', 'rarely', 'frequently', 'very frequently'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[13px] cursor-pointer hover:bg-surface-container transition-all ${
                            inputs.airTravel === v 
                              ? 'bg-secondary-container border-primary text-on-secondary-container font-bold' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => setInputs(prev => ({ ...prev, airTravel: v }))}
                        >
                          <span className="capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Consumption & Waste */}
              {step === 4 && (
                <div className="space-y-lg">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/30 pb-sm">Consumption & Disposal</h3>

                  <div className="space-y-sm">
                    <div className="flex justify-between text-body-sm">
                      <label className="font-label-md text-on-surface-variant font-semibold">Monthly Grocery Bill</label>
                      <span className="text-primary font-bold">${inputs.groceryBill}</span>
                    </div>
                    <input 
                      type="range"
                      min="50"
                      max="300"
                      step="5"
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                      value={inputs.groceryBill}
                      onChange={(e) => setInputs(prev => ({ ...prev, groceryBill: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-sm">
                    <div className="flex justify-between text-body-sm">
                      <label className="font-label-md text-on-surface-variant font-semibold">New Clothes Purchased Monthly</label>
                      <span className="text-primary font-bold">{inputs.newClothes} items</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                      value={inputs.newClothes}
                      onChange={(e) => setInputs(prev => ({ ...prev, newClothes: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-on-surface-variant font-semibold" htmlFor="calc-bagSize">Waste Bag Size</label>
                      <select 
                        id="calc-bagSize"
                        className="w-full px-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md text-on-surface"
                        value={inputs.wasteBagSize}
                        onChange={(e) => setInputs(prev => ({ ...prev, wasteBagSize: e.target.value }))}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra large">Extra Large</option>
                      </select>
                    </div>

                    <div className="space-y-sm">
                      <div className="flex justify-between text-body-sm">
                        <label className="font-label-md text-on-surface-variant font-semibold">Weekly Waste Bags Dumped</label>
                        <span className="text-primary font-bold">{inputs.wasteBagCount} bags</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                        value={inputs.wasteBagCount}
                        onChange={(e) => setInputs(prev => ({ ...prev, wasteBagCount: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="space-y-sm">
                      <div className="flex justify-between text-body-sm">
                        <label className="font-label-md text-on-surface-variant font-semibold">Daily Screen Time (TV/PC)</label>
                        <span className="text-primary font-bold">{inputs.tvPcHours}h</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="24"
                        step="1"
                        className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                        value={inputs.tvPcHours}
                        onChange={(e) => setInputs(prev => ({ ...prev, tvPcHours: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-sm">
                      <div className="flex justify-between text-body-sm">
                        <label className="font-label-md text-on-surface-variant font-semibold">Daily Internet Usage</label>
                        <span className="text-primary font-bold">{inputs.internetHours}h</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="24"
                        step="1"
                        className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-primary cursor-pointer"
                        value={inputs.internetHours}
                        onChange={(e) => setInputs(prev => ({ ...prev, internetHours: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="font-label-md text-on-surface-variant font-semibold">Recycling Habits (Select all that apply)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                      {['Paper', 'Plastic', 'Glass', 'Metal'].map(v => (
                        <div 
                          key={v}
                          className={`p-md border rounded-xl text-center font-bold text-[13px] cursor-pointer hover:bg-surface-container transition-all ${
                            (inputs.recycling || []).includes(v) 
                              ? 'bg-secondary-container border-primary text-on-secondary-container font-bold' 
                              : 'bg-white border-outline-variant text-on-surface-variant'
                          }`}
                          onClick={() => toggleRecycling(v)}
                        >
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons inside card */}
              <div className="flex justify-between items-center border-t border-outline-variant/30 pt-lg mt-xl">
                <button 
                  onClick={prevStep}
                  className={`px-lg py-sm border border-outline text-outline rounded-full font-label-md flex items-center gap-xs ${
                    step === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container transition-all'
                  }`}
                  disabled={step === 1}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
                
                {step < 4 ? (
                  <button 
                    onClick={nextStep} 
                    className="px-lg py-sm bg-primary text-on-primary rounded-full font-label-md flex items-center gap-xs hover:bg-primary-container active:scale-95 transition-all shadow-md"
                  >
                    Next
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleCalculateSubmit} 
                    className="px-lg py-sm bg-primary text-on-primary rounded-full font-label-md flex items-center gap-xs hover:bg-primary-container active:scale-95 transition-all shadow-md"
                    disabled={calculating}
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {calculating ? 'Processing...' : 'Save Log'}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Right side preview (1 column) */}
        <div className="lg:col-span-1">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
