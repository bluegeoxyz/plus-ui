export interface ProjectMemberVO extends BaseEntity {
  id: number | string;
  projectId: number | string;
  projectCode: string;
  projectName: string;
  employeeId: number | string;
  employeeNo: string;
  employeeName: string;
  deptName?: string;
  postName?: string;
  memberRole: string;
  isManager: string;
  startDate: string;
  endDate?: string;
  memberStatus: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface ProjectMemberForm {
  id?: number | string;
  projectId?: number | string;
  employeeId?: number | string;
  memberRole: string;
  isManager: string;
  startDate: string;
  endDate?: string;
  memberStatus: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface ProjectMemberQuery extends PageQuery {
  projectId?: number | string;
  employeeId?: number | string;
  memberRole?: string;
  isManager?: string;
  memberStatus?: string;
  status?: string;
}

export interface ProjectMemberOptionVO {
  memberId: number | string;
  projectId: number | string;
  projectName: string;
  employeeId: number | string;
  employeeNo: string;
  employeeName: string;
  memberRole: string;
  isManager: string;
}
