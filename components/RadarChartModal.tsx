import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from './Modal';
import { Product, Spec } from '../types';
import { normalizeSpec, isScorableSpec } from '../utils/specValue';

interface RadarChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  specs: Spec[];
}

const COLORS = ['#4f46e5', '#dc2626', '#16a34a', '#d97706', '#0891b2', '#9333ea', '#db2777', '#65a30d'];

const RadarChartModal: React.FC<RadarChartModalProps> = ({ isOpen, onClose, products, specs }) => {
  // Use scorable specs that actually have weight-worthy signal, capped for readability.
  const axes = useMemo(
    () => specs.filter(isScorableSpec).slice(0, 8),
    [specs],
  );

  const chartProducts = useMemo(() => products.slice(0, COLORS.length), [products]);

  const data = useMemo(() => {
    return axes.map(spec => {
      const scores = normalizeSpec(chartProducts, spec);
      const row: Record<string, string | number> = { subject: spec.name.replace(/\s*\(.*\)\s*/, '') };
      chartProducts.forEach(p => {
        row[`${p.brand} ${p.model}`] = scores[p.id];
      });
      return row;
    });
  }, [axes, chartProducts]);

  if (!isOpen) return null;

  const canRender = axes.length >= 3 && chartProducts.length >= 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="다축 비교 — 레이더 차트 (정규화 점수)">
      <div className="h-[60vh] w-full text-sm">
        {canRender ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {chartProducts.map((p, i) => (
                <Radar
                  key={p.id}
                  name={`${p.brand} ${p.model}`}
                  dataKey={`${p.brand} ${p.model}`}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-slate-500">
              레이더 차트를 그리려면 점수화 가능한 숫자 스펙이 3개 이상, 제품이 1개 이상 필요합니다.
            </p>
          </div>
        )}
      </div>
      {canRender && chartProducts.length < products.length && (
        <p className="mt-2 text-xs text-slate-400">
          가독성을 위해 처음 {chartProducts.length}개 제품만 표시합니다.
        </p>
      )}
    </Modal>
  );
};

export default RadarChartModal;
