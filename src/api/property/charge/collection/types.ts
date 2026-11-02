export type Id = string | number;
export type Status = 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PENDING_WRITE_OFF' | 'WRITTEN_OFF' | 'CANCELLED';
export interface Content {
  projectId: Id;
  roomId: Id;
  payerCustomerId?: Id;
  payerName?: string;
  payerType?: string;
  registeredAmount?: string;
  paymentMethod?: string;
  paymentTime?: string;
  transactionNo?: string;
  remark?: string;
  details: { receivableId: Id; plannedAllocationAmount: string }[];
  attachments: { ossId: Id }[];
}
export interface Registration {
  id: Id;
  projectId: Id;
  roomId: Id;
  registrationNo: string;
  roomFullNameSnapshot?: string;
  payerCustomerId?: Id;
  payerNameSnapshot?: string;
  payerTypeSnapshot?: string;
  registeredAmount?: string;
  paymentMethod?: string;
  paymentTime?: string;
  transactionNo?: string;
  remark?: string;
  registrarUserId: Id;
  status: Status;
  contentVersion: number;
  rowVersion: Id;
  firstSubmittedAt?: string;
  submittedAt?: string;
  submitterUserId?: Id;
  reviewedBy?: Id;
  reviewedAt?: string;
  approvedContentVersion?: number;
  paymentId?: Id;
  actualReceivedAmount?: string;
  actualReceivedTime?: string;
  writtenOffBy?: Id;
  writtenOffAt?: string;
  lastReturnReason?: string;
}
export interface Attachment {
  attachmentType?: 'PAYMENT_PROOF' | 'ARRIVAL_PROOF';
  id: Id;
  ossId: Id;
  contentVersion: number;
  fileNameSnapshot: string;
}
export interface Detail {
  registration: Registration;
  details: {
    receivableId: Id;
    receivableNoSnapshot: string;
    chargeItemNameSnapshot?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    plannedAllocationAmount: string;
    receivableAmountSnapshot: string;
    paidAmountSnapshot: string;
    outstandingAmountSnapshot: string;
  }[];
  attachments: Attachment[];
  logs: {
    id: Id;
    contentVersion: number;
    action: string;
    fromStatus: string;
    toStatus: string;
    occurredAt: string;
    reason?: string;
    actorUserId?: Id;
    actorNameSnapshot?: string;
  }[];
}
export interface Result {
  registrationId: Id;
  registrationNo: string;
  status: Status;
  contentVersion: number;
  rowVersion: Id;
  replayed: boolean;
}
export interface Option {
  id: Id;
  label: string;
}
export interface Receivable {
  id: Id;
  receivableNo: string;
  chargeItem?: string;
  receivableAmount: string;
  paidAmount: string;
  outstandingAmount: string;
}
