export interface ChargeItemVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  projectName?: string;
  itemCode: string;
  itemName: string;
  chargeType: string;
  chargeCategory: string;
  chargeObjectType: string;
  status: string;
  sort?: number;
  remark?: string;
}

export interface ChargeItemForm {
  id?: number | string;
  projectId?: number | string;
  itemCode?: string;
  itemName: string;
  chargeType?: string;
  chargeCategory?: string;
  chargeObjectType?: string;
  status?: string;
  sort?: number;
  remark?: string;
}

export interface ChargeItemQuery extends PageQuery {
  projectId?: number | string;
  itemCode?: string;
  itemName?: string;
  chargeType?: string;
  chargeCategory?: string;
  chargeObjectType?: string;
  status?: string;
}

export interface ChargeItemOptionVO {
  id: number | string;
  projectId: number | string;
  itemCode: string;
  itemName: string;
  chargeType: string;
  chargeCategory: string;
  chargeObjectType: string;
}

export interface ChargeItemStatusForm { id: number | string; status: string }
