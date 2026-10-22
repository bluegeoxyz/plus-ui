import type { PageResult } from '@/api/types';
import type {
  ContextCompanyOptionVO,
  ContextMaterialCategoryOptionVO,
  DocumentLocationOptionVO,
  DocumentMaterialOptionVO,
  DocumentWarehouseOptionVO,
  DocumentZoneOptionVO
} from '@/api/warehouse/context/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { InventoryQuery, InventorySummaryVO, InventoryVO } from './types';
const baseUrl = '/warehouse/inventory';
export const listInventory = (params: InventoryQuery): AxiosPromise<PageResult<InventoryVO>> =>
  request({ url: `${baseUrl}/list`, method: 'get', params });
export const listInventorySummary = (params: InventoryQuery): AxiosPromise<PageResult<InventorySummaryVO>> =>
  request({ url: `${baseUrl}/summary`, method: 'get', params });
export const getInventory = (id: number | string): AxiosPromise<InventoryVO> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });
export const inventoryCompanyOptions = (): AxiosPromise<ContextCompanyOptionVO[]> =>
  request({ url: `${baseUrl}/context/companies`, method: 'get' });
export const inventoryWarehouseOptions = (): AxiosPromise<DocumentWarehouseOptionVO[]> =>
  request({ url: `${baseUrl}/context/warehouses`, method: 'get' });
export const inventoryCategoryOptions = (
  companyId?: number | string
): AxiosPromise<ContextMaterialCategoryOptionVO[]> =>
  request({ url: `${baseUrl}/context/categories`, method: 'get', params: { companyId } });
export const inventoryZoneOptions = (warehouseId: number | string): AxiosPromise<DocumentZoneOptionVO[]> =>
  request({ url: `${baseUrl}/context/zones`, method: 'get', params: { warehouseId } });
export const inventoryLocationOptions = (
  warehouseId: number | string,
  zoneId?: number | string
): AxiosPromise<DocumentLocationOptionVO[]> =>
  request({ url: `${baseUrl}/context/locations`, method: 'get', params: { warehouseId, zoneId } });
export const inventoryMaterialOptions = (warehouseId: number | string): AxiosPromise<DocumentMaterialOptionVO[]> =>
  request({ url: `${baseUrl}/context/materials`, method: 'get', params: { warehouseId } });
