import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type { BuildingForm, BuildingOptionVO, BuildingQuery, BuildingStatusForm, BuildingVO } from './types';
import type { ProjectOptionVO } from '@/api/property/project/types';

export const listBuilding = (query: BuildingQuery): AxiosPromise<PageResult<BuildingVO>> =>
  request({ url: '/property/resource/building/list', method: 'get', params: query });

export const getBuilding = (id: number | string): AxiosPromise<BuildingVO> =>
  request({ url: `/property/resource/building/${id}`, method: 'get' });

export const addBuilding = (data: BuildingForm) =>
  request({ url: '/property/resource/building', method: 'post', data });

export const updateBuilding = (data: BuildingForm) =>
  request({ url: '/property/resource/building', method: 'put', data });

export const changeBuildingStatus = (data: BuildingStatusForm) =>
  request({ url: '/property/resource/building/changeStatus', method: 'put', data });

export const delBuilding = (ids: number | string | (number | string)[]) =>
  request({ url: `/property/resource/building/${ids}`, method: 'delete' });

export const exportBuilding = (query: BuildingQuery) =>
  download('/property/resource/building/export', query, `building_${Date.now()}.xlsx`);

export const buildingOptions = (query?: Pick<BuildingQuery, 'projectId'>): AxiosPromise<BuildingOptionVO[]> =>
  request({ url: '/property/resource/building/options', method: 'get', params: query });

/** 当前用户在 RESOURCE 业务域可访问的项目候选，仅用于页面交互验证。 */
export const resourceProjectOptions = (): AxiosPromise<ProjectOptionVO[]> =>
  request({ url: '/property/resource/building/project-options', method: 'get' });
