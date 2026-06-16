import React, { useState, useCallback, useMemo, useRef, useEffect, memo, lazy, Suspense } from 'react';
import { Product, Spec } from './types';
import { PencilIcon, TrashIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, XMarkIcon, CheckIcon, ArrowUpTrayIcon, Bars2Icon, ChartBarIcon, SaveIcon, ArrowsRightLeftIcon } from './components/icons';
import SpecFormModal from './components/SpecFormModal';
import ProductFormModal from './components/ProductFormModal';
import DataImportModal from './components/DataImportModal';
import ConfirmationModal from './components/ConfirmationModal';
import DecisionPanel from './components/DecisionPanel';
import ProductCardView from './components/ProductCardView';
// recharts is heavy; load the chart modals (and recharts) only when opened.
const ChartModal = lazy(() => import('./components/ChartModal'));
const RadarChartModal = lazy(() => import('./components/RadarChartModal'));
import { SEED_SPECS, SEED_PRODUCTS } from './data/mockData';
import { computeBestWorstMap, rankCell, withInferredMeta, isScorableSpec } from './utils/specValue';
// FIX: Suppress TS error for react-window import, likely due to missing `@types/react-window`.
// @ts-ignore
import { FixedSizeList as List } from 'react-window';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const initialSpecs: Spec[] = SEED_SPECS;
const initialProducts: Product[] = SEED_PRODUCTS;

const ALL_CATEGORIES = 'All Categories';

/** Tailwind classes for a winner / loser cell. */
const rankCellClass = (rank: 'best' | 'worst' | 'none'): string =>
  rank === 'best'
    ? 'bg-green-50 text-green-800 font-semibold'
    : rank === 'worst'
      ? 'bg-slate-50 text-slate-400'
      : '';


interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

type ViewMode = 'product-as-row' | 'product-as-column';

