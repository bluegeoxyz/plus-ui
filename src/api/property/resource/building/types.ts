export interface BuildingVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  buildingCode: string;
  buildingName: string;
  buildingType?: string;
  aboveGroundFloors?: number;
  undergroundFloors?: number;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface BuildingForm {
  id?: number | string;
  projectId?: number | string;
  buildingCode: string;
  buildingName: string;
  buildingType?: string;
  aboveGroundFloors?: number;
  undergroundFloors?: number;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface BuildingQuery extends PageQuery {
  projectId?: number | string;
  buildingCode?: string;
  buildingName?: string;
  status?: string;
}

export interface BuildingStatusForm {
  id: number | string;
  status: string;
}

export interface BuildingOptionVO {
  id: number | string;
  projectId: number | string;
  buildingCode: string;
  buildingName: string;
}
