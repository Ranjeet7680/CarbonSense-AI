import React, { useState, useMemo } from 'react';

const ARTICLES = [
  {
    id: 'a1',
    title: 'Switching to an EV: Environmental and Cost Analysis',
    category: 'Transport',
    readTime: '5 min read',
    impact: 'Saves ~1,200 kg CO₂/mo',
    icon: 'electric_car',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
    desc: 'Replacing a traditional internal combustion engine vehicle with an electric model is the single largest carbon-reducing action a commuter can take.',
    content: `
      ### The Carbon Math of Going Electric
      According to our Ordinary Least Squares (OLS) regression model, driving a petrol car accounts for an average increase of **+829 kg CO₂/month**, while shifting to an electric vehicle contributes to a massive offset of **-1,036 kg CO₂/month**. 
      
      This swing represents a net reduction of nearly **1.8 metric tons** of greenhouse gases per month for frequent drivers.

      ### Financial Payback Period
      While the initial purchase price of an EV can be higher, fuel savings and lower maintenance costs offset this premium:
      - **Charging vs. Petrol**: Electricity costs average 70% less than petrol per mile.
      - **Federal Incentives**: Under tax credits, buyers can receive up to $7,500 in credit.
      - **Payback Horizon**: Most regular commuters break even within 4.2 years of purchase.
    `
  },
  {
    id: 'a2',
    title: 'Is Solar Energy Right for Your Home?',
    category: 'Energy',
    readTime: '4 min read',
    impact: 'Saves ~400 kg CO₂/mo',
    icon: 'solar_power',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    desc: 'An in-depth look at home solar panel installations, average payback periods, and residential greenhouse gas reductions.',
    content: `
      ### Residential Carbon Footprint
      Residential energy makes up roughly 20% of national greenhouse gas emissions. Heating and power generation are the main drivers. By installing solar, you switch your home fuel source from municipal grids (often powered by coal or natural gas) to clean, zero-emission solar radiation.

      ### Costs & Benefits
      - **Average System Cost**: A standard 6kW residential system costs around $12,000–$16,000 after tax incentives.
      - **Payback Time**: Most homes achieve net zero electricity bills, leading to a payback period of 5.5 to 7 years.
      - **Property Value**: Solar installations increase home values by an average of 4.1% according to recent real estate indexes.
    `
  },
  {
    id: 'a3',
    title: 'Eating Green: Carbon Impact of Plant-Based Diets',
    category: 'Food',
    readTime: '6 min read',
    impact: 'Saves ~160 kg CO₂/mo',
    icon: 'restaurant',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    desc: 'How dietary changes scale across global food networks to reduce agricultural methane and carbon emissions.',
    content: `
      ### Diet Regression Impact
      Food systems account for about 26% of global emissions. The OLS regression indicates:
      - **Omnivore**: Adds **+96 kg CO₂/month** to your profile.
      - **Vegan**: Cuts footprint by **-65 kg CO₂/month**.
      - **Vegetarian**: Saves **-38 kg CO₂/month**.

      Transitioning from a heavy meat diet to a plant-based vegan diet cuts food-related carbon output by over **160 kg/month**.

      ### Where the Savings Come From
      Beef and dairy cattle require extensive land use and emit large quantities of methane (a greenhouse gas 28x more potent than CO₂). Shifting production to cereals, nuts, and legumes uses 10x less land and produces a fraction of the emissions.
    `
  },
  {
    id: 'a4',
    title: 'Methane and Landfills: The Recycling Solution',
    category: 'Waste',
    readTime: '3 min read',
    impact: 'Saves ~430 kg CO₂/mo',
    icon: 'recycling',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    desc: 'Sorting paper, plastic, glass, and metals prevents landfill decay and limits organic greenhouse gas release.',
    content: `
      ### Methane Avoidance
      When paper and cardboard decompose in oxygen-poor landfills, they release methane. Sorting and recycling routes these materials back into manufacturing, entirely skipping landfill decay.

      ### Coefficient Breakdown
      The OLS model values active recycling habits highly:
      - **Paper Recycling**: Saves **-148 kg/mo**
      - **Metal Recycling**: Saves **-129 kg/mo**
      - **Glass Recycling**: Saves **-91 kg/mo**
      - **Plastic Recycling**: Saves **-64 kg/mo**

      Active recycling in all four categories yields over **430 kg CO₂/month** in net footprint reduction.
    `
  },
  {
    id: 'a5',
    title: 'Smart Thermostats & Eco-insulation',
    category: 'Energy',
    readTime: '3 min read',
    impact: 'Saves ~50 kg CO₂/mo',
    icon: 'thermostat',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    desc: 'Simple, budget-friendly actions to weatherize your home and automate heating efficiency.',
    content: `
      ### High Impact, Low Cost
      Not everyone can afford solar panel installations. Weatherizing your home is an affordable alternative:
      - **Smart Thermostats**: Save 10–12% on heating and 15% on cooling bills.
      - **LED Bulb Conversion**: Converts 95% of energy into light, not heat, using 75% less electricity.
      - **Insulation Seals**: Sealing window seams and attic floorboards cuts heating gas loads by 150 kg annually.
    `
  }
];

