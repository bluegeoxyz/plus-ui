import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type {
  BuildingUnitForm,
  BuildingUnitOptionVO,
  BuildingUnitQuery,
  BuildingUnitStatusForm,
  BuildingUnitVO
} from './types';

export const listBuildingUnit = (query: BuildingUnitQuery): AxiosPromise<PageResult<BuildingUnitVO>> =>
  request({ url: '/property/resource/unit/list', method: 'get', params: query });

export const getBuildingUnit = (id: number | string): AxiosPromise<BuildingUnitVO> =>
  request({ url: `/property/resource/unit/${id}`, method: 'get' });

export const addBuildingUnit = (data: BuildingUnitForm) =>
  request({ url: '/property/resource/unit', method: 'post', data });

export const updateBuildingUnit = (data: BuildingUnitForm) =>
  request({ url: '/property/resource/unit', method: 'put', data });

export const changeBuildingUnitStatus = (data: BuildingUnitStatusForm) =>
  request({ url: '/property/resource/unit/changeStatus', method: 'put', data });

export const delBuildingUnit = (ids: number | string | (number | string)[]) =>
  request({ url: `/property/resource/unit/${ids}`, method: 'delete' });

export const exportBuildingUnit = (query: BuildingUnitQuery) =>
  download('/property/resource/unit/export', query, `building_unit_${Date.now()}.xlsx`);

export const buildingUnitOptions = (query: Pick<BuildingUnitQuery, 'projectId' | 'buildingId'>): AxiosPromise<BuildingUnitOptionVO[]> =>
  request({ url: '/property/resource/unit/options', method: 'get', params: query });
