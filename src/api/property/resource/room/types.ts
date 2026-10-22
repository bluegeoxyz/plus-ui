export interface RoomVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitId: number | string;
  roomCode: string;
  roomNo: string;
  floorNo?: number;
  roomType?: string;
  propertyType?: string;
  buildingArea?: number;
  usableArea?: number;
  deliveryStatus?: string;
  occupancyStatus?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface RoomForm {
  id?: number | string;
  projectId?: number | string;
  buildingId?: number | string;
  unitId?: number | string;
  roomCode: string;
  roomNo: string;
  floorNo?: number;
  roomType?: string;
  propertyType?: string;
  buildingArea?: number;
  usableArea?: number;
  deliveryStatus?: string;
  occupancyStatus?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export interface RoomQuery extends PageQuery {
  projectId?: number | string;
  buildingId?: number | string;
  unitId?: number | string;
  roomCode?: string;
  roomNo?: string;
  status?: string;
}

export interface RoomStatusForm {
  id: number | string;
  status: string;
}

export interface RoomOptionVO {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitId: number | string;
  roomCode: string;
  roomNo: string;
}
