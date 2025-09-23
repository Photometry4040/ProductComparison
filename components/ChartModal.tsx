import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from './Modal';
import { Spec, Product } from '../types';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: Spec | null;
  products: Product[];
}

const parseSpecValue = (value: string | undefined): number | null => {
  if (typeof value !== 'string') return null;
  // Remove currency symbols, commas, and any text that isn't part of a number
  const cleanedValue = value.replace(/[$,]/g, '').trim();
  const numericPart = cleanedValue.match(/^-?\d*\.?\d+/);
  if (numericPart) {
    return parseFloat(numericPart[0]);
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-slate-300 rounded-md shadow-lg">
        <p className="font-bold text-slate-800">{`${label}`}</p>
        <p className="text-sm text-indigo-600">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};


const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, spec, products }) => {
  if (!isOpen || !spec) return null;

  const chartData = products
    .map(product => {
        const value = parseSpecValue(product.specs[spec.id]);
        return {
            name: product.name,
            value: value,
        };
    })
    .filter(item => item.value !== null && !isNaN(item.value))
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  const hasData = chartData.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comparison for: ${spec.name}`}>
      <div className="h-[60vh] w-full text-sm">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" dataKey="value" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150} 
                tick={{ fontSize: 12, width: 150 }} 
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 242, 255, 0.6)' }} />
              <Bar dataKey="value" name={spec.name} fill="#4f46e5" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">No numerical data available to visualize for this specification.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChartModal;
