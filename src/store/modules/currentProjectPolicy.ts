/**
 * 会使用全局物业工作项目的既有业务权限。
 * 仓库业务使用自身仓库上下文，因此 warehouse:* 不属于此列表。
 */
export const PROPERTY_WORKSPACE_PERMISSIONS = [
  'property:project:list',
  'property:projectMember:list',
  'property:building:list',
  'property:unit:list',
  'property:room:list',
  'property:customer:list',
  'property:resident:list',
  'property:customerRelation:list',
  'property:customerRelation:add',
  'property:customerRelation:edit',
  'property:customerRelation:moveIn',
  'property:customerRelation:moveOut',
  'property:chargeItem:list',
  'property:chargeRule:list',
  'property:chargeBinding:list',
  'property:chargeBinding:add',
  'property:chargeBinding:edit',
  'property:receivable:list',
  'property:receivable:generate',
  'property:payment:list',
  'property:payment:add'
] as const;

export const requiresPropertyWorkspace = (permissions: string[]) =>
  permissions.includes('*:*:*') || PROPERTY_WORKSPACE_PERMISSIONS.some(permission => permissions.includes(permission));
