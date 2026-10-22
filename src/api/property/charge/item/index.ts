import type { PageResult } from '@/api/types';
import type { ProjectOptionVO } from '@/api/property/project/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type { ChargeItemForm, ChargeItemOptionVO, ChargeItemQuery, ChargeItemStatusForm, ChargeItemVO } from './types';

const baseUrl = '/property/charge/item';

export const listChargeItem = (query: ChargeItemQuery): AxiosPromise<PageResult<ChargeItemVO>> =>
  request({ url: `${baseUrl}/list`, method: 'get', params: query });
export const getChargeItem = (id: number | string): AxiosPromise<ChargeItemVO> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });
export const addChargeItem = (data: ChargeItemForm) => request({ url: baseUrl, method: 'post', data });
export const updateChargeItem = (data: ChargeItemForm) => request({ url: baseUrl, method: 'put', data });
export const changeChargeItemStatus = (data: ChargeItemStatusForm) =>
  request({ url: `${baseUrl}/changeStatus`, method: 'put', data });
export const delChargeItem = (ids: number | string | (number | string)[]) =>
  request({ url: `${baseUrl}/${ids}`, method: 'delete' });
export const exportChargeItem = (query: ChargeItemQuery) =>
  download(`${baseUrl}/export`, query, `charge_item_${Date.now()}.xlsx`);
export const chargeItemOptions = (query?: Pick<ChargeItemQuery, 'projectId' | 'chargeType' | 'chargeCategory' | 'chargeObjectType'>): AxiosPromise<ChargeItemOptionVO[]> =>
  request({ url: `${baseUrl}/options`, method: 'get', params: query });
export const financeProjectOptions = (): AxiosPromise<ProjectOptionVO[]> =>
  request({ url: `${baseUrl}/project-options`, method: 'get' });
