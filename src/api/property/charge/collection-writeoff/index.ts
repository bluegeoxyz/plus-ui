import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ReviewDetail } from '../collection-review';
import type { Id, Registration, Result } from '../collection/types';
export interface FinancePayment {
  id: Id;
  paymentNo: string;
  sourceRegistrationId: Id;
  sourceRegistrationNo: string;
  sourceType: string;
  collectorUserId: Id;
  reviewerUserId: Id;
  writerUserId: Id;
  writtenOffAt: string;
  status: string;
  paymentAmount: string;
  allocatedAmount: string;
  allocations: {
    id: Id;
    receivableId: Id;
    receivableNo: string;
    allocationAmount: string;
    receivablePaidAmount: string;
    receivableOutstandingAmount: string;
    paymentStatus: string;
  }[];
  reversal?: { id: Id; reversalNo: string; reversalAmount: string; reversalTime: string; reason: string };
}
export type { ReviewDetail } from '../collection-review';
export interface Arrival {
  actualReceivedAmount: string;
  actualReceivedTime: string;
  arrivalProofOssIds: Id[];
  arrivalConfirmed: boolean;
}
const base = '/property/collection-writeoff';
export const listReviews = (params: Record<string, unknown>): AxiosPromise<PageResult<Registration>> =>
  request({ url: `${base}/list`, params });
export const getReview = (id: Id, version?: number): AxiosPromise<ReviewDetail> =>
  request({ url: version ? `${base}/${id}/versions/${version}` : `${base}/${id}` });
export const decideReview = (
  row: Registration,
  action: 'write-off' | 'return',
  requestKey: string,
  reason: string,
  arrival: Arrival
): AxiosPromise<Result> =>
  request({
    url: `${base}/${row.id}/${action}`,
    method: 'post',
    headers: { repeatSubmit: false },
    data: {
      requestKey,
      expectedContentVersion: row.contentVersion,
      expectedRowVersion: row.rowVersion,
      ...(action === 'return' ? { reason } : arrival)
    }
  });
export const downloadReviewProof = (id: Id, attachmentId: Id): Promise<Blob> =>
  request({ url: `${base}/${id}/attachments/${attachmentId}`, responseType: 'blob' }) as unknown as Promise<Blob>;
export const uploadArrival = (projectId: Id, file: File): AxiosPromise<{ ossId: Id; fileName: string }> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: `${base}/attachments/upload`,
    method: 'post',
    params: { projectId },
    data,
    headers: { repeatSubmit: false }
  });
};
export const getPayment = (id: Id): AxiosPromise<FinancePayment> => request({ url: `${base}/${id}/payment` });
