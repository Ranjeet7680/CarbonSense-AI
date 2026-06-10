import React, { useState } from 'react';

const PROJECTS = [
  {
    id: 'p1',
    name: 'Amazon Rainforest Protection',
    type: 'reforestation',
    desc: 'Protect endangered rainforest land from deforestation in the Amazon basin, preserving biodiversity and capturing carbon.',
    costPerTon: 15,
    icon: 'forest',
    impact: 'High'
  },
  {
    id: 'p2',
    name: 'Wind Energy Expansion',
    type: 'renewable',
    desc: 'Fund the construction of wind turbine farms in developing regions, replacing coal power with clean energy.',
    costPerTon: 10,
    icon: 'wind_power',
    impact: 'Medium'
  },
  {
    id: 'p3',
    name: 'Clean Water Project',
    type: 'community',
    desc: 'Provide clean water access to rural communities, reducing wood fuel consumption previously used for boiling water.',
    costPerTon: 12,
    icon: 'water_drop',
    impact: 'Medium'
  },
  {
    id: 'p4',
    name: 'Landfill Methane Capture',
    type: 'methane',
    desc: 'Capture methane emissions from municipal landfills and convert them into clean electricity.',
    costPerTon: 8,
    icon: 'mode_heat',
    impact: 'High'
  }
];

export default function Offsets({ grossEmissions, onAddOffset, offsetTotal }) {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [offsetAmountKg, setOffsetAmountKg] = useState(100);
  const [successMsg, setSuccessMsg] = useState('');

  const handleOffsetSubmit = (e) => {
    e.preventDefault();
    const tons = offsetAmountKg / 1000;
    const cost = Math.round(tons * selectedProject.costPerTon * 100) / 100;

    onAddOffset({
      id: Math.random().toString(),
      projectName: selectedProject.name,
      amountKg: offsetAmountKg,
      cost,
      timestamp: Date.now()
    });

    setSuccessMsg(`Successfully offset ${offsetAmountKg} kg CO₂ by supporting ${selectedProject.name}!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const netEmissions = Math.max(0, grossEmissions - offsetTotal);
  const offsetPercentage = grossEmissions > 0 
    ? Math.min(100, Math.round((offsetTotal / grossEmissions) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-lg pb-12">
      <div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Carbon Offsetting</h1>
        <p className="font-body-md text-on-surface-variant">Neutralize your carbon footprint by supporting verified global climate projects.</p>
      </div>

      {successMsg && (
        <div className="p-md bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim/40 rounded-xl font-body-sm flex items-center gap-xs">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Net Footprint Balance Section */}
      <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md text-on-surface">Your Carbon Balance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-center py-xs">
          <div>
            <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Gross Footprint</div>
            <div className="font-headline-xl text-[36px] font-extrabold text-on-surface">{grossEmissions} kg</div>
          </div>
          <div>
            <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Offsets</div>
            <div className="font-headline-xl text-[36px] font-extrabold text-emerald-600">-{offsetTotal} kg</div>
          </div>
          <div>
            <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Net Balance</div>
            <div className="font-headline-xl text-[36px] font-extrabold text-secondary">{netEmissions} kg</div>
          </div>
        </div>

        {grossEmissions > 0 && (
          <div className="mt-sm">
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant mb-xs">
              <span>Footprint Neutralized:</span>
              <span className="text-secondary font-bold">{offsetPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-500 ease-in-out"
                style={{ width: `${offsetPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Offset Form left, projects list right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Purchase Offsets Form (5/12 cols) */}
        <div className="lg:col-span-5 glass-card p-lg rounded-2xl flex flex-col gap-md h-fit">
          <h3 className="font-headline-md text-headline-md text-on-surface pb-xs border-b border-outline-variant/30">Fund Project</h3>
          
          <form onSubmit={handleOffsetSubmit} className="space-y-md">
            <div className="space-y-xs">
              <label className="font-label-md text-on-surface-variant">Selected Portfolio Project</label>
              <select 
                className="w-full px-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md"
                value={selectedProject.id}
                onChange={(e) => setSelectedProject(PROJECTS.find(p => p.id === e.target.value))}
              >
                {PROJECTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.costPerTon}/ton)</option>
                ))}
              </select>
            </div>

            <div className="space-y-sm">
              <div className="flex justify-between text-body-sm">
                <label className="font-label-md text-on-surface-variant">Offset Amount</label>
                <span className="text-secondary font-bold">{offsetAmountKg} kg CO₂</span>
              </div>
              <input 
                type="range"
                min="10"
                max={Math.max(500, Math.round(grossEmissions * 1.2))}
                step="10"
                className="w-full h-2 bg-surface-container-high rounded-full appearance-none outline-none accent-secondary cursor-pointer"
                value={offsetAmountKg}
                onChange={(e) => setOffsetAmountKg(parseInt(e.target.value))}
              />
            </div>

            <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-md space-y-sm text-body-sm text-[13px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Equivalent Tons:</span>
                <span className="font-semibold">{(offsetAmountKg / 1000).toFixed(3)} metric tons</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-sm">
                <span className="text-on-surface-variant">Offset Cost Rate:</span>
                <span className="font-semibold">${selectedProject.costPerTon}.00 / ton</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-sm text-body-md font-bold text-on-surface">
                <span>Estimated Cost:</span>
                <span className="text-secondary flex items-center">
                  ${Math.round((offsetAmountKg / 1000) * selectedProject.costPerTon * 100) / 100}
                </span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-md bg-secondary text-white font-label-md rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">public</span>
              Contribute Offset
            </button>
          </form>
        </div>

        {/* Projects Info (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">Verified Climate Portfolio</h3>
          
          <div className="flex flex-col gap-md">
            {PROJECTS.map(p => (
              <div 
                key={p.id} 
                className={`p-md border rounded-xl flex gap-md items-start cursor-pointer transition-all hover:bg-surface-container ${
                  selectedProject.id === p.id 
                    ? 'border-secondary bg-secondary-container/15' 
                    : 'border-outline-variant bg-white'
                }`}
                onClick={() => setSelectedProject(p)}
              >
                <div className={`p-sm rounded-lg flex items-center justify-center ${
                  selectedProject.id === p.id ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{p.icon}</span>
                </div>
                <div className="flex-1 space-y-xs">
                  <div className="flex justify-between items-center gap-xs">
                    <span className="font-headline-md text-body-md font-bold text-on-surface">{p.name}</span>
                    <span className="font-label-md text-label-md text-secondary border border-secondary/35 px-sm py-0.5 rounded-full font-bold">
                      ${p.costPerTon}/ton
                    </span>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
