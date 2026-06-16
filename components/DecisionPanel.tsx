import React, { useMemo } from 'react';
import Modal from './Modal';
import { Product, Spec } from '../types';
import { computeScores, isScorableSpec, parseSpecValue } from '../utils/specValue';

interface DecisionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  specs: Spec[];
  weights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
  onResetWeights: () => void;
  priceSpecId?: string;
}

const medal = (rank: number) => (rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}`);

const DecisionPanel: React.FC<DecisionPanelProps> = ({
  isOpen, onClose, products, specs, weights, onWeightsChange, onResetWeights, priceSpecId,
}) => {
  const scorableSpecs = useMemo(() => specs.filter(isScorableSpec), [specs]);

  const ranked = useMemo(() => {
    const scores = computeScores(products, specs, weights, priceSpecId);
    return [...scores].sort((a, b) => b.total - a.total);
  }, [products, specs, weights, priceSpecId]);

  const productById = useMemo(() => {
    const m: Record<string, Product> = {};
    products.forEach(p => { m[p.id] = p; });
    return m;
  }, [products]);

  const bestValue = useMemo(() => {
    const withValue = ranked.filter(r => r.valueScore !== null);
    if (withValue.length === 0) return null;
    return withValue.reduce((a, b) => ((b.valueScore ?? 0) > (a.valueScore ?? 0) ? b : a));
  }, [ranked]);

  if (!isOpen) return null;

  const setWeight = (specId: string, value: number) => {
    onWeightsChange({ ...weights, [specId]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="의사결정 매트릭스 — 가중치로 자동 순위">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Weights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800">기준별 가중치</h4>
            <button onClick={onResetWeights} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              기본값으로 초기화
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            중요한 기준의 슬라이더를 올리면 순위가 실시간으로 바뀝니다. 점수는 비교 대상 {products.length}개 제품을
            기준별로 0~100으로 정규화(가격·응답속도 등은 낮을수록 100)한 뒤 가중 평균한 값입니다.
          </p>
          <div className="space-y-3">
            {scorableSpecs.map(spec => {
              const w = weights[spec.id] ?? 0;
              return (
                <div key={spec.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate" title={spec.name}>
                      {spec.name}
                      <span className="ml-1 text-xs text-slate-400">
                        ({spec.betterDirection === 'lower' ? '낮을수록↑' : '높을수록↑'})
                      </span>
                    </span>
                    <span className="font-mono text-xs text-slate-500 w-8 text-right">{w}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={w}
                    onChange={e => setWeight(spec.id, Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              );
            })}
            {scorableSpecs.length === 0 && (
              <p className="text-sm text-slate-500">점수화 가능한 숫자 스펙이 없습니다.</p>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div>
          <h4 className="font-bold text-slate-800 mb-3">자동 순위</h4>
          <div className="space-y-3">
            {ranked.map((score, idx) => {
              const product = productById[score.productId];
              if (!product) return null;
              const isTop = idx === 0;
              const isBestValue = bestValue?.productId === score.productId;
              return (
                <div
                  key={score.productId}
                  className={`rounded-lg border p-3 ${isTop ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg w-7 text-center flex-shrink-0">{medal(idx)}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate" title={`${product.brand} ${product.model}`}>
                          {product.brand} {product.model}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isTop && <span className="text-[10px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded">추천</span>}
                          {isBestValue && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">가성비</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-indigo-700 text-lg flex-shrink-0">{score.total.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isTop ? 'bg-indigo-600' : 'bg-slate-400'}`}
                      style={{ width: `${Math.max(0, Math.min(100, score.total))}%` }}
                    />
                  </div>
                  {score.valueScore !== null && priceSpecId && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      가성비 지수 {score.valueScore.toFixed(2)} · 가격 {product.specs[priceSpecId] || '-'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DecisionPanel;
