import type { PageResult } from '@/api/types';
import type { DocumentMaterialOptionVO, DocumentWarehouseOptionVO } from '@/api/warehouse/context/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { InventoryQuery, InventorySummaryVO } from './types';

export interface InventoryStatistics {
  lowCount: number;
  highCount: number;
  normalCount: number;
  warningCount: number;
}
export interface InventoryThreshold {
  warehouseId: number | string;
  materialId: number | string;
  safetyStock: string;
  upperStock: string;
  precisionScale: number;
  thresholdSource: 'MATERIAL_DEFAULT' | 'WAREHOUSE_OVERRIDE';
  version?: number;
}
const base = '/warehouse/inventory';
export const listWarnings = (params: InventoryQuery): AxiosPromise<PageResult<InventorySummaryVO>> =>
  request({ url: `${base}/warnings`, method: 'get', params });
export const warningStatistics = (params: Partial<InventoryQuery>): AxiosPromise<InventoryStatistics> =>
  request({ url: `${base}/warnings/statistics`, method: 'get', params });
export const warningWarehouses = (): AxiosPromise<DocumentWarehouseOptionVO[]> =>
  request({ url: `${base}/warnings/context/warehouses`, method: 'get' });
export const thresholdWarehouses = (): AxiosPromise<DocumentWarehouseOptionVO[]> =>
  request({ url: `${base}/threshold/context/warehouses`, method: 'get' });
export const thresholdMaterials = (warehouseId: number | string): AxiosPromise<DocumentMaterialOptionVO[]> =>
  request({ url: `${base}/threshold/context/materials`, method: 'get', params: { warehouseId } });
export const getThreshold = (
  warehouseId: number | string,
  materialId: number | string
): AxiosPromise<InventoryThreshold> =>
  request({ url: `${base}/threshold`, method: 'get', params: { warehouseId, materialId } });
export const saveThreshold = (data: InventoryThreshold): AxiosPromise<void> =>
  request({ url: `${base}/threshold`, method: 'put', data });
