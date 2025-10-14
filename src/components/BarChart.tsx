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
      <div className="space-y-2">
        {data.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-12 items-center gap-2 text-sm">
            <span className="col-span-2 text-brand-subtle text-right">{label}</span>
            <div className="col-span-9 w-full bg-slate-700 rounded-full h-4">
              <div
                className="bg-brand-accent h-4 rounded-full transition-all duration-500"
                style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                title={`${value} books`}
              >
              </div>
            </div>
            <span className="col-span-1 text-brand-text font-semibold text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;