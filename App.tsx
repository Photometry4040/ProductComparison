import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Product, Spec } from './types';
import { PencilIcon, TrashIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, XMarkIcon, CheckIcon, ArrowUpTrayIcon } from './components/icons';
import SpecFormModal from './components/SpecFormModal';
import ProductFormModal from './components/ProductFormModal';
import DataImportModal from './components/DataImportModal';

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
    name: 'BenQ TK710',
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
    name: 'Epson Pro Cinema LS12000',
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
    name: 'Sony VPL-XW5000ES',
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

const App: React.FC = () => {
  const [specs, setSpecs] = useState<Spec[]>(initialSpecs);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [modelQuery, setModelQuery] = useState('');
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const brandFilterRef = useRef<HTMLDivElement>(null);

  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>([]);
  const [isSpecFilterOpen, setIsSpecFilterOpen] = useState(false);
  const specFilterRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });
  const [specSortDirection, setSpecSortDirection] = useState<'ascending' | 'descending'>('ascending');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (specFilterRef.current && !specFilterRef.current.contains(event.target as Node)) {
            setIsSpecFilterOpen(false);
        }
        if (brandFilterRef.current && !brandFilterRef.current.contains(event.target as Node)) {
            setIsBrandFilterOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenSpecModal = useCallback((spec: Spec | null = null) => {
    setEditingSpec(spec);
    setIsSpecModalOpen(true);
  }, []);

  const handleOpenProductModal = useCallback((product: Product | null = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    setIsSpecModalOpen(false);
    setIsProductModalOpen(false);
    setIsImportModalOpen(false);
    setEditingSpec(null);
    setEditingProduct(null);
  }, []);

  const handleSaveSpec = useCallback((specData: { id?: string; name: string }) => {
    if (specData.id) {
      setSpecs(prev => prev.map(s => s.id === specData.id ? { ...s, name: specData.name } : s));
    } else {
      const newSpec = { id: uuidv4(), name: specData.name };
      setSpecs(prev => [...prev, newSpec]);
      setProducts(prev => prev.map(p => ({ ...p, specs: { ...p.specs, [newSpec.id]: '' } })));
    }
    handleCloseModals();
  }, [handleCloseModals]);

  const handleDeleteSpec = useCallback((specId: string) => {
    if (window.confirm('Are you sure you want to delete this specification? This will remove it from all products.')) {
        setSpecs(prev => prev.filter(s => s.id !== specId));
        setProducts(prev => prev.map(p => {
            const newSpecs = { ...p.specs };
            delete newSpecs[specId];
            return { ...p, specs: newSpecs };
        }));
        setSelectedSpecIds(prev => prev.filter(id => id !== specId));
    }
  }, []);

  const handleSaveProduct = useCallback((productData: Product) => {
    if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else {
        const newProduct = { ...productData, id: uuidv4() };
        setProducts(prev => [...prev, newProduct]);
    }
    handleCloseModals();
  }, [editingProduct, handleCloseModals]);


  const handleDeleteProduct = useCallback((productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
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

    const handleImportData = useCallback((importedProducts: any[]) => {
        try {
            if (!Array.isArray(importedProducts) || !importedProducts.every(p => p.name && typeof p.specs === 'object')) {
                throw new Error('Invalid data structure in JSON file.');
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
                    name: product.name,
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

  const requestSort = useCallback((key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const requestSpecSort = useCallback(() => {
    setSpecSortDirection(prev => prev === 'ascending' ? 'descending' : 'ascending');
  }, []);

  const sortedSpecs = useMemo(() => {
    let tempSpecs = [...specs];
    
    tempSpecs.sort((a, b) => {
        const dir = specSortDirection === 'ascending' ? 1 : -1;
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1 * dir;
        if (nameA > nameB) return 1 * dir;
        return 0;
    });

    return tempSpecs;
  }, [specs, specSortDirection]);

  const filteredAndSortedSpecs = useMemo(() => {
    if (selectedSpecIds.length > 0) {
        const selectedSet = new Set(selectedSpecIds);
        return sortedSpecs.filter(spec => selectedSet.has(spec.id));
    }
    return sortedSpecs;
  }, [sortedSpecs, selectedSpecIds]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.name.split(' ')[0]));
    return ['All Brands', ...Array.from(brands).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let tempProducts = [...products];

    if (selectedBrand !== 'All Brands') {
        tempProducts = tempProducts.filter(p => p.name.split(' ')[0] === selectedBrand);
    }

    const query = modelQuery.toLowerCase().trim();
    if (query) {
        tempProducts = tempProducts.filter(p => p.name.toLowerCase().includes(query));
    }
    return tempProducts;
  }, [products, selectedBrand, modelQuery]);

  const sortedProducts = useMemo(() => {
    let sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
        sortableProducts.sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'ascending' ? 1 : -1;

            const valA = key === 'name' ? a.name : a.specs[key] || '';
            const valB = key === 'name' ? b.name : b.specs[key] || '';

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
    return products.filter(p => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const SortableHeader: React.FC<{ sortKey: string; children: React.ReactNode; className?: string; }> = ({ sortKey, children, className }) => (
    <button onClick={() => requestSort(sortKey)} className={`flex items-center gap-1 group ${className}`}>
        {children}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {sortConfig?.key === sortKey ? (
                sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" /> : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />
            ) : (
               <ChevronUpIcon className="h-4 w-4 text-slate-400" />
            )}
        </div>
    </button>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-12">
      <header className="mb-10">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Product Comparison</h1>
        <p className="text-xl text-slate-500 mt-3">An elegant way to compare product specifications.</p>
        <div className="mt-8 flex flex-wrap gap-4 items-center">
            <div ref={brandFilterRef} className="relative w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-48">
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
            <input
                type="text"
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder="Filter by model..."
                className="w-full sm:w-auto flex-grow px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                aria-label="Filter by model"
            />
            <div ref={specFilterRef} className="relative w-full sm:w-auto flex-grow">
                <button
                    onClick={() => setIsSpecFilterOpen(prev => !prev)}
                    className="w-full px-4 py-2 text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex justify-between items-center"
                    aria-haspopup="true"
                    aria-expanded={isSpecFilterOpen}
                >
                    <span>
                        {selectedSpecIds.length > 0 ? `${selectedSpecIds.length} spec(s) selected` : 'Filter specifications...'}
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isSpecFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSpecFilterOpen && (
                    <div className="absolute z-20 mt-2 w-full sm:w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="p-2">
                            <div className="max-h-60 overflow-y-auto p-2">
                                {sortedSpecs.map(spec => (
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
                    className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Compare selected products"
                >
                    Compare Selected ({selectedProductIds.size})
                </button>
                 <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-slate-700 bg-white/60 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
                    aria-label="Import data"
                >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Import Data
                </button>
            </div>
        </div>
      </header>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg ring-1 ring-slate-900/5">
        <div className="flex">
          {/* Specs Column */}
          <div className="sticky left-0 bg-white z-10 flex-shrink-0 w-56 border-r border-slate-200">
            <div className="h-56 flex flex-col justify-between p-4 bg-slate-50/75">
                <button onClick={requestSpecSort} className="flex items-center gap-2 group">
                    <span className="font-bold text-slate-800 text-lg">Specification</span>
                    {specSortDirection === 'ascending' ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" /> : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />}
                </button>
                <button onClick={() => handleOpenSpecModal()} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors w-full justify-center">
                    <PlusIcon className="h-5 w-5" />
                    Add Spec
                </button>
            </div>
            {filteredAndSortedSpecs.map(spec => (
              <div key={spec.id} className="h-24 px-4 flex items-center justify-between group border-b border-slate-200">
                 <SortableHeader sortKey={spec.id} className="w-full text-left">
                     <span className="font-semibold text-slate-700 text-sm">{spec.name}</span>
                 </SortableHeader>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenSpecModal(spec)} className="text-slate-400 hover:text-indigo-600"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDeleteSpec(spec.id)} className="text-slate-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Products Columns */}
          <div className="flex">
            {sortedProducts.map(product => {
              const isSelected = selectedProductIds.has(product.id);
              return (
              <div 
                  key={product.id} 
                  className={`flex-shrink-0 w-72 border-r border-slate-200 transition-all duration-200 cursor-pointer ring-2 ring-inset ${isSelected ? 'bg-indigo-50 ring-indigo-500' : 'bg-white ring-transparent'}`}
                  onClick={() => handleToggleProductSelection(product.id)}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Select ${product.name}`}
                  tabIndex={0}
              >
                <div className="h-56 p-4 border-b border-slate-200 group relative">
                    {isSelected && (
                      <div className="absolute top-3 right-3 h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center text-white z-20 shadow">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                    )}
                    <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover rounded-md mb-3 bg-slate-100" />
                    <h3 className="font-bold text-slate-800 text-center text-lg">{product.name}</h3>
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleOpenProductModal(product)} className="bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-white shadow"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-slate-600 hover:text-red-600 hover:bg-white shadow"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                </div>
                {filteredAndSortedSpecs.map(spec => (
                  <div key={spec.id} className="h-24 px-4 flex items-center border-b border-slate-200 text-slate-600 text-sm">
                    {product.specs[spec.id] || <span className="text-slate-400">-</span>}
                  </div>
                ))}
              </div>
            )})}
             <div className="flex-shrink-0 w-72 flex items-center justify-center border-r border-slate-200 px-4">
                <div className="h-full flex items-center justify-center p-4 w-full">
                     <button onClick={() => handleOpenProductModal()} className="flex items-center justify-center flex-col gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg w-full h-full transition-colors">
                        <PlusIcon className="h-8 w-8" />
                        <span className="font-semibold">Add Product</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
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

      {isComparisonModalOpen && (
         <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={() => setIsComparisonModalOpen(false)}
        >
             <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col transform transition-all" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
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
                     <div className="flex">
                        <div className="sticky left-0 bg-white z-10 flex-shrink-0 w-56 border-r border-slate-200">
                             <div className="h-56 flex items-center p-4 bg-slate-50">
                                <span className="font-bold text-slate-800 text-lg">Specification</span>
                            </div>
                            {filteredAndSortedSpecs.map(spec => (
                                <div key={spec.id} className="h-24 px-4 flex items-center justify-between border-b border-slate-200">
                                    <span className="font-semibold text-slate-700 text-sm">{spec.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex">
                            {selectedProducts.map(product => (
                                <div key={product.id} className="flex-shrink-0 w-72 border-r border-slate-200">
                                    <div className="h-56 p-4 border-b border-slate-200">
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover rounded-md mb-3 bg-slate-100" />
                                        <h3 className="font-bold text-slate-800 text-center text-lg">{product.name}</h3>
                                    </div>
                                    {filteredAndSortedSpecs.map(spec => (
                                        <div key={spec.id} className="h-24 px-4 flex items-center border-b border-slate-200 text-slate-600 text-sm">
                                            {product.specs[spec.id] || <span className="text-slate-400">-</span>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
