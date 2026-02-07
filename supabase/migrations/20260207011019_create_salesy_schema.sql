/*
  # SALESY - AI Demand Forecasting System Schema

  ## New Tables
  
  ### `shops`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references auth.users)
  - `name` (text) - Shop name
  - `category` (text) - Business category (Stationery, Grocery, etc.)
  - `location` (text) - Shop location
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `products`
  - `id` (uuid, primary key)
  - `shop_id` (uuid, references shops)
  - `name` (text) - Product name
  - `category` (text) - Product category (Pen, Pencil, Notebook, etc.)
  - `brand` (text) - Brand name (Apsara, Natraj, DOMS, Cello, Classmate, etc.)
  - `current_stock` (integer) - Current stock level
  - `unit_price` (decimal) - Price per unit
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `sales_data`
  - `id` (uuid, primary key)
  - `product_id` (uuid, references products)
  - `shop_id` (uuid, references shops)
  - `date` (date) - Sale date
  - `quantity_sold` (integer) - Units sold
  - `revenue` (decimal) - Total revenue
  - `is_festival` (boolean) - Festival indicator
  - `created_at` (timestamptz)
  
  ### `forecasts`
  - `id` (uuid, primary key)
  - `product_id` (uuid, references products)
  - `shop_id` (uuid, references shops)
  - `forecast_date` (date) - Date of forecast
  - `predicted_demand` (decimal) - Forecasted demand
  - `recommended_stock` (integer) - Recommended inventory level
  - `safety_stock` (integer) - Safety stock buffer
  - `risk_level` (text) - Low/Medium/High
  - `model_used` (text) - Model name
  - `confidence_score` (decimal) - Forecast confidence
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access data for their own shops
  - All operations require authentication
*/

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  current_stock integer DEFAULT 0,
  unit_price decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_data table
CREATE TABLE IF NOT EXISTS sales_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  quantity_sold integer NOT NULL,
  revenue decimal(10,2) DEFAULT 0,
  is_festival boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  forecast_date date NOT NULL,
  predicted_demand decimal(10,2) NOT NULL,
  recommended_stock integer NOT NULL,
  safety_stock integer NOT NULL,
  risk_level text NOT NULL,
  model_used text NOT NULL,
  confidence_score decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shops
CREATE POLICY "Users can view own shops"
  ON shops FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own shops"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own shops"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own shops"
  ON shops FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for products
CREATE POLICY "Users can view products from own shops"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = products.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create products in own shops"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = products.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in own shops"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = products.shop_id
      AND shops.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = products.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from own shops"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = products.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- RLS Policies for sales_data
CREATE POLICY "Users can view sales data from own shops"
  ON sales_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales_data.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sales data for own shops"
  ON sales_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales_data.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sales data for own shops"
  ON sales_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales_data.shop_id
      AND shops.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales_data.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sales data from own shops"
  ON sales_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales_data.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- RLS Policies for forecasts
CREATE POLICY "Users can view forecasts from own shops"
  ON forecasts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = forecasts.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create forecasts for own shops"
  ON forecasts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = forecasts.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update forecasts for own shops"
  ON forecasts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = forecasts.shop_id
      AND shops.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = forecasts.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete forecasts from own shops"
  ON forecasts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = forecasts.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS shops_owner_id_idx ON shops(owner_id);
CREATE INDEX IF NOT EXISTS products_shop_id_idx ON products(shop_id);
CREATE INDEX IF NOT EXISTS sales_data_product_id_idx ON sales_data(product_id);
CREATE INDEX IF NOT EXISTS sales_data_shop_id_idx ON sales_data(shop_id);
CREATE INDEX IF NOT EXISTS sales_data_date_idx ON sales_data(date);
CREATE INDEX IF NOT EXISTS forecasts_product_id_idx ON forecasts(product_id);
CREATE INDEX IF NOT EXISTS forecasts_shop_id_idx ON forecasts(shop_id);