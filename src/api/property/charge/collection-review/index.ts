import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { Detail, Id, Registration, Result, Status } from '../collection/types';
export interface ReviewDetail {
  snapshot: Detail;
  currentStatus: Status;
  latestSubmittedVersion: number;
  submittedVersions: number[];
  latestBills: {
    receivableId: Id;
    paymentStatus?: string;
    available: boolean;
    balanceChanged: boolean;
    receivableAmount?: string;
    paidAmount?: string;
    outstandingAmount?: string;
    sufficient: boolean;
  }[];
}
const base = '/property/collection-review';
export const listReviews = (params: Record<string, unknown>): AxiosPromise<PageResult<Registration>> =>
  request({ url: `${base}/list`, params });
export const getReview = (id: Id, version?: number): AxiosPromise<ReviewDetail> =>
  request({ url: version ? `${base}/${id}/versions/${version}` : `${base}/${id}` });
export const decideReview = (
  row: Registration,
  action: 'approve' | 'reject',
  requestKey: string,
  reason?: string
): AxiosPromise<Result> =>
  request({
    url: `${base}/${row.id}/${action}`,
    method: 'post',
    headers: { repeatSubmit: false },
    data: {
      requestKey,
      expectedContentVersion: row.contentVersion,
      expectedRowVersion: row.rowVersion,
      ...(action === 'reject' ? { reason } : {})
    }
  });
export const downloadReviewProof = (id: Id, attachmentId: Id): Promise<Blob> =>
  request({ url: `${base}/${id}/attachments/${attachmentId}`, responseType: 'blob' }) as unknown as Promise<Blob>;
