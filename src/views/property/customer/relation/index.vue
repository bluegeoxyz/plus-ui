<template>
  <div class="p-2 app-container relation-page">
    <el-alert v-if="!currentProjectId" title="请先在顶部选择当前物业项目" type="info" :closable="false" show-icon class="mb-2" />
    <el-alert v-else-if="permissionInvalid" title="当前项目的房屋住户关系权限已失效" description="请选择具有 CUSTOMER_RELATION 业务权限的项目。" type="warning" :closable="false" show-icon class="mb-2" />
    <template v-else>
      <el-card v-show="showSearch" shadow="hover" class="mb-2">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="楼栋"><el-select v-model="queryBuildingId" clearable filterable placeholder="请选择楼栋" @change="handleQueryBuildingChange"><el-option v-for="item in buildings" :key="item.id" :label="buildingLabel(item)" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="单元"><el-select v-model="queryUnitId" clearable filterable :disabled="!queryBuildingId" placeholder="请选择单元" @change="handleQueryUnitChange"><el-option v-for="item in queryUnits" :key="item.id" :label="unitLabel(item)" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="房屋" prop="roomId"><el-select v-model="queryParams.roomId" clearable filterable :disabled="!queryUnitId" placeholder="请选择房屋"><el-option v-for="item in queryRooms" :key="item.id" :label="roomLabel(item)" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="关系类型" prop="relationType"><el-select v-model="queryParams.relationType" clearable placeholder="请选择"><el-option v-for="item in pm_relation_type" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="关系状态" prop="relationStatus"><el-select v-model="queryParams.relationStatus" clearable placeholder="请选择"><el-option v-for="item in pm_relation_status" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover">
        <template #header><el-row :gutter="10" class="mb-2">
          <el-col :span="1.5"><el-button v-hasPermi="['property:customerRelation:add']" type="primary" plain icon="Plus" @click="handleAdd">新增关系</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:customerRelation:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:customerRelation:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除误录</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:customerRelation:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:customer-relation:import']" type="info" plain icon="Download" @click="downloadImportTemplate">下载模板</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:customer-relation:import']" type="primary" plain icon="Upload" :disabled="!currentProjectId" @click="openImportDialog">导入关系</el-button></el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row></template>
        <el-table v-loading="loading" border :data="relations" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="楼栋/单元" min-width="180"><template #default="scope">{{ scope.row.buildingName || scope.row.buildingCode || '-' }} / {{ scope.row.unitName || scope.row.unitCode || '-' }}</template></el-table-column>
          <el-table-column label="房屋" min-width="150"><template #default="scope">{{ scope.row.roomNo ? `${scope.row.roomCode} - ${scope.row.roomNo}` : knownRoomLabel(scope.row.roomId) }}</template></el-table-column>
          <el-table-column label="客户编号" prop="customerNo" min-width="150" />
          <el-table-column label="客户" min-width="160"><template #default="scope">{{ scope.row.customerName || '-' }}<span v-if="scope.row.mobile" class="ml-1 text-gray-400">{{ scope.row.mobile }}</span></template></el-table-column>
          <el-table-column label="关系类型" width="110"><template #default="scope"><dict-tag :options="pm_relation_type" :value="scope.row.relationType" /></template></el-table-column>
          <el-table-column label="主要关系人" width="100" align="center"><template #default="scope">{{ scope.row.isPrimary === '1' ? '是' : '否' }}</template></el-table-column>
          <el-table-column label="关系状态" width="110"><template #default="scope"><dict-tag :options="pm_relation_status" :value="scope.row.relationStatus" /></template></el-table-column>
          <el-table-column label="开始日期" prop="startDate" width="115" /><el-table-column label="入住日期" prop="moveInDate" width="115" /><el-table-column label="迁出日期" prop="moveOutDate" width="115" />
          <el-table-column label="操作" width="220" fixed="right" align="center"><template #default="scope">
            <el-button v-hasPermi="['property:customerRelation:query']" link type="primary" icon="View" @click="handleDetail(scope.row)" />
            <el-button v-if="scope.row.relationStatus === 'PENDING'" v-hasPermi="['property:customerRelation:moveIn']" link type="success" @click="openMoveIn(scope.row)">入住</el-button>
            <el-button v-if="scope.row.relationStatus === 'ACTIVE'" v-hasPermi="['property:customerRelation:moveOut']" link type="warning" @click="openMoveOut(scope.row)">迁出</el-button>
            <el-button v-hasPermi="['property:customerRelation:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            <el-button v-if="scope.row.relationStatus === 'PENDING'" v-hasPermi="['property:customerRelation:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template></el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>
    </template>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body>
      <el-form ref="relationFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <template v-if="!form.id">
            <el-col :span="12"><el-form-item label="楼栋" prop="buildingId"><el-select v-model="formBuildingId" filterable @change="handleFormBuildingChange"><el-option v-for="item in formBuildings" :key="item.id" :label="buildingLabel(item)" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="单元" prop="unitId"><el-select v-model="formUnitId" filterable :disabled="!formBuildingId" @change="handleFormUnitChange"><el-option v-for="item in formUnits" :key="item.id" :label="unitLabel(item)" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="房屋" prop="roomId"><el-select v-model="form.roomId" filterable :disabled="!formUnitId"><el-option v-for="item in formRooms" :key="item.id" :label="roomLabel(item)" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="客户" prop="customerId"><el-select v-model="form.customerId" filterable remote reserve-keyword :remote-method="searchCustomers" :loading="customerLoading" placeholder="输入至少2位编号或姓名"><el-option v-for="item in customers" :key="item.id" :label="customerLabel(item)" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="关系类型" prop="relationType"><el-select v-model="form.relationType"><el-option v-for="item in pm_relation_type" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="form.startDate" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-col>
          </template>
          <el-col :span="12"><el-form-item label="主要关系人" prop="isPrimary"><el-radio-group v-model="form.isPrimary"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button><el-button @click="closeOperationDialogs">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="房屋住户关系详情" width="650px" append-to-body><el-descriptions v-if="detail" :column="2" border>
      <el-descriptions-item label="房屋">{{ detail.roomNo ? `${detail.roomCode} - ${detail.roomNo}` : knownRoomLabel(detail.roomId) }}</el-descriptions-item><el-descriptions-item label="客户">{{ detail.customerName || detail.customerNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="关系类型"><dict-tag :options="pm_relation_type" :value="detail.relationType" /></el-descriptions-item><el-descriptions-item label="关系状态"><dict-tag :options="pm_relation_status" :value="detail.relationStatus" /></el-descriptions-item>
      <el-descriptions-item label="开始日期">{{ detail.startDate }}</el-descriptions-item><el-descriptions-item label="入住日期">{{ detail.moveInDate || '-' }}</el-descriptions-item><el-descriptions-item label="迁出日期">{{ detail.moveOutDate || '-' }}</el-descriptions-item><el-descriptions-item label="结束日期">{{ detail.endDate || '-' }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
    </el-descriptions></el-dialog>

    <el-dialog v-model="moveInVisible" title="办理入住" width="420px" append-to-body><el-form><el-form-item label="入住日期"><el-date-picker v-model="moveInDate" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-form><template #footer><el-button type="primary" :loading="submitLoading" @click="submitMoveIn">确认入住</el-button><el-button @click="moveInVisible=false">取消</el-button></template></el-dialog>
    <el-dialog v-model="moveOutVisible" title="办理迁出" width="420px" append-to-body><el-form><el-form-item label="迁出日期"><el-date-picker v-model="moveOutDate" value-format="YYYY-MM-DD" type="date" /></el-form-item></el-form><template #footer><el-button type="primary" :loading="submitLoading" @click="submitMoveOut">确认迁出</el-button><el-button @click="moveOutVisible=false">取消</el-button></template></el-dialog>
    <el-dialog v-model="importVisible" title="房屋客户关系批量导入" width="720px" append-to-body :close-on-click-modal="false">
      <el-descriptions :column="1" border class="mb-3"><el-descriptions-item label="当前项目">{{ importProjectName }}</el-descriptions-item></el-descriptions>
      <el-alert title="任意一条关系数据校验失败，本次全部不导入。" type="warning" :closable="false" show-icon class="mb-3" />
      <div class="mb-3">单次最多导入 2000 条；请使用楼栋编码、单元编码、房屋编码和客户编号定位数据。</div>
      <el-upload v-model:file-list="importFiles" drag :auto-upload="false" :limit="1" accept=".xlsx,.xls"><el-icon class="el-icon--upload"><UploadFilled /></el-icon><div class="el-upload__text">拖入 Excel 文件，或<em>点击选择</em></div></el-upload>
      <div class="mt-3"><el-button type="info" plain @click="downloadImportTemplate">下载模板</el-button></div>
      <template v-if="importResult"><el-divider />
        <el-result v-if="importResult.failedRows===0" icon="success" title="导入成功" :sub-title="`共 ${importResult.totalRows} 条，成功 ${importResult.successRows} 条`" />
        <template v-else><el-alert :title="`共 ${importResult.totalRows} 条关系，发现 ${importResult.errors.length} 个问题，本次写入 0 条`" type="error" :closable="false" show-icon class="mb-2" />
          <el-table :data="importResult.errors" border max-height="260"><el-table-column label="行号" prop="rowNumber" width="80" /><el-table-column label="字段" prop="field" width="130" /><el-table-column label="错误消息" prop="message" min-width="320" /></el-table>
        </template>
      </template>
      <template #footer><el-button type="primary" :loading="importLoading" :disabled="!importFiles.length" @click="submitImport">开始导入</el-button><el-button @click="importVisible=false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="RoomCustomerRelation" lang="ts">
import { addCustomerRelation, customerRelationContextBuildings, customerRelationContextCustomers, customerRelationContextProjects, customerRelationContextRooms, customerRelationContextUnits, delCustomerRelation, downloadCustomerRelationImportTemplate, exportCustomerRelation, getCustomerRelation, importCustomerRelations, listCustomerRelation, moveInCustomerRelation, moveOutCustomerRelation, updateCustomerRelation } from '@/api/property/customer/relation';
import type { CustomerReferenceOptionVO, CustomerRelationBuildingOptionVO, CustomerRelationRoomOptionVO, CustomerRelationUnitOptionVO, RelationImportResult, RoomCustomerRelationForm, RoomCustomerRelationQuery, RoomCustomerRelationVO } from '@/api/property/customer/relation/types';
import type { UploadUserFile } from 'element-plus';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useDict } from '@/utils/dict';

const relationDicts = useDict('pm_relation_type', 'pm_relation_status');
const pm_relation_type = computed(() => relationDicts.pm_relation_type || []);
const pm_relation_status = computed(() => relationDicts.pm_relation_status || []);
const currentProjectStore = useCurrentProjectStore(); const currentProjectId = computed(() => currentProjectStore.currentProjectId);
const relations=ref<RoomCustomerRelationVO[]>([]), buildings=ref<CustomerRelationBuildingOptionVO[]>([]), formBuildings=ref<CustomerRelationBuildingOptionVO[]>([]), queryUnits=ref<CustomerRelationUnitOptionVO[]>([]), queryRooms=ref<CustomerRelationRoomOptionVO[]>([]), formUnits=ref<CustomerRelationUnitOptionVO[]>([]), formRooms=ref<CustomerRelationRoomOptionVO[]>([]), customers=ref<CustomerReferenceOptionVO[]>([]);
const loading=ref(false), submitLoading=ref(false), customerLoading=ref(false), permissionInvalid=ref(false), pageActive=ref(true); const total=ref(0), ids=ref<Array<number|string>>([]), single=ref(true), multiple=ref(true);
const queryBuildingId=ref<number|string>(), queryUnitId=ref<number|string>(), formBuildingId=ref<number|string>(), formUnitId=ref<number|string>(), dialogProjectId=ref<number|string>();
const detail=ref<RoomCustomerRelationVO>(), detailVisible=ref(false), moveInVisible=ref(false), moveOutVisible=ref(false), commandId=ref<number|string>(), moveInDate=ref(''), moveOutDate=ref('');
const importVisible=ref(false), importLoading=ref(false), importFiles=ref<UploadUserFile[]>([]), importResult=ref<RelationImportResult>(), importProjectId=ref<number|string>(), importProjectName=ref('');
let requestVersion=0, optionVersion=0, customerVersion=0, importVersion=0, activationCount=0; const { showSearch }=useSearchToggle(); const queryFormRef=ref<ElFormInstance>(), relationFormRef=ref<ElFormInstance>();
const initForm=():RoomCustomerRelationForm=>({id:undefined,projectId:undefined,roomId:undefined,customerId:undefined,relationType:undefined,isPrimary:'0',startDate:undefined,remark:''});
const data=reactive<PageData<RoomCustomerRelationForm,RoomCustomerRelationQuery>>({form:initForm(),queryParams:{pageNum:1,pageSize:10,projectId:undefined,roomId:undefined,customerId:undefined,relationType:undefined,relationStatus:undefined,status:undefined},rules:{roomId:[{required:true,message:'房屋不能为空',trigger:'change'}],customerId:[{required:true,message:'客户不能为空',trigger:'change'}],relationType:[{required:true,message:'关系类型不能为空',trigger:'change'}],startDate:[{required:true,message:'开始日期不能为空',trigger:'change'}]}});
const {form,queryParams,rules}=toRefs(data); const {dialog,resetForm,openDialog,showDialog,closeDialog}=useFormDialog({form,formRef:relationFormRef,initialFormData:initForm()});
const displayName=(name?:string,code?:string)=>name?.trim()||code?.trim()||'-';
const buildingLabel=(x:CustomerRelationBuildingOptionVO)=>{const name=displayName(x.buildingName,x.buildingCode),options=[...buildings.value,...formBuildings.value],duplicate=Boolean(x.buildingName?.trim())&&options.filter(item=>item.buildingName?.trim()===x.buildingName.trim()).length>1;return duplicate&&x.buildingCode?.trim()?`${name}（${x.buildingCode.trim()}）`:name;};
const unitLabel=(x:CustomerRelationUnitOptionVO)=>{const options=[...queryUnits.value,...formUnits.value].filter(item=>String(item.buildingId)===String(x.buildingId)),name=displayName(x.unitName,x.unitCode),duplicate=Boolean(x.unitName?.trim())&&options.filter(item=>item.unitName?.trim()===x.unitName.trim()).length>1;return duplicate&&x.unitCode?.trim()?`${name}（${x.unitCode.trim()}）`:name;};
const roomLabel=(x:CustomerRelationRoomOptionVO)=>`${x.roomCode} - ${x.roomNo}`;
const customerLabel=(x:CustomerReferenceOptionVO)=>`${x.customerNo} - ${x.customerName}${x.mobile?` (${x.mobile})`:''}`; const knownCustomer=(id:number|string)=>customers.value.find(x=>String(x.id)===String(id)); const knownRoomLabel=(id:number|string)=>{const x=[...queryRooms.value,...formRooms.value].find(r=>String(r.id)===String(id));return x?roomLabel(x):'-';};
const invalidate=()=>{requestVersion++;optionVersion++;customerVersion++;importVersion++;loading.value=false;customerLoading.value=false;importLoading.value=false;}; const current=(v:number,p:number|string)=>pageActive.value&&v===requestVersion&&String(p)===String(currentProjectId.value);
const isPermissionError=(e:unknown)=>e instanceof Error&&(e.message.includes('无项目业务访问权限')||e.message.includes('无权限'));
const clearList=()=>{relations.value=[];total.value=0;ids.value=[];single.value=true;multiple.value=true;};
const closeOperationDialogs=()=>{closeDialog();resetForm();formBuildingId.value=undefined;formUnitId.value=undefined;formBuildings.value=[];formUnits.value=[];formRooms.value=[];customers.value=[];dialogProjectId.value=undefined;moveInVisible.value=false;moveOutVisible.value=false;commandId.value=undefined;moveInDate.value='';moveOutDate.value='';};
const clearPage=()=>{clearList();buildings.value=[];queryUnits.value=[];queryRooms.value=[];queryBuildingId.value=undefined;queryUnitId.value=undefined;queryParams.value.roomId=undefined;detail.value=undefined;detailVisible.value=false;closeOperationDialogs();};
const validateProject=async(p:number|string,v:number)=>{const res=await customerRelationContextProjects('list');if(!current(v,p))return false;const ok=(res.data||[]).some(x=>String(x.id)===String(p));permissionInvalid.value=!ok;if(!ok)clearPage();return ok;};
const loadBuildings=async(p:number|string,v:number)=>{const res=await customerRelationContextBuildings('list',p);if(!current(v,p))return false;buildings.value=res.data||[];return true;};
const getList=async()=>{const p=currentProjectId.value,v=++requestVersion;if(!p){permissionInvalid.value=false;clearPage();return;}loading.value=true;try{if(!(await validateProject(p,v))||!(await loadBuildings(p,v)))return;const res=await listCustomerRelation({...queryParams.value,projectId:p});if(!current(v,p))return;relations.value=res.data?.rows||[];total.value=res.data?.total||0;}catch(e){if(current(v,p)&&isPermissionError(e)){permissionInvalid.value=true;clearPage();modal.msgWarning('当前项目的房屋住户关系权限已失效');}}finally{if(v===requestVersion)loading.value=false;}};
const loadUnits=async(mode:'list'|'create',p:number|string,b:number|string,target:typeof queryUnits)=>{const v=++optionVersion;const res=await customerRelationContextUnits(mode,p,b);if(v===optionVersion&&String(p)===String(currentProjectId.value))target.value=res.data||[];};
const loadRooms=async(mode:'list'|'create',p:number|string,b:number|string,u:number|string,target:typeof queryRooms)=>{const v=++optionVersion;const res=await customerRelationContextRooms(mode,p,b,u);if(v===optionVersion&&String(p)===String(currentProjectId.value))target.value=res.data||[];};
const handleQueryBuildingChange=async()=>{queryUnitId.value=undefined;queryParams.value.roomId=undefined;queryUnits.value=[];queryRooms.value=[];if(currentProjectId.value&&queryBuildingId.value)await loadUnits('list',currentProjectId.value,queryBuildingId.value,queryUnits);handleQuery();};
const handleQueryUnitChange=async()=>{queryParams.value.roomId=undefined;queryRooms.value=[];if(currentProjectId.value&&queryBuildingId.value&&queryUnitId.value)await loadRooms('list',currentProjectId.value,queryBuildingId.value,queryUnitId.value,queryRooms);handleQuery();};
const handleQuery=()=>{queryParams.value.pageNum=1;getList();}; const resetQuery=()=>{queryFormRef.value?.resetFields();queryBuildingId.value=undefined;queryUnitId.value=undefined;queryUnits.value=[];queryRooms.value=[];handleQuery();};
const handleSelectionChange=(rows:RoomCustomerRelationVO[])=>{ids.value=rows.map(x=>x.id);single.value=rows.length!==1;multiple.value=rows.length===0;};
const handleAdd=async()=>{const p=currentProjectId.value;if(!p||permissionInvalid.value)return modal.msgWarning('请先选择具有房客关系权限的项目');try{const projects=await customerRelationContextProjects('create');if(!(projects.data||[]).some(x=>String(x.id)===String(p)))return modal.msgWarning('当前项目没有新增房屋住户关系权限');const res=await customerRelationContextBuildings('create',p);formBuildings.value=res.data||[];resetForm();form.value.projectId=p;dialogProjectId.value=p;openDialog('新增房屋住户关系');}catch(e){if(isPermissionError(e))modal.msgWarning('没有新增房屋住户关系权限');}};
const handleFormBuildingChange=async()=>{if((formUnitId.value||form.value.roomId)&&!(await modal.confirm('切换楼栋将清空已选单元和房屋，是否继续？').then(()=>true).catch(()=>false)))return;formUnitId.value=undefined;form.value.roomId=undefined;formUnits.value=[];formRooms.value=[];if(currentProjectId.value&&formBuildingId.value)await loadUnits('create',currentProjectId.value,formBuildingId.value,formUnits);};
const handleFormUnitChange=async()=>{if(form.value.roomId&&!(await modal.confirm('切换单元将清空已选房屋，是否继续？').then(()=>true).catch(()=>false)))return;form.value.roomId=undefined;formRooms.value=[];if(currentProjectId.value&&formBuildingId.value&&formUnitId.value)await loadRooms('create',currentProjectId.value,formBuildingId.value,formUnitId.value,formRooms);};
const searchCustomers=async(keyword:string)=>{const p=currentProjectId.value,v=++customerVersion;if(!p||keyword.trim().length<2){customers.value=[];return;}customerLoading.value=true;try{const res=await customerRelationContextCustomers(p,keyword.trim());if(v===customerVersion&&String(p)===String(currentProjectId.value))customers.value=res.data||[];}catch(e){if(isPermissionError(e))modal.msgWarning('没有新增房屋住户关系权限');}finally{if(v===customerVersion)customerLoading.value=false;}};
const loadDetail=async(id:number|string)=>{try{const res=await getCustomerRelation(id);detail.value=res.data;detailVisible.value=true;}catch(e){if(isPermissionError(e))modal.msgWarning('没有查看房屋住户关系详情权限');}};
const handleUpdate=(row?:Partial<RoomCustomerRelationVO>)=>{const selected=row?.id?row:relations.value.find(x=>String(x.id)===String(ids.value[0]));if(!selected?.id)return;resetForm();form.value={id:selected.id,isPrimary:selected.isPrimary,remark:selected.remark};dialogProjectId.value=currentProjectId.value;showDialog('修改房屋住户关系');}; const handleDetail=(row:Partial<RoomCustomerRelationVO>)=>{if(row.id)loadDetail(row.id);};
const submitForm=()=>relationFormRef.value?.validate(async valid=>{if(!valid)return;const p=currentProjectId.value;if(!p||String(p)!==String(dialogProjectId.value)){modal.msgWarning('当前项目已切换，请重新操作');closeOperationDialogs();return;}submitLoading.value=true;try{if(form.value.id)await updateCustomerRelation({id:form.value.id,isPrimary:form.value.isPrimary,remark:form.value.remark});else await addCustomerRelation({...form.value,projectId:p});modal.msgSuccess('操作成功');closeOperationDialogs();await getList();}catch(e){if(isPermissionError(e)){permissionInvalid.value=true;clearPage();}}finally{submitLoading.value=false;}});
const openMoveIn=(row:Partial<RoomCustomerRelationVO>)=>{if(!row.id)return;commandId.value=row.id;dialogProjectId.value=currentProjectId.value;moveInDate.value=row.startDate||'';moveInVisible.value=true;}; const openMoveOut=(row:Partial<RoomCustomerRelationVO>)=>{if(!row.id)return;commandId.value=row.id;dialogProjectId.value=currentProjectId.value;moveOutDate.value=new Date().toISOString().slice(0,10);moveOutVisible.value=true;};
const commandContextValid=()=>Boolean(commandId.value&&currentProjectId.value&&String(dialogProjectId.value)===String(currentProjectId.value));
const submitMoveIn=async()=>{if(!commandContextValid()||!moveInDate.value)return modal.msgWarning('请选择入住日期或重新操作');submitLoading.value=true;try{await moveInCustomerRelation({id:commandId.value!,moveInDate:moveInDate.value});modal.msgSuccess('入住办理成功');closeOperationDialogs();await getList();}finally{submitLoading.value=false;}};
const submitMoveOut=async()=>{if(!commandContextValid()||!moveOutDate.value)return modal.msgWarning('请选择迁出日期或重新操作');submitLoading.value=true;try{await moveOutCustomerRelation({id:commandId.value!,moveOutDate:moveOutDate.value});modal.msgSuccess('迁出办理成功');closeOperationDialogs();await getList();}finally{submitLoading.value=false;}};
const handleDelete=async(row?:Partial<RoomCustomerRelationVO>)=>{const target=row?.id??ids.value;if(Array.isArray(target)&&!target.length)return;await modal.confirm('删除仅用于未入住的待生效误录关系；业务结束请使用“迁出”。确认继续吗？');try{await delCustomerRelation(target);modal.msgSuccess('删除成功');await getList();}catch(e){if(isPermissionError(e)){permissionInvalid.value=true;clearPage();}}};
const handleExport=()=>{if(currentProjectId.value&&!permissionInvalid.value)exportCustomerRelation({...queryParams.value,projectId:currentProjectId.value});};
const resetImport=()=>{importFiles.value=[];importResult.value=undefined;importProjectId.value=undefined;importProjectName.value='';importLoading.value=false;};
const openImportDialog=()=>{if(!currentProjectId.value)return modal.msgWarning('请先选择当前物业项目');importVersion++;resetImport();importProjectId.value=currentProjectId.value;importProjectName.value=currentProjectStore.currentProjectName;importVisible.value=true;};
const downloadImportTemplate=async()=>{await downloadCustomerRelationImportTemplate();};
const submitImport=async()=>{const file=importFiles.value[0]?.raw,p=importProjectId.value,v=++importVersion;if(!file||!p)return modal.msgWarning('请选择 Excel 文件');if(String(p)!==String(currentProjectId.value)){importVisible.value=false;return modal.msgWarning('当前项目已切换，请重新选择文件');}importLoading.value=true;importResult.value=undefined;try{const res=await importCustomerRelations(p,file);if(v!==importVersion||String(p)!==String(currentProjectId.value)||!importVisible.value)return;importResult.value=res.data;if(res.data.failedRows===0){modal.msgSuccess('导入成功');await getList();}}finally{if(v===importVersion)importLoading.value=false;}};
const stopWatch=watch(currentProjectId,()=>{invalidate();importVisible.value=false;resetImport();clearPage();permissionInvalid.value=false;queryParams.value.pageNum=1;if(pageActive.value)getList();});
onMounted(getList);onActivated(()=>{pageActive.value=true;if(activationCount++===0)return;getList();});onDeactivated(()=>{pageActive.value=false;invalidate();customers.value=[];closeOperationDialogs();});onBeforeUnmount(()=>{pageActive.value=false;invalidate();stopWatch();});
</script>

<style lang="scss" scoped>
.relation-page :deep(.el-select) { width: 220px; }
</style>
