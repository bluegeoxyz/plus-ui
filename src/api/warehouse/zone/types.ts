export interface WarehouseZoneVO extends BaseEntity { id: number | string; warehouseId: number | string; warehouseName?: string; zoneCode: string; zoneName: string; status: string; sort?: number; remark?: string }
export interface WarehouseZoneForm { id?: number | string; warehouseId?: number | string; zoneCode: string; zoneName: string; status: string; sort?: number; remark?: string }
export interface WarehouseZoneQuery extends PageQuery { warehouseId?: number | string; zoneCode?: string; zoneName?: string; status?: string }
export interface WarehouseZoneOptionVO { id: number | string; warehouseId: number | string; zoneCode: string; zoneName: string }
export interface WarehouseZoneStatusForm { id: number | string; status: string }
