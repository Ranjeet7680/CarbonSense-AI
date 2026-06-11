import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';
import coefficients from '../coefficients.json';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

export default function History({ logs, onDeleteLog, theme }) {
  const isCyberGreen = theme === 'cyber-green';
  const isGold = theme === 'gold';
  const isDarkNeon = theme === 'dark-neon';

  const themeSecondaryColor = isCyberGreen ? '#00e676' : isGold ? '#bf953f' : isDarkNeon ? '#34d399' : '#3a6758';
  const themeSecondaryAlpha = isCyberGreen ? 'rgba(0, 230, 118, 0.1)' : isGold ? 'rgba(191, 149, 63, 0.1)' : isDarkNeon ? 'rgba(52, 211, 153, 0.1)' : 'rgba(58, 103, 88, 0.1)';

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedLogs.map(log => {
      const date = new Date(log.timestamp);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const data = sortedLogs.map(log => log.score);

    return {
      labels,
      datasets: [
        {
          label: 'Carbon Footprint Trend',
          data,
          borderColor: themeSecondaryColor, // Secondary (Green or dynamic)
          backgroundColor: themeSecondaryAlpha,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: themeSecondaryColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: 'National Baseline',
          data: Array(logs.length).fill(Math.round(coefficients.mean_emission)),
          borderColor: '#ba1a1a', // Error (Red)
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [logs, themeSecondaryColor, themeSecondaryAlpha]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#181c1b',
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} kg CO₂/mo`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#45464d',
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#45464d',
          font: {
            family: 'Inter',
            size: 11
          }
        }
      }
    }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-lg pb-12">
      <div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Emissions History</h1>
        <p className="font-body-md text-on-surface-variant">Review historical tracking data and examine personal footprint trends.</p>
      </div>

      {logs && logs.length > 0 ? (
        <>
          {/* Trend Graph */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md text-on-surface">Carbon Emissions Trend Graph</h3>
            <div className="h-[300px] relative">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Historical Logs List */}
          <div className="glass-card p-lg rounded-2xl flex flex-col gap-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary">clipboard_list</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Detailed Log Entries</h3>
            </div>
            
            <div className="overflow-x-auto border border-outline-variant/60 rounded-xl bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Date & Time</th>
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Footprint</th>
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Diet</th>
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Transport</th>
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Distance</th>
                    <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Heating</th>
                    <th className="p-md text-right font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-md whitespace-nowrap text-on-surface text-body-sm font-semibold">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-outline text-[16px]">calendar_today</span>
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <span className={`font-bold text-body-md ${
                          log.score > 2500 ? 'text-error' : log.score < 1500 ? 'text-primary' : 'text-secondary'
                        }`}>
                          {log.score} kg CO₂
                        </span>
                      </td>
                      <td className="p-md whitespace-nowrap capitalize text-on-surface-variant text-body-sm">
                        {log.inputs.diet}
                      </td>
                      <td className="p-md whitespace-nowrap capitalize text-on-surface-variant text-body-sm">
                        {log.inputs.transport === 'walk/bicycle' ? 'Walk / Bike' : log.inputs.transport}
                      </td>
                      <td className="p-md whitespace-nowrap text-on-surface-variant text-body-sm">
                        {log.inputs.vehicleDistance} km
                      </td>
                      <td className="p-md whitespace-nowrap capitalize text-on-surface-variant text-body-sm">
                        {log.inputs.heatingEnergy}
                      </td>
                      <td className="p-md whitespace-nowrap text-right">
                        <button 
                          onClick={() => onDeleteLog(log.id)} 
                          className="p-sm text-error hover:bg-error-container/30 rounded-lg transition-all inline-flex items-center justify-center"
                          title="Delete this entry"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-2xl rounded-2xl flex flex-col items-center justify-center gap-md border-2 border-dashed text-center">
          <span className="material-symbols-outlined text-[48px] text-outline">info</span>
          <div>
            <span className="font-headline-md text-headline-md text-on-surface block mb-xs">No Logs Logged</span>
            <p className="font-body-md text-on-surface-variant">Complete your first carbon tracking questionnaire to populate your history.</p>
          </div>
        </div>
      )}
    </div>
  );
}
