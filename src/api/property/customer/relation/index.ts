import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type {
  CustomerReferenceOptionVO,
  CustomerRelationBuildingOptionVO,
  CustomerRelationProjectOptionVO,
  CustomerRelationRoomOptionVO,
  CustomerRelationUnitOptionVO,
  RoomCustomerMoveInForm,
  RoomCustomerMoveOutForm,
  RoomCustomerRelationForm,
  RoomCustomerRelationQuery,
  RoomCustomerRelationVO,
  RelationImportResult
} from './types';
import { saveBlob } from '@/utils/save';

const baseUrl = '/property/customer-relation';

export const listCustomerRelation = (query: RoomCustomerRelationQuery): AxiosPromise<PageResult<RoomCustomerRelationVO>> =>
  request({ url: `${baseUrl}/list`, method: 'get', params: query });
export const getCustomerRelation = (id: number | string): AxiosPromise<RoomCustomerRelationVO> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });
export const addCustomerRelation = (data: RoomCustomerRelationForm) => request({ url: baseUrl, method: 'post', data });
export const updateCustomerRelation = (data: RoomCustomerRelationForm) => request({ url: baseUrl, method: 'put', data });
export const moveInCustomerRelation = (data: RoomCustomerMoveInForm) => request({ url: `${baseUrl}/move-in`, method: 'put', data });
export const moveOutCustomerRelation = (data: RoomCustomerMoveOutForm) => request({ url: `${baseUrl}/move-out`, method: 'put', data });
export const delCustomerRelation = (ids: number | string | (number | string)[]) => request({ url: `${baseUrl}/${ids}`, method: 'delete' });
export const exportCustomerRelation = (query: RoomCustomerRelationQuery) =>
  download(`${baseUrl}/export`, query, `room_customer_relation_${Date.now()}.xlsx`);
export const customerRelationOptions = (query: RoomCustomerRelationQuery): AxiosPromise<RoomCustomerRelationVO[]> =>
  request({ url: `${baseUrl}/options`, method: 'get', params: query });
export const customerReferenceOptions = (projectId: number | string, keyword: string): AxiosPromise<CustomerReferenceOptionVO[]> =>
  request({ url: `${baseUrl}/customer-options`, method: 'get', params: { projectId, keyword } });
export const customerRelationProjectOptions = (): AxiosPromise<CustomerRelationProjectOptionVO[]> =>
  request({ url: `${baseUrl}/project-options`, method: 'get' });

const contextUrl = `${baseUrl}/context`;
export type CustomerRelationOptionMode = 'list' | 'create';
export const customerRelationContextProjects = (mode: CustomerRelationOptionMode): AxiosPromise<CustomerRelationProjectOptionVO[]> =>
  request({ url: `${contextUrl}/${mode}/projects`, method: 'get' });
export const customerRelationContextBuildings = (mode: CustomerRelationOptionMode, projectId: number | string): AxiosPromise<CustomerRelationBuildingOptionVO[]> =>
  request({ url: `${contextUrl}/${mode}/buildings`, method: 'get', params: { projectId } });
export const customerRelationContextUnits = (mode: CustomerRelationOptionMode, projectId: number | string, buildingId: number | string): AxiosPromise<CustomerRelationUnitOptionVO[]> =>
  request({ url: `${contextUrl}/${mode}/units`, method: 'get', params: { projectId, buildingId } });
export const customerRelationContextRooms = (mode: CustomerRelationOptionMode, projectId: number | string, buildingId: number | string, unitId: number | string): AxiosPromise<CustomerRelationRoomOptionVO[]> =>
  request({ url: `${contextUrl}/${mode}/rooms`, method: 'get', params: { projectId, buildingId, unitId } });
export const customerRelationContextCustomers = (projectId: number | string, keyword: string): AxiosPromise<CustomerReferenceOptionVO[]> =>
  request({ url: `${contextUrl}/create/customers`, method: 'get', params: { projectId, keyword } });
export const importCustomerRelations = (projectId: number | string, file: File): AxiosPromise<RelationImportResult> => {
  const data = new FormData();
  data.append('projectId', String(projectId));
  data.append('file', file);
  return request({ url: `${baseUrl}/import`, method: 'post', data, headers: { repeatSubmit: false } });
};
export const downloadCustomerRelationImportTemplate = async () => {
  const blob = await request({ url: `${baseUrl}/import/template`, method: 'get', responseType: 'blob' });
  saveBlob(new Blob([blob]), `room_customer_relation_import_${Date.now()}.xlsx`);
};
