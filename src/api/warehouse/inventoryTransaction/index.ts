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
import type { InventoryTransactionQuery, InventoryTransactionVO } from './types';
const baseUrl = '/warehouse/inventoryTransaction';
export const listInventoryTransaction = (
  params: InventoryTransactionQuery
): AxiosPromise<PageResult<InventoryTransactionVO>> => request({ url: `${baseUrl}/list`, method: 'get', params });
export const getInventoryTransaction = (id: number | string): AxiosPromise<InventoryTransactionVO> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });
export const inventoryTransactionCompanyOptions = (): AxiosPromise<ContextCompanyOptionVO[]> =>
  request({ url: `${baseUrl}/context/companies`, method: 'get' });
export const inventoryTransactionWarehouseOptions = (): AxiosPromise<DocumentWarehouseOptionVO[]> =>
  request({ url: `${baseUrl}/context/warehouses`, method: 'get' });
export const inventoryTransactionCategoryOptions = (
  companyId?: number | string
): AxiosPromise<ContextMaterialCategoryOptionVO[]> =>
  request({ url: `${baseUrl}/context/categories`, method: 'get', params: { companyId } });
export const inventoryTransactionZoneOptions = (warehouseId: number | string): AxiosPromise<DocumentZoneOptionVO[]> =>
  request({ url: `${baseUrl}/context/zones`, method: 'get', params: { warehouseId } });
export const inventoryTransactionLocationOptions = (
  warehouseId: number | string,
  zoneId?: number | string
): AxiosPromise<DocumentLocationOptionVO[]> =>
  request({ url: `${baseUrl}/context/locations`, method: 'get', params: { warehouseId, zoneId } });
export const inventoryTransactionMaterialOptions = (
  warehouseId: number | string
): AxiosPromise<DocumentMaterialOptionVO[]> =>
  request({ url: `${baseUrl}/context/materials`, method: 'get', params: { warehouseId } });
