export interface LotEntry {
  id: string;
  lotNumber: string;
  weight: number | undefined;
}

export interface ProductEntry {
  id: string;
  productName: string;
  cost: number | undefined;
  lots: LotEntry[];
}
