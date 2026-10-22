import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ProjectMemberForm, ProjectMemberOptionVO, ProjectMemberQuery, ProjectMemberVO } from './types';

export const listProjectMember = (query: ProjectMemberQuery): AxiosPromise<PageResult<ProjectMemberVO>> =>
  request({ url: '/property/project/member/list', method: 'get', params: query });

export const getProjectMember = (id: number | string): AxiosPromise<ProjectMemberVO> =>
  request({ url: `/property/project/member/${id}`, method: 'get' });

export const addProjectMember = (data: ProjectMemberForm) =>
  request({ url: '/property/project/member', method: 'post', data });

export const updateProjectMember = (data: ProjectMemberForm) =>
  request({ url: '/property/project/member', method: 'put', data });

export const endProjectMember = (id: number | string, endDate?: string) =>
  request({ url: `/property/project/member/${id}/end`, method: 'put', data: endDate ? { endDate } : {} });

export const setProjectMemberManager = (id: number | string) =>
  request({ url: `/property/project/member/${id}/set-manager`, method: 'put' });

export const cancelProjectMemberManager = (id: number | string) =>
  request({ url: `/property/project/member/${id}/cancel-manager`, method: 'put' });

export const delProjectMember = (ids: number | string | (number | string)[]) =>
  request({ url: `/property/project/member/${ids}`, method: 'delete' });

export const projectMemberOptions = (projectId?: number | string): AxiosPromise<ProjectMemberOptionVO[]> =>
  request({ url: '/property/project/member/options', method: 'get', params: { projectId } });
