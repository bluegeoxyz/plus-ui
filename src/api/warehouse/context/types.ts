export interface DocumentWarehouseOptionVO {
  id: number | string;
  companyId: number | string;
  projectId?: number | string;
  warehouseScope: string;
  warehouseCode: string;
  warehouseName: string;
}

export interface ContextCompanyOptionVO {
  deptId: number | string;
  deptName: string;
}

export interface ContextMaterialCategoryOptionVO {
  id: number | string;
  companyId: number | string;
  parentId: number | string;
  categoryCode: string;
  categoryName: string;
  children?: ContextMaterialCategoryOptionVO[];
}

export interface DocumentZoneOptionVO {
  id: number | string;
  warehouseId: number | string;
  zoneCode: string;
  zoneName: string;
}

export interface DocumentLocationOptionVO {
  id: number | string;
  warehouseId: number | string;
  zoneId: number | string;
  zoneName: string;
  locationCode: string;
  locationName: string;
}

export interface DocumentMaterialOptionVO {
  id: number | string;
  companyId: number | string;
  materialCode: string;
  materialName: string;
  baseUnitId: number | string;
  specification?: string;
  model?: string;
  unitName: string;
  unitSymbol?: string;
  precisionScale: number;
}

export interface DocumentInventoryOptionVO {
  warehouseId: number | string;
  locationId: number | string;
  materialId: number | string;
  quantity: number;
  lockedQuantity: number;
  availableQuantity: number;
}
