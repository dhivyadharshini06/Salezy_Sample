import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
}

interface DataUploadProps {
  shopId: string;
}

export default function DataUpload({ shopId }: DataUploadProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, brand')
      .eq('shop_id', shopId)
      .order('name');

    if (data) {
      setProducts(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });
      data.push(row);
    }
    return data;
  };

  const handleUpload = async () => {
    if (!file || !selectedProduct) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a product and choose a CSV file',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const salesData = rows
        .filter((row) => row.date && row['quantity sold'])
        .map((row) => ({
          product_id: selectedProduct,
          shop_id: shopId,
          date: row.date,
          quantity_sold: parseInt(row['quantity sold']) || 0,
          revenue: parseFloat(row.revenue || '0'),
          is_festival: row['festival indicator']?.toLowerCase() === 'yes' || row.is_festival === '1',
        }));

      if (salesData.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid data found. Please check CSV format.',
        });
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('sales_data').insert(salesData);

      if (error) {
        setUploadStatus({
          type: 'error',
          message: `Upload failed: ${error.message}`,
        });
      } else {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded ${salesData.length} records!`,
        });
        setFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to parse CSV file. Please check the format.',
      });
    }

    setUploading(false);
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Date,Product Name,Brand,Quantity Sold,Revenue,Festival Indicator
2024-01-01,Blue Pen,Apsara,45,450,No
2024-01-02,Blue Pen,Apsara,52,520,No
2024-01-03,Blue Pen,Apsara,38,380,No
2024-01-14,Blue Pen,Apsara,120,1200,Yes
2024-01-15,Blue Pen,Apsara,95,950,Yes`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_sales_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Sales Data</h2>
            <p className="text-gray-600">Import historical sales data for AI forecasting</p>
          </div>
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Sample CSV
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">Please add products before uploading sales data</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Date</strong>: YYYY-MM-DD format (e.g., 2024-01-15)</li>
                <li>• <strong>Product Name / Brand</strong>: Product identifier</li>
                <li>• <strong>Quantity Sold</strong>: Number of units sold</li>
                <li>• <strong>Revenue</strong>: (Optional) Total revenue</li>
                <li>• <strong>Festival Indicator</strong>: (Optional) Yes/No or 1/0</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.brand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-gray-900 font-medium mb-1">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900 font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-600">CSV files only</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {uploadStatus.type && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  uploadStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {uploadStatus.message}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || !selectedProduct || uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Next Steps After Upload</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ Data will be automatically preprocessed and validated</p>
          <p>✓ Missing dates and outliers will be handled intelligently</p>
          <p>✓ Navigate to AI Forecast tab to generate demand predictions</p>
          <p>✓ Get inventory recommendations and business insights</p>
        </div>
      </div>
    </div>
  );
}