export default function LearningHub({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(art => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            art.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-lg pb-12">
      {/* Top Header */}
      <div>
        <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">Eco Learning Hub</h1>
        <p className="font-body-md text-on-surface-variant">Explore articles and guides to understand your carbon footprint and make an impact.</p>
      </div>

      {/* Search Bar and Categories Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>search</span>
          <input
            type="text"
            className="w-full pl-11 pr-md py-sm bg-surface-container border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md"
            placeholder="Search articles, guides, tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-xs overflow-x-auto pb-sm no-scrollbar">
          {['All', 'Transport', 'Energy', 'Food', 'Waste'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-md py-xs rounded-full font-label-md text-label-md transition-all active:scale-95 duration-100 ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container-high text-on-surface hover:bg-secondary-container'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Articles */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filteredArticles.map(art => (
            <div
              key={art.id}
              onClick={() => setActiveArticle(art)}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden cursor-pointer hover:shadow-[0px_4px_20px_rgba(45,90,39,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image header */}
                <div className="h-44 relative overflow-hidden bg-surface-container-high">
                  <img
                    alt={art.title}
                    src={art.image}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container text-[11px] font-bold px-sm py-xs rounded-full flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{art.icon}</span>
                    {art.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-md space-y-xs">
                  <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider block">{art.impact}</span>
                  <h3 className="font-headline-md text-body-lg font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">{art.title}</h3>
                  <p className="font-body-sm text-[13px] text-on-surface-variant line-clamp-3">{art.desc}</p>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="p-md pt-0 flex justify-between items-center border-t border-surface-container text-outline">
                <span className="font-label-md text-[11px] uppercase">{art.readTime}</span>
                <span className="font-label-md text-[11px] text-primary font-bold flex items-center gap-xs">
                  Read More <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2xl text-center border-2 border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-md">find_in_page</span>
          <h3 className="font-headline-md text-on-surface-variant font-bold">No articles found</h3>
          <p className="font-body-sm text-outline">Try searching other keywords or modifying your category filters.</p>
        </div>
      )}

      {/* Bill Analytics Helper Card */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-lg flex flex-col md:flex-row gap-lg items-center justify-between mt-lg">
        <div className="flex gap-md items-start">
          <div className="p-md bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
          </div>
          <div className="space-y-xs">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Automated Waste & Energy Statement Reader</h3>
            <p className="font-body-sm text-on-surface-variant max-w-2xl">
              Don't want to type your values manually? Upload your monthly utility statement or waste disposal bill inside the Carbon Tracker. Our built-in OCR scans the document to input values directly into the OLS calculator.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('calculator')}
          className="whitespace-nowrap px-lg py-sm bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container shadow active:scale-95 duration-100 flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Open Carbon Tracker
        </button>
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-md animate-in fade-in duration-200">
          <div
            className="bg-surface rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-outline-variant flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="h-60 relative w-full flex-shrink-0 bg-surface-container">
              <img
                alt={activeArticle.title}
                src={activeArticle.image}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute bottom-4 left-4 bg-primary text-on-primary text-xs font-bold px-md py-xs rounded-full flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{activeArticle.icon}</span>
                {activeArticle.category}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-lg space-y-md">
              <div className="flex justify-between items-center text-outline">
                <span className="font-label-md text-primary font-bold uppercase tracking-wider">{activeArticle.impact}</span>
                <span className="text-xs">{activeArticle.readTime}</span>
              </div>
              <h2 className="font-headline-xl text-headline-lg font-bold text-on-surface leading-tight">{activeArticle.title}</h2>
              
              {/* Formatted Content */}
              <div className="prose prose-slate max-w-none text-body-md text-on-surface-variant space-y-md border-t border-outline-variant/30 pt-md">
                {activeArticle.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.trim().startsWith('###')) {
                    return <h3 key={idx} className="font-headline-md text-primary font-bold pt-sm">{paragraph.replace('###', '').trim()}</h3>;
                  }
                  if (paragraph.trim().startsWith('-')) {
                    return (
                      <ul key={idx} className="list-disc pl-lg space-y-xs">
                        {paragraph.split('\n').map((li, liIdx) => (
                          <li key={liIdx} className="font-body-sm leading-relaxed">{li.replace('-', '').trim()}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={idx} className="font-body-sm leading-relaxed">{paragraph.trim()}</p>;
                })}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-lg border-t border-outline-variant/30 flex justify-end gap-md bg-surface-container-lowest flex-shrink-0">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-lg py-sm border border-outline text-outline font-semibold rounded-full hover:bg-surface-container-low transition-colors"
              >
                Close Reader
              </button>
              <button
                onClick={() => {
                  setActiveArticle(null);
                  onNavigate('calculator');
                }}
                className="px-lg py-sm bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-container shadow transition-all active:scale-95 duration-100 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                Update My Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
