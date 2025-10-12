import React from 'react';

interface BarChartProps {
  title: string;
  data: { label: string; value: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ title, data }) => {
  const maxValue = Math.max(...data.map(item => item.value), 0);

  return (
    <div>
      <h3 className="font-semibold text-brand-text mb-4">{title}</h3>
      <div className="flex items-end justify-around h-48 gap-2 border-b-2 border-slate-700 pb-2">
        {data.map(({ label, value }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-2 text-center">
            <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
              <div
                className="w-3/4 max-w-xs bg-brand-accent rounded-t-sm hover:bg-sky-400 transition-colors"
                style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                title={`${label}: ${value} books`}
              ></div>
            </div>
            <span className="text-xs text-brand-subtle font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
