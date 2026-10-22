<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" class="mb-2" shadow="hover"><el-form ref="queryRef" :model="query" inline>
      <el-form-item label="入库单号"><el-input v-model="query.inboundNo" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item label="仓库"><el-select v-model="query.warehouseId" clearable filterable><el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" /></el-select></el-form-item>
      <el-form-item label="类型"><el-select v-model="query.inboundType" clearable><el-option v-for="d in wm_inbound_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
      <el-form-item label="状态"><el-select v-model="query.status" clearable><el-option v-for="d in wm_inbound_status" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="search">搜索</el-button><el-button icon="Refresh" @click="reset">重置</el-button></el-form-item>
    </el-form></el-card>
    <el-card shadow="hover"><template #header><el-row justify="space-between"><el-button v-hasPermi="['warehouse:inbound:add']" type="primary" icon="Plus" @click="openCreate">新增</el-button><div v-if="canList"><el-button v-hasPermi="['warehouse:inbound:export']" type="warning" plain icon="Download" @click="exportList">导出</el-button><right-toolbar v-model:show-search="showSearch" @query-table="load" /></div></el-row></template>
      <el-table v-if="canList" v-loading="loading" :data="rows" border>
        <el-table-column label="入库单号" prop="inboundNo" width="185" /><el-table-column label="类型" width="105"><template #default="s"><dict-tag :options="wm_inbound_type" :value="s.row.inboundType" /></template></el-table-column><el-table-column label="公司" prop="companyName" min-width="120" /><el-table-column label="项目" prop="projectName" min-width="120" /><el-table-column label="仓库" prop="warehouseName" min-width="130" /><el-table-column label="状态" width="100"><template #default="s"><dict-tag :options="wm_inbound_status" :value="s.row.status" /></template></el-table-column><el-table-column label="入库时间" prop="inboundAt" width="165" /><el-table-column label="完成时间" prop="completedAt" width="165" /><el-table-column label="操作人" prop="operatorName" width="100" />
        <el-table-column label="操作" width="270" fixed="right"><template #default="s"><el-button v-hasPermi="['warehouse:inbound:query']" link type="primary" @click="view(s.row.id)">查看</el-button><el-button v-if="s.row.status==='DRAFT'" v-hasPermi="['warehouse:inbound:edit']" link type="primary" @click="edit(s.row.id)">编辑</el-button><el-button v-if="s.row.status==='DRAFT'" v-hasPermi="['warehouse:inbound:confirm']" link type="success" @click="act(s.row,'confirm')">确认</el-button><el-button v-if="s.row.status==='CONFIRMED'" v-hasPermi="['warehouse:inbound:complete']" link type="success" @click="act(s.row,'complete')">完成入库</el-button><el-button v-if="['DRAFT','CONFIRMED'].includes(s.row.status)" v-hasPermi="['warehouse:inbound:cancel']" link type="warning" @click="act(s.row,'cancel')">取消</el-button><el-button v-if="s.row.status==='DRAFT'" v-hasPermi="['warehouse:inbound:remove']" link type="danger" @click="remove(s.row)">删除</el-button></template></el-table-column>
      </el-table><pagination v-show="total>0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1000px"><el-form ref="formRef" :model="form" label-width="90px" :disabled="dialog.readonly"><el-row :gutter="16"><el-col :span="8"><el-form-item label="仓库" required><el-select v-model="form.warehouseId" filterable @change="warehouseChanged"><el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" /></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="入库类型" required><el-select v-model="form.inboundType"><el-option v-for="d in wm_inbound_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="入库时间"><el-date-picker v-model="form.inboundAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item></el-col></el-row><el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      <el-table :data="form.items" border><el-table-column label="物料" min-width="210"><template #default="s"><el-select v-model="s.row.materialId" filterable @change="materialChanged(s.row)"><el-option v-for="m in materials" :key="m.id" :label="`${m.materialCode} ${m.materialName}`" :value="m.id" /></el-select></template></el-table-column><el-table-column label="规格" prop="specification" /><el-table-column label="库区/库位" min-width="240"><template #default="s"><el-select v-model="s.row.locationId" filterable><el-option v-for="l in locations" :key="l.id" :label="locationLabel(l)" :value="l.id" /></el-select></template></el-table-column><el-table-column label="单位" prop="unitName" width="100" /><el-table-column label="数量" width="150"><template #default="s"><el-input-number v-model="s.row.quantity" :min="0" :precision="s.row.precisionScale || 0" /></template></el-table-column><el-table-column v-if="!dialog.readonly" label="操作" width="70"><template #default="s"><el-button link type="danger" @click="form.items.splice(s.$index,1)">删除</el-button></template></el-table-column></el-table><el-button v-if="!dialog.readonly" class="mt-2" icon="Plus" @click="form.items.push({})">添加明细</el-button>
    </el-form><template v-if="!dialog.readonly" #footer><el-button type="primary" @click="save">保存草稿</el-button><el-button @click="dialog.visible=false">取消</el-button></template></el-dialog>
  </div>
