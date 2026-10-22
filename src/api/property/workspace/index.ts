import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { WorkspaceProjectOptionVO } from './types';

/** 当前登录用户在已有业务能力下可使用的工作项目。 */
export const workspaceProjectOptions = (): AxiosPromise<WorkspaceProjectOptionVO[]> =>
  request({ url: '/property/workspace/projects', method: 'get' });
