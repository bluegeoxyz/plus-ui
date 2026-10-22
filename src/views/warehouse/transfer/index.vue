<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" class="mb-2">
      <el-form :model="query" inline>
        <el-form-item label="调拨单号"><el-input v-model="query.transferNo" clearable /></el-form-item>
        <el-form-item label="源仓库">
          <el-select v-model="query.sourceWarehouseId" clearable>
            <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库">
          <el-select v-model="query.targetWarehouseId" clearable>
            <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option v-for="d in wm_transfer_status" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="search">搜索</el-button>
      </el-form>
    </el-card>
    <el-card>
      <template #header>
        <el-row justify="space-between">
          <el-button v-hasPermi="['warehouse:transfer:add']" type="primary" @click="create">新增</el-button>
          <div v-if="canList">
            <el-button v-hasPermi="['warehouse:transfer:export']" @click="exportList">导出</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="load" />
          </div>
        </el-row>
      </template>
      <el-table v-if="canList" v-loading="loading" :data="rows" border>
        <el-table-column label="调拨单号" prop="transferNo" width="185" />
        <el-table-column label="源仓库" prop="sourceWarehouseName" />
        <el-table-column label="目标仓库" prop="targetWarehouseName" />
        <el-table-column label="类型">
          <template #default="s"><dict-tag :options="wm_transfer_type" :value="s.row.transferType" /></template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="s"><dict-tag :options="wm_transfer_status" :value="s.row.status" /></template>
        </el-table-column>
        <el-table-column label="调拨时间" prop="transferAt" width="165" />
        <el-table-column label="操作" width="270">
          <template #default="s">
            <el-button v-hasPermi="['warehouse:transfer:query']" link @click="open(s.row.id, true)">查看</el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:transfer:edit']"
              link
              @click="open(s.row.id, false)"
            >
              编辑
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:transfer:confirm']"
              link
              @click="act(s.row.id, 'confirm')"
            >
              确认
            </el-button>
            <el-button
              v-if="s.row.status === 'CONFIRMED'"
              v-hasPermi="['warehouse:transfer:complete']"
              link
              type="success"
              @click="act(s.row.id, 'complete')"
            >
              完成
            </el-button>
            <el-button
              v-if="['DRAFT', 'CONFIRMED'].includes(s.row.status)"
              v-hasPermi="['warehouse:transfer:cancel']"
              link
              @click="act(s.row.id, 'cancel')"
            >
              取消
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:transfer:remove']"
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
    <el-dialog v-model="visible" :title="readonly ? '调拨单详情' : '调拨单'" width="1100px">
      <el-form :disabled="readonly">
        <el-row :gutter="12">
          <el-col :span="6">
            <el-form-item label="源仓库">
              <el-select v-model="form.sourceWarehouseId" @change="sourceChanged">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="目标仓库">
              <el-select v-model="form.targetWarehouseId" @change="targetChanged">
                <el-option v-for="w in targetWarehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="类型">
              <el-select v-model="form.transferType">
                <el-option v-for="d in wm_transfer_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时间">
              <el-date-picker v-model="form.transferAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
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
          <el-table-column label="源库区/库位">
            <template #default="s">
              <el-select v-model="s.row.sourceLocationId" @change="refreshAvailable(s.row)">
                <el-option
                  v-for="l in sourceLocations"
                  :key="l.id"
                  :label="`${zoneName(sourceZones, l.zoneId)} ${l.locationCode} ${l.locationName}`"
                  :value="l.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="目标库区/库位">
            <template #default="s">
              <el-select v-model="s.row.targetLocationId">
                <el-option
                  v-for="l in targetLocations"
                  :key="l.id"
                  :label="`${zoneName(targetZones, l.zoneId)} ${l.locationCode} ${l.locationName}`"
                  :value="l.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="当前/锁定/可用" width="145">
            <template #default="s">
              {{ s.row.inventoryQuantity || 0 }} / {{ s.row.lockedQuantity || 0 }} / {{ s.row.availableQuantity || 0 }}
            </template>
          </el-table-column>
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
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template v-if="!readonly" #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="TransferOrder" lang="ts">
import type {
  DocumentLocationOptionVO,
  DocumentMaterialOptionVO,
  DocumentWarehouseOptionVO,
  DocumentZoneOptionVO
} from '@/api/warehouse/context/types';
import type { TransferForm, TransferItem, TransferQuery, TransferVO } from '@/api/warehouse/transfer/types';
import {
  addTransfer,
  cancelTransfer,
  completeTransfer,
  confirmTransfer,
  delTransfer,
  getTransfer,
  getTransferEditContext,
  listTransfer,
  transferInventoryOption,
  transferLocationOptions,
  transferMaterialOptions,
  transferQueryWarehouseOptions,
  transferWarehouseOptions,
  transferZoneOptions,
  updateTransfer
} from '@/api/warehouse/transfer';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
import { useWarehousePageMode } from '@/views/warehouse/useWarehousePageMode';

