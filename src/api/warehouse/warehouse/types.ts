export interface ProjectOptionVO { id: number | string; projectCode: string; projectName: string; status: string }
export interface CompanyOptionVO { deptId: number | string; deptName: string; status: string }
export interface WarehouseVO extends BaseEntity { id: number | string; companyId: number | string; companyName?: string; projectId?: number | string; projectName?: string; warehouseScope: string; warehouseCode: string; warehouseName: string; managerId?: number | string; managerName?: string; contactPhone?: string; address?: string; status: string; sort?: number; remark?: string }
export interface WarehouseForm { id?: number | string; companyId?: number | string; projectId?: number | string; warehouseScope: string; warehouseCode: string; warehouseName: string; managerId?: number | string; contactPhone?: string; address?: string; status: string; sort?: number; remark?: string }
export interface WarehouseQuery extends PageQuery { companyId?: number | string; projectId?: number | string; warehouseScope?: string; warehouseCode?: string; warehouseName?: string; status?: string }
export interface WarehouseOptionVO { id: number | string; companyId: number | string; projectId?: number | string; warehouseScope: string; warehouseCode: string; warehouseName: string }
export interface WarehouseStatusForm { id: number | string; status: string }
