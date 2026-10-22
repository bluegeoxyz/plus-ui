<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" class="mb-2">
      <el-form ref="queryRef" :model="query" inline>
        <el-form-item label="出库单号"><el-input v-model="query.outboundNo" clearable /></el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" clearable>
            <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.outboundType" clearable>
            <el-option v-for="d in wm_outbound_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option v-for="d in wm_outbound_status" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="search">搜索</el-button>
      </el-form>
    </el-card>
    <el-card>
      <template #header>
        <el-row justify="space-between">
          <el-button v-hasPermi="['warehouse:outbound:add']" type="primary" @click="create">新增</el-button>
          <div v-if="canList">
            <el-button v-hasPermi="['warehouse:outbound:export']" @click="exportList">导出</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="load" />
          </div>
        </el-row>
      </template>
      <el-table v-if="canList" v-loading="loading" :data="rows" border>
        <el-table-column label="出库单号" prop="outboundNo" width="185" />
        <el-table-column label="类型">
          <template #default="s"><dict-tag :options="wm_outbound_type" :value="s.row.outboundType" /></template>
        </el-table-column>
        <el-table-column label="公司" prop="companyName" />
        <el-table-column label="项目" prop="projectName" />
        <el-table-column label="仓库" prop="warehouseName" />
        <el-table-column label="状态">
          <template #default="s"><dict-tag :options="wm_outbound_status" :value="s.row.status" /></template>
        </el-table-column>
        <el-table-column label="出库时间" prop="outboundAt" width="165" />
        <el-table-column label="完成时间" prop="completedAt" width="165" />
        <el-table-column label="操作" width="270">
          <template #default="s">
            <el-button v-hasPermi="['warehouse:outbound:query']" link @click="open(s.row.id, true)">查看</el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:outbound:edit']"
              link
              @click="open(s.row.id, false)"
            >
              编辑
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:outbound:confirm']"
              link
              @click="act(s.row.id, 'confirm')"
            >
              确认
            </el-button>
            <el-button
              v-if="s.row.status === 'CONFIRMED'"
              v-hasPermi="['warehouse:outbound:complete']"
              link
              type="success"
              @click="act(s.row.id, 'complete')"
            >
              完成
            </el-button>
            <el-button
              v-if="['DRAFT', 'CONFIRMED'].includes(s.row.status)"
              v-hasPermi="['warehouse:outbound:cancel']"
              link
              @click="act(s.row.id, 'cancel')"
            >
              取消
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:outbound:remove']"
              link
              type="danger"
              @click="remove(s.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-if="canList"
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="load"
      />
    </el-card>
    <el-dialog v-model="visible" :title="readonly ? '出库单详情' : '出库单'" width="1000px">
      <el-form :disabled="readonly">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="仓库">
              <el-select v-model="form.warehouseId" @change="warehouseChanged">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类型">
              <el-select v-model="form.outboundType">
                <el-option v-for="d in wm_outbound_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时间">
              <el-date-picker v-model="form.outboundAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-table :data="form.items" border>
          <el-table-column label="物料">
            <template #default="s">
              <el-select v-model="s.row.materialId" @change="materialChanged(s.row)">
                <el-option
                  v-for="m in materials"
                  :key="m.id"
                  :label="`${m.materialCode} ${m.materialName}`"
                  :value="m.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="库位">
            <template #default="s">
              <el-select v-model="s.row.locationId" @change="refreshAvailable(s.row)">
                <el-option
                  v-for="l in locations"
                  :key="l.id"
                  :label="`${l.locationCode} ${l.locationName}`"
                  :value="l.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="可用" prop="availableQuantity" />
          <el-table-column label="数量">
            <template #default="s">
              <el-input-number v-model="s.row.quantity" :min="0" :precision="s.row.precisionScale || 0" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" />
          <el-table-column v-if="!readonly" label="操作">
            <template #default="s">
              <el-button link type="danger" @click="form.items.splice(s.$index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button v-if="!readonly" @click="form.items.push({})">添加明细</el-button>
      </el-form>
      <template v-if="!readonly" #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="OutboundOrder" lang="ts">
import type {
  DocumentLocationOptionVO,
  DocumentMaterialOptionVO,
  DocumentWarehouseOptionVO
} from '@/api/warehouse/context/types';
import type { OutboundForm, OutboundItem, OutboundQuery, OutboundVO } from '@/api/warehouse/outbound/types';
import {
  addOutbound,
  cancelOutbound,
  completeOutbound,
  confirmOutbound,
  delOutbound,
  getOutbound,
  getOutboundEditContext,
  listOutbound,
  outboundInventoryOption,
  outboundLocationOptions,
  outboundMaterialOptions,
  outboundQueryWarehouseOptions,
  outboundWarehouseOptions,
  updateOutbound
} from '@/api/warehouse/outbound';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
import { useWarehousePageMode } from '@/views/warehouse/useWarehousePageMode';

const { wm_outbound_type, wm_outbound_status } = toRefs<any>(useDict('wm_outbound_type', 'wm_outbound_status'));
const { showSearch } = useSearchToggle();
const queryRef = ref();
const query = reactive<OutboundQuery>({ pageNum: 1, pageSize: 10 });
const rows = ref<OutboundVO[]>([]);
const total = ref(0);
const loading = ref(false);
const warehouses = ref<DocumentWarehouseOptionVO[]>([]);
const materials = ref<DocumentMaterialOptionVO[]>([]);
const locations = ref<DocumentLocationOptionVO[]>([]);
const form = reactive<OutboundForm>({ outboundType: 'MATERIAL_USE', items: [] });
const visible = ref(false);
const readonly = ref(false);
const modal = getCurrentInstance()!.proxy!.$modal;
let acceptedWarehouseId: number | string | undefined;