const { wm_transfer_type, wm_transfer_status } = toRefs<any>(useDict('wm_transfer_type', 'wm_transfer_status'));
const { showSearch } = useSearchToggle();
const query = reactive<TransferQuery>({ pageNum: 1, pageSize: 10 });
const rows = ref<TransferVO[]>([]),
  total = ref(0),
  loading = ref(false);
const warehouses = ref<DocumentWarehouseOptionVO[]>([]),
  materials = ref<DocumentMaterialOptionVO[]>([]);
const sourceLocations = ref<DocumentLocationOptionVO[]>([]),
  targetLocations = ref<DocumentLocationOptionVO[]>([]);
const sourceZones = ref<DocumentZoneOptionVO[]>([]),
  targetZones = ref<DocumentZoneOptionVO[]>([]);
const form = reactive<TransferForm>({ transferType: 'NORMAL', items: [] });
const visible = ref(false),
  readonly = ref(false);
const modal = getCurrentInstance()!.proxy!.$modal;
let acceptedSourceId: number | string | undefined, acceptedTargetId: number | string | undefined;
const targetWarehouses = computed(() => {
  const source = warehouses.value.find(w => w.id === form.sourceWarehouseId);
  return source ? warehouses.value.filter(w => w.companyId === source.companyId) : warehouses.value;
});
const zoneName = (zones: DocumentZoneOptionVO[], id: string | number) => zones.find(z => z.id === id)?.zoneName || '';
const load = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listTransfer(query);
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
    sourceWarehouseId: undefined,
    targetWarehouseId: undefined,
    transferType: 'NORMAL',
    transferAt: undefined,
    remark: undefined,
    items: []
  });
  materials.value = [];
  sourceLocations.value = [];
  targetLocations.value = [];
  sourceZones.value = [];
  targetZones.value = [];
  acceptedSourceId = undefined;
  acceptedTargetId = undefined;
};
const loadWarehouses = async () => {
  warehouses.value = (await transferWarehouseOptions()).data || [];
};
const loadQueryWarehouses = async () => {
  try {
    warehouses.value = (await transferQueryWarehouseOptions()).data || [];
  } catch {
    modal.msgError('调拨单筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};
const loadSide = async (warehouseId: number | string, source: boolean) => {
  const [z, l] = await Promise.all([transferZoneOptions(warehouseId), transferLocationOptions(warehouseId)]);
  if (source) {
    sourceZones.value = z.data || [];
    sourceLocations.value = l.data || [];
    materials.value = (await transferMaterialOptions(warehouseId)).data || [];
  } else {
    targetZones.value = z.data || [];
    targetLocations.value = l.data || [];
  }
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
const sourceChanged = async () => {
  const selected = form.sourceWarehouseId;
  if (form.items.length) {
    try {
      await modal.confirm('切换源仓将清空已填写的调拨明细和目标仓，确定继续吗？');
    } catch {
      form.sourceWarehouseId = acceptedSourceId;
      return;
    }
  }
  form.items = [];
  form.targetWarehouseId = undefined;
  targetLocations.value = [];
  targetZones.value = [];
  materials.value = [];
  sourceLocations.value = [];
  sourceZones.value = [];
  acceptedSourceId = selected;
  acceptedTargetId = undefined;
  if (selected) await loadSide(selected, true);
};
const targetChanged = async () => {
  const selected = form.targetWarehouseId;
  if (form.items.some(i => i.targetLocationId)) {
    try {
      await modal.confirm('切换目标仓将清空所有明细的目标库位，确定继续吗？');
    } catch {
      form.targetWarehouseId = acceptedTargetId;
      return;
    }
  }
  form.items.forEach(i => (i.targetLocationId = undefined));
  targetLocations.value = [];
  targetZones.value = [];
  acceptedTargetId = selected;
  if (selected) await loadSide(selected, false);
};
const refreshAvailable = async (i: TransferItem) => {
  i.inventoryQuantity = 0;
  i.lockedQuantity = 0;
  i.availableQuantity = 0;
  if (!form.sourceWarehouseId || !i.materialId || !i.sourceLocationId) return;
  const r = await transferInventoryOption(form.sourceWarehouseId, i.sourceLocationId, i.materialId);
  i.inventoryQuantity = r.data?.quantity || 0;
  i.lockedQuantity = r.data?.lockedQuantity || 0;
  i.availableQuantity = r.data?.availableQuantity || 0;
};
const materialChanged = async (i: TransferItem) => {
  const m = materials.value.find(x => x.id === i.materialId);
  i.unitId = m?.baseUnitId;
  i.unitName = m?.unitName;
  i.precisionScale = m?.precisionScale;
  await refreshAvailable(i);
};
const appendReadonlyOptions = (d: TransferVO) => {
  warehouses.value = [
    {
      id: d.sourceWarehouseId,
      companyId: d.sourceCompanyId,
      warehouseScope: d.sourceProjectName ? 'PROJECT' : 'COMPANY',
      warehouseCode: '',
      warehouseName: d.sourceWarehouseName
    },
    {
      id: d.targetWarehouseId,
      companyId: d.targetCompanyId,
      warehouseScope: d.targetProjectName ? 'PROJECT' : 'COMPANY',
      warehouseCode: '',
      warehouseName: d.targetWarehouseName
    }
  ];
  materials.value = (d.items || []).map(i => ({
    id: i.materialId!,
    companyId: d.sourceCompanyId,
    materialCode: i.materialCode || '',
    materialName: i.materialName || '',
    baseUnitId: i.unitId!,
    specification: i.specification,
    unitName: i.unitName || '',
    precisionScale: i.precisionScale || 0
  }));
  sourceLocations.value = (d.items || []).map(i => ({
    id: i.sourceLocationId!,
    warehouseId: d.sourceWarehouseId,
    zoneId: 0,
    zoneName: i.sourceZoneName || '',
    locationCode: i.sourceLocationCode || '',
    locationName: i.sourceLocationName || ''
  }));
  targetLocations.value = (d.items || []).map(i => ({
    id: i.targetLocationId!,
    warehouseId: d.targetWarehouseId,
    zoneId: 0,
    zoneName: i.targetZoneName || '',
    locationCode: i.targetLocationCode || '',
    locationName: i.targetLocationName || ''
  }));
};
const open = async (id: string | number, ro: boolean) => {
  clear();
  const r = ro ? await getTransfer(id) : await getTransferEditContext(id);
  const d = r.data;
  Object.assign(form, d);
  const saved = d.items || [];
  acceptedSourceId = d.sourceWarehouseId;
  acceptedTargetId = d.targetWarehouseId;
  if (ro) appendReadonlyOptions(d as TransferVO);
  else {
    try {
      await loadWarehouses();
      await Promise.all([loadSide(d.sourceWarehouseId!, true), loadSide(d.targetWarehouseId!, false)]);
    } catch {
      return;
    }
  }
  form.items = saved;
  readonly.value = ro;
  visible.value = true;
};
const save = async () => {
  if (
    form.sourceWarehouseId === form.targetWarehouseId &&
    form.items.some(i => i.sourceLocationId === i.targetLocationId)
  )
    return modal.msgError('同仓调拨的源库位与目标库位不能相同');
  if (form.items.some(i => Number(i.quantity) > Number(i.availableQuantity)))
    await modal.confirm('存在调拨数量大于当前源可用库存的明细，确定继续保存草稿吗？');
  if (form.id) await updateTransfer(form);
  else await addTransfer(form);
  visible.value = false;
  load();
};
const act = async (id: string | number, t: string) => {
  if (t === 'complete') await modal.confirm('完成后将同时扣减源库存、增加目标库存，且不可直接撤销。确定继续吗？');
  if (t === 'confirm') await confirmTransfer(id);
  else if (t === 'complete') await completeTransfer(id);
  else await cancelTransfer(id);
  load();
};
const remove = async (id: string | number) => {
  await delTransfer(id);
  load();
};
const exportList = () => download('/warehouse/transfer/export', { ...query }, `调拨单_${Date.now()}.xlsx`);
const { canList } = useWarehousePageMode({
  permissionPrefix: 'warehouse:transfer',
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
