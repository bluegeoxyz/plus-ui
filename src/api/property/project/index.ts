import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ProjectForm, ProjectOptionVO, ProjectQuery, ProjectVO } from './types';

export const listProject = (query: ProjectQuery): AxiosPromise<PageResult<ProjectVO>> =>
  request({ url: '/property/project/list', method: 'get', params: query });

export const getProject = (id: number | string): AxiosPromise<ProjectVO> =>
  request({ url: `/property/project/${id}`, method: 'get' });

export const addProject = (data: ProjectForm) => request({ url: '/property/project', method: 'post', data });

export const updateProject = (data: ProjectForm) => request({ url: '/property/project', method: 'put', data });

export const delProject = (ids: number | string | (number | string)[]) =>
  request({ url: `/property/project/${ids}`, method: 'delete' });

export const changeProjectStatus = (id: number | string, status: string) =>
  request({ url: '/property/project/changeStatus', method: 'put', data: { id, status } });

export const projectOptions = (): AxiosPromise<ProjectOptionVO[]> =>
  request({ url: '/property/project/options', method: 'get' });

/** PROJECT_BASE business candidates only; never use management options as a working-project source. */
export const businessProjectOptions = (): AxiosPromise<ProjectOptionVO[]> =>
  request({ url: '/property/project/business-options', method: 'get' });
