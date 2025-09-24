import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { Product, Spec } from './types';
import { PencilIcon, TrashIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, XMarkIcon, CheckIcon, ArrowUpTrayIcon, Bars2Icon, ChartBarIcon, SaveIcon, ArrowsRightLeftIcon } from './components/icons';
import SpecFormModal from './components/SpecFormModal';
import ProductFormModal from './components/ProductFormModal';
import DataImportModal from './components/DataImportModal';
import ChartModal from './components/ChartModal';
import ConfirmationModal from './components/ConfirmationModal';
// FIX: Suppress TS error for react-window import, likely due to missing `@types/react-window`.
// @ts-ignore
import { FixedSizeList as List } from 'react-window';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const specData = [
  { id: uuidv4(), name: 'Street Price (USD)' },
  { id: uuidv4(), name: 'MSRP (USD)' },
  { id: uuidv4(), name: 'Status' },
  { id: uuidv4(), name: 'Released' },
  { id: uuidv4(), name: 'Warranty' },
  { id: uuidv4(), name: 'Brightness' },
  { id: uuidv4(), name: 'Resolution' },
  { id: uuidv4(), name: 'Aspect Ratio' },
  { id: uuidv4(), name: 'Dynamic Contrast' },
  { id: uuidv4(), name: 'Display Type' },
];
const initialSpecs: Spec[] = specData;

