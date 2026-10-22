import type { PageResult } from '@/api/types'; import type { AxiosPromise } from '@/utils/api-types'; import request,{download} from '@/utils/request'; import type { ChargeRuleForm,ChargeRuleOptionVO,ChargeRuleQuery,ChargeRuleStatusForm,ChargeRuleVO } from './types';
const base='/property/charge/rule';
export const listChargeRule=(q:ChargeRuleQuery):AxiosPromise<PageResult<ChargeRuleVO>>=>request({url:`${base}/list`,method:'get',params:q});
export const getChargeRule=(id:number|string):AxiosPromise<ChargeRuleVO>=>request({url:`${base}/${id}`,method:'get'});
export const addChargeRule=(data:ChargeRuleForm)=>request({url:base,method:'post',data}); export const updateChargeRule=(data:ChargeRuleForm)=>request({url:base,method:'put',data});
export const changeChargeRuleStatus=(data:ChargeRuleStatusForm)=>request({url:`${base}/changeStatus`,method:'put',data}); export const delChargeRule=(ids:number|string|(number|string)[])=>request({url:`${base}/${ids}`,method:'delete'});
export const exportChargeRule=(q:ChargeRuleQuery)=>download(`${base}/export`,q,`charge_rule_${Date.now()}.xlsx`); export const chargeRuleOptions=(q?:ChargeRuleQuery):AxiosPromise<ChargeRuleOptionVO[]>=>request({url:`${base}/options`,method:'get',params:q});
