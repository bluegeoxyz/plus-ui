import type { DeptTreeVO } from '@/api/system/dept/types';
import type { PostVO } from '@/api/system/post/types';

export interface EmployeeVO extends BaseEntity {
  id: number | string;
  employeeNo: string;
  employeeName: string;
  deptId: number | string;
  deptName: string;
  postId?: number | string;
  postName?: string;
  userId?: number | string;
  userName?: string;
  nickName?: string;
  userStatus?: string;
  gender?: string;
  mobile?: string;
  email?: string;
  idType?: string;
  idNo?: string;
  birthDate?: string;
  entryDate?: string;
  leaveDate?: string;
  employmentType?: string;
  employmentStatus: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface EmployeeForm {
  id?: number | string;
  employeeNo: string;
  employeeName: string;
  deptId?: number | string;
  postId?: number | string;
  gender?: string;
  mobile?: string;
  email?: string;
  idType?: string;
  idNo?: string;
  birthDate?: string;
  entryDate?: string;
  leaveDate?: string;
  employmentType?: string;
  employmentStatus: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface EmployeeQuery extends PageQuery {
  employeeNo?: string;
  employeeName?: string;
  deptId?: number | string;
  postId?: number | string;
  employmentType?: string;
  employmentStatus?: string;
  status?: string;
  mobile?: string;
}

export interface EmployeeOptionVO {
  id: number | string;
  employeeNo: string;
  employeeName: string;
  deptId: number | string;
  deptName: string;
  postName?: string;
}

export interface EmployeeBindUserForm {
  userId: number | string;
}

export interface EmployeeUserOptionVO {
  userId: number | string;
  userName: string;
  nickName?: string;
  deptName?: string;
  status: string;
  bound: boolean;
}

export interface EmployeeUserOptionQuery extends PageQuery {
  userName?: string;
  nickName?: string;
  phoneNumber?: string;
}

export type EmployeeDeptTreeVO = DeptTreeVO;
export type EmployeePostVO = PostVO;
