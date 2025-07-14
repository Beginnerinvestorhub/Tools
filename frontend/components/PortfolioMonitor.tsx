import React, { useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend);

type PortfolioAsset = { name: string; value: number; allocation: number };
type PortfolioHistory = { date: string; total: number };

export default function PortfolioMonitor() {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [history, setHistory] = useState<PortfolioHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAsset, setShowAsset] = useState<string | null>(null);
  const [alertSensitivity, setAlertSensitivity] = useState(5);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/portfolio-proxy')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch portfolio');
        return res.json();
      })
      .then((data) => {
        setPortfolio(data.assets || []);
        setHistory(data.history || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

export default function PortfolioMonitor() {
  const [showAsset, setShowAsset] = useState<string | null>(null);
  const [alertSensitivity, setAlertSensitivity] = useState(5);

  const pieData = {
    labels: portfolio.map((a) => a.name),
    datasets: [
      {
        data: portfolio.map((a) => a.allocation),
        backgroundColor: ['#6366f1', '#f59e42', '#10b981', '#f43f5e', '#a78bfa'],
      },
    ],
  };

  const lineData = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: history.map((h) => h.total),
        fill: false,
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-2xl">
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Portfolio Allocation</h3>
        <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Performance Over Time</h3>
        <Line data={lineData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
      </div>
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div>
          <label className="block text-sm font-semibold mb-1">Asset Toggle</label>
          <select className="input" value={showAsset || ''} onChange={e => setShowAsset(e.target.value || null)}>
            <option value="">All</option>
            {portfolio.map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Alert Sensitivity</label>
          <input type="range" min="1" max="10" value={alertSensitivity} onChange={e => setAlertSensitivity(Number(e.target.value))} className="w-full" />
          <span className="ml-2">{alertSensitivity}</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Asset Details</h3>
        {showAsset ? (
          <div className="text-indigo-700 font-bold">{showAsset}: ${portfolio.find(a => a.name === showAsset)?.value?.toLocaleString() || 'N/A'}</div>
        ) : (
          <div className="text-gray-700">Select an asset to view details.</div>
        )}
      </div>
    </div>
  );
}
