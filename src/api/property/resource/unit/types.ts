export interface BuildingUnitVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitCode: string;
  unitName: string;
  floorCount?: number;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface BuildingUnitForm {
  id?: number | string;
  projectId?: number | string;
  buildingId?: number | string;
  unitCode: string;
  unitName: string;
  floorCount?: number;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface BuildingUnitQuery extends PageQuery {
  projectId?: number | string;
  buildingId?: number | string;
  unitCode?: string;
  unitName?: string;
  status?: string;
}

export interface BuildingUnitStatusForm {
  id: number | string;
  status: string;
}

export interface BuildingUnitOptionVO {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitCode: string;
  unitName: string;
}