const initialProducts: Product[] = [
  {
    id: uuidv4(),
    brand: 'BenQ',
    model: 'TK710',
    imageUrl: 'https://picsum.photos/seed/proj1/400/300',
    specs: {
      [specData[0].id]: '$2,999',
      [specData[1].id]: '$3,499',
      [specData[2].id]: 'Shipping',
      [specData[3].id]: 'May 2024',
      [specData[4].id]: '3 Years',
      [specData[5].id]: '3,200 ANSI Lumens',
      [specData[6].id]: '3840x2160',
      [specData[7].id]: '16:9 (4K UHD)',
      [specData[8].id]: '600,000:1',
      [specData[9].id]: 'DLP',
    },
  },
    {
    id: uuidv4(),
    brand: 'BenQ',
    model: 'HT4550i',
    imageUrl: 'https://picsum.photos/seed/proj4/400/300',
    specs: {
      [specData[0].id]: '$2,999',
      [specData[1].id]: '$2,999',
      [specData[2].id]: 'Shipping',
      [specData[3].id]: 'Apr 2023',
      [specData[4].id]: '3 Years',
      [specData[5].id]: '3,200 ANSI Lumens',
      [specData[6].id]: '3840x2160',
      [specData[7].id]: '16:9 (4K UHD)',
      [specData[8].id]: '2,000,000:1',
      [specData[9].id]: 'DLP',
    },
  },
  {
    id: uuidv4(),
    brand: 'Epson',
    model: 'Pro Cinema LS12000',
    imageUrl: 'https://picsum.photos/seed/proj2/400/300',
    specs: {
      [specData[0].id]: '$4,999',
      [specData[1].id]: '$4,999',
      [specData[2].id]: 'Shipping',
      [specData[3].id]: 'Dec 2021',
      [specData[4].id]: '3 Years',
      [specData[5].id]: '2,700 ANSI Lumens',
      [specData[6].id]: '3840x2160',
      [specData[7].id]: '16:9 (4K UHD)',
      [specData[8].id]: '2,500,000:1',
      [specData[9].id]: '3LCD',
    },
  },
  {
    id: uuidv4(),
    brand: 'Sony',
    model: 'VPL-XW5000ES',
    imageUrl: 'https://picsum.photos/seed/proj3/400/300',
    specs: {
      [specData[0].id]: '$5,999',
      [specData[1].id]: '$5,999',
      [specData[2].id]: 'Shipping',
      [specData[3].id]: 'May 2022',
      [specData[4].id]: '3 Years',
      [specData[5].id]: '2,000 ANSI Lumens',
      [specData[6].id]: '3840x2160',
      [specData[7].id]: '16:9 (4K UHD)',
      [specData[8].id]: 'Infinite',
      [specData[9].id]: 'SXRD',
    },
  },
];


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
        modelQuery: '',
        selectedSpecIds: [],
        sortConfig: { key: 'name', direction: 'ascending' },
        viewMode: 'product-as-row' as ViewMode,
    };
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
        isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec
    } = props;

    const ProductRow = memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
        const { products, displayedSpecs, selectedProductIds, handleToggleProductSelection, handleOpenProductModal, isProductReordering, handleProductDragStart, handleProductDragEnd, handleProductDrop, handleProductDragOver, handleProductDragLeave, draggedProductId, dropTargetProductId } = data;
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

                    {displayedSpecs.map(spec => (
                        <div key={spec.id} className="flex-shrink-0 w-48 p-3 flex items-center border-r border-slate-200 text-sm text-slate-600">
                           <span className="truncate"> {product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                        </div>
                    ))}
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
                        dropTargetProductId
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
        isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec
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
                            {displayedSpecs.map(spec => (
                                <div key={spec.id} className="h-12 p-3 flex items-center border-b border-slate-200 text-sm text-slate-600">
                                    <span className="truncate">{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                </div>
                            ))}
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
      return savedSpecs ? JSON.parse(savedSpecs) : initialSpecs;
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
    
  useEffect(() => {
    setSelectedModels([]);
  }, [selectedBrand]);

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
      const newSpec = { id: uuidv4(), name: specData.name };
      setSpecs(prev => [...prev, newSpec]);
      setProducts(prev => prev.map(p => ({ ...p, specs: { ...p.specs, [newSpec.id]: '' } })));
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

          const newSpecs = Array.from(specNameSet).map(name => ({
              id: uuidv4(),
              name,
          }));

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
          setSelectedProductIds(new Set());
          setSelectedSpecIds([]);
          setModelQuery('');
          setSelectedBrand('All Brands');
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
            modelQuery,
            selectedSpecIds,
            sortConfig,
            viewMode,
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
  }, [selectedBrand, modelQuery, selectedSpecIds, sortConfig, viewMode]);

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

  const uniqueBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand));
    return ['All Brands', ...Array.from(brands).sort()];
  }, [products]);
  
  const modelsForSelectedBrand = useMemo(() => {
    if (selectedBrand === 'All Brands') {
        return [];
    }
    const brandModels = products
        .filter(p => p.brand === selectedBrand)
        .map(p => p.model);
    return [...new Set(brandModels)].sort();
  }, [products, selectedBrand]);

  const filteredProducts = useMemo(() => {
    let tempProducts = [...products];

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
  }, [products, selectedBrand, modelQuery, selectedModels]);

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
    sortedProducts, displayedSpecs, selectedProductIds, handleToggleProductSelection,
    handleOpenProductModal, isProductReordering, handleProductDragStart,
    handleProductDragEnd, handleProductDragOver, handleProductDragLeave, handleProductDrop,
    draggedProductId, dropTargetProductId, requestSort, sortConfig,
    isSpecReordering, handleSpecDragStart, handleSpecDragEnd, handleSpecDragOver,
    handleSpecDragLeave, handleSpecDrop, draggedSpecId, dropTargetId,
    isSpecChartable, products, handleOpenChartModal, handleOpenSpecModal, handleDeleteSpec
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12">
      <header className="mb-10">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Product Comparison</h1>
        <p className="text-xl text-slate-500 mt-3">An elegant way to compare product specifications.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
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
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                 <button
                    onClick={() => setIsComparisonModalOpen(true)}
                    disabled={selectedProductIds.size < 2}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Compare selected products"
                >
                    Compare ({selectedProductIds.size})
                </button>
            </div>
        </div>
         <div className="mt-6 flex flex-wrap gap-3 items-center border-t border-slate-200 pt-6">
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
      
      {viewMode === 'product-as-row' ? (
        <ProductAsRowView {...viewProps} />
      ) : (
        <ProductAsColumnView {...viewProps} />
      )}
      
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

      {isChartModalOpen && (
        <ChartModal
          isOpen={isChartModalOpen}
          onClose={handleCloseModals}
          spec={chartingSpec}
          products={isComparisonModalOpen ? selectedProducts : products}
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
                <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-slate-800">Comparing {selectedProducts.length} Products</h3>
                    <button
                        onClick={() => setIsComparisonModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
                        aria-label="Close comparison"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="overflow-auto flex-grow">
                     {viewMode === 'product-as-row' ? (
                         <div className="min-w-max">
                            {/* Header */}
                            <div className="flex sticky top-0 bg-slate-100/75 backdrop-blur-sm z-10 border-b-2 border-slate-300">
                                 <div className="flex-shrink-0 w-64 p-3 flex items-center border-r border-slate-200 font-bold text-slate-800 text-sm">Product</div>
                                  {displayedSpecs.map(spec => (
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
                                        {displayedSpecs.map(spec => (
                                            <div key={spec.id} className="flex-shrink-0 w-48 p-3 flex items-center border-r border-slate-200 text-sm text-slate-600">
                                                <span className="truncate"> {product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                            </div>
                                        ))}
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
                                {displayedSpecs.map(spec => (
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
                                        {displayedSpecs.map(spec => (
                                            <div key={spec.id} className="h-12 p-3 flex items-center border-b border-slate-200 text-sm text-slate-600">
                                                <span className="truncate">{product.specs[spec.id] || <span className="text-slate-400">-</span>}</span>
                                            </div>
                                        ))}
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