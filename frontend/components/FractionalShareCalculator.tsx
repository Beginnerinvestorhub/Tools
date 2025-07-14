import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const brokers = [
  { name: 'Broker A', fee: 0 },
  { name: 'Broker B', fee: 1.99 },
  { name: 'Broker C', fee: 4.95 },
];

export default function FractionalShareCalculator() {
  const [amount, setAmount] = useState('');
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [selectedBroker, setSelectedBroker] = useState(brokers[0].name);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const fetchPrice = async (sym: string) => {
    setLoadingPrice(true);
    setPriceError(null);
    setPrice('');
    try {
      const res = await fetch(`/api/price-proxy?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch price');
      setPrice(data.price.toString());
    } catch (err: any) {
      setPriceError(err.message);
    } finally {
      setLoadingPrice(false);
    }
  };

  const calcShares = (amt: number, p: number, fee: number) => (amt - fee > 0 && p > 0 ? (amt - fee) / p : 0);

  const shares = brokers.map((b) => calcShares(Number(amount), Number(price), b.fee));

  const pieData = {
    labels: brokers.map((b) => b.name),
    datasets: [
      {
        data: shares,
        backgroundColor: ['#6366f1', '#10b981', '#f59e42'],
      },
    ],
  };

  const barData = {
    labels: brokers.map((b) => b.name),
    datasets: [
      {
        label: 'Broker Fee ($)',
        data: brokers.map((b) => b.fee),
        backgroundColor: '#6366f1',
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-lg">
      <form className="space-y-4 mb-8">
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="Investment Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Stock Symbol (e.g. AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onBlur={() => symbol && fetchPrice(symbol)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!symbol || loadingPrice}
            onClick={() => symbol && fetchPrice(symbol)}
          >
            {loadingPrice ? '...' : 'Get Price'}
          </button>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="Stock Price (USD)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        {priceError && <div className="text-red-500 text-sm">{priceError}</div>}
        <select
          className="input"
          value={selectedBroker}
          onChange={(e) => setSelectedBroker(e.target.value)}
        >
          {brokers.map((b) => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      </form>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Fractional Shares by Broker</h3>
        <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Broker Fee Comparison</h3>
        <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
      </div>
      <div className="text-center mt-4">
        <span className="text-lg font-bold text-indigo-700">
          {selectedBroker}: {calcShares(Number(amount), Number(price), brokers.find(b => b.name === selectedBroker)?.fee ?? 0).toFixed(4)} shares
        </span>
      </div>
    </div>
  );
}
