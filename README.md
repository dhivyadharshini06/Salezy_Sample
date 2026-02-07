# SALESY - AI-Driven Demand Forecasting & Inventory Decision System

A comprehensive full-stack SaaS application for retail shops featuring AI-powered demand forecasting, inventory optimization, and business intelligence.

## Features

### 1. User & Shop Management
- Professional authentication system (signup/login)
- Multi-tenant architecture with isolated dashboards
- Support for multiple shop owners and shops

### 2. Product & Inventory Management
- Add, edit, and delete products
- Product categorization (Pen, Pencil, Notebook, etc.)
- Brand management (Apsara, Natraj, DOMS, Cello, Classmate, etc.)
- Real-time stock level tracking
- Search and filter functionality

### 3. Data Upload & Processing
- CSV file upload for historical sales data
- Automatic data validation and preprocessing
- Support for festival indicators
- Sample CSV download

### 4. AI Forecasting Engine
- Multiple forecasting models:
  - Linear Regression
  - Moving Average
  - Exponential Smoothing
- Automatic model selection based on performance
- Model evaluation metrics (MAE, RMSE, MAPE)
- Confidence scoring

### 5. Inventory Decision Engine
- Safety stock calculation (10-20% based on confidence)
- Optimal inventory level recommendations
- Risk level detection (Low/Medium/High)
- Overstock and understock alerts

### 6. Explainable AI Insights
- Festival and seasonal trend detection
- Demand spike/drop analysis
- Actionable recommendations
- Smart alerts for inventory actions

### 7. Business Impact Analysis
- Overstock reduction metrics
- Stockout risk reduction
- Cost savings estimation (₹)
- Revenue opportunity analysis
- Visual impact charts

### 8. What-If Simulation
- Interactive stock level adjustment
- Discount impact simulation
- Real-time forecast updates
- Profit optimization scenarios

### 9. Professional UI/UX
- Modern, Gen-Z friendly design
- Responsive layout (mobile to desktop)
- Interactive charts (Recharts)
- Smooth navigation
- Professional color scheme

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- Vite for build tooling

### Backend
- Supabase (PostgreSQL database)
- Supabase Auth for authentication
- Row Level Security (RLS) for data isolation

### AI/ML
- Custom TypeScript implementations:
  - Linear Regression
  - Moving Average
  - Exponential Smoothing
- Statistical model evaluation
- Time series forecasting

## Database Schema

### Tables
- `shops` - Shop information and ownership
- `products` - Product catalog with inventory
- `sales_data` - Historical sales records
- `forecasts` - AI-generated predictions

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Environment Setup
Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Usage Flow

1. **Sign Up / Login** - Create an account or sign in
2. **Create Shop** - Set up your shop profile
3. **Add Products** - Add products with details and current stock
4. **Upload Data** - Import historical sales data via CSV
5. **Generate Forecast** - Get AI-powered demand predictions
6. **Review Insights** - Understand trends and patterns
7. **Take Action** - Follow recommendations for inventory optimization
8. **Simulate** - Use What-If scenarios to optimize decisions

## CSV Format

Required columns:
- Date (YYYY-MM-DD)
- Product Name / Brand
- Quantity Sold

Optional columns:
- Revenue
- Festival Indicator (Yes/No or 1/0)

## Key Algorithms

### Forecasting Models
1. **Linear Regression**: Trend-based prediction
2. **Moving Average**: Short-term smoothing
3. **Exponential Smoothing**: Weighted recent data

### Model Selection
- Automatic selection based on lowest MAPE
- Performance metrics comparison
- Confidence scoring

### Inventory Optimization
- Dynamic safety stock calculation
- Risk level assessment
- Demand-driven recommendations

## Business Intelligence

### Insights Generated
- Demand trends (increasing/decreasing)
- Festival impact analysis
- Sales volatility detection
- Seasonal patterns
- Forecast confidence assessment

### Impact Metrics
- Overstock reduction percentage
- Stockout risk reduction
- Holding cost savings
- Revenue opportunity from prevented stockouts

## Security

- Row Level Security (RLS) enabled on all tables
- User authentication required
- Data isolation per shop owner
- Secure API endpoints

## Performance

- Optimized database queries
- Indexed columns for fast lookups
- Efficient forecasting algorithms
- Responsive UI components

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
