<template>
  <div class="p-2 app-container room-page">
    <el-alert v-if="!currentProjectId" title="请先在顶部选择当前物业项目" type="info" :closable="false" show-icon class="mb-2" />
    <el-alert v-else-if="resourcePermissionInvalid" title="当前项目的房屋访问权限已失效" description="请重新选择具有 RESOURCE 业务访问权限的项目。" type="warning" :closable="false" show-icon class="mb-2" />
    <template v-else>
      <el-card v-show="showSearch" shadow="hover" class="mb-2">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="所属楼栋" prop="buildingId">
            <el-select v-model="queryParams.buildingId" clearable filterable placeholder="请选择楼栋" @change="handleQueryBuildingChange">
              <el-option v-for="item in buildingOptionsList" :key="item.id" :label="buildingOptionLabel(item)" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属单元" prop="unitId">
            <el-select v-model="queryParams.unitId" clearable filterable placeholder="请选择单元" :disabled="!queryParams.buildingId" @change="handleQuery">
              <el-option v-for="item in unitOptionsList" :key="item.id" :label="unitOptionLabel(item, unitOptionsList)" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="房屋编码" prop="roomCode"><el-input v-model="queryParams.roomCode" clearable placeholder="请输入房屋编码" @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="房号" prop="roomNo"><el-input v-model="queryParams.roomNo" clearable placeholder="请输入房号" @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable placeholder="请选择状态"><el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" /></el-select></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
      </el-card>
      <el-card shadow="hover">
        <template #header>
          <el-row :gutter="10" class="mb-2">
            <el-col :span="1.5"><el-button v-hasPermi="['property:room:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:room:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:room:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:room:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:chargeBinding:add']" type="primary" plain icon="Setting" :disabled="multiple" @click="openBatchBinding">收费设置</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:resource:treeImport']" type="info" plain icon="Download" :disabled="!currentProjectId" @click="downloadImportTemplate">下载资源模板</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:resource:treeImport']" type="primary" plain icon="Upload" :disabled="!currentProjectId" @click="openImportDialog">导入房屋资源</el-button></el-col>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-row>
        </template>
        <el-table ref="roomTableRef" v-loading="loading" border :data="roomList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="楼栋" min-width="150"><template #default="scope">{{ buildingName(scope.row.buildingId) }}</template></el-table-column>
          <el-table-column label="单元" min-width="130"><template #default="scope">{{ unitName(scope.row.unitId) }}</template></el-table-column>
          <el-table-column label="房屋编码" prop="roomCode" min-width="120"><template #default="scope"><el-button v-hasPermi="['property:room:query']" link type="primary" @click="handleDetail(scope.row)">{{ scope.row.roomCode }}</el-button></template></el-table-column>
          <el-table-column label="房号" prop="roomNo" min-width="100" />
          <el-table-column label="楼层" prop="floorNo" width="80" align="center" />
          <el-table-column label="建筑面积" prop="buildingArea" width="110" align="right" />
          <el-table-column label="入住状态" prop="occupancyStatus" width="110"><template #default="scope"><dict-tag :options="pm_occupancy_status" :value="scope.row.occupancyStatus" /></template></el-table-column>
          <el-table-column label="状态" prop="status" width="90" align="center"><template #default="scope"><el-switch v-model="scope.row.status" v-hasPermi="['property:room:edit']" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" /></template></el-table-column>
          <el-table-column label="操作" width="290" fixed="right" align="center"><template #default="scope">
            <el-button v-hasPermi="['property:chargeBinding:list']" link type="primary" @click="openBindingDialog(scope.row)">收费设置</el-button>
            <el-button v-hasPermi="['property:receivable:list']" link type="primary" @click="ledgerDialog?.open(scope.row)">收费台账</el-button>
            <el-button v-hasPermi="['property:room:query']" link type="primary" icon="View" @click="handleDetail(scope.row)" />
            <el-button v-hasPermi="['property:room:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            <el-button v-hasPermi="['property:room:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template></el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>
    </template>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" append-to-body>
      <el-form ref="roomFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="所属楼栋" prop="buildingId"><el-select v-model="form.buildingId" filterable :disabled="Boolean(form.id)" @change="handleFormBuildingChange"><el-option v-for="item in buildingOptionsList" :key="item.id" :label="buildingOptionLabel(item)" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属单元" prop="unitId"><el-select v-model="form.unitId" filterable :disabled="Boolean(form.id) || !form.buildingId"><el-option v-for="item in formUnitOptions" :key="item.id" :label="unitOptionLabel(item, formUnitOptions)" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="房屋编码" prop="roomCode"><el-input v-model="form.roomCode" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="房号" prop="roomNo"><el-input v-model="form.roomNo" maxlength="32" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="楼层" prop="floorNo"><el-input-number v-model="form.floorNo" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="房屋类型" prop="roomType"><el-select v-model="form.roomType" clearable><el-option v-for="dict in pm_room_type" :key="dict.value" :label="dict.label" :value="dict.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产权属性" prop="propertyType"><el-select v-model="form.propertyType" clearable><el-option v-for="dict in pm_property_type" :key="dict.value" :label="dict.label" :value="dict.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建筑面积" prop="buildingArea"><el-input-number v-model="form.buildingArea" :min="0" :precision="2" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="使用面积" prop="usableArea"><el-input-number v-model="form.usableArea" :min="0" :precision="2" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="交付状态" prop="deliveryStatus"><el-select v-model="form.deliveryStatus"><el-option v-for="dict in pm_delivery_status" :key="dict.value" :label="dict.label" :value="dict.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="入住状态"><el-select v-model="form.occupancyStatus" disabled><el-option v-for="dict in pm_occupancy_status" :key="dict.value" :label="dict.label" :value="dict.value" /></el-select><div class="el-form-item-msg">由有效房屋-客户关系自动计算</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示顺序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="导入房屋资源" width="760px" append-to-body @closed="resetImportDialog">
      <el-descriptions :column="1" border class="mb-3">
        <el-descriptions-item label="当前项目">{{ importProjectName }}</el-descriptions-item>
      </el-descriptions>
      <el-alert title="任意一行数据校验失败，本次全部不导入，数据库写入 0 条。" type="warning" :closable="false" show-icon class="mb-3" />
      <el-upload v-model:file-list="importFileList" :auto-upload="false" :limit="1" accept=".xlsx,.xls" drag :disabled="importLoading">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击选择</em></div>
        <template #tip><div class="el-upload__tip">仅支持 xls、xlsx；单次最多导入 2000 条房屋数据。</div></template>
      </el-upload>
      <div class="mt-3"><el-link type="primary" :underline="false" @click="downloadImportTemplate">下载房屋资源导入模板</el-link></div>
      <template v-if="importResult">
        <el-alert v-if="importResult.failedRows > 0" title="本次导入失败，数据库写入 0 条。" type="error" :closable="false" show-icon class="mt-4 mb-2" />
        <el-alert v-else title="房屋资源导入成功" type="success" :closable="false" show-icon class="mt-4 mb-2" />
        <el-descriptions :column="3" border class="mb-2">
          <el-descriptions-item label="总行数">{{ importResult.totalRows }}</el-descriptions-item>
          <el-descriptions-item label="成功行数">{{ importResult.successRows }}</el-descriptions-item>
          <el-descriptions-item label="失败行数">{{ importResult.failedRows }}</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="importResult.errors.length" :data="importResult.errors" border max-height="300">
          <el-table-column label="行号" prop="rowNumber" width="90"><template #default="scope">{{ scope.row.rowNumber ?? '-' }}</template></el-table-column>
          <el-table-column label="字段" prop="field" width="150"><template #default="scope">{{ scope.row.field || '-' }}</template></el-table-column>
          <el-table-column label="错误消息" prop="message" min-width="360" show-overflow-tooltip />
        </el-table>
      </template>
      <template #footer><el-button type="primary" :loading="importLoading" :disabled="!importFileList.length" @click="submitTreeImport">上传并导入</el-button><el-button @click="importDialogVisible=false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="房屋详情" width="700px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="所属楼栋">{{ buildingName(detail.buildingId) }}</el-descriptions-item><el-descriptions-item label="所属单元">{{ unitName(detail.unitId) }}</el-descriptions-item>
        <el-descriptions-item label="房屋编码">{{ detail.roomCode }}</el-descriptions-item><el-descriptions-item label="房号">{{ detail.roomNo }}</el-descriptions-item>
        <el-descriptions-item label="楼层">{{ detail.floorNo ?? '-' }}</el-descriptions-item><el-descriptions-item label="房屋类型"><dict-tag :options="pm_room_type" :value="detail.roomType" /></el-descriptions-item>
        <el-descriptions-item label="产权属性"><dict-tag :options="pm_property_type" :value="detail.propertyType" /></el-descriptions-item><el-descriptions-item label="建筑面积">{{ detail.buildingArea ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用面积">{{ detail.usableArea ?? '-' }}</el-descriptions-item><el-descriptions-item label="交付状态"><dict-tag :options="pm_delivery_status" :value="detail.deliveryStatus" /></el-descriptions-item>
        <el-descriptions-item label="入住状态"><dict-tag :options="pm_occupancy_status" :value="detail.occupancyStatus" /></el-descriptions-item><el-descriptions-item label="状态"><dict-tag :options="sys_normal_disable" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="bindingVisible" :title="`房间收费设置 - ${bindingRoomName}`" width="1200px" append-to-body @closed="resetBindingState">
      <el-alert title="这里只维护房间与计费规则的生效关系，不会生成应收账单或计算费用。" type="info" :closable="false" show-icon class="mb-3" />
      <div class="mb-3"><el-button v-hasPermi="['property:chargeBinding:add']" type="primary" icon="Plus" @click="handleBindingAdd">新增收费设置</el-button></div>
      <el-table v-loading="bindingLoading" :data="bindingList" border>
        <el-table-column label="收费项目" prop="chargeItemName" min-width="140" />
        <el-table-column label="计费规则" prop="chargeRuleName" min-width="150" />
        <el-table-column label="计费方式" width="110"><template #default="scope"><dict-tag :options="pm_billing_method" :value="scope.row.billingMethod" /></template></el-table-column>
        <el-table-column label="计费标准" min-width="140"><template #default="scope">{{ bindingStandard(scope.row) }}</template></el-table-column>
        <el-table-column label="计费周期" width="100"><template #default="scope"><dict-tag :options="pm_billing_cycle" :value="scope.row.billingCycle" /></template></el-table-column>
        <el-table-column label="周期模式" width="110"><template #default="scope"><dict-tag :options="pm_cycle_mode" :value="scope.row.cycleMode" /></template></el-table-column>
        <el-table-column label="生效日期" prop="effectiveStartDate" width="115" />
        <el-table-column label="失效日期" width="180"><template #default="scope"><el-tag v-if="scope.row.status==='1'&&!scope.row.effectiveEndDate" type="danger">停用但未设置失效日期</el-tag><span v-else>{{ scope.row.effectiveEndDate || '长期' }}</span></template></el-table-column>
        <el-table-column label="状态" width="90" align="center"><template #default="scope"><el-switch v-model="scope.row.status" v-hasPermi="['property:chargeBinding:edit']" active-value="0" inactive-value="1" @change="handleBindingStatusChange(scope.row)" /></template></el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center"><template #default="scope">
          <el-button v-hasPermi="['property:chargeBinding:edit']" link type="primary" icon="Edit" @click="handleBindingEdit(scope.row)" />
          <el-button v-hasPermi="['property:chargeBinding:remove']" link type="danger" icon="Delete" @click="handleBindingDelete(scope.row)" />
        </template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="bindingFormVisible" :title="bindingForm.id ? '修改收费设置' : '新增收费设置'" width="720px" append-to-body @closed="resetBindingForm">
      <el-form ref="bindingFormRef" :model="bindingForm" :rules="bindingRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="所属项目"><el-input :model-value="currentProjectStore.currentProjectName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费房间"><el-input :model-value="bindingRoomName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费项目" prop="chargeItemId"><el-select v-model="bindingForm.chargeItemId" filterable :disabled="Boolean(bindingForm.id)" placeholder="请选择收费项目" @change="handleBindingItemChange"><el-option v-for="item in bindingItemOptions" :key="item.id" :label="`${item.itemName}（${item.itemCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计费规则" prop="chargeRuleId"><el-select v-model="bindingForm.chargeRuleId" filterable :disabled="Boolean(bindingForm.id) || !bindingForm.chargeItemId" placeholder="请选择计费规则"><el-option v-for="item in bindingRuleOptions" :key="item.id" :label="`${item.ruleName}（${item.ruleCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="规则摘要"><el-alert :title="selectedRuleSummary" :description="selectedCycleHint" type="info" :closable="false" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效日期" prop="effectiveStartDate"><el-date-picker v-model="bindingForm.effectiveStartDate" type="date" value-format="YYYY-MM-DD" :disabled="Boolean(bindingForm.id)" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效日期" prop="effectiveEndDate"><el-date-picker v-model="bindingForm.effectiveEndDate" type="date" value-format="YYYY-MM-DD" clearable /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="bindingForm.status"><el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示顺序" prop="sort"><el-input-number v-model="bindingForm.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="bindingForm.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="bindingSubmitLoading" @click="submitBindingForm">确定</el-button><el-button @click="bindingFormVisible=false">取消</el-button></template>
    </el-dialog>
    <el-dialog v-model="batchBindingVisible" title="批量收费设置" width="760px" append-to-body @closed="resetBatchBinding">
      <el-alert :title="`当前项目：${currentProjectStore.currentProjectName}；已选择 ${selectedRooms.length} 个房间（仅当前页实际勾选）`" type="info" :closable="false" show-icon class="mb-3" />
      <div class="room-preview mb-3"><el-tag v-for="room in selectedRooms.slice(0,5)" :key="room.id" class="mr-1">{{ fullRoomName(room) }}</el-tag><span v-if="selectedRooms.length>5">等 {{ selectedRooms.length }} 个房间</span></div>
      <el-form ref="batchBindingFormRef" :model="batchBindingForm" :rules="bindingRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="收费项目" prop="chargeItemId"><el-select v-model="batchBindingForm.chargeItemId" filterable @change="handleBatchItemChange"><el-option v-for="item in bindingItemOptions" :key="item.id" :label="`${item.itemName}（${item.itemCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计费规则" prop="chargeRuleId"><el-select v-model="batchBindingForm.chargeRuleId" filterable :disabled="!batchBindingForm.chargeItemId"><el-option v-for="item in batchRuleOptions" :key="item.id" :label="`${item.ruleName}（${item.ruleCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效日期" prop="effectiveStartDate"><el-date-picker v-model="batchBindingForm.effectiveStartDate" type="date" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效日期"><el-date-picker v-model="batchBindingForm.effectiveEndDate" type="date" value-format="YYYY-MM-DD" clearable /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示顺序"><el-input-number v-model="batchBindingForm.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="batchBindingForm.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="batchBindingVisible=false">取消</el-button><el-button type="primary" :loading="batchBindingLoading" @click="submitBatchBinding">确认设置</el-button></template>
    </el-dialog>
    <el-dialog v-model="batchResultVisible" title="收费设置完成" width="760px" append-to-body>
      <el-descriptions v-if="batchResult" :column="3" border class="mb-3"><el-descriptions-item label="总计">{{ batchResult.totalCount }}</el-descriptions-item><el-descriptions-item label="成功">{{ batchResult.successCount }}</el-descriptions-item><el-descriptions-item label="失败">{{ batchResult.failedCount }}</el-descriptions-item></el-descriptions>
      <el-alert v-if="batchResult?.failedCount" :title="batchResult.successCount ? '部分成功' : '全部失败'" type="warning" :closable="false" show-icon class="mb-3" />
      <el-table v-if="batchResult?.failures.length" :data="batchResult.failures" border><el-table-column label="房屋" prop="roomName" min-width="220"/><el-table-column label="失败原因" prop="reasonMessage" min-width="320"/></el-table>
    </el-dialog>
    <RoomLedgerDialog ref="ledgerDialog" :project-id="currentProjectId" :project-name="currentProjectStore.currentProjectName" @open-binding="openBindingDialog" />
  </div>
</template>

<script setup name="Room" lang="ts">
import type { UploadUserFile } from 'element-plus';
import { buildingOptions, resourceProjectOptions } from '@/api/property/resource/building';
import type { BuildingOptionVO } from '@/api/property/resource/building/types';
import { buildingUnitOptions } from '@/api/property/resource/unit';
import type { BuildingUnitOptionVO } from '@/api/property/resource/unit/types';
import { addRoom, changeRoomStatus, delRoom, exportRoom, getRoom, listRoom, updateRoom } from '@/api/property/resource/room';
import type { RoomForm, RoomQuery, RoomVO } from '@/api/property/resource/room/types';
import { downloadTreeImportTemplate, treeImportResource } from '@/api/property/resource/treeImport';
import type { ImportResult } from '@/api/property/resource/treeImport/types';
import { addChargeBinding, batchAddChargeBinding, changeChargeBindingStatus, chargeBindingContextItems, chargeBindingContextRules, delChargeBinding, getChargeBinding, listChargeBinding, updateChargeBinding } from '@/api/property/charge/binding';
import type { ChargeBindingBatchForm, ChargeBindingBatchResultVO, ChargeBindingForm, ChargeBindingVO } from '@/api/property/charge/binding/types';
import type { ChargeItemOptionVO } from '@/api/property/charge/item/types';
import type { ChargeRuleOptionVO } from '@/api/property/charge/rule/types';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useDict } from '@/utils/dict';
import RoomLedgerDialog from '@/views/property/charge/payment/RoomLedgerDialog.vue';

const roomDicts = useDict('pm_room_type', 'pm_property_type', 'pm_delivery_status', 'pm_occupancy_status', 'pm_billing_method', 'pm_billing_cycle', 'pm_cycle_mode', 'sys_normal_disable');
const pm_room_type = computed(() => roomDicts.pm_room_type || []); const pm_property_type = computed(() => roomDicts.pm_property_type || []);
const pm_delivery_status = computed(() => roomDicts.pm_delivery_status || []); const pm_occupancy_status = computed(() => roomDicts.pm_occupancy_status || []);
const sys_normal_disable = computed(() => roomDicts.sys_normal_disable || []);
const pm_billing_method = computed(() => roomDicts.pm_billing_method || []); const pm_billing_cycle = computed(() => roomDicts.pm_billing_cycle || []); const pm_cycle_mode = computed(() => roomDicts.pm_cycle_mode || []);

const currentProjectStore = useCurrentProjectStore();
const currentProjectId = computed(() => currentProjectStore.currentProjectId);
const roomList = ref<RoomVO[]>([]); const buildingOptionsList = ref<BuildingOptionVO[]>([]); const unitOptionsList = ref<BuildingUnitOptionVO[]>([]); const allUnitOptionsList = ref<BuildingUnitOptionVO[]>([]); const formUnitOptions = ref<BuildingUnitOptionVO[]>([]);
const detail = ref<RoomVO>(); const detailVisible = ref(false); const ids = ref<Array<number | string>>([]); const selectedRooms = ref<RoomVO[]>([]); const roomTableRef = ref(); const single = ref(true); const multiple = ref(true); const total = ref(0);
const importDialogVisible = ref(false); const importLoading = ref(false); const importFileList = ref<UploadUserFile[]>([]); const importResult = ref<ImportResult>(); const importProjectId = ref<number|string>(); const importProjectName = ref(''); let importVersion = 0;
const loading = ref(false); const submitLoading = ref(false); const dialogProjectId = ref<number | string>(); const resourcePermissionInvalid = ref(false); const resourceValidatedProjectId = ref<number | string>(); const pageActive = ref(true);
const bindingVisible = ref(false); const bindingFormVisible = ref(false); const bindingLoading = ref(false); const bindingSubmitLoading = ref(false); const bindingList = ref<ChargeBindingVO[]>([]); const bindingRoom = ref<RoomVO>(); const bindingItemOptions = ref<ChargeItemOptionVO[]>([]); const bindingRuleOptions = ref<ChargeRuleOptionVO[]>([]); const bindingFormRef = ref<ElFormInstance>(); let bindingVersion = 0;
const batchBindingVisible = ref(false); const batchBindingLoading = ref(false); const batchResultVisible = ref(false); const batchResult = ref<ChargeBindingBatchResultVO>(); const batchRuleOptions = ref<ChargeRuleOptionVO[]>([]); const batchBindingFormRef = ref<ElFormInstance>();
const initBatchBindingForm = (): ChargeBindingBatchForm => ({ projectId: currentProjectId.value || '', roomIds: [], chargeItemId: undefined, chargeRuleId: undefined, effectiveStartDate: undefined, effectiveEndDate: undefined, sort: 0, remark: '' });
const batchBindingForm = ref<ChargeBindingBatchForm>(initBatchBindingForm());
const ledgerDialog = ref<InstanceType<typeof RoomLedgerDialog>>();
const initBindingForm = (): ChargeBindingForm => ({ id: undefined, projectId: undefined, objectType: 'ROOM', objectId: undefined, chargeItemId: undefined, chargeRuleId: undefined, effectiveStartDate: undefined, effectiveEndDate: undefined, status: '0', sort: 0, remark: '' });
const bindingForm = ref<ChargeBindingForm>(initBindingForm());
const bindingRules = { chargeItemId: [{ required: true, message: '收费项目不能为空', trigger: 'change' }], chargeRuleId: [{ required: true, message: '计费规则不能为空', trigger: 'change' }], effectiveStartDate: [{ required: true, message: '生效日期不能为空', trigger: 'change' }] };
const bindingRoomName = computed(() => bindingRoom.value ? `${buildingName(bindingRoom.value.buildingId)} / ${unitName(bindingRoom.value.unitId)} / ${bindingRoom.value.roomNo}` : '-');
const selectedRule = computed(() => bindingRuleOptions.value.find(x => String(x.id) === String(bindingForm.value.chargeRuleId)));
const dictLabel = (options:any[],value?:string) => options.find(x=>x.value===value)?.label || value || '-';
const selectedRuleSummary = computed(() => selectedRule.value ? `计费方式：${dictLabel(pm_billing_method.value,selectedRule.value.billingMethod)}；计费标准：${selectedRule.value.fixedAmount != null ? `${selectedRule.value.fixedAmount} 元/周期` : `${selectedRule.value.unitPrice ?? '-'} 元/㎡`}；计费周期：${dictLabel(pm_billing_cycle.value,selectedRule.value.billingCycle)}；周期模式：${dictLabel(pm_cycle_mode.value,selectedRule.value.cycleMode)}；规则有效期：${selectedRule.value.effectiveStartDate} ～ ${selectedRule.value.effectiveEndDate || '长期'}` : '请选择计费规则后查看计费方式、周期与标准');
const selectedCycleHint = computed(() => selectedRule.value?.cycleMode==='NATURAL' ? '自然周期首期从生效日期开始，到当前自然周期结束；之后按完整自然周期计费。' : selectedRule.value?.cycleMode==='ROLLING' ? '循环周期将以生效日期作为计费周期起点。' : '');
let requestVersion = 0; let candidateVersion = 0; let activationCount = 0;
const { showSearch } = useSearchToggle(); const queryFormRef = ref<ElFormInstance>(); const roomFormRef = ref<ElFormInstance>();
const initFormData = (): RoomForm => ({ id: undefined, projectId: undefined, buildingId: undefined, unitId: undefined, roomCode: '', roomNo: '', floorNo: undefined, roomType: undefined, propertyType: undefined, buildingArea: undefined, usableArea: undefined, deliveryStatus: 'UNDELIVERED', occupancyStatus: 'VACANT', sort: 0, status: '0', remark: '' });
const data = reactive<PageData<RoomForm, RoomQuery>>({ form: initFormData(), queryParams: { pageNum: 1, pageSize: 10, projectId: undefined, buildingId: undefined, unitId: undefined, roomCode: undefined, roomNo: undefined, status: undefined }, rules: {
  buildingId: [{ required: true, message: '所属楼栋不能为空', trigger: 'change' }], unitId: [{ required: true, message: '所属单元不能为空', trigger: 'change' }],
  roomCode: [{ required: true, message: '房屋编码不能为空', trigger: 'blur' }, { max: 64, message: '房屋编码长度不能超过64个字符', trigger: 'blur' }],
  roomNo: [{ required: true, message: '房号不能为空', trigger: 'blur' }, { max: 32, message: '房号长度不能超过32个字符', trigger: 'blur' }]
} });
const { queryParams, form, rules } = toRefs(data); const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({ form, formRef: roomFormRef, initialFormData: initFormData() });
const displayName = (name?: string, code?: string) => name?.trim() || code?.trim() || '-';
const hasDuplicateName = <T extends { buildingName?: string; unitName?: string }>(item: T, options: T[], field: 'buildingName' | 'unitName') => {
  const name = item[field]?.trim();
  return Boolean(name) && options.filter(option => option[field]?.trim() === name).length > 1;
};
const buildingOptionLabel = (item: BuildingOptionVO) => {
  const name = displayName(item.buildingName, item.buildingCode);
  return hasDuplicateName(item, buildingOptionsList.value, 'buildingName') && item.buildingCode?.trim() ? `${name}（${item.buildingCode.trim()}）` : name;
};
const unitOptionLabel = (item: BuildingUnitOptionVO, options: BuildingUnitOptionVO[]) => {
  const name = displayName(item.unitName, item.unitCode);
  return hasDuplicateName(item, options, 'unitName') && item.unitCode?.trim() ? `${name}（${item.unitCode.trim()}）` : name;
};
const buildingName = (id: number | string) => { const item=buildingOptionsList.value.find(x=>String(x.id)===String(id)); return item?displayName(item.buildingName,item.buildingCode):'-'; };
const unitName = (id: number | string) => { const item=[...allUnitOptionsList.value,...formUnitOptions.value].find(x=>String(x.id)===String(id)); return item?displayName(item.unitName,item.unitCode):'-'; };
const clearSelection = () => { roomTableRef.value?.clearSelection();ids.value=[];selectedRooms.value=[];single.value=true;multiple.value=true; };
const clearList = () => { roomList.value=[];total.value=0;clearSelection(); };
const cancel = () => { closeDialog();resetForm();formUnitOptions.value=[];dialogProjectId.value=undefined; };
const resetProjectState = () => { clearList();buildingOptionsList.value=[];unitOptionsList.value=[];allUnitOptionsList.value=[];queryParams.value.buildingId=undefined;queryParams.value.unitId=undefined;cancel();detail.value=undefined;detailVisible.value=false; };
const invalidateRequests = () => { requestVersion++;candidateVersion++;loading.value=false; };
const isCurrentRequest = (v:number,p:number|string) => pageActive.value&&v===requestVersion&&String(currentProjectId.value)===String(p);
const isBusinessPermissionError = (e:unknown) => e instanceof Error&&e.message.includes('无项目业务访问权限');
const validateResourceProject = async (p:number|string,v:number) => { const res=await resourceProjectOptions();if(!isCurrentRequest(v,p))return false;const allowed=(res.data||[]).some(x=>String(x.id)===String(p));resourceValidatedProjectId.value=allowed?p:undefined;resourcePermissionInvalid.value=!allowed;if(!allowed)resetProjectState();return allowed; };
const loadBuildings = async (p:number|string,v:number) => { const res=await buildingOptions({projectId:p});if(!isCurrentRequest(v,p))return false;buildingOptionsList.value=res.data||[];return true; };
const loadAllUnits = async (p:number|string,v:number) => { const res=await buildingUnitOptions({projectId:p});if(!isCurrentRequest(v,p))return false;allUnitOptionsList.value=res.data||[];return true; };
const loadQueryUnits = async (p:number|string,b:number|string|undefined,v:number) => { if(!b){unitOptionsList.value=[];return true;}const res=await buildingUnitOptions({projectId:p,buildingId:b});if(!isCurrentRequest(v,p))return false;unitOptionsList.value=res.data||[];return true; };
const handlePermissionRevoked = async (p:number|string,v:number) => { resetProjectState();try{const allowed=await validateResourceProject(p,v);if(isCurrentRequest(v,p)&&!allowed)modal.msgWarning('当前项目的房屋访问权限已失效，请重新选择项目');}catch{/* 网络异常不视为撤权 */} };
const handleOperationError = async (e:unknown) => { const p=currentProjectId.value;if(p&&isBusinessPermissionError(e)){await handlePermissionRevoked(p,++requestVersion);return;}modal.msgError(e instanceof Error&&e.message?e.message:'操作失败，请稍后重试'); };
const getList = async () => { const p=currentProjectId.value;const v=++requestVersion;if(!p){resetProjectState();resourcePermissionInvalid.value=false;resourceValidatedProjectId.value=undefined;return;}loading.value=true;try{if(!(await validateResourceProject(p,v))||!(await loadBuildings(p,v))||!(await loadAllUnits(p,v))||!(await loadQueryUnits(p,queryParams.value.buildingId,v)))return;const res=await listRoom({...queryParams.value,projectId:p});if(!isCurrentRequest(v,p))return;roomList.value=res.data?.rows||[];total.value=res.data?.total||0;}catch(e){if(isCurrentRequest(v,p)&&isBusinessPermissionError(e))await handlePermissionRevoked(p,v);}finally{if(v===requestVersion)loading.value=false;} };
const handleQuery = () => { queryParams.value.pageNum=1;getList(); }; const handleQueryBuildingChange = () => { queryParams.value.unitId=undefined;unitOptionsList.value=[];handleQuery(); }; const resetQuery = () => { queryFormRef.value?.resetFields();unitOptionsList.value=[];handleQuery(); };
const handleSelectionChange = (rows:RoomVO[]) => { selectedRooms.value=rows;ids.value=rows.map(x=>x.id);single.value=rows.length!==1;multiple.value=rows.length===0; };
const handleAdd = () => { if(!currentProjectId.value||resourcePermissionInvalid.value)return modal.msgWarning('请先选择具有资源权限的当前项目');if(!buildingOptionsList.value.length)return modal.msgWarning('当前项目没有可用楼栋');resetForm();form.value.projectId=currentProjectId.value;dialogProjectId.value=currentProjectId.value;openDialog('新增房屋'); };
const handleFormBuildingChange = async () => { form.value.unitId=undefined;formUnitOptions.value=[];const p=currentProjectId.value,b=form.value.buildingId,v=++candidateVersion;if(!p||!b)return;try{const res=await buildingUnitOptions({projectId:p,buildingId:b});if(v===candidateVersion&&String(p)===String(currentProjectId.value)&&String(b)===String(form.value.buildingId))formUnitOptions.value=res.data||[];}catch(e){await handleOperationError(e);} };
const loadDetail = async (id:number|string,mode:'edit'|'detail') => { const p=currentProjectId.value;if(!p||resourcePermissionInvalid.value)return;const v=++requestVersion;try{if(!(await validateResourceProject(p,v))||!(await loadBuildings(p,v)))return;const res=await getRoom(id);if(!isCurrentRequest(v,p))return;const units=await buildingUnitOptions({projectId:p,buildingId:res.data.buildingId});if(!isCurrentRequest(v,p))return;formUnitOptions.value=units.data||[];if(mode==='edit'){resetForm();Object.assign(form.value,res.data);dialogProjectId.value=p;showDialog('修改房屋');}else{detail.value=res.data;detailVisible.value=true;}}catch(e){if(isCurrentRequest(v,p)&&isBusinessPermissionError(e))await handlePermissionRevoked(p,v);} };
const handleUpdate = (row?:Partial<RoomVO>) => { const id=row?.id??ids.value[0];if(id)loadDetail(id,'edit'); }; const handleDetail = (row:Partial<RoomVO>) => { if(row.id)loadDetail(row.id,'detail'); };
const submitForm = () => roomFormRef.value?.validate(async valid => { if(!valid)return;if(!currentProjectId.value||String(dialogProjectId.value)!==String(currentProjectId.value)){modal.msgWarning('当前项目已切换，请重新操作');cancel();return;}submitLoading.value=true;try{if(form.value.id)await updateRoom(form.value);else await addRoom({...form.value,projectId:currentProjectId.value});modal.msgSuccess('操作成功');cancel();await getList();}catch(e){await handleOperationError(e);}finally{submitLoading.value=false;} });
const handleStatusChange = async (row:Partial<RoomVO>) => { if(!row.id)return;const target=row.status||'1';try{await modal.confirm(`确认${target==='0'?'启用':'停用'}房屋“${row.roomNo}”吗？`);await changeRoomStatus({id:row.id,status:target});modal.msgSuccess('操作成功');}catch(e){row.status=target==='0'?'1':'0';await handleOperationError(e);} };
const handleDelete = async (row?:Partial<RoomVO>) => { const target=row?.id??ids.value;if(Array.isArray(target)&&!target.length)return;await modal.confirm('确认删除选中的房屋吗？存在有效客户关系的房屋无法删除。');try{await delRoom(target);modal.msgSuccess('删除成功');await getList();}catch(e){await handleOperationError(e);} };
const handleExport = () => { if(currentProjectId.value&&!resourcePermissionInvalid.value)exportRoom({...queryParams.value,projectId:currentProjectId.value}); };
const resetBindingForm = () => { bindingForm.value=initBindingForm();bindingRuleOptions.value=[];bindingFormRef.value?.clearValidate(); };
const resetBindingState = () => { bindingVersion++;bindingList.value=[];bindingRoom.value=undefined;bindingItemOptions.value=[];bindingFormVisible.value=false;resetBindingForm(); };
const bindingRequestCurrent = (v:number,p:number|string,roomId:number|string) => v===bindingVersion&&bindingVisible.value&&String(currentProjectId.value)===String(p)&&String(bindingRoom.value?.id)===String(roomId);
const loadBindingList = async () => { const p=currentProjectId.value,roomId=bindingRoom.value?.id;if(!p||!roomId)return;const v=++bindingVersion;bindingLoading.value=true;try{const res=await listChargeBinding(roomId);if(bindingRequestCurrent(v,p,roomId))bindingList.value=res.data||[];}catch(e){await handleOperationError(e);}finally{if(v===bindingVersion)bindingLoading.value=false;} };
const openBindingDialog = async (row:Partial<RoomVO>) => { const p=currentProjectId.value;if(!p)return modal.msgWarning('请先选择当前物业项目');if(!row.id)return;resetBindingState();bindingRoom.value=row as RoomVO;bindingVisible.value=true;await loadBindingList(); };
const loadBindingRules = async (itemId:number|string|undefined,mode:'create'|'edit'=bindingForm.value.id?'edit':'create') => { const p=currentProjectId.value;if(!p||!itemId){bindingRuleOptions.value=[];return;}const res=await chargeBindingContextRules(mode,p,itemId);if(String(p)===String(currentProjectId.value))bindingRuleOptions.value=res.data||[]; };
const handleBindingItemChange = async () => { bindingForm.value.chargeRuleId=undefined;await loadBindingRules(bindingForm.value.chargeItemId); };
const fullRoomName = (room:RoomVO) => [buildingName(room.buildingId),room.unitId?unitName(room.unitId):'',room.roomNo||room.roomCode].filter(x=>x&&x!=='-').join('-');
const resetBatchBinding = () => { batchBindingForm.value=initBatchBindingForm();batchRuleOptions.value=[];batchBindingFormRef.value?.clearValidate(); };
const openBatchBinding = async () => { const p=currentProjectId.value;if(!p)return modal.msgWarning('请先选择项目');if(!selectedRooms.value.length)return modal.msgWarning('请先选择房间');resetBatchBinding();batchBindingForm.value.projectId=p;batchBindingForm.value.roomIds=selectedRooms.value.map(x=>x.id);const res=await chargeBindingContextItems('create',p);if(String(p)!==String(currentProjectId.value))return;bindingItemOptions.value=res.data||[];batchBindingVisible.value=true; };
const handleBatchItemChange = async () => { batchBindingForm.value.chargeRuleId=undefined;batchRuleOptions.value=[];const p=currentProjectId.value,itemId=batchBindingForm.value.chargeItemId;if(!p||!itemId)return;const res=await chargeBindingContextRules('create',p,itemId);if(batchBindingVisible.value&&String(p)===String(currentProjectId.value))batchRuleOptions.value=res.data||[]; };
const submitBatchBinding = () => batchBindingFormRef.value?.validate(async valid=>{if(!valid)return;const p=currentProjectId.value;if(!p||String(batchBindingForm.value.projectId)!==String(p)||batchBindingForm.value.roomIds.some(id=>!selectedRooms.value.some(r=>String(r.id)===String(id)))){batchBindingVisible.value=false;return modal.msgWarning('当前项目或房屋选择已变化，请重新操作');}batchBindingLoading.value=true;try{const res=await batchAddChargeBinding(batchBindingForm.value);batchResult.value=res.data;batchBindingVisible.value=false;batchResultVisible.value=true;res.data.failedCount?modal.msgWarning(res.data.successCount?'批量收费设置部分成功':'批量收费设置全部失败'):modal.msgSuccess('批量收费设置成功');clearSelection();await getList();}catch(e){await handleOperationError(e);}finally{batchBindingLoading.value=false;}});
const handleBindingAdd = async () => { const p=currentProjectId.value,roomId=bindingRoom.value?.id;if(!p||!roomId)return modal.msgWarning('当前项目或房间无效，请重新打开收费设置');const items=await chargeBindingContextItems('create',p);bindingItemOptions.value=items.data||[];resetBindingForm();bindingForm.value.projectId=p;bindingForm.value.objectId=roomId;bindingFormVisible.value=true; };
const handleBindingEdit = async (row:Partial<ChargeBindingVO>) => { const p=currentProjectId.value,roomId=bindingRoom.value?.id;if(!p||!roomId||!row.id)return;const v=bindingVersion;try{const [res,items]=await Promise.all([getChargeBinding(row.id),chargeBindingContextItems('edit',p)]);if(v!==bindingVersion||String(p)!==String(currentProjectId.value)||String(roomId)!==String(bindingRoom.value?.id))return;bindingItemOptions.value=items.data||[];bindingForm.value={...res.data};await loadBindingRules(res.data.chargeItemId,'edit');if(!bindingRuleOptions.value.some(x=>String(x.id)===String(res.data.chargeRuleId)))bindingRuleOptions.value.push({id:res.data.chargeRuleId,projectId:res.data.projectId,chargeItemId:res.data.chargeItemId,chargeItemName:res.data.chargeItemName||'',ruleCode:'历史规则',ruleName:res.data.chargeRuleName||'历史规则',billingMethod:res.data.billingMethod||'',billingCycle:res.data.billingCycle||'',cycleMode:res.data.cycleMode||'',unitPrice:res.data.unitPrice,fixedAmount:res.data.fixedAmount,effectiveStartDate:res.data.ruleEffectiveStartDate||'',effectiveEndDate:res.data.ruleEffectiveEndDate});bindingFormVisible.value=true;}catch(e){await handleOperationError(e);} };
const submitBindingForm = () => bindingFormRef.value?.validate(async valid => { if(!valid)return;const p=currentProjectId.value,roomId=bindingRoom.value?.id;if(!p||!roomId||String(bindingForm.value.projectId)!==String(p)||String(bindingForm.value.objectId)!==String(roomId)){bindingFormVisible.value=false;return modal.msgWarning('当前项目或房间已切换，请重新操作');}bindingSubmitLoading.value=true;try{if(bindingForm.value.id)await updateChargeBinding(bindingForm.value);else await addChargeBinding(bindingForm.value);modal.msgSuccess('操作成功');bindingFormVisible.value=false;await loadBindingList();}catch(e){await handleOperationError(e);}finally{bindingSubmitLoading.value=false;} });
const handleBindingStatusChange = async (row:Partial<ChargeBindingVO>) => { if(!row.id||!row.status)return;const target=row.status;try{let effectiveEndDate:string|undefined;if(target==='1'){const today=new Date().toISOString().slice(0,10);const result=await ElMessageBox.prompt('停用后该收费设置成为历史区间；重新收费请新建收费设置。','停用收费设置',{inputValue:today,inputPlaceholder:'YYYY-MM-DD',inputValidator:(v)=>/^\d{4}-\d{2}-\d{2}$/.test(v)||'请输入 YYYY-MM-DD 格式的失效日期'});effectiveEndDate=result.value}else await modal.confirm('确认启用该收费设置吗？');await changeChargeBindingStatus({id:row.id,status:target,effectiveEndDate});row.effectiveEndDate=effectiveEndDate??row.effectiveEndDate;modal.msgSuccess('操作成功');}catch(e){row.status=target==='0'?'1':'0';await handleOperationError(e);} };
const handleBindingDelete = async (row:Partial<ChargeBindingVO>) => { if(!row.id)return;await modal.confirm(`确认删除收费设置“${row.chargeItemName || ''}”吗？`);try{await delChargeBinding(row.id);modal.msgSuccess('删除成功');await loadBindingList();}catch(e){await handleOperationError(e);} };
const bindingStandard = (row:Partial<ChargeBindingVO>) => row.fixedAmount != null ? `${row.fixedAmount} 元/周期` : row.unitPrice != null ? `${row.unitPrice} 元/计费单位` : '-';
const resetImportDialog = () => { importFileList.value=[];importResult.value=undefined;importProjectId.value=undefined;importProjectName.value='';importLoading.value=false; };
const openImportDialog = () => { if(!currentProjectId.value)return modal.msgWarning('请先选择当前物业项目');importVersion++;resetImportDialog();importProjectId.value=currentProjectId.value;importProjectName.value=currentProjectStore.currentProjectName;importDialogVisible.value=true; };
const downloadImportTemplate = async () => { if(!currentProjectId.value)return modal.msgWarning('请先选择当前物业项目');await downloadTreeImportTemplate(); };
const submitTreeImport = async () => { const file=importFileList.value[0]?.raw,p=importProjectId.value,v=++importVersion;if(!file||!p)return modal.msgWarning('请选择 Excel 文件');if(String(p)!==String(currentProjectId.value)){importDialogVisible.value=false;return modal.msgWarning('当前项目已切换，请重新选择文件');}importLoading.value=true;importResult.value=undefined;try{const res=await treeImportResource(p,file);if(v!==importVersion||String(p)!==String(currentProjectId.value)||!importDialogVisible.value)return;importResult.value=res.data;if(res.data.failedRows===0){modal.msgSuccess('导入成功');await getList();}}catch(e){if(v===importVersion&&String(p)===String(currentProjectId.value))await handleOperationError(e);}finally{if(v===importVersion)importLoading.value=false;} };
const stopProjectWatch = watch(currentProjectId,()=>{importVersion++;importDialogVisible.value=false;resetImportDialog();bindingVisible.value=false;resetBindingState();batchBindingVisible.value=false;batchResultVisible.value=false;batchResult.value=undefined;resetBatchBinding();clearSelection();ledgerDialog.value?.close();invalidateRequests();resetProjectState();resourcePermissionInvalid.value=false;resourceValidatedProjectId.value=undefined;queryParams.value.pageNum=1;if(pageActive.value)getList();});
onMounted(getList);onActivated(()=>{pageActive.value=true;if(activationCount++===0)return;if(String(resourceValidatedProjectId.value||'')!==String(currentProjectId.value||''))resetProjectState();getList();});onDeactivated(()=>{pageActive.value=false;invalidateRequests();});onBeforeUnmount(()=>{pageActive.value=false;invalidateRequests();stopProjectWatch();});
</script>

<style lang="scss" scoped>
.room-page :deep(.el-select) { width: 220px; }
.room-page :deep(.el-input-number) { width: 100%; }
</style>
