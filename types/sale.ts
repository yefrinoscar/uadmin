export type SaleStatus = "ACTIVE" | "INACTIVE" | "SOLD" | "RESERVED";

export type Sale = {
  id: string;
  name: string;
  status: SaleStatus;
  quantity_sold: number;
  link?: string;
  purchase_date?: string;
  sale_date?: string;
  size?: string;
  total_price_usd: number;
  traveler_cost?: number;
  warehouse_mobility?: number;
  exchange_rate: number;
  peru_price: number;
  sale_price?: number;
  shipping?: number;
  quantity: number;
  profit?: number;
  real_profit?: number;
  created_at: string;
  updated_at: string;
}
