export interface PaymentQuery extends PageQuery {
  projectId?: number | string;
  roomId?: number | string;
  paymentNo?: string;
  roomKeyword?: string;
  payerKeyword?: string;
  paymentMethod?: string;
  status?: string;
  paymentTimeFrom?: string;
  paymentTimeTo?: string;
}

export interface PaymentCreateForm {
  projectId: number | string;
  roomId: number | string;
  payerCustomerId?: number | string;
  payerName?: string;
  payerType?: string;
  paymentAmount: number;
  paymentMethod: string;
  transactionNo?: string;
  paymentTime: string;
  remark?: string;
}

export interface PaymentRoomOptionVO {
  roomId: number | string;
  roomFullName: string;
  outstandingAmount: number;
  unpaidCount: number;
  earliestDueDate?: string;
}

export interface PaymentCustomerOptionVO { id:number|string; customerNo:string; customerType:string; customerName:string; mobile?:string; }
export interface PaymentReceivableOptionVO { id:number|string; receivableNo:string; projectId:number|string; roomId:number|string; chargeItemNameSnapshot?:string; responsibleCustomerNameSnapshot?:string; periodStartDate:string; periodEndDate:string; dueDate:string; receivableAmount:number; paidAmount:number; outstandingAmount:number; paymentStatus:string; }

export interface PaymentAllocationVO {
  id: number | string;
  receivableId: number | string;
  receivableNo: string;
  chargeItemNameSnapshot?: string;
  responsibleCustomerNameSnapshot?: string;
  periodStart: string;
  periodEnd: string;
  allocationAmount: number;
  allocationTime: string;
  receivablePaidAmount: number;
  receivableOutstandingAmount: number;
  paymentStatus: string;
}

export interface PaymentReversalVO {
  id: number | string;
  reversalNo: string;
  reversalAmount: number;
  reversalTime: string;
  reason: string;
  createBy?: number | string;
  createByName?: string;
}

export interface PaymentReverseForm {
  reason: string;
}

export interface PaymentReverseReceivableVO {
  receivableId: number | string;
  receivableNo: string;
  reversedAllocationAmount: number;
  paidAmountAfter: number;
  outstandingAmountAfter: number;
  paymentStatusAfter: string;
}

export interface PaymentReverseResultVO {
  paymentId: number | string;
  paymentNo: string;
  reversalId: number | string;
  reversalNo: string;
  reversalAmount: number;
  reversalTime: string;
  reason: string;
  paymentStatus: string;
  affectedReceivableCount: number;
  receivables: PaymentReverseReceivableVO[];
}

export interface PaymentVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  projectName?: string;
  paymentNo: string;
  roomId: number | string;
  roomFullNameSnapshot: string;
  payerCustomerId?: number | string;
  payerNameSnapshot: string;
  payerTypeSnapshot?: string;
  paymentAmount: number;
  allocatedAmount: number;
  paymentMethod: string;
  transactionNo?: string;
  paymentTime: string;
  status: string;
  createByName?: string;
  remark?: string;
  allocations?: PaymentAllocationVO[];
  reversal?: PaymentReversalVO;
}
