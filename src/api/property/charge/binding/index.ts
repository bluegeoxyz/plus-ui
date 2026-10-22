import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ChargeItemOptionVO } from '@/api/property/charge/item/types';
import type { ChargeRuleOptionVO } from '@/api/property/charge/rule/types';
import type { ChargeBindingBatchForm, ChargeBindingBatchResultVO, ChargeBindingBuildingOptionVO, ChargeBindingForm, ChargeBindingProjectOptionVO, ChargeBindingRoomOptionVO, ChargeBindingStatusForm, ChargeBindingUnitOptionVO, ChargeBindingVO } from './types';

const baseUrl = '/property/charge/binding';
export type ChargeBindingOptionMode = 'create' | 'edit';
export const chargeBindingContextItems = (mode: ChargeBindingOptionMode, projectId: number | string): AxiosPromise<ChargeItemOptionVO[]> => request({ url: `${baseUrl}/context/${mode}/items`, method: 'get', params: { projectId } });
export const chargeBindingContextRules = (mode: ChargeBindingOptionMode, projectId: number | string, chargeItemId: number | string): AxiosPromise<ChargeRuleOptionVO[]> => request({ url: `${baseUrl}/context/${mode}/rules`, method: 'get', params: { projectId, chargeItemId } });
export const chargeBindingListProjects = (): AxiosPromise<ChargeBindingProjectOptionVO[]> => request({ url: `${baseUrl}/context/list/projects`, method: 'get' });
export const chargeBindingListBuildings = (projectId: number | string): AxiosPromise<ChargeBindingBuildingOptionVO[]> => request({ url: `${baseUrl}/context/list/buildings`, method: 'get', params: { projectId } });
export const chargeBindingListUnits = (projectId: number | string, buildingId: number | string): AxiosPromise<ChargeBindingUnitOptionVO[]> => request({ url: `${baseUrl}/context/list/units`, method: 'get', params: { projectId, buildingId } });
export const chargeBindingListRooms = (projectId: number | string, buildingId: number | string, unitId: number | string): AxiosPromise<ChargeBindingRoomOptionVO[]> => request({ url: `${baseUrl}/context/list/rooms`, method: 'get', params: { projectId, buildingId, unitId } });

export const listChargeBinding = (roomId: number | string): AxiosPromise<ChargeBindingVO[]> =>
  request({ url: `${baseUrl}/list`, method: 'get', params: { roomId } });
export const getChargeBinding = (id: number | string): AxiosPromise<ChargeBindingVO> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });
export const addChargeBinding = (data: ChargeBindingForm) => request({ url: baseUrl, method: 'post', data });
export const batchAddChargeBinding = (data: ChargeBindingBatchForm): AxiosPromise<ChargeBindingBatchResultVO> => request({ url: `${baseUrl}/batch`, method: 'post', data });
export const updateChargeBinding = (data: ChargeBindingForm) => request({ url: baseUrl, method: 'put', data });
export const changeChargeBindingStatus = (data: ChargeBindingStatusForm) =>
  request({ url: `${baseUrl}/changeStatus`, method: 'put', data });
export const delChargeBinding = (ids: number | string | (number | string)[]) =>
  request({ url: `${baseUrl}/${ids}`, method: 'delete' });
