<template><div class="p-2 app-container resident-page">
 <el-alert v-if="!projectId" title="请先在顶部选择当前物业项目" type="info" :closable="false" show-icon />
 <template v-else>
  <el-card shadow="hover" class="mb-2"><el-tabs v-model="tab" @tab-change="changeTab"><el-tab-pane v-for="x in tabs" :key="x.name" :label="x.label" :name="x.name" /></el-tabs>
   <el-form :model="query" inline><el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="客户编号、姓名或房屋" @keyup.enter="search" /></el-form-item>
    <el-form-item label="楼栋"><el-select v-model="query.buildingId" clearable filterable @change="buildingChanged"><el-option v-for="x in buildings" :key="x.id" :label="name(x.buildingName,x.buildingCode)" :value="x.id" /></el-select></el-form-item>
    <el-form-item label="单元"><el-select v-model="query.unitId" clearable filterable :disabled="!query.buildingId" @change="unitChanged"><el-option v-for="x in units" :key="x.id" :label="name(x.unitName,x.unitCode)" :value="x.id" /></el-select></el-form-item>
    <el-form-item label="房屋"><el-select v-model="query.roomId" clearable filterable :disabled="!query.unitId"><el-option v-for="x in rooms" :key="x.id" :label="name(x.roomNo,x.roomCode)" :value="x.id" /></el-select></el-form-item>
    <el-form-item><el-button type="primary" icon="Search" @click="search">搜索</el-button><el-button icon="Refresh" @click="reset">重置</el-button></el-form-item>
   </el-form>
  </el-card>
  <el-card shadow="hover"><template #header><el-button v-hasPermi="['property:resident:export']" type="warning" plain icon="Download" @click="doExport">导出当前范围</el-button></template>
   <el-table v-loading="loading" :data="rows" border><el-table-column label="姓名" prop="maskedCustomerName" min-width="100"/><el-table-column label="客户编号" prop="customerNo" min-width="140"/>
    <el-table-column label="关系类型" width="110"><template #default="s"><dict-tag :options="pm_relation_type" :value="s.row.relationType"/></template></el-table-column>
    <el-table-column label="楼栋" prop="buildingName" min-width="110"/><el-table-column label="单元" prop="unitName" min-width="100"/><el-table-column label="房屋" prop="roomNo" min-width="100"/>
    <el-table-column label="状态" width="110"><template #default="s"><dict-tag :options="pm_relation_status" :value="s.row.relationStatus"/></template></el-table-column>
    <el-table-column label="迁入日期" prop="moveInDate" width="115"/><el-table-column label="迁出日期" prop="moveOutDate" width="115"/>
    <el-table-column label="操作" width="90" fixed="right"><template #default="s"><el-button v-hasPermi="['property:resident:query']" link type="primary" @click="showDetail(s.row)">查看</el-button></template></el-table-column>
   </el-table><pagination v-show="total>0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
  </el-card>
 </template>
 <el-dialog v-model="detailVisible" title="住户详情" width="800px" append-to-body><template v-if="detail"><el-descriptions :column="2" border><el-descriptions-item label="客户编号">{{detail.customerNo}}</el-descriptions-item><el-descriptions-item label="姓名">{{detail.customerName}}</el-descriptions-item><el-descriptions-item label="手机号">{{detail.mobile||'-'}}</el-descriptions-item><el-descriptions-item label="客户类型"><dict-tag :options="pm_customer_type" :value="detail.customerType"/></el-descriptions-item></el-descriptions>
  <h4>当前住房</h4><relation-table :rows="detail.currentRelations"/><h4 v-if="detail.pendingRelations.length">待生效关系</h4><relation-table v-if="detail.pendingRelations.length" :rows="detail.pendingRelations"/><h4>历史住房</h4><relation-table :rows="detail.historyRelations"/>
 </template></el-dialog>
