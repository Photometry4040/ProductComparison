import React from 'react';
import { Product, Spec } from '../types';
import { rankCell, BestWorst } from '../utils/specValue';

interface ProductCardViewProps {
  products: Product[];
  specs: Spec[];
  selectedProductIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  bestWorstMap: Record<string, BestWorst>;
}

/**
 * Stacked card layout for narrow screens — avoids the cramped horizontal-scroll
 * table. Each product is a card with its specs as label/value rows, keeping the
 * 🏆 winner-highlight from the desktop views.
 */
const ProductCardView: React.FC<ProductCardViewProps> = ({
  products, specs, selectedProductIds, onToggleSelect, onEdit, bestWorstMap,
}) => {
  if (products.length === 0) {
    return <p className="text-center text-slate-500 py-10">표시할 제품이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {products.map(product => {
        const isSelected = selectedProductIds.has(product.id);
        const name = `${product.brand} ${product.model}`;
        return (
          <div key={product.id} className="bg-white rounded-xl shadow ring-1 ring-slate-900/5 overflow-hidden">
            <div className={`flex items-center gap-3 p-3 border-b border-slate-200 ${isSelected ? 'bg-indigo-50' : ''}`}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(product.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                aria-label={`Select ${name}`}
              />
              <img src={product.imageUrl} alt={name} className="w-16 h-12 object-cover rounded-md bg-slate-100 flex-shrink-0" />
              <div className="min-w-0 flex-grow">
                <p className="font-bold text-slate-800 truncate" title={name}>{name}</p>
                {product.category && <p className="text-xs text-slate-400 truncate">{product.category}</p>}
              </div>
              <button onClick={() => onEdit(product)} className="text-sm text-slate-500 hover:text-indigo-600 flex-shrink-0">Edit</button>
            </div>
            <dl className="divide-y divide-slate-100">
              {specs.map(spec => {
                const rank = rankCell(spec.id, product.specs[spec.id], bestWorstMap);
                return (
                  <div key={spec.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <dt className="text-slate-500 flex-shrink-0">{spec.name}</dt>
                    <dd className={`text-right ${rank === 'best' ? 'text-green-700 font-semibold' : rank === 'worst' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                      {rank === 'best' && <span className="mr-1">🏆</span>}
                      {product.specs[spec.id] || '-'}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
};

export default ProductCardView;
