import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface LoanChartProps {
  borrowedAmount: number;
  remainingAmount: number;
}

export function LoanChart({ borrowedAmount, remainingAmount }: LoanChartProps) {
  const chartRef = useRef(null);

  // Simulate loan repayment progress over time
  const generateChartData = () => {
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Today'];
    const repaymentProgress = [
      borrowedAmount,
      borrowedAmount * 0.85,
      borrowedAmount * 0.65,
      borrowedAmount * 0.40,
      remainingAmount,
    ];

    return {
      labels: days,
      datasets: [
        {
          label: 'Remaining Debt (ckBTC)',
          data: repaymentProgress,
          borderColor: '#00FF85',
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 255, 133, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 133, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#00FF85',
          pointBorderColor: '#0B0E11',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#00FF85',
          pointHoverBorderColor: '#0B0E11',
          pointHoverBorderWidth: 3,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(11, 14, 17, 0.95)',
        titleColor: '#00FF85',
        bodyColor: '#ffffff',
        borderColor: '#00FF85',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            if (context.parsed.y !== null && typeof context.parsed.y === 'number') {
              return `${context.parsed.y.toFixed(4)} ckBTC`;
            }
            return '0.0000 ckBTC';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
          callback: function (value: number | string) {
            if (typeof value === 'number') {
              return value.toFixed(4);
            }
            return value;
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Loan Repayment Progress</h3>
          <p className="text-sm text-gray-400">Track your debt reduction over time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#00FF85] rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Live Data</span>
        </div>
      </div>

      <div className="h-[300px]">
        <Line ref={chartRef} data={generateChartData()} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Initial Borrowed</div>
          <div className="text-[#FFC700] font-bold">{borrowedAmount.toFixed(4)} ckBTC</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Remaining</div>
          <div className="text-[#00FF85] font-bold">{remainingAmount.toFixed(4)} ckBTC</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Progress</div>
          <div className="text-white font-bold">
            {((1 - remainingAmount / borrowedAmount) * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}
