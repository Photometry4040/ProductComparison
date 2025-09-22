import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Spec } from '../types';

interface SpecFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (specData: { id?: string; name:string }) => void;
    spec: Spec | null;
}

const SpecFormModal: React.FC<SpecFormModalProps> = ({ isOpen, onClose, onSave, spec }) => {
    const [name, setName] = useState(spec?.name || '');

    useEffect(() => {
        if (isOpen) {
            setName(spec?.name || '');
        }
    }, [isOpen, spec]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ id: spec?.id, name });
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={spec ? 'Edit Specification' : 'Add New Specification'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="specName" className="block text-sm font-medium text-slate-700">Specification Name</label>
                        <input
                            type="text"
                            id="specName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default SpecFormModal;
