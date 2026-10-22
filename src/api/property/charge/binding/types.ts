export interface ChargeBindingVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  projectName?: string;
  objectType: string;
  objectId: number | string;
  roomName?: string;
  chargeItemId: number | string;
  chargeItemName?: string;
  chargeRuleId: number | string;
  chargeRuleName?: string;
  billingMethod?: string;
  billingCycle?: string;
  priceCycle?: string;
  cycleMode?: string;
  dueDateMode?: string;
  dueDateOffsetDays?: number;
  unitPrice?: number;
  fixedAmount?: number;
  ruleEffectiveStartDate?: string;
  ruleEffectiveEndDate?: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  status: string;
  sort?: number;
  remark?: string;
}

export interface ChargeBindingForm {
  id?: number | string;
  projectId?: number | string;
  objectType?: string;
  objectId?: number | string;
  chargeItemId?: number | string;
  chargeRuleId?: number | string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  status?: string;
  sort?: number;
  remark?: string;
}

export interface ChargeBindingStatusForm {
  id: number | string;
  status: string;
  effectiveEndDate?: string;
}

export interface ChargeBindingBatchForm {
  projectId: number | string;
  roomIds: (number | string)[];
  chargeItemId?: number | string;
  chargeRuleId?: number | string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  sort?: number;
  remark?: string;
}

export interface ChargeBindingBatchFailureVO { roomId: number | string; roomName: string; reasonCode: string; reasonMessage: string; }
export interface ChargeBindingBatchResultVO { totalCount: number; successCount: number; failedCount: number; failures: ChargeBindingBatchFailureVO[]; }

export interface ChargeBindingProjectOptionVO { id: number | string; projectCode: string; projectName: string; }
export interface ChargeBindingBuildingOptionVO { id: number | string; projectId: number | string; buildingCode: string; buildingName: string; }
export interface ChargeBindingUnitOptionVO { id: number | string; projectId: number | string; buildingId: number | string; unitCode: string; unitName: string; }
export interface ChargeBindingRoomOptionVO { id: number | string; projectId: number | string; buildingId: number | string; unitId: number | string; roomCode: string; roomNo: string; floorNo?: number; }
