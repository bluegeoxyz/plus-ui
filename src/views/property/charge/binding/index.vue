<template>
  <div class="p-2">
    <el-card shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="项目">
          <el-select v-model="filters.projectId" clearable filterable placeholder="请选择项目" style="width: 220px" @change="handleProjectChange">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼栋">
          <el-select v-model="filters.buildingId" clearable filterable placeholder="请选择楼栋" style="width: 180px" :disabled="!filters.projectId" @change="handleBuildingChange">
            <el-option v-for="item in buildingOptions" :key="item.id" :label="item.buildingName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="单元">
          <el-select v-model="filters.unitId" clearable filterable placeholder="请选择单元" style="width: 180px" :disabled="!filters.buildingId" @change="handleUnitChange">
            <el-option v-for="item in unitOptions" :key="item.id" :label="item.unitName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房屋">
          <el-select v-model="filters.roomId" clearable filterable placeholder="请选择房屋" style="width: 200px" :disabled="!filters.unitId" @change="loadBindings">
            <el-option v-for="item in roomOptions" :key="item.id" :label="item.roomNo" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button v-hasPermi="['property:chargeBinding:list']" type="primary" icon="Search" :disabled="!filters.roomId" @click="loadBindings">查询</el-button>
          <el-button icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="mb-3">
        <el-button v-hasPermi="['property:chargeBinding:add']" type="primary" icon="Plus" :disabled="!filters.roomId" @click="handleAdd">新增收费设置</el-button>
        <span v-if="filters.roomId" class="ml-3 text-sm text-gray-500">当前房屋：{{ selectedRoomName }}</span>
      </div>

      <el-table v-loading="loading" :data="bindingList" border>
        <el-table-column label="收费项目" prop="chargeItemName" min-width="140" />
        <el-table-column label="计费规则" prop="chargeRuleName" min-width="140" />
        <el-table-column label="计费标准" min-width="140"><template #default="scope">{{ bindingStandard(scope.row) }}</template></el-table-column>
        <el-table-column label="生效日期" prop="effectiveStartDate" width="120" />
        <el-table-column label="失效日期" prop="effectiveEndDate" width="120" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope"><el-switch v-model="scope.row.status" v-hasPermi="['property:chargeBinding:edit']" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button v-hasPermi="['property:chargeBinding:query']" link type="primary" icon="View" @click="handleView(scope.row)">详情</el-button>
            <el-button v-hasPermi="['property:chargeBinding:edit']" link type="primary" icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
            <el-button v-hasPermi="['property:chargeBinding:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !filters.roomId" description="请先选择项目、楼栋、单元和房屋" />
    </el-card>

    <el-dialog v-model="formVisible" :title="form.id ? '修改收费设置' : '新增收费设置'" width="720px" append-to-body @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="收费房屋"><el-input :model-value="selectedRoomName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费项目" prop="chargeItemId"><el-select v-model="form.chargeItemId" filterable :disabled="Boolean(form.id)" placeholder="请选择收费项目" @change="handleItemChange"><el-option v-for="item in itemOptions" :key="item.id" :label="`${item.itemName}（${item.itemCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计费规则" prop="chargeRuleId"><el-select v-model="form.chargeRuleId" filterable :disabled="Boolean(form.id) || !form.chargeItemId" placeholder="请选择计费规则"><el-option v-for="item in ruleOptions" :key="item.id" :label="`${item.ruleName}（${item.ruleCode}）`" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效日期" prop="effectiveStartDate"><el-date-picker v-model="form.effectiveStartDate" type="date" value-format="YYYY-MM-DD" :disabled="Boolean(form.id)" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效日期"><el-date-picker v-model="form.effectiveEndDate" type="date" value-format="YYYY-MM-DD" clearable /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示顺序"><el-input-number v-model="form.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button><el-button @click="formVisible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="收费设置详情" width="680px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="房屋">{{ selectedRoomName }}</el-descriptions-item>
        <el-descriptions-item label="收费项目">{{ detail?.chargeItemName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计费规则">{{ detail?.chargeRuleName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计费标准">{{ bindingStandard(detail || {}) }}</el-descriptions-item>
        <el-descriptions-item label="生效日期">{{ detail?.effectiveStartDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="失效日期">{{ detail?.effectiveEndDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail?.status === '0' ? '正常' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessageBox } from 'element-plus';
import type { ChargeItemOptionVO } from '@/api/property/charge/item/types';
import type { ChargeRuleOptionVO } from '@/api/property/charge/rule/types';
import {
  addChargeBinding,
  changeChargeBindingStatus,
  chargeBindingContextItems,
  chargeBindingContextRules,
  chargeBindingListBuildings,
  chargeBindingListProjects,
  chargeBindingListRooms,
  chargeBindingListUnits,
  delChargeBinding,
  getChargeBinding,
  listChargeBinding,
  updateChargeBinding
} from '@/api/property/charge/binding';
import type {
  ChargeBindingBuildingOptionVO,
  ChargeBindingForm,
  ChargeBindingProjectOptionVO,
  ChargeBindingRoomOptionVO,
  ChargeBindingUnitOptionVO,
  ChargeBindingVO
} from '@/api/property/charge/binding/types';
import { useDict } from '@/utils/dict';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

const filters = reactive<{ projectId?: number | string; buildingId?: number | string; unitId?: number | string; roomId?: number | string }>({});
const projectOptions = ref<ChargeBindingProjectOptionVO[]>([]);
const buildingOptions = ref<ChargeBindingBuildingOptionVO[]>([]);
const unitOptions = ref<ChargeBindingUnitOptionVO[]>([]);
const roomOptions = ref<ChargeBindingRoomOptionVO[]>([]);
const bindingList = ref<ChargeBindingVO[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const itemOptions = ref<ChargeItemOptionVO[]>([]);
const ruleOptions = ref<ChargeRuleOptionVO[]>([]);
const detail = ref<ChargeBindingVO>();
let requestVersion = 0;

const initForm = (): ChargeBindingForm => ({ objectType: 'ROOM', status: '0', sort: 0 });
const form = ref<ChargeBindingForm>(initForm());
const rules: FormRules<ChargeBindingForm> = {
  chargeItemId: [{ required: true, message: '收费项目不能为空', trigger: 'change' }],
  chargeRuleId: [{ required: true, message: '计费规则不能为空', trigger: 'change' }],
  effectiveStartDate: [{ required: true, message: '生效日期不能为空', trigger: 'change' }]
};
const selectedRoomName = computed(() => roomOptions.value.find((item) => String(item.id) === String(filters.roomId))?.roomNo || '-');

const resetForm = () => {
  form.value = initForm();
  itemOptions.value = [];
  ruleOptions.value = [];
  formRef.value?.clearValidate();
};
const clearBindings = () => {
  requestVersion++;
  bindingList.value = [];
  detailVisible.value = false;
  formVisible.value = false;
  resetForm();
};
const handleProjectChange = async () => {
  filters.buildingId = undefined;
  filters.unitId = undefined;
  filters.roomId = undefined;
  buildingOptions.value = [];
  unitOptions.value = [];
  roomOptions.value = [];
  clearBindings();
  if (filters.projectId) buildingOptions.value = (await chargeBindingListBuildings(filters.projectId)).data || [];
};
const handleBuildingChange = async () => {
  filters.unitId = undefined;
  filters.roomId = undefined;
  unitOptions.value = [];
  roomOptions.value = [];
  clearBindings();
  if (filters.projectId && filters.buildingId) unitOptions.value = (await chargeBindingListUnits(filters.projectId, filters.buildingId)).data || [];
};
const handleUnitChange = async () => {
  filters.roomId = undefined;
  roomOptions.value = [];
  clearBindings();
  if (filters.projectId && filters.buildingId && filters.unitId) roomOptions.value = (await chargeBindingListRooms(filters.projectId, filters.buildingId, filters.unitId)).data || [];
};
const loadBindings = async () => {
  clearBindings();
  if (!filters.roomId) return;
  const roomId = filters.roomId;
  const version = ++requestVersion;
  loading.value = true;
  try {
    const res = await listChargeBinding(roomId);
    if (version === requestVersion && String(roomId) === String(filters.roomId)) bindingList.value = res.data || [];
  } finally {
    if (version === requestVersion) loading.value = false;
  }
};
const resetFilters = async () => {
  filters.projectId = undefined;
  await handleProjectChange();
};
const loadRules = async (itemId: number | string | undefined, mode: 'create' | 'edit') => {
  if (!filters.projectId || !itemId) return void (ruleOptions.value = []);
  ruleOptions.value = (await chargeBindingContextRules(mode, filters.projectId, itemId)).data || [];
};
const handleItemChange = async () => {
  form.value.chargeRuleId = undefined;
  await loadRules(form.value.chargeItemId, form.value.id ? 'edit' : 'create');
};
const handleAdd = async () => {
  if (!filters.projectId || !filters.roomId) return proxy?.$modal.msgWarning('请先选择房屋');
  resetForm();
  form.value.projectId = filters.projectId;
  form.value.objectId = filters.roomId;
  itemOptions.value = (await chargeBindingContextItems('create', filters.projectId)).data || [];
  formVisible.value = true;
};
const getBindingId = (row: Partial<ChargeBindingVO>) => {
  if (typeof row.id !== 'string' && typeof row.id !== 'number') {
    proxy?.$modal.msgError('收费设置列表数据不完整，请刷新后重试');
    return;
  }
  return row.id;
};
const handleEdit = async (row: Partial<ChargeBindingVO>) => {
  if (!filters.projectId || !filters.roomId) return;
  const id = getBindingId(row);
  if (id === undefined) return;
  const [binding, items] = await Promise.all([getChargeBinding(id), chargeBindingContextItems('edit', filters.projectId)]);
  form.value = { ...binding.data };
  itemOptions.value = items.data || [];
  await loadRules(binding.data.chargeItemId, 'edit');
  formVisible.value = true;
};
const handleView = async (row: Partial<ChargeBindingVO>) => {
  const id = getBindingId(row);
  if (id === undefined) return;
  detail.value = (await getChargeBinding(id)).data;
  detailVisible.value = true;
};
const submitForm = () => formRef.value?.validate(async (valid) => {
  if (!valid || !filters.projectId || !filters.roomId) return;
  if (String(form.value.projectId) !== String(filters.projectId) || String(form.value.objectId) !== String(filters.roomId)) {
    formVisible.value = false;
    return proxy?.$modal.msgWarning('当前项目或房屋已切换，请重新操作');
  }
  submitLoading.value = true;
  try {
    if (form.value.id) await updateChargeBinding(form.value); else await addChargeBinding(form.value);
    proxy?.$modal.msgSuccess('操作成功');
    formVisible.value = false;
    await loadBindings();
  } finally {
    submitLoading.value = false;
  }
});
const handleStatusChange = async (row: Partial<ChargeBindingVO>) => {
  const id = getBindingId(row);
  if (id === undefined || (row.status !== '0' && row.status !== '1')) {
    proxy?.$modal.msgError('收费设置状态数据无效，请刷新后重试');
    return;
  }
  const target = row.status;
  try {
    let effectiveEndDate: string | undefined;
    if (target === '1') {
      const result = await ElMessageBox.prompt('停用后该收费设置成为历史区间；重新收费请新建收费设置。', '停用收费设置', {
        inputValue: new Date().toISOString().slice(0, 10),
        inputValidator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || '请输入 YYYY-MM-DD 格式的失效日期'
      });
      effectiveEndDate = result.value;
    } else {
      await proxy?.$modal.confirm('确认启用该收费设置吗？');
    }
    await changeChargeBindingStatus({ id, status: target, effectiveEndDate });
    row.effectiveEndDate = effectiveEndDate ?? row.effectiveEndDate;
    proxy?.$modal.msgSuccess('操作成功');
  } catch {
    row.status = target === '0' ? '1' : '0';
  }
};
const handleDelete = async (row: Partial<ChargeBindingVO>) => {
  const id = getBindingId(row);
  if (id === undefined) return;
  await proxy?.$modal.confirm(`确认删除收费设置“${row.chargeItemName || ''}”吗？`);
  await delChargeBinding(id);
  proxy?.$modal.msgSuccess('删除成功');
  await loadBindings();
};
const bindingStandard = (row: Partial<ChargeBindingVO>) => row.fixedAmount != null ? `${row.fixedAmount} 元/周期` : row.unitPrice != null ? `${row.unitPrice} 元/计费单位` : '-';

onMounted(async () => {
  projectOptions.value = (await chargeBindingListProjects()).data || [];
});
</script>
