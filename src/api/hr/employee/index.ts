import type { DeptTreeVO } from '@/api/system/dept/types';
import type { PostVO } from '@/api/system/post/types';
import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  EmployeeBindUserForm,
  EmployeeForm,
  EmployeeOptionVO,
  EmployeeQuery,
  EmployeeUserOptionQuery,
  EmployeeUserOptionVO,
  EmployeeVO
} from './types';

export const listEmployee = (query: EmployeeQuery): AxiosPromise<PageResult<EmployeeVO>> =>
  request({ url: '/hr/employee/list', method: 'get', params: query });

export const getEmployee = (id: number | string): AxiosPromise<EmployeeVO> =>
  request({ url: `/hr/employee/${id}`, method: 'get' });

export const addEmployee = (data: EmployeeForm) => request({ url: '/hr/employee', method: 'post', data });

export const updateEmployee = (data: EmployeeForm) => request({ url: '/hr/employee', method: 'put', data });

export const delEmployee = (ids: number | string | (number | string)[]) =>
  request({ url: `/hr/employee/${ids}`, method: 'delete' });

export const changeEmployeeStatus = (id: number | string, status: string) =>
  request({ url: '/hr/employee/changeStatus', method: 'put', data: { id, status } });

export const bindEmployeeUser = (employeeId: number | string, data: EmployeeBindUserForm) =>
  request({ url: `/hr/employee/${employeeId}/bind-user`, method: 'put', data });

export const unbindEmployeeUser = (employeeId: number | string) =>
  request({ url: `/hr/employee/${employeeId}/unbind-user`, method: 'delete' });

export const getEmployeeUserOptions = (
  query: EmployeeUserOptionQuery
): AxiosPromise<PageResult<EmployeeUserOptionVO>> =>
  request({ url: '/hr/employee/user-options', method: 'get', params: query });

export const employeeOptions = (): AxiosPromise<EmployeeOptionVO[]> =>
  request({ url: '/hr/employee/options', method: 'get' });

export const employeeDeptTree = (): AxiosPromise<DeptTreeVO[]> =>
  request({ url: '/hr/employee/deptTree', method: 'get' });

export const employeePostOptions = (deptId: number | string): AxiosPromise<PostVO[]> =>
  request({ url: '/hr/employee/postOptions', method: 'get', params: { deptId } });