const getInitialSettings = () => {
    try {
        const savedSettings = localStorage.getItem('comparison-tool-settings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
    } catch (error) {
        console.error('Could not load settings from local storage', error);
    }
    // Default settings if nothing is saved or an error occurs
    return {
        selectedBrand: 'All Brands',
        selectedCategory: ALL_CATEGORIES,
        modelQuery: '',
        selectedSpecIds: [],
        sortConfig: { key: 'name', direction: 'ascending' },
        viewMode: 'product-as-row' as ViewMode,
        differenceOnly: false,
        weights: null as Record<string, number> | null,
    };
};

/** Build the default weight map from each spec's declared weight. */
const defaultWeightsFor = (specs: Spec[]): Record<string, number> => {
    const w: Record<string, number> = {};
    specs.forEach(s => { if (isScorableSpec(s)) w[s.id] = s.weight ?? 0; });
    return w;
};

const SortableHeader: React.FC<{ sortKey: string; children: React.ReactNode; className?: string; onClick: (key: string) => void; sortConfig: SortConfig | null }> = ({ sortKey, children, className, onClick, sortConfig }) => (
    <button onClick={() => onClick(sortKey)} className={`flex items-center gap-1 group w-full ${className}`}>
        <span className="truncate">{children}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {sortConfig?.key === sortKey ? (
                sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" /> : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />
            ) : (
               <ChevronUpIcon className="h-4 w-4 text-slate-400" />
            )}
        </div>
    </button>
);

const ProductAsRowView = memo((props: any) => {
    const { 
        sortedProducts, displayedSpecs, selectedProductIds, handleToggleProductSelection, 
        handleOpenProductModal, isProductReordering, handleProductDragStart, 
        handleProductDragEnd, handleProductDragOver, handleProductDragLeave, handleProductDrop,
        draggedProductId, dropTargetProductId, requestSort, sortConfig,
        isSpecReordering, handleSpecDragStart, handleSpecDragEnd, handleSpecDragOver,
        handleSpecDragLeave, handleSpecDrop, draggedSpecId, dropTargetId,
        isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec, bestWorstMap
    } = props;

    const ProductRow = memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
        const { products, displayedSpecs, selectedProductIds, handleToggleProductSelection, handleOpenProductModal, isProductReordering, handleProductDragStart, handleProductDragEnd, handleProductDrop, handleProductDragOver, handleProductDragLeave, draggedProductId, dropTargetProductId, bestWorstMap } = data;
        const product = products[index];
        const isSelected = selectedProductIds.has(product.id);
        const productName = `${product.brand} ${product.model}`;

        return (
            <div 
              style={style}
              className={`
                ${draggedProductId === product.id ? 'opacity-40' : ''}
                ${dropTargetProductId === product.id ? 'border-t-2 border-indigo-500' : ''}
              `}
            >
                <div
                    className={`flex items-stretch border-b border-slate-200 h-full transition-colors duration-200 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}
                    draggable={isProductReordering}
                    onDragStart={isProductReordering ? (e) => handleProductDragStart(e, product) : undefined}
                    onDragEnd={isProductReordering ? handleProductDragEnd : undefined}
                    onDragOver={isProductReordering ? (e) => handleProductDragOver(e, product) : undefined}
                    onDragLeave={isProductReordering ? handleProductDragLeave : undefined}
                    onDrop={isProductReordering ? (e) => handleProductDrop(e, product) : undefined}
                >
                    <div className="flex-shrink-0 w-64 p-2 flex items-center gap-3 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                            {isProductReordering ? (
                              <Bars2Icon className="h-5 w-5 text-slate-400 cursor-grab" aria-hidden="true" />
                            ) : (
                              <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleProductSelection(product.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  aria-label={`Select ${productName}`}
                              />
                            )}
                        </div>
                        <img src={product.imageUrl} alt={productName} className="w-20 h-16 object-cover rounded-md bg-slate-100 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-slate-800 truncate" title={productName}>{productName}</p>
                            <button
                                onClick={() => handleOpenProductModal(product)}
                                className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    </div>

                    {displayedSpecs.map(spec => {
                        const rank = rankCell(spec.id, product.specs[spec.id], bestWorstMap || {});
                        return (
                        <div key={spec.id} className={`flex-shrink-0 w-48 p-3 flex items-center border-r border-slate-200 text-sm text-slate-600 ${rankCellClass(rank)}`}>
                           <span className="truncate">{rank === 'best' && <span className="mr-1">🏆</span>}{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                        </div>
                        );
                    })}
                </div>
            </div>
        );
    });

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg ring-1 ring-slate-900/5">
            <div className="min-w-max">
                <div className="flex sticky top-0 bg-slate-100/75 backdrop-blur-sm z-10 border-b-2 border-slate-300">
                    <div className="flex-shrink-0 w-64 p-3 flex items-center border-r border-slate-200 font-bold text-slate-800">
                       <SortableHeader sortKey="name" onClick={requestSort} sortConfig={sortConfig} className="text-sm">Product ({sortedProducts.length})</SortableHeader>
                    </div>
                    {displayedSpecs.map(spec => (
                         <div 
                            key={spec.id}
                            draggable={isSpecReordering}
                            onDragStart={isSpecReordering ? (e) => handleSpecDragStart(e, spec) : undefined}
                            onDragEnd={isSpecReordering ? handleSpecDragEnd : undefined}
                            onDragOver={isSpecReordering ? (e) => handleSpecDragOver(e, spec) : undefined}
                            onDragLeave={isSpecReordering ? handleSpecDragLeave : undefined}
                            onDrop={isSpecReordering ? (e) => handleSpecDrop(e, spec) : undefined}
                            className={`flex-shrink-0 w-48 p-3 flex items-center justify-between border-r border-slate-200 group
                               ${isSpecReordering ? 'cursor-grab active:cursor-grabbing' : ''}
                               ${draggedSpecId === spec.id ? 'opacity-40' : ''}
                               ${dropTargetId === spec.id ? 'border-l-2 border-l-indigo-500' : ''}
                            `}>
                             <div className="flex items-center gap-2 flex-grow min-w-0">
                               {isSpecReordering && <Bars2Icon className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                               <SortableHeader sortKey={spec.id} onClick={requestSort} sortConfig={sortConfig} className="font-bold text-slate-800 text-sm">{spec.name}</SortableHeader>
                             </div>
                            {!isSpecReordering && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isSpecChartable(spec.id, products) && (
                                     <button onClick={() => handleOpenChartModal(spec)} className="text-slate-400 hover:text-indigo-600" title="Visualize data">
                                       <ChartBarIcon className="h-4 w-4" />
                                     </button>
                                  )}
                                  <button onClick={() => handleOpenSpecModal(spec)} className="text-slate-400 hover:text-indigo-600" title="Edit spec"><PencilIcon className="h-4 w-4" /></button>
                                  <button onClick={() => handleDeleteSpec(spec.id)} className="text-slate-400 hover:text-red-600" title="Delete spec"><TrashIcon className="h-4 w-4" /></button>
                                </div>
                             )}
                        </div>
                    ))}
                </div>
                <List
                    height={600}
                    itemCount={sortedProducts.length}
                    itemSize={80}
                    width="100%"
                    itemData={{
                        products: sortedProducts, displayedSpecs, selectedProductIds, handleToggleProductSelection,
                        handleOpenProductModal, isProductReordering, handleProductDragStart, handleProductDragEnd,
                        handleProductDrop, handleProductDragOver, handleProductDragLeave, draggedProductId,
                        dropTargetProductId, bestWorstMap
                    }}
                >
                    {ProductRow}
                </List>
            </div>
        </div>
    );
});

const ProductAsColumnView = memo((props: any) => {
    const { 
        sortedProducts, displayedSpecs, selectedProductIds, handleToggleProductSelection, 
        handleOpenProductModal, isProductReordering, handleProductDragStart, 
        handleProductDragEnd, handleProductDragOver, handleProductDragLeave, handleProductDrop,
        draggedProductId, dropTargetProductId, requestSort, sortConfig,
        isSpecReordering, handleSpecDragStart, handleSpecDragEnd, handleSpecDragOver,
        handleSpecDragLeave, handleSpecDrop, draggedSpecId, dropTargetId,
        isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec, bestWorstMap
    } = props;

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg ring-1 ring-slate-900/5">
            <div className="flex min-w-max">
                {/* Specs Header Column */}
                <div className="flex-shrink-0 sticky left-0 bg-slate-100/75 backdrop-blur-sm z-10 border-r-2 border-slate-300">
                    <div className="h-48 p-3 flex items-end border-b border-slate-200">
                        <SortableHeader sortKey="name" onClick={requestSort} sortConfig={sortConfig} className="font-bold text-slate-800 text-sm">
                            Product ({sortedProducts.length})
                        </SortableHeader>
                    </div>
                    {displayedSpecs.map(spec => (
                        <div
                            key={spec.id}
                            draggable={isSpecReordering}
                            onDragStart={isSpecReordering ? (e) => handleSpecDragStart(e, spec) : undefined}
                            onDragEnd={isSpecReordering ? handleSpecDragEnd : undefined}
                            onDragOver={isSpecReordering ? (e) => handleSpecDragOver(e, spec) : undefined}
                            onDragLeave={isSpecReordering ? handleSpecDragLeave : undefined}
                            onDrop={isSpecReordering ? (e) => handleSpecDrop(e, spec) : undefined}
                            className={`h-12 w-64 p-3 flex items-center justify-between border-b border-slate-200 group
                                ${isSpecReordering ? 'cursor-grab active:cursor-grabbing' : ''}
                                ${draggedSpecId === spec.id ? 'opacity-40' : ''}
                                ${dropTargetId === spec.id ? 'border-t-2 border-t-indigo-500' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                                {isSpecReordering && <Bars2Icon className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                                <SortableHeader sortKey={spec.id} onClick={requestSort} sortConfig={sortConfig} className="font-bold text-slate-800 text-sm">{spec.name}</SortableHeader>
                            </div>
                            {!isSpecReordering && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isSpecChartable(spec.id, products) && (
                                        <button onClick={() => handleOpenChartModal(spec)} className="text-slate-400 hover:text-indigo-600" title="Visualize data"><ChartBarIcon className="h-4 w-4" /></button>
                                    )}
                                    <button onClick={() => handleOpenSpecModal(spec)} className="text-slate-400 hover:text-indigo-600" title="Edit spec"><PencilIcon className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteSpec(spec.id)} className="text-slate-400 hover:text-red-600" title="Delete spec"><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Products Columns */}
                {sortedProducts.map(product => {
                    const isSelected = selectedProductIds.has(product.id);
                    const productName = `${product.brand} ${product.model}`;
                    return (
                        <div
                            key={product.id}
                            draggable={isProductReordering}
                            onDragStart={isProductReordering ? (e) => handleProductDragStart(e, product) : undefined}
                            onDragEnd={isProductReordering ? handleProductDragEnd : undefined}
                            onDragOver={isProductReordering ? (e) => handleProductDragOver(e, product) : undefined}
                            onDragLeave={isProductReordering ? handleProductDragLeave : undefined}
                            onDrop={isProductReordering ? (e) => handleProductDrop(e, product) : undefined}
                            className={`flex-shrink-0 w-56 border-r border-slate-200 transition-colors duration-200 
                                ${isSelected ? 'bg-indigo-50' : 'bg-white'}
                                ${isProductReordering ? 'cursor-grab active:cursor-grabbing' : ''}
                                ${draggedProductId === product.id ? 'opacity-40' : ''}
                                ${dropTargetProductId === product.id ? 'border-l-2 border-l-indigo-500' : ''}
                            `}
                        >
                            <div className="h-48 p-2 flex flex-col items-center justify-between gap-2 border-b border-slate-200 sticky top-0 bg-inherit z-10">
                                <div className="flex items-center w-full gap-2">
                                     {isProductReordering ? (
                                      <Bars2Icon className="h-5 w-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
                                    ) : (
                                      <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleProductSelection(product.id)}
                                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                          aria-label={`Select ${productName}`}
                                      />
                                    )}
                                    <p className="font-bold text-slate-800 truncate flex-grow min-w-0" title={productName}>{productName}</p>
                                </div>
                                <img src={product.imageUrl} alt={productName} className="w-full h-24 object-cover rounded-md bg-slate-100" />
                                <button onClick={() => handleOpenProductModal(product)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors w-full text-center">
                                    Edit
                                </button>
                            </div>
                            {displayedSpecs.map(spec => {
                                const rank = rankCell(spec.id, product.specs[spec.id], bestWorstMap || {});
                                return (
                                <div key={spec.id} className={`h-12 p-3 flex items-center border-b border-slate-200 text-sm text-slate-600 ${rankCellClass(rank)}`}>
                                    <span className="truncate">{rank === 'best' && <span className="mr-1">🏆</span>}{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});


const App: React.FC = () => {
  const [specs, setSpecs] = useState<Spec[]>(() => {
    try {
      const savedSpecs = localStorage.getItem('comparison-tool-specs');
      // withInferredMeta backfills comparison metadata onto legacy/imported specs.
      return withInferredMeta(savedSpecs ? JSON.parse(savedSpecs) : initialSpecs);
    } catch (error) {
      console.error('Could not load specs from local storage', error);
      return initialSpecs;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('comparison-tool-products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (parsed.length > 0 && parsed[0].name && !parsed[0].brand) {
          return parsed.map((p: any) => {
            const nameParts = p.name.split(' ');
            const brand = nameParts[0] || '';
            const model = nameParts.slice(1).join(' ') || '';
            const { name, ...rest } = p;
            return { ...rest, brand, model };
          });
        }
        return parsed;
      }
      return initialProducts;
    } catch (error) {
      console.error('Could not load products from local storage', error);
      return initialProducts;
    }
  });

  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [initialSettings] = useState(getInitialSettings);
  const [selectedBrand, setSelectedBrand] = useState(initialSettings.selectedBrand);
  const [modelQuery, setModelQuery] = useState(initialSettings.modelQuery);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [isModelFilterOpen, setIsModelFilterOpen] = useState(false);
  const brandFilterRef = useRef<HTMLDivElement>(null);
  const modelFilterRef = useRef<HTMLDivElement>(null);

  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>(initialSettings.selectedSpecIds);
  const [isSpecFilterOpen, setIsSpecFilterOpen] = useState(false);
  const specFilterRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSettings.sortConfig);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Reordering Mode State
  const [isSpecReordering, setIsSpecReordering] = useState(false);
  const [isProductReordering, setIsProductReordering] = useState(false);

  // Drag and drop state for specs
  const [draggedSpecId, setDraggedSpecId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Drag and drop state for products
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dropTargetProductId, setDropTargetProductId] = useState<string | null>(null);

  // Charting state
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartingSpec, setChartingSpec] = useState<Spec | null>(null);

  // Save settings confirmation state
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const [viewMode, setViewMode] = useState<ViewMode>(initialSettings.viewMode);

  // Category filter (AV/display domain)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSettings.selectedCategory || ALL_CATEGORIES);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);

  // "차이만 보기" — hide specs where every visible product shares the same value
  const [differenceOnly, setDifferenceOnly] = useState<boolean>(!!initialSettings.differenceOnly);

  // Decision matrix weights + panels
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const defaults = defaultWeightsFor(specs);
    return initialSettings.weights ? { ...defaults, ...initialSettings.weights } : defaults;
  });
  const [isDecisionPanelOpen, setIsDecisionPanelOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);


  useEffect(() => {
    try {
      localStorage.setItem('comparison-tool-specs', JSON.stringify(specs));
    } catch (error) {
      console.error('Could not save specs to local storage', error);
    }
  }, [specs]);

  useEffect(() => {
    try {
      localStorage.setItem('comparison-tool-products', JSON.stringify(products));
    } catch (error) {
      console.error('Could not save products to local storage', error);
    }
  }, [products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (specFilterRef.current && !specFilterRef.current.contains(event.target as Node)) {
            setIsSpecFilterOpen(false);
        }
        if (brandFilterRef.current && !brandFilterRef.current.contains(event.target as Node)) {
            setIsBrandFilterOpen(false);
        }
        if (modelFilterRef.current && !modelFilterRef.current.contains(event.target as Node)) {
            setIsModelFilterOpen(false);
        }
        if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
            setIsCategoryFilterOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
    
  useEffect(() => {
    setSelectedModels([]);
  }, [selectedBrand]);

  useEffect(() => {
    // Changing category invalidates any brand/model selection.
    setSelectedBrand('All Brands');
    setModelQuery('');
  }, [selectedCategory]);

  const handleOpenSpecModal = (spec: Spec | null = null) => {
    setEditingSpec(spec);
    setIsSpecModalOpen(true);
  };

  const handleOpenProductModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseModals = useCallback(() => {
    setIsSpecModalOpen(false);
    setIsProductModalOpen(false);
    setIsImportModalOpen(false);
    setIsChartModalOpen(false);
    setEditingSpec(null);
    setEditingProduct(null);
    setChartingSpec(null);
  }, []);

  const handleSaveSpec = (specData: { id?: string; name: string }) => {
    if (specData.id) {
      setSpecs(prev => prev.map(s => s.id === specData.id ? { ...s, name: specData.name } : s));
    } else {
      const newSpec = withInferredMeta([{ id: uuidv4(), name: specData.name }])[0];
      setSpecs(prev => [...prev, newSpec]);
      setProducts(prev => prev.map(p => ({ ...p, specs: { ...p.specs, [newSpec.id]: '' } })));
      if (isScorableSpec(newSpec)) {
        setWeights(prev => ({ ...prev, [newSpec.id]: newSpec.weight ?? 0 }));
      }
    }
    handleCloseModals();
  };
  
  const handleCloseConfirmation = () => {
    setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
  };

  const handleDeleteSpec = (specId: string) => {
    setConfirmation({
        isOpen: true,
        message: 'Are you sure you want to delete this specification? This will remove it from all products.',
        onConfirm: () => {
            setSpecs(prev => prev.filter(s => s.id !== specId));
            setProducts(prev => prev.map(p => {
                const newSpecs = { ...p.specs };
                delete newSpecs[specId];
                return { ...p, specs: newSpecs };
            }));
            setSelectedSpecIds(prev => prev.filter(id => id !== specId));
            handleCloseConfirmation();
        }
    });
  };

  const handleSaveProduct = (productData: Product) => {
    if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else {
        const newProduct = { ...productData, id: uuidv4() };
        setProducts(prev => [...prev, newProduct]);
    }
    handleCloseModals();
  };


  const handleDeleteProduct = (productId: string) => {
    setConfirmation({
        isOpen: true,
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        onConfirm: () => {
            setProducts(prev => prev.filter(p => p.id !== productId));
            setSelectedProductIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
            handleCloseModals();
            handleCloseConfirmation();
        }
    });
  };

  const handleOpenChartModal = (spec: Spec) => {
    setChartingSpec(spec);
    setIsChartModalOpen(true);
  };

  const parseSpecValueForCharting = (value: string | undefined): number | null => {
    if (typeof value !== 'string') return null;
    const cleanedValue = value.replace(/[$,]/g, '').trim();
    const numericPart = cleanedValue.match(/^-?\d*\.?\d+/);
    if (numericPart) {
        return parseFloat(numericPart[0]);
    }
    return null;
  };

  const isSpecChartable = useCallback((specId: string, productList: Product[]): boolean => {
    let numericCount = 0;
    for (const product of productList) {
        if (parseSpecValueForCharting(product.specs[specId]) !== null) {
            numericCount++;
        }
        if (numericCount >= 2) return true;
    }
    return false;
  }, []);

  const handleToggleProductSelection = useCallback((productId: string) => {
      setSelectedProductIds(prevSelectedIds => {
          const newSelectedIds = new Set(prevSelectedIds);
          if (newSelectedIds.has(productId)) {
              newSelectedIds.delete(productId);
          } else {
              newSelectedIds.add(productId);
          }
          return newSelectedIds;
      });
  }, []);
  
  const handleSpecSelection = useCallback((specId: string) => {
    setSelectedSpecIds(prev => {
        if (prev.includes(specId)) {
            return prev.filter(id => id !== specId);
        } else {
            return [...prev, specId];
        }
    });
  }, []);
  
  const handleModelSelection = useCallback((model: string) => {
    setSelectedModels(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(model)) {
            newSelected.delete(model);
        } else {
            newSelected.add(model);
        }
        return Array.from(newSelected);
    });
  }, []);

  const handleImportData = useCallback((importedProducts: any[]) => {
      try {
          if (!Array.isArray(importedProducts) || !importedProducts.every(p => p.brand && p.model && typeof p.specs === 'object')) {
              throw new Error('Invalid data structure. Each product must have "brand", "model", and "specs" properties.');
          }

          const specNameSet = new Set<string>();
          importedProducts.forEach(product => {
              Object.keys(product.specs).forEach(specName => {
                  specNameSet.add(specName);
              });
          });

          const newSpecs = withInferredMeta(Array.from(specNameSet).map(name => ({
              id: uuidv4(),
              name,
          })));

          const specNameToIdMap = new Map(newSpecs.map(s => [s.name, s.id]));

          const newProducts = importedProducts.map(product => {
              const newProductSpecs: { [key: string]: string } = {};
              for (const specName in product.specs) {
                  const specId = specNameToIdMap.get(specName);
                  if (specId) {
                      newProductSpecs[specId] = product.specs[specName];
                  }
              }
              return {
                  id: uuidv4(),
                  brand: product.brand,
                  model: product.model,
                  imageUrl: product.imageUrl || `https://picsum.photos/seed/imported${Math.random()}/400/300`,
                  specs: newProductSpecs,
              };
          });

          setSpecs(newSpecs);
          setProducts(newProducts);
          setWeights(defaultWeightsFor(newSpecs));
          setSelectedProductIds(new Set());
          setSelectedSpecIds([]);
          setModelQuery('');
          setSelectedBrand('All Brands');
          setSelectedCategory(ALL_CATEGORIES);
          handleCloseModals();
          alert('Data imported successfully!');

      } catch (error) {
          console.error("Import failed:", error);
          alert(`Failed to import data. Please check the file format. Error: ${error instanceof Error ? error.message : String(error)}`);
      }
  }, [handleCloseModals]);

  const handleSaveSettings = useCallback(() => {
    try {
        const settingsToSave = {
            selectedBrand,
            selectedCategory,
            modelQuery,
            selectedSpecIds,
            sortConfig,
            viewMode,
            differenceOnly,
            weights,
        };
        localStorage.setItem('comparison-tool-settings', JSON.stringify(settingsToSave));

        setShowSaveConfirmation(true);
        setTimeout(() => {
            setShowSaveConfirmation(false);
        }, 3000);
    } catch (error) {
        console.error('Could not save settings to local storage', error);
        alert('Failed to save settings.');
    }
  }, [selectedBrand, selectedCategory, modelQuery, selectedSpecIds, sortConfig, viewMode, differenceOnly, weights]);

  const handleResetWeights = useCallback(() => {
    setWeights(defaultWeightsFor(specs));
  }, [specs]);

  const handleLoadSampleData = useCallback(() => {
    setConfirmation({
        isOpen: true,
        message: 'AV/디스플레이 샘플 데이터(30종)를 불러옵니다. 현재 데이터는 대체됩니다. 계속할까요?',
        onConfirm: () => {
            const seedSpecs = withInferredMeta(SEED_SPECS);
            setSpecs(seedSpecs);
            setProducts(SEED_PRODUCTS);
            setWeights(defaultWeightsFor(seedSpecs));
            setSelectedProductIds(new Set());
            setSelectedSpecIds([]);
            setSelectedModels([]);
            setModelQuery('');
            setSelectedBrand('All Brands');
            setSelectedCategory(ALL_CATEGORIES);
            handleCloseConfirmation();
        },
    });
  }, []);

  const requestSort = useCallback((key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);
  
  const alphabeticallySortedSpecs = useMemo(() => {
    return [...specs].sort((a, b) => a.name.localeCompare(b.name));
  }, [specs]);

  const displayedSpecs = useMemo(() => {
    if (selectedSpecIds.length > 0) {
        const selectedSet = new Set(selectedSpecIds);
        return specs.filter(spec => selectedSet.has(spec.id));
    }
    return specs;
  }, [specs, selectedSpecIds]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return [ALL_CATEGORIES, ...Array.from(cats).sort()];
  }, [products]);

  // Products narrowed by the selected category (the basis for brand/model filters).
  const categoryProducts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(categoryProducts.map(p => p.brand));
    return ['All Brands', ...Array.from(brands).sort()];
  }, [categoryProducts]);
  
  const modelsForSelectedBrand = useMemo(() => {
    if (selectedBrand === 'All Brands') {
        return [];
    }
    const brandModels = categoryProducts
        .filter(p => p.brand === selectedBrand)
        .map(p => p.model);
    return [...new Set(brandModels)].sort();
  }, [categoryProducts, selectedBrand]);

  const filteredProducts = useMemo(() => {
    let tempProducts = [...categoryProducts];

    if (selectedBrand !== 'All Brands') {
        tempProducts = tempProducts.filter(p => p.brand === selectedBrand);
        if (selectedModels.length > 0) {
            tempProducts = tempProducts.filter(p => selectedModels.includes(p.model));
        }
    } else {
        const query = modelQuery.toLowerCase().trim();
        if (query) {
            tempProducts = tempProducts.filter(p => p.model.toLowerCase().includes(query));
        }
    }
    return tempProducts;
  }, [categoryProducts, selectedBrand, modelQuery, selectedModels]);

  const sortedProducts = useMemo(() => {
    let sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
        sortableProducts.sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'ascending' ? 1 : -1;

            const valA = key === 'name' ? `${a.brand} ${a.model}` : a.specs[key] || '';
            const valB = key === 'name' ? `${b.brand} ${b.model}` : b.specs[key] || '';

            if (!valA) return 1;
            if (!valB) return -1;
            
            const re = /[$,]/g;
            const numA = parseFloat(String(valA).replace(re, ''));
            const numB = parseFloat(String(valB).replace(re, ''));

            if (!isNaN(numA) && !isNaN(numB)) {
                if (numA < numB) return -1 * dir;
                if (numA > numB) return 1 * dir;
                return 0;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            
            if (strA < strB) return -1 * dir;
            if (strA > strB) return 1 * dir;
            return 0;
        });
    }
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  const selectedProducts = useMemo(() => {
    // Maintain the order from the main products array for consistency
    const selectedIds = selectedProductIds;
    return products.filter(p => selectedIds.has(p.id));
  }, [products, selectedProductIds]);

  // Spec used for the price-performance (가성비) score.
  const priceSpecId = useMemo(() => {
    const street = specs.find(s => s.kind === 'currency' && s.betterDirection === 'lower' && /street\s*price|가격/i.test(s.name));
    if (street) return street.id;
    return specs.find(s => s.kind === 'currency')?.id;
  }, [specs]);

  // Score the selected products when 2+ are chosen, otherwise everything visible.
  const productsToScore = useMemo(
    () => (selectedProducts.length >= 2 ? selectedProducts : sortedProducts),
    [selectedProducts, sortedProducts],
  );

  // "차이만 보기": drop specs whose value is identical across all visible products.
  const finalDisplayedSpecs = useMemo(() => {
    if (!differenceOnly) return displayedSpecs;
    return displayedSpecs.filter(spec => {
      const values = sortedProducts.map(p => (p.specs[spec.id] ?? '').trim());
      const nonEmpty = values.filter(v => v !== '');
      if (nonEmpty.length <= 1) return true; // not enough data to call it "same"
      return new Set(values).size > 1;
    });
  }, [differenceOnly, displayedSpecs, sortedProducts]);

  // Best/worst value per scorable spec, for winner-highlight in each context.
  const bestWorstMap = useMemo(
    () => computeBestWorstMap(sortedProducts, finalDisplayedSpecs),
    [sortedProducts, finalDisplayedSpecs],
  );
  const comparisonBestWorst = useMemo(
    () => computeBestWorstMap(selectedProducts, finalDisplayedSpecs),
    [selectedProducts, finalDisplayedSpecs],
  );

  // Spec Drag & Drop Handlers
  const handleSpecDragStart = (e: React.DragEvent<HTMLDivElement>, spec: Spec) => {
    setDraggedSpecId(spec.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSpecDragOver = (e: React.DragEvent<HTMLDivElement>, spec: Spec) => {
    e.preventDefault();
    if (spec.id !== draggedSpecId) {
        setDropTargetId(spec.id);
    }
  };

  const handleSpecDragLeave = () => {
    setDropTargetId(null);
  };
    
  const handleSpecDrop = (e: React.DragEvent<HTMLDivElement>, dropSpec: Spec) => {
    e.preventDefault();
    if (!draggedSpecId) return;

    const draggedIndex = specs.findIndex(s => s.id === draggedSpecId);
    const dropIndex = specs.findIndex(s => s.id === dropSpec.id);

    if (draggedIndex === -1 || dropIndex === -1 || draggedIndex === dropIndex) return;

    const newSpecs = [...specs];
    const [removed] = newSpecs.splice(draggedIndex, 1);
    newSpecs.splice(dropIndex, 0, removed);

    setSpecs(newSpecs);
    setDraggedSpecId(null);
    setDropTargetId(null);
  };

  const handleSpecDragEnd = () => {
    setDraggedSpecId(null);
    setDropTargetId(null);
  };
    
  // Product Drag & Drop Handlers
  const handleProductDragStart = (e: React.DragEvent<HTMLDivElement>, product: Product) => {
    setDraggedProductId(product.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProductDragOver = (e: React.DragEvent<HTMLDivElement>, product: Product) => {
    e.preventDefault();
    if (product.id !== draggedProductId) {
      setDropTargetProductId(product.id);
    }
  };

  const handleProductDragLeave = () => {
    setDropTargetProductId(null);
  };

  const handleProductDrop = (e: React.DragEvent<HTMLDivElement>, dropProduct: Product) => {
    e.preventDefault();
    if (!draggedProductId) return;
    
    // Use the main products array for reordering
    const originalProducts = [...products];
    const draggedIndex = originalProducts.findIndex(p => p.id === draggedProductId);
    const dropIndex = originalProducts.findIndex(p => p.id === dropProduct.id);

    if (draggedIndex === -1 || dropIndex === -1 || draggedIndex === dropIndex) {
      setDraggedProductId(null);
      setDropTargetProductId(null);
      return;
    }

    const [removed] = originalProducts.splice(draggedIndex, 1);
    originalProducts.splice(dropIndex, 0, removed);

    setProducts(originalProducts);
    setDraggedProductId(null);
    setDropTargetProductId(null);
  };

  const handleProductDragEnd = () => {
    setDraggedProductId(null);
    setDropTargetProductId(null);
  };

  const viewProps = {
    sortedProducts, displayedSpecs: finalDisplayedSpecs, selectedProductIds, handleToggleProductSelection,
    handleOpenProductModal, isProductReordering, handleProductDragStart,
    handleProductDragEnd, handleProductDragOver, handleProductDragLeave, handleProductDrop,
    draggedProductId, dropTargetProductId, requestSort, sortConfig,
    isSpecReordering, handleSpecDragStart, handleSpecDragEnd, handleSpecDragOver,
    handleSpecDragLeave, handleSpecDrop, draggedSpecId, dropTargetId,
    isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec,
    bestWorstMap
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12">
      <header className="mb-10 no-print">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white font-extrabold text-2xl shadow-sm">A</div>
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AV Compare <span className="text-indigo-600">Pro</span></h1>
                <p className="text-base text-slate-500">경쟁 제품을 빠르게 비교하고 의사결정을 내리는 도구</p>
            </div>
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div ref={categoryFilterRef} className="relative">
                <button
                    onClick={() => setIsCategoryFilterOpen(prev => !prev)}
                    className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex justify-between items-center text-left"
                    aria-haspopup="true"
                    aria-expanded={isCategoryFilterOpen}
                >
                    <span className="truncate">{selectedCategory === ALL_CATEGORIES ? '전체 카테고리' : selectedCategory}</span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isCategoryFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCategoryFilterOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="max-h-60 overflow-y-auto p-1">
                            {uniqueCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setSelectedCategory(cat); setIsCategoryFilterOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                                >
                                    {cat === ALL_CATEGORIES ? '전체 카테고리' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div ref={brandFilterRef} className="relative">
                <button
                    onClick={() => setIsBrandFilterOpen(prev => !prev)}
                    className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex justify-between items-center text-left"
                    aria-haspopup="true"
                    aria-expanded={isBrandFilterOpen}
                >
                    <span className="truncate">{selectedBrand}</span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isBrandFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isBrandFilterOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="max-h-60 overflow-y-auto p-1">
                            {uniqueBrands.map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => {
                                        setSelectedBrand(brand);
                                        setIsBrandFilterOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {selectedBrand !== 'All Brands' ? (
                 <div ref={modelFilterRef} className="relative">
                    <button
                        onClick={() => setIsModelFilterOpen(prev => !prev)}
                        disabled={modelsForSelectedBrand.length === 0}
                        className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex justify-between items-center text-left disabled:bg-slate-100 disabled:cursor-not-allowed"
                        aria-haspopup="true"
                        aria-expanded={isModelFilterOpen}
                    >
                        <span className="truncate">
                            {modelsForSelectedBrand.length === 0 ? 'No models available' : (selectedModels.length > 0 ? `${selectedModels.length} model(s) selected` : 'Filter by model...')}
                        </span>
                        <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isModelFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isModelFilterOpen && modelsForSelectedBrand.length > 0 && (
                        <div className="absolute z-20 mt-2 w-full sm:w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="p-2">
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {modelsForSelectedBrand.map(model => (
                                        <label key={model} className="flex items-center space-x-3 py-2 px-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedModels.includes(model)}
                                                onChange={() => handleModelSelection(model)}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-600">{model}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedModels.length > 0 && (
                                     <div className="mt-2 p-2 border-t border-slate-100 flex justify-end">
                                        <button 
                                            onClick={() => { setSelectedModels([]); setIsModelFilterOpen(false); }} 
                                            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <input
                    type="text"
                    value={modelQuery}
                    onChange={(e) => setModelQuery(e.target.value)}
                    placeholder="Filter by model..."
                    className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    aria-label="Filter by model"
                />
            )}
            <div ref={specFilterRef} className="relative">
                <button
                    onClick={() => setIsSpecFilterOpen(prev => !prev)}
                    className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex justify-between items-center"
                    aria-haspopup="true"
                    aria-expanded={isSpecFilterOpen}
                >
                    <span className="truncate">
                        {selectedSpecIds.length > 0 ? `${selectedSpecIds.length} spec(s) selected` : 'Filter specifications...'}
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isSpecFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSpecFilterOpen && (
                    <div className="absolute z-20 mt-2 w-full sm:w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="p-2">
                            <div className="max-h-60 overflow-y-auto p-2">
                                {alphabeticallySortedSpecs.map(spec => (
                                    <label key={spec.id} className="flex items-center space-x-3 py-2 px-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSpecIds.includes(spec.id)}
                                            onChange={() => handleSpecSelection(spec.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-600">{spec.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 p-2 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => { setSelectedSpecIds([]); setIsSpecFilterOpen(false); }} 
                                    className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
         <div className="mt-6 flex flex-wrap gap-3 items-center border-t border-slate-200 pt-6">
              <button
                  onClick={() => setIsDecisionPanelOpen(true)}
                  className="flex items-center gap-2 text-sm bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors justify-center shadow-sm"
                  title="가중치 기반 자동 순위"
              >
                  🏆 의사결정 매트릭스
              </button>
              <button
                  onClick={() => setIsComparisonModalOpen(true)}
                  disabled={selectedProductIds.size < 2}
                  className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Compare selected products"
              >
                  선택 비교 ({selectedProductIds.size})
              </button>
              <button
                  onClick={() => setIsRadarModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors justify-center"
                  title="다축 레이더 비교"
              >
                  <ChartBarIcon className="h-5 w-5" /> 레이더 비교
              </button>
              <button
                  onClick={() => setDifferenceOnly(prev => !prev)}
                  className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors justify-center ${differenceOnly ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  title="모든 제품이 동일한 스펙 행을 숨깁니다"
              >
                  {differenceOnly ? '✓ ' : ''}차이만 보기
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <button onClick={() => handleOpenProductModal()} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors justify-center">
                  <PlusIcon className="h-5 w-5" />
                  Add Product
              </button>
              <button onClick={() => handleOpenSpecModal()} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors justify-center">
                  <PlusIcon className="h-5 w-5" />
                  Add Spec
              </button>
              {isSpecReordering ? (
                  <button onClick={() => setIsSpecReordering(false)} className="flex items-center gap-2 text-sm bg-green-50 text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-100 transition-colors justify-center">
                      <CheckIcon className="h-5 w-5" />
                      Done Reordering
                  </button>
              ) : (
                  <button onClick={() => setIsSpecReordering(true)} className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors justify-center">
                      <Bars2Icon className="h-5 w-5" />
                      Reorder Specs
                  </button>
              )}
               {isProductReordering ? (
                  <button onClick={() => setIsProductReordering(false)} className="flex items-center gap-2 text-sm bg-green-50 text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-100 transition-colors justify-center">
                      <CheckIcon className="h-5 w-5" />
                      Done Reordering
                  </button>
              ) : (
                  <button onClick={() => setIsProductReordering(true)} className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors justify-center">
                      <Bars2Icon className="h-5 w-5" />
                      Reorder Products
                  </button>
              )}
               <button onClick={() => setViewMode(prev => prev === 'product-as-row' ? 'product-as-column' : 'product-as-row')} className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors justify-center" title="Transpose View">
                  <ArrowsRightLeftIcon className="h-5 w-5" />
                  Transpose View
              </button>
               <div className="flex-grow"></div>
                <button
                    onClick={handleLoadSampleData}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
                    aria-label="Load sample data"
                    title="AV/디스플레이 샘플 데이터 30종 불러오기"
                >
                    샘플 데이터
                </button>
                 <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
                    aria-label="Import data"
                >
                    <ArrowUpTrayIcon className="h-5 w-5" /> Import
                </button>
                <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
                    aria-label="Save current settings"
                >
                    <SaveIcon className="h-5 w-5" /> Save
                </button>
        </div>
      </header>
      
      {/* Desktop: full comparison table. Mobile: stacked card view. */}
      <div className="hidden lg:block">
        {viewMode === 'product-as-row' ? (
          <ProductAsRowView {...viewProps} />
        ) : (
          <ProductAsColumnView {...viewProps} />
        )}
      </div>
      <div className="lg:hidden">
        <ProductCardView
          products={sortedProducts}
          specs={finalDisplayedSpecs}
          selectedProductIds={selectedProductIds}
          onToggleSelect={handleToggleProductSelection}
          onEdit={handleOpenProductModal}
          bestWorstMap={bestWorstMap}
        />
      </div>
      
      {isSpecModalOpen && (
        <SpecFormModal 
          isOpen={isSpecModalOpen}
          onClose={handleCloseModals}
          onSave={handleSaveSpec}
          spec={editingSpec}
        />
      )}
      
      {isProductModalOpen && (
        <ProductFormModal 
            isOpen={isProductModalOpen}
            onClose={handleCloseModals}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            product={editingProduct}
            specs={specs}
        />
      )}

       {isImportModalOpen && (
        <DataImportModal
            isOpen={isImportModalOpen}
            onClose={handleCloseModals}
            onImport={handleImportData}
            currentProducts={products}
            currentSpecs={specs}
        />
      )}

      <Suspense fallback={null}>
        {isChartModalOpen && (
          <ChartModal
            isOpen={isChartModalOpen}
            onClose={handleCloseModals}
            spec={chartingSpec}
            products={isComparisonModalOpen ? selectedProducts : products}
          />
        )}

        {isRadarModalOpen && (
          <RadarChartModal
            isOpen={isRadarModalOpen}
            onClose={() => setIsRadarModalOpen(false)}
            products={productsToScore}
            specs={specs}
          />
        )}
      </Suspense>

      {isDecisionPanelOpen && (
        <DecisionPanel
          isOpen={isDecisionPanelOpen}
          onClose={() => setIsDecisionPanelOpen(false)}
          products={productsToScore}
          specs={specs}
          weights={weights}
          onWeightsChange={setWeights}
          onResetWeights={handleResetWeights}
          priceSpecId={priceSpecId}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={confirmation.onConfirm}
        title="Confirm Deletion"
        message={confirmation.message}
      />

      {isComparisonModalOpen && (
         <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={() => setIsComparisonModalOpen(false)}
        >
             <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col transform transition-all" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0 no-print">
                    <h3 className="text-xl font-semibold text-slate-800">{selectedProducts.length}개 제품 비교</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                            title="비교 결과를 인쇄하거나 PDF로 저장"
                        >
                            🖨️ 인쇄 / PDF
                        </button>
                        <button
                            onClick={() => setIsComparisonModalOpen(false)}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
                            aria-label="Close comparison"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div id="print-area" className="overflow-auto flex-grow">
                    <h2 className="hidden print:block text-2xl font-bold text-slate-900 p-4">AV Compare Pro — 제품 비교</h2>
                     {viewMode === 'product-as-row' ? (
                         <div className="min-w-max">
                            {/* Header */}
                            <div className="flex sticky top-0 bg-slate-100/75 backdrop-blur-sm z-10 border-b-2 border-slate-300">
                                 <div className="flex-shrink-0 w-64 p-3 flex items-center border-r border-slate-200 font-bold text-slate-800 text-sm">Product</div>
                                  {finalDisplayedSpecs.map(spec => (
                                    <div key={spec.id} className="flex-shrink-0 w-48 p-3 flex items-center justify-between border-r border-slate-200 group font-bold text-slate-800 text-sm">
                                        <span className="truncate">{spec.name}</span>
                                         {isSpecChartable(spec.id, selectedProducts) && (
                                            <button 
                                                onClick={() => handleOpenChartModal(spec)}
                                                className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                title="Visualize data"
                                            >
                                                <ChartBarIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                  ))}
                            </div>
                            {/* Body */}
                            {selectedProducts.map(product => {
                                const productName = `${product.brand} ${product.model}`;
                                return (
                                    <div key={product.id} className="flex items-stretch border-b border-slate-200 bg-white hover:bg-slate-50">
                                        <div className="flex-shrink-0 w-64 p-2 flex items-center gap-3 border-r border-slate-200">
                                            <img src={product.imageUrl} alt={productName} className="w-20 h-16 object-cover rounded-md bg-slate-100 flex-shrink-0" />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-slate-800 truncate" title={productName}>{productName}</p>
                                            </div>
                                        </div>
                                        {finalDisplayedSpecs.map(spec => {
                                            const rank = rankCell(spec.id, product.specs[spec.id], comparisonBestWorst);
                                            return (
                                            <div key={spec.id} className={`flex-shrink-0 w-48 p-3 flex items-center border-r border-slate-200 text-sm text-slate-600 ${rankCellClass(rank)}`}>
                                                <span className="truncate">{rank === 'best' && <span className="mr-1">🏆</span>}{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                            </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                         </div>
                     ) : (
                        <div className="flex min-w-max">
                            {/* Specs Header Column */}
                            <div className="flex-shrink-0 sticky left-0 bg-slate-100/75 backdrop-blur-sm z-10 border-r-2 border-slate-300">
                                <div className="h-48 p-3 flex items-end border-b border-slate-200">
                                    <span className="font-bold text-slate-800 text-sm">Product</span>
                                </div>
                                {finalDisplayedSpecs.map(spec => (
                                    <div key={spec.id} className="h-12 w-64 p-3 flex items-center justify-between border-b border-slate-200 group">
                                        <span className="font-bold text-slate-800 text-sm truncate">{spec.name}</span>
                                        {isSpecChartable(spec.id, selectedProducts) && (
                                            <button onClick={() => handleOpenChartModal(spec)} className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Visualize data">
                                                <ChartBarIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Products Columns */}
                            {selectedProducts.map(product => {
                                const productName = `${product.brand} ${product.model}`;
                                return (
                                    <div key={product.id} className="flex-shrink-0 w-56 border-r border-slate-200 bg-white">
                                        <div className="h-48 p-2 flex flex-col items-center justify-center gap-2 border-b border-slate-200 sticky top-0 bg-inherit z-10">
                                            <p className="font-bold text-slate-800 truncate text-center" title={productName}>{productName}</p>
                                            <img src={product.imageUrl} alt={productName} className="w-full h-24 object-cover rounded-md bg-slate-100" />
                                        </div>
                                        {finalDisplayedSpecs.map(spec => {
                                            const rank = rankCell(spec.id, product.specs[spec.id], comparisonBestWorst);
                                            return (
                                            <div key={spec.id} className={`h-12 p-3 flex items-center border-b border-slate-200 text-sm text-slate-600 ${rankCellClass(rank)}`}>
                                                <span className="truncate">{rank === 'best' && <span className="mr-1">🏆</span>}{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                            </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                     )}
                </div>
            </div>
        </div>
      )}

      {showSaveConfirmation && (
        <div 
            className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-5 py-3 rounded-lg shadow-2xl transition-opacity duration-500"
        >
            <div className="flex items-center gap-3">
                <CheckIcon className="h-5 w-5 text-green-400" />
                <span className="font-semibold">Settings Saved!</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;