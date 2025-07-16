import React, { useState, useEffect } from 'react';
import { Bubble } from 'react-chartjs-2';
import { Chart, BubbleController, PointElement, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BubbleController, PointElement, LinearScale, Tooltip, Legend);

type ESGData = { name: string; sector: string; esg: number; flagged: boolean; marketCap: number };

export default function ESGScreener() {
  const [data, setData] = useState<ESGData[]>([]);

  const [sector, setSector] = useState('');
  const [threshold, setThreshold] = useState(0);

  useEffect(() => {

    fetch('/api/esg-proxy')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch ESG data');
        return res.json();
      })
      .then((apiData) => setData(apiData.stocks || []))
      .catch((err) => setError(err.message))
      // .finally(() => setLoading(false));
  }, []);

  const sectors = Array.from(new Set(data.map((d) => d.sector)));

  const filtered = data.filter((d) =>
    (sector === '' || d.sector === sector) && d.esg >= threshold
  );

  const bubbleData = {
    datasets: filtered.map((d) => ({
      label: d.name,
      data: [{ x: d.marketCap, y: d.esg, r: 10 }],
      backgroundColor: d.flagged ? '#f43f5e' : '#10b981',
      borderColor: '#6366f1',
      borderWidth: 1,
    })),
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-2xl">
      <form className="flex flex-wrap gap-4 mb-8 items-end">
        <div>
          <label className="block text-sm font-semibold mb-1">Sector</label>
          <select
            className="input"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">All</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">ESG Score ≥</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
      </form>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">ESG Score Bubble Chart</h3>
        <Bubble data={bubbleData} options={{
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ESG ${ctx.raw.y}` } } },
          scales: { x: { title: { display: true, text: 'Market Cap ($B)' } }, y: { title: { display: true, text: 'ESG Score' }, min: 0, max: 100 } }
        }} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Red Flags</h3>
        <ul className="space-y-1">
          {filtered.filter((d) => d.flagged).length === 0 ? (
            <li className="text-green-600">No red flags detected in current filter.</li>
          ) : (
            filtered.filter((d) => d.flagged).map((d) => (
              <li key={d.name} className="text-red-500 font-semibold">{d.name} ({d.sector}) - Possible greenwashing or ESG concern</li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
