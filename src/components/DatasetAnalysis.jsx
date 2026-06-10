import React, { useState, useMemo } from 'react';
import datasetSummary from '../dataset_summary.json';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DatasetAnalysis() {
  const [activeTab, setActiveTab] = useState('Transport'); // Active categorical breakdown tab

  // 1. Prepare Histogram Chart Data
  const histogramChartData = useMemo(() => {
    const labels = datasetSummary.histogram.map(b => `${b.binStart}-${b.binEnd} kg`);
    const counts = datasetSummary.histogram.map(b => b.count);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Observations',
          data: counts,
          backgroundColor: '#3a6758', // Secondary green
          hoverBackgroundColor: '#154212', // Primary dark green
          borderRadius: 6,
          borderWidth: 0
        }
      ]
    };
  }, []);

  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.raw} records`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#72796e',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.04)'
        },
        ticks: {
          color: '#72796e'
        }
      }
    }
  };

  // 2. Prepare Categorical Breakdown Chart Data based on active tab
  const categoricalChartData = useMemo(() => {
    const data = datasetSummary.categoricalBreakdowns[activeTab] || [];
    const labels = data.map(d => d.category.charAt(0).toUpperCase() + d.category.slice(1));
    const averages = data.map(d => d.avgEmission);

    return {
      labels,
      datasets: [
        {
          label: 'Average Emission (kg CO₂/month)',
          data: averages,
          backgroundColor: [
            '#154212', // Dark green
            '#3a6758', // Sage green
            '#ffe179', // Yellow
            '#72796e', // Slate
            '#ba1a1a', // Red/Crimson
            '#8f928c'
          ].slice(0, labels.length),
          borderRadius: 8,
          maxBarThickness: 50
        }
      ]
    };
  }, [activeTab]);

  const categoricalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => ` Average: ${context.raw} kg CO₂/mo`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#0b1c30',
          font: {
            family: 'Inter',
            weight: 'bold',
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.04)'
        },
        ticks: {
          color: '#72796e'
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-lg pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Dataset Analytics</h1>
        <p className="font-body-md text-on-surface-variant">
          Statistical models trained on the <code className="bg-surface-container px-sm py-xs rounded text-secondary font-mono text-sm">Carbon Emission.csv</code> database of 10,000 observations.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="glass-card p-md rounded-2xl flex flex-col gap-xs">
          <span className="font-label-md text-outline uppercase text-[11px] tracking-wider">Total Observations</span>
          <span className="text-2xl font-bold text-on-surface">{datasetSummary.totalRecords.toLocaleString()}</span>
          <span className="text-[11px] text-outline">Simulated ESG profiles</span>
        </div>
        <div className="glass-card p-md rounded-2xl flex flex-col gap-xs">
          <span className="font-label-md text-outline uppercase text-[11px] tracking-wider">Mean Emission</span>
          <span className="text-2xl font-bold text-primary">{datasetSummary.meanEmission} kg</span>
          <span className="text-[11px] text-outline">CO₂ per user / month</span>
        </div>
        <div className="glass-card p-md rounded-2xl flex flex-col gap-xs">
          <span className="font-label-md text-outline uppercase text-[11px] tracking-wider">Standard Deviation</span>
          <span className="text-2xl font-bold text-secondary">{datasetSummary.stdDev} kg</span>
          <span className="text-[11px] text-outline">Distribution dispersion</span>
        </div>
        <div className="glass-card p-md rounded-2xl flex flex-col gap-xs">
          <span className="font-label-md text-outline uppercase text-[11px] tracking-wider">Emission Range</span>
          <span className="text-2xl font-bold text-on-surface">{datasetSummary.minEmission} - {datasetSummary.maxEmission} kg</span>
          <span className="text-[11px] text-outline">Absolute min / max bounds</span>
        </div>
      </div>

      {/* Two Columns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        
        {/* Left Column: Histogram distribution (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Carbon Emission Distribution</h3>
            <p className="font-body-sm text-on-surface-variant">
              Histogram showing the frequency of users falling into different emission classes. The bulk of profiles center around 1,500 - 2,500 kg CO₂/mo.
            </p>
            <div className="h-[300px] mt-sm">
              <Bar data={histogramChartData} options={histogramOptions} />
            </div>
          </div>

          {/* Pearson Correlations */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Numerical Feature Drivers</h3>
            <p className="font-body-sm text-on-surface-variant">
              Pearson correlation coefficients measuring the direct linear relationship with total CarbonEmission. Values closer to 1.0 signify a stronger driver.
            </p>

            <div className="overflow-x-auto border border-outline-variant/30 rounded-xl">
              <table className="w-full border-collapse text-left text-sm bg-surface-container-lowest">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface border-b border-outline-variant/50">
                    <th className="p-md font-bold">Feature Name</th>
                    <th className="p-md font-bold text-center">Dataset Mean</th>
                    <th className="p-md font-bold text-center">Min - Max</th>
                    <th className="p-md font-bold text-right">Pearson r Correlation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {datasetSummary.numericalStats.map(stat => {
                    const isStrong = stat.correlation >= 0.3;
                    return (
                      <tr key={stat.feature} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-md font-semibold text-on-surface">{stat.feature}</td>
                        <td className="p-md text-center text-on-surface-variant">{stat.mean}</td>
                        <td className="p-md text-center text-on-surface-variant">{stat.min} - {stat.max}</td>
                        <td className={`p-md text-right font-bold ${
                          isStrong ? 'text-error font-extrabold' : 'text-secondary'
                        }`}>
                          {stat.correlation > 0 ? `+${stat.correlation}` : stat.correlation}
                          {isStrong && (
                            <span className="block text-[9px] text-error font-normal uppercase tracking-wide">Primary Driver</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Categorical Factor Breakdowns (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Categorical Carbon Factors</h3>
            <p className="font-body-sm text-on-surface-variant">
              Compare average emissions by selecting different demographic and lifestyle categories from the dataset.
            </p>

            {/* Selector tabs */}
            <div className="flex flex-wrap gap-xs border-b border-outline-variant/30 pb-xs">
              {['Transport', 'Diet', 'Heating Energy Source', 'Vehicle Type', 'Frequency of Traveling by Air'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-sm py-base text-xs font-semibold border-b-2 transition-all ${
                    activeTab === tab 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab === 'Heating Energy Source' ? 'Heating' : tab === 'Frequency of Traveling by Air' ? 'Air Travel' : tab}
                </button>
              ))}
            </div>

            {/* Average emissions Bar Chart */}
            <div className="h-[250px] my-sm">
              <Bar data={categoricalChartData} options={categoricalOptions} />
            </div>

            {/* Explanation box */}
            <div className="p-md bg-surface-container-low rounded-xl text-xs space-y-sm text-on-surface-variant">
              <div className="font-bold text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Insights
              </div>
              {activeTab === 'Transport' && (
                <p>Private transit profiles average <b>2,980.88 kg/mo</b>, which is roughly <b>58% higher</b> than walking/biking or public transit options.</p>
              )}
              {activeTab === 'Diet' && (
                <p>Omnivore choices average <b>2,391.98 kg/mo</b>. Shifting to vegan/vegetarian selections reduces base food-production emissions significantly.</p>
              )}
              {activeTab === 'Heating Energy Source' && (
                <p>Electricity-based heating source users represent the lowest average (<b>2,039.38 kg/mo</b>), compared to coal heating (<b>2,495.06 kg/mo</b>).</p>
              )}
              {activeTab === 'Vehicle Type' && (
                <p>Electric car owners have an average emission of <b>1,883.29 kg/mo</b>, while petrol vehicle drivers top the list at <b>3,749.89 kg/mo</b>.</p>
              )}
              {activeTab === 'Frequency of Traveling by Air' && (
                <p>Frequent air travel (especially very frequent flights) represents the highest carbon index in the entire database (<b>3,026.46 kg/mo</b>).</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
