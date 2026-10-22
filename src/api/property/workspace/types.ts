export interface WorkspaceProjectOptionVO {
  /** 后端按字符串返回，避免 JavaScript 大整数精度丢失。 */
  id: string;
  projectCode: string;
  projectName: string;
  projectShortName?: string;
}
