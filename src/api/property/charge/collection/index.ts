import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { Content, Detail, Id, Option, Receivable, Registration, Result } from './types';
const base = '/property/collection-registration';
export const listRegistrations = (params: Record<string, unknown>): AxiosPromise<PageResult<Registration>> =>
  request({ url: `${base}/list`, params });
export const getRegistration = (id: Id): AxiosPromise<Detail> => request({ url: `${base}/${id}` });
export const saveRegistration = (content: Content, requestKey: string, existing?: Registration): AxiosPromise<Result> =>
  request({
    url: existing ? `${base}/${existing.id}` : base,
    method: existing ? 'put' : 'post',
    headers: { repeatSubmit: false },
    data: {
      requestKey,
      content,
      ...(existing ? { expectedContentVersion: existing.contentVersion, expectedRowVersion: existing.rowVersion } : {})
    }
  });
export const submitRegistration = (row: Registration, requestKey: string): AxiosPromise<Result> =>
  request({
    url: `${base}/${row.id}/submit`,
    method: 'post',
    headers: { repeatSubmit: false },
    data: { requestKey, expectedContentVersion: row.contentVersion, expectedRowVersion: row.rowVersion }
  });
export const cancelRegistration = (row: Registration, requestKey: string, reason: string): AxiosPromise<Result> =>
  request({
    url: `${base}/${row.id}/cancel`,
    method: 'post',
    headers: { repeatSubmit: false },
    data: { requestKey, expectedContentVersion: row.contentVersion, expectedRowVersion: row.rowVersion, reason }
  });
export const collectionRooms = (projectId: Id, keyword = ''): AxiosPromise<Option[]> =>
  request({ url: `${base}/context/rooms`, params: { projectId, keyword } });
export const collectionCustomers = (projectId: Id, keyword: string): AxiosPromise<Option[]> =>
  request({ url: `${base}/context/customers`, params: { projectId, keyword } });
export const collectionReceivables = (projectId: Id, roomId: Id): AxiosPromise<Receivable[]> =>
  request({ url: `${base}/context/receivables`, params: { projectId, roomId } });
export const uploadProof = (projectId: Id, file: File): AxiosPromise<{ ossId: Id; fileName: string }> => {
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
export const downloadProof = (id: Id, attachmentId: Id): Promise<Blob> =>
  request({ url: `${base}/${id}/attachments/${attachmentId}`, responseType: 'blob' }) as unknown as Promise<Blob>;

export const getRegistrationVersion = (id: Id, version: number): AxiosPromise<Detail> =>
  request({ url: `${base}/${id}/versions/${version}` });