const load = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listOutbound(query);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const search = () => {
  query.pageNum = 1;
  load();
};
const clear = () => {
  Object.assign(form, {
    id: undefined,
    warehouseId: undefined,
    outboundType: 'MATERIAL_USE',
    outboundAt: undefined,
    items: []
  });
  materials.value = [];
  locations.value = [];
  acceptedWarehouseId = undefined;
};
const loadWarehouses = async () => {
  const r = await outboundWarehouseOptions();
  warehouses.value = r.data || [];
};
const loadQueryWarehouses = async () => {
  try {
    warehouses.value = (await outboundQueryWarehouseOptions()).data || [];
  } catch {
    modal.msgError('出库单筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};
const loadWarehouseContext = async (warehouseId: number | string) => {
  const [m, l] = await Promise.all([outboundMaterialOptions(warehouseId), outboundLocationOptions(warehouseId)]);
  materials.value = m.data || [];
  locations.value = l.data || [];
};
const create = async () => {
  clear();
  try {
    await loadWarehouses();
  } catch {
    return;
  }
  if (!warehouses.value.length) modal.msgWarning('当前没有可用仓库');
  readonly.value = false;
  visible.value = true;
};
const warehouseChanged = async () => {
  const selected = form.warehouseId;
  if (form.items.length) {
    try {
      await modal.confirm('切换仓库将清空已填写的出库明细，确定继续吗？');
    } catch {
      form.warehouseId = acceptedWarehouseId;
      return;
    }
  }
  form.items = [];
  materials.value = [];
  locations.value = [];
  acceptedWarehouseId = selected;
  if (selected) await loadWarehouseContext(selected);
};
const refreshAvailable = async (item: OutboundItem) => {
  item.inventoryQuantity = 0;
  item.lockedQuantity = 0;
  item.availableQuantity = 0;
  if (!form.warehouseId || !item.materialId || !item.locationId) return;
  const r = await outboundInventoryOption(form.warehouseId, item.locationId, item.materialId);
  item.inventoryQuantity = r.data?.quantity || 0;
  item.lockedQuantity = r.data?.lockedQuantity || 0;
  item.availableQuantity = r.data?.availableQuantity || 0;
};
const materialChanged = async (item: OutboundItem) => {
  const m = materials.value.find(x => x.id === item.materialId);
  item.unitId = m?.baseUnitId;
  item.unitName = m?.unitName;
  item.precisionScale = m?.precisionScale;
  await refreshAvailable(item);
};
const appendReadonlyOptions = (detail: OutboundVO) => {
  warehouses.value = [
    {
      id: detail.warehouseId,
      companyId: detail.companyId,
      projectId: detail.projectId,
      warehouseScope: detail.projectId ? 'PROJECT' : 'COMPANY',
      warehouseCode: '',
      warehouseName: detail.warehouseName || String(detail.warehouseId)
    }
  ];
  materials.value = (detail.items || []).map(i => ({
    id: i.materialId!,
    companyId: detail.companyId,
    materialCode: i.materialCode || '',
    materialName: i.materialName || '',
    baseUnitId: i.unitId!,
    specification: i.specification,
    unitName: i.unitName || '',
    precisionScale: i.precisionScale || 0
  }));
  locations.value = (detail.items || []).map(i => ({
    id: i.locationId!,
    warehouseId: detail.warehouseId,
    zoneId: 0,
    zoneName: '',
    locationCode: i.locationCode || '',
    locationName: i.locationName || ''
  }));
};
const open = async (id: number | string, ro: boolean) => {
  clear();
  const r = ro ? await getOutbound(id) : await getOutboundEditContext(id);
  const detail = r.data;
  Object.assign(form, detail);
  const saved = detail.items || [];
  acceptedWarehouseId = detail.warehouseId;
  if (ro) appendReadonlyOptions(detail as OutboundVO);
  else {
    try {
      await loadWarehouses();
      await loadWarehouseContext(detail.warehouseId!);
    } catch {
      return;
    }
  }
  form.items = saved;
  readonly.value = ro;
  visible.value = true;
};
const save = async () => {
  const exceeded = form.items.some(
    i => i.availableQuantity !== undefined && Number(i.quantity) > Number(i.availableQuantity)
  );
  if (exceeded) await modal.confirm('存在出库数量大于当前可用库存的明细，保存草稿后仍将无法完成出库。确定继续保存吗？');
  if (form.id) await updateOutbound(form);
  else await addOutbound(form);
  visible.value = false;
  load();
};
const act = async (id: number | string, t: string) => {
  if (t === 'complete') await modal.confirm('完成后将正式扣减库存，且当前版本不支持直接撤销。确定继续吗？');
  if (t === 'confirm') await confirmOutbound(id);
  else if (t === 'complete') await completeOutbound(id);
  else await cancelOutbound(id);
  load();
};
const remove = async (id: number | string) => {
  await delOutbound(id);
  load();
};
const exportList = () => download('/warehouse/outbound/export', { ...query }, `出库单_${Date.now()}.xlsx`);
const { canList } = useWarehousePageMode({
  permissionPrefix: 'warehouse:outbound',
  loadList: async () => {
    await Promise.allSettled([load(), loadQueryWarehouses()]);
  },
  openAdd: create,
  openEdit: id => open(id, false),
  clearList: () => {
    visible.value = false;
    clear();
    rows.value = [];
    total.value = 0;
    warehouses.value = [];
  }
});
</script>
