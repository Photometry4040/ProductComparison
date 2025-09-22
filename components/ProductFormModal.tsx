import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Product, Spec } from '../types';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    product: Product | null;
    specs: Spec[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product, specs }) => {
    const [formData, setFormData] = useState<Product>(() => {
        const newSpecs: { [key: string]: string } = {};
        specs.forEach(s => newSpecs[s.id] = '');
        return { id: '', name: '', imageUrl: '', specs: newSpecs };
    });

    useEffect(() => {
        if(isOpen) {
            if (product) {
                const updatedProductData = { ...product };
                // Ensure all specs exist on the product being edited
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSpecChange = (specId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [specId]: value }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-slate-700">Product Name</label>
                    <input type="text" id="productName" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Product Image</label>
                    <div className="mt-2 flex items-center gap-4">
                        {formData.imageUrl ? (
                            <img src={formData.imageUrl} alt="Product Preview" className="h-16 w-16 object-cover rounded-md bg-slate-100" />
                        ) : (
                            <div className="h-16 w-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        )}
                        <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span>{formData.imageUrl ? 'Change' : 'Upload'} Image</span>
                            <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                    </div>
                </div>
                <hr className="my-4 border-slate-200"/>
                <h4 className="text-lg font-medium text-slate-800">Specifications</h4>
                {specs.sort((a,b) => a.name.localeCompare(b.name)).map(spec => (
                    <div key={spec.id}>
                        <label htmlFor={`spec-${spec.id}`} className="block text-sm font-medium text-slate-700">{spec.name}</label>
                        <input
                            type="text"
                            id={`spec-${spec.id}`}
                            value={formData.specs[spec.id] || ''}
                            onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                ))}
                <div className="mt-6 flex justify-end gap-3 sticky bottom-0 bg-white py-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save Product</button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductFormModal;
