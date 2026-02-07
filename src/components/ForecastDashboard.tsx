import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Package,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  selectBestModel,
  calculateInventoryRecommendation,
  generateInsights,
  calculateBusinessImpact,
  SalesDataPoint,
  ForecastResult,
  InventoryRecommendation,
  Insight,
  BusinessImpact,
} from '../utils/forecasting';

interface Product {
  id: string;
  name: string;
  brand: string;
  current_stock: number;
  unit_price: number;
}

interface ForecastDashboardProps {
  shopId: string;
}

export default function ForecastDashboard({ shopId }: ForecastDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [recommendation, setRecommendation] = useState<InventoryRecommendation | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [businessImpact, setBusinessImpact] = useState<BusinessImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [whatIfStock, setWhatIfStock] = useState(0);
  const [whatIfDiscount, setWhatIfDiscount] = useState(0);
  const [whatIfResults, setWhatIfResults] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  useEffect(() => {
    if (selectedProduct) {
      loadSalesData(selectedProduct.id);
      setWhatIfStock(selectedProduct.current_stock);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('name');

    if (data && data.length > 0) {
      setProducts(data);
      setSelectedProduct(data[0]);
    }
    setLoading(false);
  };

  const loadSalesData = async (productId: string) => {
    const { data } = await supabase
      .from('sales_data')
      .select('date, quantity_sold, is_festival')
      .eq('product_id', productId)
      .order('date', { ascending: true });

    if (data) {
      setSalesData(data);
      setForecast(null);
      setRecommendation(null);
      setInsights([]);
      setBusinessImpact(null);
    }
  };

  const generateForecast = async () => {
    if (!selectedProduct || salesData.length < 7) {
      alert('Need at least 7 days of sales data to generate forecast');
      return;
    }

    setGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const bestForecast = selectBestModel(salesData);
    const inventoryRec = calculateInventoryRecommendation(
      bestForecast,
      selectedProduct.current_stock
    );
    const aiInsights = generateInsights(salesData, bestForecast);
    const impact = calculateBusinessImpact(
      selectedProduct.current_stock,
      inventoryRec.recommendedStock,
      inventoryRec.forecastedDemand,
      selectedProduct.unit_price
    );

    setForecast(bestForecast);
    setRecommendation(inventoryRec);
    setInsights(aiInsights);
    setBusinessImpact(impact);

    await supabase.from('forecasts').insert({
      product_id: selectedProduct.id,
      shop_id: shopId,
      forecast_date: bestForecast.predictions[bestForecast.predictions.length - 1].date,
      predicted_demand: inventoryRec.forecastedDemand,
      recommended_stock: inventoryRec.recommendedStock,
      safety_stock: inventoryRec.safetyStock,
      risk_level: inventoryRec.riskLevel,
      model_used: bestForecast.model,
      confidence_score: bestForecast.confidence,
    });

    setGenerating(false);
  };

  const runWhatIfSimulation = () => {
    if (!recommendation || !selectedProduct) return;

    const adjustedDemand =
      recommendation.forecastedDemand * (1 + whatIfDiscount / 100 * 0.5);
    const adjustedRecommendedStock = Math.round(
      adjustedDemand + recommendation.safetyStock
    );

    let newRiskLevel: 'Low' | 'Medium' | 'High';
    if (whatIfStock >= adjustedRecommendedStock * 1.5) {
      newRiskLevel = 'Medium';
    } else if (whatIfStock < adjustedDemand * 0.8) {
      newRiskLevel = 'High';
    } else {
      newRiskLevel = 'Low';
    }

    const impact = calculateBusinessImpact(
      whatIfStock,
      adjustedRecommendedStock,
      adjustedDemand,
      selectedProduct.unit_price * (1 - whatIfDiscount / 100)
    );

    setWhatIfResults({
      adjustedDemand: Math.round(adjustedDemand),
      adjustedRecommendedStock,
      riskLevel: newRiskLevel,
      impact,
    });
  };

  useEffect(() => {
    if (recommendation) {
      runWhatIfSimulation();
    }
  }, [whatIfStock, whatIfDiscount]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
        <p className="text-gray-600">Please add products before generating forecasts</p>
      </div>
    );
  }

  const chartData =
    forecast && salesData.length > 0
      ? [
          ...salesData.slice(-30).map((d) => ({
            date: d.date,
            actual: d.quantity_sold,
            forecast: null,
          })),
          ...forecast.predictions.slice(-7).map((p) => ({
            date: p.date,
            actual: null,
            forecast: p.value,
          })),
        ]
      : salesData.slice(-30).map((d) => ({
          date: d.date,
          actual: d.quantity_sold,
          forecast: null,
        }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Demand Forecasting</h2>
            <p className="text-gray-600">Generate predictions and inventory recommendations</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value);
                setSelectedProduct(product || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.brand})
                </option>
              ))}
            </select>
            <button
              onClick={generateForecast}
              disabled={generating || salesData.length < 7}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Forecast'}
            </button>
          </div>
        </div>

        {salesData.length < 7 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-yellow-900 mb-2">Insufficient Data</h3>
            <p className="text-yellow-800 text-sm">
              Need at least 7 days of sales data. Current: {salesData.length} days
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-gray-900">
                  Data Ready: {salesData.length} days of historical sales
                </h4>
                <p className="text-sm text-gray-600">
                  Click Generate Forecast to get AI-powered predictions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {forecast && recommendation && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Forecasted Demand</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendation.forecastedDemand}
                  </p>
                  <p className="text-xs text-gray-500">units (next period)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recommended Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendation.recommendedStock}
                  </p>
                  <p className="text-xs text-gray-500">
                    Safety: +{recommendation.safetyStock}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p
                    className={`text-2xl font-bold ${
                      recommendation.riskLevel === 'Low'
                        ? 'text-green-600'
                        : recommendation.riskLevel === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {recommendation.riskLevel}
                  </p>
                  <p className="text-xs text-gray-500">inventory risk</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model Confidence</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(forecast.confidence)}%
                  </p>
                  <p className="text-xs text-gray-500">{forecast.model}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Demand Forecast Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Actual Sales"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-900">Explainable AI Insights</h3>
            </div>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.impact === 'positive'
                      ? 'bg-green-50 border-green-500'
                      : insight.impact === 'negative'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  <p className="text-sm font-medium text-gray-900">
                    Action: {insight.actionable}
                  </p>
                </div>
              ))}

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg text-white">
                <h4 className="font-semibold mb-2">Inventory Decision</h4>
                <p className="text-sm text-blue-100">{recommendation.reasoning}</p>
              </div>
            </div>
          </div>

          {businessImpact && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Business Impact Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: 'Overstock\nReduction', value: businessImpact.overstockReduction },
                        { name: 'Stockout\nReduction', value: businessImpact.stockoutReduction },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="value" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost Savings</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{businessImpact.costSavings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      From reduced holding costs
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Revenue Opportunity</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{businessImpact.revenueIncrease.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      From prevented stockouts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              What-If Simulation
            </h3>
            <p className="text-purple-100 mb-6">
              Adjust stock levels and discount to see impact on forecast and profit
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Stock Level: {whatIfStock} units
                </label>
                <input
                  type="range"
                  min="0"
                  max={recommendation.recommendedStock * 2}
                  value={whatIfStock}
                  onChange={(e) => setWhatIfStock(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Discount: {whatIfDiscount}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={whatIfDiscount}
                  onChange={(e) => setWhatIfDiscount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {whatIfResults && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm text-purple-100 mb-1">Adjusted Demand</p>
                  <p className="text-2xl font-bold">{whatIfResults.adjustedDemand}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm text-purple-100 mb-1">Risk Level</p>
                  <p className="text-2xl font-bold">{whatIfResults.riskLevel}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm text-purple-100 mb-1">Cost Savings</p>
                  <p className="text-2xl font-bold">₹{whatIfResults.impact.costSavings}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm text-purple-100 mb-1">Revenue Impact</p>
                  <p className="text-2xl font-bold">₹{whatIfResults.impact.revenueIncrease}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Model Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">MAE (Mean Absolute Error)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forecast.metrics.mae.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">RMSE (Root Mean Square Error)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forecast.metrics.rmse.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">MAPE (Mean Absolute % Error)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forecast.metrics.mape.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Selected Model:</strong> {forecast.model} - Automatically chosen as the
                best performing model based on lowest MAPE score. Lower error metrics indicate
                higher accuracy.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