</div></template>
<script setup name="PropertyResident" lang="ts">
import {listResident,getResident,exportResident,residentBuildingOptions,residentUnitOptions,residentRoomOptions} from '@/api/property/resident'; import type {ResidentQuery,ResidentRelationVO,ResidentDetailVO,ResidentBuildingOptionVO,ResidentUnitOptionVO,ResidentRoomOptionVO} from '@/api/property/resident/types';
import {useCurrentProjectStore} from '@/store/modules/currentProject'; import {useDict} from '@/utils/dict'; import {ElTable,ElTableColumn} from 'element-plus';
const RelationTable=defineComponent({props:{rows:{type:Array as PropType<ResidentRelationVO[]>,required:true}},setup(p){return()=>h(ElTable,{data:p.rows,border:true,emptyText:'暂无数据'},()=>[h(ElTableColumn,{label:'项目',prop:'projectName'}),h(ElTableColumn,{label:'住房'},{default:(s:{row:ResidentRelationVO})=>`${s.row.buildingName||s.row.buildingCode} / ${s.row.unitName||s.row.unitCode} / ${s.row.roomNo||s.row.roomCode}`}),h(ElTableColumn,{label:'迁入',prop:'moveInDate'}),h(ElTableColumn,{label:'迁出',prop:'moveOutDate'})]);}});
const ds=useDict('pm_relation_type','pm_relation_status','pm_customer_type'); const pm_relation_type=computed(()=>ds.pm_relation_type||[]),pm_relation_status=computed(()=>ds.pm_relation_status||[]),pm_customer_type=computed(()=>ds.pm_customer_type||[]);
const store=useCurrentProjectStore(),projectId=computed(()=>store.currentProjectId); const rows=ref<ResidentRelationVO[]>([]),buildings=ref<ResidentBuildingOptionVO[]>([]),units=ref<ResidentUnitOptionVO[]>([]),rooms=ref<ResidentRoomOptionVO[]>([]),loading=ref(false),total=ref(0),tab=ref('all'),detailVisible=ref(false),detail=ref<ResidentDetailVO>(); let version=0;
const tabs=[{name:'all',label:'全部'},{name:'owner',label:'业主'},{name:'tenant',label:'租户'},{name:'family',label:'家庭成员'},{name:'resident',label:'住户'},{name:'history',label:'历史住户'}]; const initial=():ResidentQuery=>({pageNum:1,pageSize:10}); const query=reactive<ResidentQuery>(initial()); const name=(n?:string,c?:string)=>n?.trim()||c?.trim()||'-';
const applyTab=()=>{query.relationType=undefined;query.relationStatus=tab.value==='history'?'ENDED':'ACTIVE';if(tab.value!=='all'&&tab.value!=='history')query.relationType=tab.value.toUpperCase();if(tab.value==='all')query.relationStatus='EFFECTIVE';};
const load=async()=>{const p=projectId.value,v=++version;if(!p){rows.value=[];total.value=0;return;}loading.value=true;try{const res=await listResident({...query,projectId:p});if(v!==version||String(p)!==String(projectId.value))return;rows.value=res.data?.rows||[];total.value=res.data?.total||0;}finally{if(v===version)loading.value=false;}};
const loadBuildings=async()=>{const p=projectId.value,v=version;if(!p)return;const r=await residentBuildingOptions(p);if(v===version&&String(p)===String(projectId.value))buildings.value=r.data||[];}; const search=()=>{query.pageNum=1;load();};
const buildingChanged=async()=>{query.unitId=undefined;query.roomId=undefined;units.value=[];rooms.value=[];const p=projectId.value,b=query.buildingId,v=version;if(p&&b){const r=await residentUnitOptions(p,b);if(v===version&&String(p)===String(projectId.value)&&String(b)===String(query.buildingId))units.value=r.data||[];}search();};
const unitChanged=async()=>{query.roomId=undefined;rooms.value=[];const p=projectId.value,b=query.buildingId,u=query.unitId,v=version;if(p&&b&&u){const r=await residentRoomOptions(p,b,u);if(v===version&&String(p)===String(projectId.value)&&String(b)===String(query.buildingId)&&String(u)===String(query.unitId))rooms.value=r.data||[];}search();};
const changeTab=()=>{applyTab();search();}; const reset=()=>{Object.assign(query,initial());applyTab();units.value=[];rooms.value=[];load();}; const doExport=()=>projectId.value&&exportResident({...query,projectId:projectId.value});
const showDetail=async(row:Partial<ResidentRelationVO>)=>{const p=projectId.value,v=++version;if(!p||!row.customerId)return;const r=await getResident(row.customerId,p);if(v===version&&String(p)===String(projectId.value)){detail.value=r.data;detailVisible.value=true;}};
watch(projectId,()=>{version++;rows.value=[];total.value=0;detailVisible.value=false;detail.value=undefined;Object.assign(query,initial());tab.value='all';units.value=[];rooms.value=[];buildings.value=[];if(projectId.value){loadBuildings();load();}}); onMounted(()=>{applyTab();if(projectId.value){loadBuildings();load();}});
</script><style scoped>.resident-page :deep(.el-select){width:190px}h4{margin:18px 0 8px}</style>
