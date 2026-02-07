import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Store,
  BarChart3,
  Package,
  Upload,
  TrendingUp,
  LogOut,
  Settings,
  Lightbulb,
  DollarSign,
  Plus,
} from 'lucide-react';
import ShopManagement from '../components/ShopManagement';
import ProductManagement from '../components/ProductManagement';
import DataUpload from '../components/DataUpload';
import ForecastDashboard from '../components/ForecastDashboard';

type Shop = {
  id: string;
  name: string;
  category: string;
  location: string | null;
};

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'data' | 'forecast'>('overview');
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setShops(data);
      if (data.length > 0 && !selectedShop) {
        setSelectedShop(data[0]);
      }
    }
    setLoading(false);
  };

  const handleShopCreated = () => {
    loadShops();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'data', label: 'Upload Data', icon: Upload },
    { id: 'forecast', label: 'AI Forecast', icon: TrendingUp },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SALESY</h1>
                <p className="text-xs text-gray-500">AI Demand Forecasting</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {selectedShop && (
                <select
                  value={selectedShop.id}
                  onChange={(e) => {
                    const shop = shops.find((s) => s.id === e.target.value);
                    setSelectedShop(shop || null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shops.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to SALESY!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first shop. Once set up, you'll be able to manage
              products, upload sales data, and get AI-powered demand forecasts.
            </p>
            <ShopManagement onShopCreated={handleShopCreated} />
          </div>
        ) : (
          <>
            <nav className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="space-y-6">
              {activeTab === 'overview' && selectedShop && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedShop.name}</h2>
                        <p className="text-gray-600">{selectedShop.category}</p>
                      </div>
                      <ShopManagement onShopCreated={handleShopCreated} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-600 p-2 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Products</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">-</p>
                        <p className="text-sm text-gray-600 mt-1">Total items</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-green-600 p-2 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Forecast</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-600">Ready</p>
                        <p className="text-sm text-gray-600 mt-1">AI-powered</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-orange-600 p-2 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Insights</h3>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">AI</p>
                        <p className="text-sm text-gray-600 mt-1">Explainable</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-purple-600 p-2 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Impact</h3>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">High</p>
                        <p className="text-sm text-gray-600 mt-1">ROI potential</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Quick Start Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex gap-4">
                        <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Add Products</h4>
                          <p className="text-blue-100 text-sm">
                            Set up your inventory with product details
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Upload Data</h4>
                          <p className="text-blue-100 text-sm">
                            Import historical sales CSV files
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Get Forecasts</h4>
                          <p className="text-blue-100 text-sm">
                            Generate AI-powered demand predictions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && selectedShop && (
                <ProductManagement shopId={selectedShop.id} />
              )}

              {activeTab === 'data' && selectedShop && (
                <DataUpload shopId={selectedShop.id} />
              )}

              {activeTab === 'forecast' && selectedShop && (
                <ForecastDashboard shopId={selectedShop.id} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
