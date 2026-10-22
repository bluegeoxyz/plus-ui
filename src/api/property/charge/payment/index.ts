import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type { PaymentCreateForm, PaymentCustomerOptionVO, PaymentQuery, PaymentReceivableOptionVO, PaymentReverseForm, PaymentReverseResultVO, PaymentRoomOptionVO, PaymentVO } from './types';

const base = '/property/payment';

export const listPayment = (query: PaymentQuery): AxiosPromise<PageResult<PaymentVO>> =>
  request({ url: `${base}/list`, method: 'get', params: query });

export const getPayment = (id: number | string): AxiosPromise<PaymentVO> =>
  request({ url: `${base}/${id}`, method: 'get' });

export const addPayment = (data: PaymentCreateForm): AxiosPromise<PaymentVO> =>
  request({ url: base, method: 'post', data });

export const reversePayment = (id: number | string, data: PaymentReverseForm): AxiosPromise<PaymentReverseResultVO> =>
  request({ url: `${base}/${id}/reverse`, method: 'post', data });

export const paymentRoomOptions = (projectId: number | string): AxiosPromise<PaymentRoomOptionVO[]> =>
  request({ url: `${base}/room-options`, method: 'get', params: { projectId } });
export const paymentContextRooms = (projectId: number | string): AxiosPromise<PaymentRoomOptionVO[]> => request({ url: `${base}/context/create/rooms`, method: 'get', params: { projectId } });
export const paymentContextCustomers = (projectId: number | string, keyword: string): AxiosPromise<PaymentCustomerOptionVO[]> => request({ url: `${base}/context/create/customers`, method: 'get', params: { projectId, keyword } });
export const paymentContextReceivables = (projectId: number | string, roomId: number | string): AxiosPromise<PaymentReceivableOptionVO[]> => request({ url: `${base}/context/create/receivables`, method: 'get', params: { projectId, roomId } });

export const exportPayment = (query: PaymentQuery) =>
  download(`${base}/export`, query, `payment_${Date.now()}.xlsx`);
