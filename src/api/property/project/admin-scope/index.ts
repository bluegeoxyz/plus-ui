import type { PageResult } from '@/api/types'; import type { AxiosPromise } from '@/utils/api-types'; import request from '@/utils/request'; import type { ProjectManagementGrantForm, ProjectManagementGrantVO } from './types';
export const listProjectManagementGrants = (params: PageQuery): AxiosPromise<PageResult<ProjectManagementGrantVO>> => request({ url: '/property/project/admin-scope/list', method: 'get', params });
export const addProjectManagementGrant = (data: ProjectManagementGrantForm) => request({ url: '/property/project/admin-scope', method: 'post', data });
export const changeProjectManagementGrantStatus = (id: number | string, data: Pick<ProjectManagementGrantVO, 'status' | 'version'>) => request({ url: `/property/project/admin-scope/${id}/status`, method: 'put', data });
export const revokeProjectManagementGrant = (id: number | string, version: number) => request({ url: `/property/project/admin-scope/${id}`, method: 'delete', params: { version } });
