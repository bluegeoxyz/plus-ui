export type RelationStatus = 'PENDING' | 'ACTIVE' | 'ENDED';
export type RelationType = 'OWNER' | 'TENANT' | 'FAMILY' | 'RESIDENT' | 'CONTACT' | 'OTHER';

export interface RoomCustomerRelationVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  roomId: number | string;
  customerId: number | string;
  buildingCode?: string;
  buildingName?: string;
  unitCode?: string;
  unitName?: string;
  roomCode?: string;
  roomNo?: string;
  customerNo?: string;
  customerName?: string;
  mobile?: string;
  relationType: RelationType;
  isPrimary: string;
  startDate: string;
  endDate?: string;
  moveInDate?: string;
  moveOutDate?: string;
  relationStatus: RelationStatus;
  status: string;
  remark?: string;
}

export interface RoomCustomerRelationForm {
  id?: number | string;
  projectId?: number | string;
  roomId?: number | string;
  customerId?: number | string;
  relationType?: RelationType;
  isPrimary?: string;
  startDate?: string;
  remark?: string;
}

export interface RoomCustomerRelationQuery extends PageQuery {
  projectId?: number | string;
  roomId?: number | string;
  customerId?: number | string;
  relationType?: RelationType;
  relationStatus?: RelationStatus;
  status?: string;
}

export interface RoomCustomerMoveInForm { id: number | string; moveInDate: string; }
export interface RoomCustomerMoveOutForm { id: number | string; moveOutDate: string; }

export interface CustomerReferenceOptionVO {
  id: number | string;
  customerNo: string;
  customerType: string;
  customerName: string;
  mobile?: string;
}

export interface CustomerRelationProjectOptionVO {
  id: number | string;
  projectCode: string;
  projectName: string;
  projectShortName?: string;
}

export interface CustomerRelationBuildingOptionVO {
  id: number | string;
  projectId: number | string;
  buildingCode: string;
  buildingName: string;
}

export interface CustomerRelationUnitOptionVO {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitCode: string;
  unitName: string;
}

export interface CustomerRelationRoomOptionVO {
  id: number | string;
  projectId: number | string;
  buildingId: number | string;
  unitId: number | string;
  roomCode: string;
  roomNo: string;
  floorNo?: number;
}

export interface RelationImportError {
  rowNumber?: number;
  field?: string;
  message: string;
}

export interface RelationImportResult {
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: RelationImportError[];
}
