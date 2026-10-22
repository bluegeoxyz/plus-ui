export interface ProjectVO extends BaseEntity {
  id: number | string;
  projectCode: string;
  projectName: string;
  projectShortName?: string;
  projectType?: string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  address?: string;
  servicePhone?: string;
  managerEmployeeId?: number | string;
  managerEmployeeNo?: string;
  managerEmployeeName?: string;
  deliveryDate?: string;
  longitude?: number;
  latitude?: number;
  sort: number;
  status: string;
  remark?: string;
}

export interface ProjectForm {
  id?: number | string;
  projectCode: string;
  projectName: string;
  projectShortName?: string;
  projectType?: string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  address?: string;
  servicePhone?: string;
  managerEmployeeId?: number | string;
  deliveryDate?: string;
  longitude?: number;
  latitude?: number;
  sort: number;
  status: string;
  remark?: string;
}

export interface ProjectQuery extends PageQuery {
  projectCode?: string;
  projectName?: string;
  projectType?: string;
  managerEmployeeId?: number | string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  status?: string;
}

export interface ProjectOptionVO {
  id: number | string;
  projectCode: string;
  projectName: string;
  projectShortName?: string;
}
