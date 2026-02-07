export interface SalesDataPoint {
  date: string;
  quantity_sold: number;
  is_festival: boolean;
}

export interface ForecastResult {
  model: string;
  predictions: { date: string; value: number }[];
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
  };
  confidence: number;
}

export interface InventoryRecommendation {
  forecastedDemand: number;
  recommendedStock: number;
  safetyStock: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasoning: string;
}

export interface Insight {
  type: 'trend' | 'festival' | 'anomaly' | 'seasonal';
  title: string;
  description: string;
  actionable: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface BusinessImpact {
  overstockReduction: number;
  stockoutReduction: number;
  costSavings: number;
  revenueIncrease: number;
}

function calculateMetrics(actual: number[], predicted: number[]) {
  const n = Math.min(actual.length, predicted.length);
  let mae = 0;
  let mse = 0;
  let mape = 0;

  for (let i = 0; i < n; i++) {
    const error = Math.abs(actual[i] - predicted[i]);
    mae += error;
    mse += error * error;
    if (actual[i] !== 0) {
      mape += Math.abs((actual[i] - predicted[i]) / actual[i]);
    }
  }

  mae /= n;
  mse /= n;
  mape = (mape / n) * 100;

  return {
    mae,
    rmse: Math.sqrt(mse),
    mape,
  };
}

export function movingAverage(data: SalesDataPoint[], window: number = 7): ForecastResult {
  const values = data.map((d) => d.quantity_sold);
  const predictions: { date: string; value: number }[] = [];

  for (let i = window; i < values.length; i++) {
    const slice = values.slice(i - window, i);
    const avg = slice.reduce((a, b) => a + b, 0) / window;
    predictions.push({
      date: data[i].date,
      value: Math.round(avg),
    });
  }

  const lastWindowValues = values.slice(-window);
  const nextPrediction = lastWindowValues.reduce((a, b) => a + b, 0) / window;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  predictions.push({
    date: tomorrow.toISOString().split('T')[0],
    value: Math.round(nextPrediction),
  });

  const actual = values.slice(window);
  const predicted = predictions.slice(0, -1).map((p) => p.value);
  const metrics = calculateMetrics(actual, predicted);

  return {
    model: 'Moving Average',
    predictions,
    metrics,
    confidence: Math.max(0, 100 - metrics.mape),
  };
}

export function exponentialSmoothing(
  data: SalesDataPoint[],
  alpha: number = 0.3
): ForecastResult {
  const values = data.map((d) => d.quantity_sold);
  const predictions: { date: string; value: number }[] = [];

  let forecast = values[0];
  predictions.push({
    date: data[0].date,
    value: Math.round(forecast),
  });

  for (let i = 1; i < values.length; i++) {
    forecast = alpha * values[i] + (1 - alpha) * forecast;
    predictions.push({
      date: data[i].date,
      value: Math.round(forecast),
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  predictions.push({
    date: tomorrow.toISOString().split('T')[0],
    value: Math.round(forecast),
  });

  const actual = values;
  const predicted = predictions.slice(0, -1).map((p) => p.value);
  const metrics = calculateMetrics(actual, predicted);

  return {
    model: 'Exponential Smoothing',
    predictions,
    metrics,
    confidence: Math.max(0, 100 - metrics.mape),
  };
}

export function linearRegression(data: SalesDataPoint[]): ForecastResult {
  const n = data.length;
  const values = data.map((d) => d.quantity_sold);

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictions: { date: string; value: number }[] = [];

  for (let i = 0; i < n; i++) {
    predictions.push({
      date: data[i].date,
      value: Math.max(0, Math.round(slope * i + intercept)),
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  predictions.push({
    date: tomorrow.toISOString().split('T')[0],
    value: Math.max(0, Math.round(slope * n + intercept)),
  });

  const actual = values;
  const predicted = predictions.slice(0, -1).map((p) => p.value);
  const metrics = calculateMetrics(actual, predicted);

  return {
    model: 'Linear Regression',
    predictions,
    metrics,
    confidence: Math.max(0, 100 - metrics.mape),
  };
}

export function selectBestModel(data: SalesDataPoint[]): ForecastResult {
  const models = [
    movingAverage(data),
    exponentialSmoothing(data),
    linearRegression(data),
  ];

  models.sort((a, b) => a.metrics.mape - b.metrics.mape);

  return models[0];
}

export function calculateInventoryRecommendation(
  forecast: ForecastResult,
  currentStock: number
): InventoryRecommendation {
  const forecastedDemand = forecast.predictions[forecast.predictions.length - 1].value;
  const safetyStockPercent = forecast.confidence > 80 ? 0.1 : forecast.confidence > 60 ? 0.15 : 0.2;
  const safetyStock = Math.round(forecastedDemand * safetyStockPercent);
  const recommendedStock = forecastedDemand + safetyStock;

  let riskLevel: 'Low' | 'Medium' | 'High';
  let reasoning = '';

  if (currentStock >= recommendedStock * 1.5) {
    riskLevel = 'Medium';
    reasoning = 'Overstock detected. Consider reducing orders or promotional discounts.';
  } else if (currentStock < forecastedDemand * 0.8) {
    riskLevel = 'High';
    reasoning = 'Critical stock level. Immediate restocking recommended to avoid stockouts.';
  } else {
    riskLevel = 'Low';
    reasoning = 'Stock levels are optimal. Monitor for seasonal changes.';
  }

  return {
    forecastedDemand,
    recommendedStock,
    safetyStock,
    riskLevel,
    reasoning,
  };
}

export function generateInsights(
  data: SalesDataPoint[],
  forecast: ForecastResult
): Insight[] {
  const insights: Insight[] = [];
  const values = data.map((d) => d.quantity_sold);

  const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
  const trend = recentAvg > overallAvg ? 'increasing' : 'decreasing';

  if (Math.abs(recentAvg - overallAvg) / overallAvg > 0.15) {
    insights.push({
      type: 'trend',
      title: `Demand is ${trend}`,
      description: `Recent sales (${Math.round(recentAvg)} units/day) are ${Math.abs(
        Math.round(((recentAvg - overallAvg) / overallAvg) * 100)
      )}% ${trend === 'increasing' ? 'higher' : 'lower'} than average.`,
      actionable:
        trend === 'increasing'
          ? 'Increase inventory levels to meet growing demand'
          : 'Consider promotional activities to boost sales',
      impact: trend === 'increasing' ? 'positive' : 'negative',
    });
  }

  const festivalDays = data.filter((d) => d.is_festival);
  if (festivalDays.length > 0) {
    const festivalAvg =
      festivalDays.reduce((sum, d) => sum + d.quantity_sold, 0) / festivalDays.length;
    const nonFestivalAvg =
      data
        .filter((d) => !d.is_festival)
        .reduce((sum, d) => sum + d.quantity_sold, 0) /
      (data.length - festivalDays.length);

    if (festivalAvg > nonFestivalAvg * 1.3) {
      insights.push({
        type: 'festival',
        title: 'Festival Impact Detected',
        description: `Sales increase by ${Math.round(
          ((festivalAvg - nonFestivalAvg) / nonFestivalAvg) * 100
        )}% during festivals (${Math.round(festivalAvg)} vs ${Math.round(
          nonFestivalAvg
        )} units/day).`,
        actionable: 'Stock up 2-3 days before festivals. Plan promotional bundles.',
        impact: 'positive',
      });
    }
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max > overallAvg * 2 || min < overallAvg * 0.3) {
    insights.push({
      type: 'anomaly',
      title: 'Sales Volatility Detected',
      description: `Sales vary significantly (${min} to ${max} units). High demand variability observed.`,
      actionable: 'Maintain higher safety stock to buffer against unpredictable demand.',
      impact: 'neutral',
    });
  }

  if (forecast.confidence < 70) {
    insights.push({
      type: 'seasonal',
      title: 'Limited Forecast Confidence',
      description: `Model confidence is ${Math.round(
        forecast.confidence
      )}%. More historical data would improve accuracy.`,
      actionable: 'Continue collecting sales data. Review forecast weekly.',
      impact: 'neutral',
    });
  }

  return insights;
}

export function calculateBusinessImpact(
  currentStock: number,
  recommendedStock: number,
  forecastedDemand: number,
  unitPrice: number
): BusinessImpact {
  const overstockAmount = Math.max(0, currentStock - recommendedStock * 1.2);
  const understockRisk = Math.max(0, recommendedStock - currentStock);

  const overstockReduction = Math.round((overstockAmount / (currentStock || 1)) * 100);
  const stockoutReduction = understockRisk > 0 ? 75 : 95;

  const holdingCostPercent = 0.15;
  const costSavings = Math.round(overstockAmount * unitPrice * holdingCostPercent);

  const potentialLostSales = understockRisk > 0 ? understockRisk * 0.3 : 0;
  const revenueIncrease = Math.round(potentialLostSales * unitPrice);

  return {
    overstockReduction,
    stockoutReduction,
    costSavings,
    revenueIncrease,
  };
}