</template>
<script setup name="InboundOrder" lang="ts">
import {
  addInbound,
  cancelInbound,
  completeInbound,
  confirmInbound,
  delInbound,
  getInbound,
  getInboundEditContext,
  inboundLocationOptions,
  inboundMaterialOptions,
  inboundQueryWarehouseOptions,
  inboundWarehouseOptions,
  inboundZoneOptions,
  listInbound,
  updateInbound
} from '@/api/warehouse/inbound';
import type {
  InboundForm,
  InboundItem,
  InboundLocationOptionVO,
  InboundMaterialOptionVO,
  InboundQuery,
  InboundVO,
  InboundWarehouseOptionVO,
  InboundZoneOptionVO
} from '@/api/warehouse/inbound/types';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
import { useWarehousePageMode } from '@/views/warehouse/useWarehousePageMode';

const { wm_inbound_type, wm_inbound_status } = toRefs<any>(useDict('wm_inbound_type', 'wm_inbound_status'));
const { showSearch } = useSearchToggle();
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const loading = ref(false);
const rows = ref<InboundVO[]>([]);
const total = ref(0);
const warehouses = ref<InboundWarehouseOptionVO[]>([]);
const zones = ref<InboundZoneOptionVO[]>([]);
const materials = ref<InboundMaterialOptionVO[]>([]);
const locations = ref<InboundLocationOptionVO[]>([]);
const query = reactive<InboundQuery>({ pageNum: 1, pageSize: 10 });
const form = reactive<InboundForm>({ inboundType: 'OTHER', items: [] });
const dialog = reactive({ visible: false, title: '', readonly: false });
const modal = getCurrentInstance()!.proxy!.$modal;

const load = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const response = await listInbound(query);
    rows.value = response.data?.rows || [];
    total.value = response.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const search = () => {
  query.pageNum = 1;
  load();
};

const reset = () => {
  queryRef.value?.resetFields();
  search();
};

const loadContextWarehouses = async () => {
  const response = await inboundWarehouseOptions();
  warehouses.value = response.data || [];
};

