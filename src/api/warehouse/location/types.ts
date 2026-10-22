export interface WarehouseLocationVO extends BaseEntity { id: number | string; warehouseId: number | string; warehouseName?: string; zoneId: number | string; zoneName?: string; locationCode: string; locationName: string; status: string; sort?: number; remark?: string }
export interface WarehouseLocationForm { id?: number | string; warehouseId?: number | string; zoneId?: number | string; locationCode: string; locationName: string; status: string; sort?: number; remark?: string }
export interface WarehouseLocationQuery extends PageQuery { warehouseId?: number | string; zoneId?: number | string; locationCode?: string; locationName?: string; status?: string }
export interface WarehouseLocationOptionVO { id: number | string; warehouseId: number | string; zoneId: number | string; locationCode: string; locationName: string }
export interface WarehouseLocationStatusForm { id: number | string; status: string }
