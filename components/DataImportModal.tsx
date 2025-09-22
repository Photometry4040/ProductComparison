import React, { useRef } from 'react';
import Modal from './Modal';
import { Product, Spec } from '../types';

interface DataImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => void;
    currentProducts: Product[];
    currentSpecs: Spec[];
}

/**
 * A simple CSV to JSON converter.
 * Assumes the first row is the header.
 * 'name' and 'imageUrl' are top-level properties, others are moved into a 'specs' object.
 * Note: This parser is simple and does not handle commas within quoted values.
 */
const parseCsvToJson = (csvText: string): any[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        throw new Error("CSV must have a header row and at least one data row.");
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const nameIndex = headers.indexOf('name');
    
    if (nameIndex === -1) {
        throw new Error("CSV must contain a 'name' column header.");
    }

    const products = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        const values = lines[i].split(',').map(v => v.trim());
        
        const product: { name: string; imageUrl?: string; specs: { [key: string]: string } } = {
            name: values[headers.indexOf('name')] || '',
            specs: {}
        };

        headers.forEach((header, index) => {
            if (header === 'imageUrl') {
                product.imageUrl = values[index] || '';
            } else if (header !== 'name') {
                product.specs[header] = values[index] || '';
            }
        });

        if(product.name) {
            products.push(product);
        }
    }
    return products;
}


const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, onImport, currentProducts, currentSpecs }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                let data;
                if (file.name.endsWith('.csv')) {
                    data = parseCsvToJson(text);
                } else {
                    data = JSON.parse(text);
                }
                onImport(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                alert(`Invalid file format. Please check the content. Error: ${errorMessage}`);
                console.error(error);
            }
        };
        reader.readAsText(file);
    };
    
    const handleDownloadJsonTemplate = () => {
        const specIdToNameMap = new Map(currentSpecs.map(s => [s.id, s.name]));
        const templateData = currentProducts.map(p => {
            const userFriendlySpecs: { [key: string]: string } = {};
            // Use currentSpecs to maintain a consistent order
            currentSpecs.forEach(spec => {
                 userFriendlySpecs[spec.name] = p.specs[spec.id] || '';
            });
            return {
                name: p.name,
                imageUrl: p.imageUrl,
                specs: userFriendlySpecs
            };
        });

        const jsonString = JSON.stringify(templateData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-template.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleDownloadCsvTemplate = () => {
        const sortedSpecs = [...currentSpecs].sort((a, b) => a.name.localeCompare(b.name));
        const headers = ['name', 'imageUrl', ...sortedSpecs.map(s => s.name)];
        const headerRow = headers.join(',');

        let content = headerRow;

        // Optionally add the current products as rows for a complete export/template
        const productRows = currentProducts.map(p => {
            const row = [
                p.name,
                p.imageUrl,
                ...sortedSpecs.map(spec => p.specs[spec.id] || '')
            ];
            // Basic CSV escaping: if a value contains a comma, wrap it in double quotes.
            return row.map(val => {
                const strVal = String(val);
                return strVal.includes(',') ? `"${strVal}"` : strVal;
            }).join(',');
        });
        
        if (productRows.length > 0) {
            content += '\n' + productRows.join('\n');
        }

        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    const jsonExample = `[
  {
    "name": "BenQ TK710",
    "imageUrl": "https://...",
    "specs": {
      "MSRP (USD)": "$3,499",
      "Resolution": "3840x2160"
    }
  }
]`;
    const csvExample = `name,imageUrl,MSRP (USD),Resolution
BenQ TK710,https://...,$3,499,3840x2160`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Product Data">
            <div className="space-y-6 text-sm text-slate-600">
                <p>Upload a JSON or CSV file to replace all current product data. Any new specifications in the file will be automatically added.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-800 mb-2">JSON Format</h4>
                        <pre className="text-xs bg-slate-100 p-3 rounded overflow-x-auto"><code>{jsonExample}</code></pre>
                        <button
                            onClick={handleDownloadJsonTemplate}
                            className="mt-3 w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Download JSON Template
                        </button>
                    </div>
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-800 mb-2">CSV Format</h4>
                        <pre className="text-xs bg-slate-100 p-3 rounded overflow-x-auto"><code>{csvExample}</code></pre>
                         <button
                            onClick={handleDownloadCsvTemplate}
                            className="mt-3 w-full px-4 py-2 text-sm font-medium text-teal-700 bg-teal-100 border border-transparent rounded-md hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Download CSV Template
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center">
                    <label htmlFor="file-upload" className="w-full sm:w-auto cursor-pointer px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center">
                        Select File & Replace Data
                    </label>
                    <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv"
                        className="sr-only"
                        onChange={handleFileChange}
                    />
                     <p className="mt-3 text-xs text-center text-slate-500">
                        <strong>Warning:</strong> This action will replace all existing product and specification data.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default DataImportModal;