const loadQueryWarehouses = async () => {
  try {
    const response = await inboundQueryWarehouseOptions();
    warehouses.value = response.data || [];
  } catch {
    modal.msgError('入库单筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};

const loadWarehouseContext = async (warehouseId: number | string) => {
  const [zoneResponse, locationResponse, materialResponse] = await Promise.all([
    inboundZoneOptions(warehouseId),
    inboundLocationOptions(warehouseId),
    inboundMaterialOptions(warehouseId)
  ]);
  zones.value = zoneResponse.data || [];
  locations.value = locationResponse.data || [];
  materials.value = materialResponse.data || [];
};

const warehouseChanged = async () => {
  form.items = [];
  zones.value = [];
  locations.value = [];
  materials.value = [];
  if (form.warehouseId) await loadWarehouseContext(form.warehouseId);
};

const locationLabel = (location: InboundLocationOptionVO) => {
  const zoneName = zones.value.find(zone => zone.id === location.zoneId)?.zoneName || location.zoneName;
  return `${zoneName} / ${location.locationCode} ${location.locationName}`;
};

const materialChanged = (item: InboundItem) => {
  const material = materials.value.find(option => option.id === item.materialId);
  item.specification = material?.specification;
  item.unitId = material?.baseUnitId;
  item.unitName = material?.unitName;
  item.precisionScale = material?.precisionScale;
};

const clearForm = () => {
  Object.assign(form, { id: undefined, warehouseId: undefined, inboundType: 'OTHER', inboundAt: undefined, remark: undefined, items: [] });
  zones.value = [];
  locations.value = [];
  materials.value = [];
};

const openCreate = async () => {
  clearForm();
  try {
    await loadContextWarehouses();
  } catch {
    return;
  }
  if (warehouses.value.length === 0) modal.msgWarning('当前没有可用仓库');
  dialog.title = '新增入库单';
  dialog.readonly = false;
  dialog.visible = true;
};

const appendReadonlyOptions = (detail: InboundVO) => {
  if (!warehouses.value.some(option => option.id === detail.warehouseId)) {
    warehouses.value.push({
      id: detail.warehouseId,
      companyId: detail.companyId,
      projectId: detail.projectId,
      warehouseScope: detail.projectId ? 'PROJECT' : 'COMPANY',
      warehouseCode: '',
      warehouseName: detail.warehouseName || String(detail.warehouseId)
    });
  }
  materials.value = (detail.items || []).map(item => ({
    id: item.materialId!, companyId: detail.companyId, materialCode: item.materialCode || '', materialName: item.materialName || '',
    baseUnitId: item.unitId!, specification: item.specification, unitName: item.unitName || '', precisionScale: item.precisionScale || 0
  }));
  locations.value = (detail.items || []).map(item => ({
    id: item.locationId!, warehouseId: detail.warehouseId, zoneId: 0, zoneName: item.zoneName || '',
    locationCode: item.locationCode || '', locationName: item.locationName || ''
  }));
};

const open = async (id: number | string, readonly: boolean) => {
  clearForm();
  const response = readonly ? await getInbound(id) : await getInboundEditContext(id);
  const detail = response.data;
  Object.assign(form, detail);
  const savedItems = (detail.items || []) as InboundItem[];
  if (readonly) {
    appendReadonlyOptions(detail as InboundVO);
  } else {
    try {
      await loadContextWarehouses();
      await loadWarehouseContext(detail.warehouseId);
    } catch {
      return;
    }
  }
  form.items = savedItems;
  dialog.title = readonly ? '入库单详情' : '编辑入库单';
  dialog.readonly = readonly;
  dialog.visible = true;
};

const view = (id: number | string) => open(id, true);
const edit = (id: number | string) => open(id, false);
const save = async () => {
  if (!form.warehouseId || !form.inboundType) return modal.msgError('请填写仓库和入库类型');
  if (form.id) await updateInbound(form);
  else await addInbound(form);
  modal.msgSuccess('保存成功');
  dialog.visible = false;
  load();
};

const getInboundActionRow = (row: Partial<InboundVO>) => {
  if ((typeof row.id !== 'string' && typeof row.id !== 'number') || !row.status) {
    modal.msgError('入库单列表数据不完整，请刷新后重试');
    return;
  }
  return { id: row.id, inboundNo: row.inboundNo, status: row.status };
};

const act = async (row: Partial<InboundVO>, type: 'confirm' | 'complete' | 'cancel') => {
  const actionRow = getInboundActionRow(row);
  if (!actionRow) return;
  const message = type === 'complete' ? '完成后将正式增加库存，且当前版本不支持直接撤销。确定继续吗？' : `确定${type === 'confirm' ? '确认' : '取消'}该入库单吗？`;
  await modal.confirm(message);
  if (type === 'confirm') await confirmInbound(actionRow.id);
  else if (type === 'complete') await completeInbound(actionRow.id);
  else await cancelInbound(actionRow.id);
  modal.msgSuccess('操作成功');
  load();
};

const remove = async (row: Partial<InboundVO>) => {
  const actionRow = getInboundActionRow(row);
  if (!actionRow) return;
  await modal.confirm(`确定删除入库单 ${actionRow.inboundNo || actionRow.id} 吗？`);
  await delInbound(actionRow.id);
  load();
};

const exportList = () => download('/warehouse/inbound/export', { ...query }, `入库单_${Date.now()}.xlsx`);

const { canList } = useWarehousePageMode({
  permissionPrefix: 'warehouse:inbound',
  loadList: async () => { await Promise.allSettled([load(), loadQueryWarehouses()]); },
  openAdd: openCreate,
  openEdit: edit,
  clearList: () => { dialog.visible = false; clearForm(); rows.value = []; total.value = 0; warehouses.value = []; }
});
</script>
