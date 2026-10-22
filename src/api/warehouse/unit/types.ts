export interface UnitVO extends BaseEntity { id: number | string; unitCode: string; unitName: string; symbol?: string; precisionScale: number; status: string; sort?: number; remark?: string }
export interface UnitForm { id?: number | string; unitCode: string; unitName: string; symbol?: string; precisionScale: number; status: string; sort?: number; remark?: string }
export interface UnitQuery extends PageQuery { unitCode?: string; unitName?: string; status?: string }
export interface UnitOptionVO { id: number | string; unitCode: string; unitName: string; symbol?: string; precisionScale: number }
