-- =====================================================
-- 库存管理系统 数据库 Schema
-- =====================================================

-- 产品表
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL DEFAULT '未分类',
  unit            text NOT NULL DEFAULT '个',
  current_stock   numeric(10,2) NOT NULL DEFAULT 0,
  low_stock_alert numeric(10,2),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT stock_non_negative CHECK (current_stock >= 0)
);

-- 客户表
CREATE TABLE customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 价格档位表（每客户每产品一条记录）
CREATE TABLE customer_prices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price       numeric(10,2) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- 交易表头（入库/出库）
CREATE TABLE transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL CHECK (type IN ('in', 'out')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id      uuid REFERENCES customers(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- 交易明细（一次可包含多个产品）
CREATE TABLE transaction_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       numeric(10,2) NOT NULL,
  unit_price     numeric(10,2) NOT NULL,
  subtotal       numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 自定义筛选器预设
CREATE TABLE filter_presets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  filter_config jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

-- =====================================================
-- Trigger: 交易明细插入后自动更新库存
-- =====================================================

CREATE OR REPLACE FUNCTION update_stock_on_transaction_item()
RETURNS TRIGGER AS $$
DECLARE
  tx_type text;
BEGIN
  SELECT type INTO tx_type FROM transactions WHERE id = NEW.transaction_id;

  IF tx_type = 'in' THEN
    UPDATE products
    SET current_stock = current_stock + NEW.quantity, updated_at = now()
    WHERE id = NEW.product_id;
  ELSE
    UPDATE products
    SET current_stock = current_stock - NEW.quantity, updated_at = now()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT ON transaction_items
FOR EACH ROW EXECUTE FUNCTION update_stock_on_transaction_item();

-- =====================================================
-- RLS: 允许匿名访问（私有网络使用，无需登录）
-- =====================================================

ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_presets  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_products"        ON products        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customers"       ON customers       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customer_prices" ON customer_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions"    ON transactions    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_items"           ON transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_filter_presets"  ON filter_presets  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 初始化默认筛选器
-- =====================================================

INSERT INTO filter_presets (name, filter_config) VALUES
  ('全部商品', '{}'),
  ('库存不足', '{"stock_below_alert": true}');
