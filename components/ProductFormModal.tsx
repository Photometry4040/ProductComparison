import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './Modal';
import { Product, Spec } from '../types';
import { PhotoIcon, XCircleIcon, TrashIcon } from './icons';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    onDelete: (productId: string) => void;
    product: Product | null;
    specs: Spec[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, onDelete, product, specs }) => {
    const [formData, setFormData] = useState<Product>(() => {
        const newSpecs: { [key: string]: string } = {};
        specs.forEach(s => newSpecs[s.id] = '');
        return { id: '', name: '', imageUrl: '', specs: newSpecs };
    });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isOpen) {
            if (product) {
                const updatedProductData = { ...product };
                specs.forEach(s => {
                    if (!(s.id in updatedProductData.specs)) {
                        updatedProductData.specs[s.id] = '';
                    }
                });
                setFormData(updatedProductData);
            } else {
                const newSpecs: { [key: string]: string } = {};
                specs.forEach(s => newSpecs[s.id] = '');
                setFormData({ id: '', name: '', imageUrl: '', specs: newSpecs });
            }
        }
    }, [isOpen, product, specs]);

    const handleFileRead = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileRead(e.target.files[0]);
        }
    };
    
    const handleSpecChange = (specId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [specId]: value }
        }));
    };
    
    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setFormData(prev => ({...prev, imageUrl: ''}));
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), []);
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileRead(e.dataTransfer.files[0]);
        }
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
    };

    const sortedSpecs = React.useMemo(() => [...specs].sort((a,b) => a.name.localeCompare(b.name)), [specs]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
                <div className="flex-grow space-y-8 overflow-y-auto -mr-6 pr-6">
                     <div>
                        <label htmlFor="productName" className="block text-sm font-medium leading-6 text-slate-900">Product Name</label>
                        <div className="mt-2">
                             <input type="text" id="productName" name="name" value={formData.name} onChange={handleChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Product Image</label>
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`mt-2 flex justify-center rounded-lg border border-dashed transition-colors duration-200 ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-900/25'} px-6 py-10 relative cursor-pointer`}
                        >
                            {formData.imageUrl ? (
                                <>
                                    <img src={formData.imageUrl} alt="Product Preview" className="h-48 w-auto object-contain rounded-md bg-slate-100" />
                                    <button onClick={handleRemoveImage} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 bg-white/50 backdrop-blur-sm rounded-full" aria-label="Remove image">
                                        <XCircleIcon className="h-7 w-7"/>
                                    </button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-slate-300" />
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600">
                                        <p className="pl-1">
                                            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                                        </p>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-600">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                             <input ref={fileInputRef} id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-base font-semibold leading-6 text-slate-900">Specifications</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        {sortedSpecs.map(spec => (
                            <div key={spec.id}>
                                <label htmlFor={`spec-${spec.id}`} className="block text-sm font-medium leading-6 text-slate-900">{spec.name}</label>
                                 <div className="mt-2">
                                    <input
                                        type="text"
                                        id={`spec-${spec.id}`}
                                        value={formData.specs[spec.id] || ''}
                                        onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex-shrink-0 flex justify-between items-center gap-3 pt-4 border-t border-slate-200">
                    <div>
                        {product && (
                             <button 
                                type="button" 
                                onClick={() => onDelete(product.id)} 
                                className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete Product
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Product</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default ProductFormModal;