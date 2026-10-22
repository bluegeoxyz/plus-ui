<template>
  <div class="p-2">
    <el-card>
      <template #header>
        <el-button v-hasPermi="['warehouse:stocktake:add']" type="primary" @click="create">新增盘点</el-button>
        <el-button v-if="canList" v-hasPermi="['warehouse:stocktake:export']" @click="exportList">导出</el-button>
      </template>
      <el-form v-if="canList" :model="query" inline>
        <el-form-item label="盘点单号"><el-input v-model="query.stocktakeNo" clearable /></el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" clearable>
            <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-button @click="load">查询</el-button>
      </el-form>
      <el-table v-if="canList" :data="rows" border>
        <el-table-column prop="stocktakeNo" label="盘点单号" />
        <el-table-column prop="warehouseName" label="仓库" />
        <el-table-column prop="companyName" label="公司" />
        <el-table-column prop="projectName" label="项目" />
        <el-table-column label="类型">
          <template #default="s"><dict-tag :options="wm_stocktake_type" :value="s.row.stocktakeType" /></template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="s"><dict-tag :options="wm_stocktake_status" :value="s.row.status" /></template>
        </el-table-column>
        <el-table-column prop="stocktakeAt" label="盘点日期" />
        <el-table-column prop="completedAt" label="完成时间" />
        <el-table-column label="操作">
          <template #default="s">
            <el-button v-hasPermi="['warehouse:stocktake:query']" link @click="open(s.row.id, true)">详情</el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:stocktake:edit']"
              link
              @click="open(s.row.id, false)"
            >
              编辑
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:stocktake:confirm']"
              link
              @click="act(s.row.id, 'confirm')"
            >
              确认
            </el-button>
            <el-button
              v-if="s.row.status === 'CONFIRMED'"
              v-hasPermi="['warehouse:stocktake:complete']"
              link
              @click="act(s.row.id, 'complete')"
            >
              完成
            </el-button>
            <el-button
              v-if="['DRAFT', 'CONFIRMED'].includes(s.row.status)"
              v-hasPermi="['warehouse:stocktake:cancel']"
              link
              @click="act(s.row.id, 'cancel')"
            >
              取消
            </el-button>
            <el-button
              v-if="s.row.status === 'DRAFT'"
              v-hasPermi="['warehouse:stocktake:remove']"
              link
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
    <el-dialog v-model="visible" width="1100px" title="盘点单">
      <el-form :disabled="readonly">
        <el-row :gutter="12">
          <el-col :span="6">
            <el-form-item label="仓库">
              <el-select v-model="form.warehouseId" @change="warehouseChanged">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="类型">
              <el-select v-model="form.stocktakeType">
                <el-option v-for="d in wm_stocktake_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="范围">
              <el-select v-model="form.scopeType">
                <el-option label="整个仓库" value="WAREHOUSE" />
                <el-option label="指定库区" value="ZONE" />
                <el-option label="指定库位" value="LOCATION" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.scopeType === 'ZONE'" :span="6">
            <el-select v-model="form.zoneId">
              <el-option v-for="z in zones" :key="z.id" :label="z.zoneName" :value="z.id" />
            </el-select>
          </el-col>
          <el-col v-if="form.scopeType === 'LOCATION'" :span="6">
            <el-select v-model="form.locationId">
              <el-option
                v-for="l in locations"
                :key="l.id"
                :label="`${l.locationCode} ${l.locationName}`"
                :value="l.id"
              />
            </el-select>
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
              <el-select v-model="s.row.locationId" @change="refreshBook(s.row)">
                <el-option
                  v-for="l in locations"
                  :key="l.id"
                  :label="`${l.locationCode} ${l.locationName}`"
                  :value="l.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="unitName" label="单位" />
          <el-table-column prop="bookQuantity" label="账面数量" />
          <el-table-column label="实际数量">
            <template #default="s">
              <el-input-number
                v-model="s.row.actualQuantity"
                :min="0"
                :precision="s.row.precisionScale || 0"
                @change="difference(s.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="差异">
            <template #default="s">
              <el-tag
                :type="
                  (s.row.differenceQuantity || 0) > 0
                    ? 'success'
                    : (s.row.differenceQuantity || 0) < 0
                      ? 'danger'
                      : 'info'
                "
              >
                {{
                  (s.row.differenceQuantity || 0) > 0
                    ? '盘盈 '
                    : (s.row.differenceQuantity || 0) < 0
                      ? '盘亏 '
                      : '正常 '
                }}{{ s.row.differenceQuantity || 0 }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" label="操作">
            <template #default="s"><el-button link @click="form.items.splice(s.$index, 1)">删除</el-button></template>
          </el-table-column>
        </el-table>
        <el-button v-if="!readonly" @click="form.items.push({ bookQuantity: 0 })">手工增加</el-button>
      </el-form>
      <template v-if="!readonly" #footer><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="StocktakeOrder">
import type {
  DocumentLocationOptionVO,
  DocumentMaterialOptionVO,
  DocumentWarehouseOptionVO,
  DocumentZoneOptionVO
} from '@/api/warehouse/context/types';
import type { StocktakeForm, StocktakeItem, StocktakeQuery, StocktakeVO } from '@/api/warehouse/stocktake/types';
import {
  addStocktake,
  cancelStocktake,
  completeStocktake,
  confirmStocktake,
  delStocktake,
  getStocktake,
  getStocktakeEditContext,
  listStocktake,
  stocktakeInventoryOption,
  stocktakeLocationOptions,
  stocktakeMaterialOptions,
  stocktakeQueryWarehouseOptions,
  stocktakeWarehouseOptions,
  stocktakeZoneOptions,
  updateStocktake
} from '@/api/warehouse/stocktake';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
import { useWarehousePageMode } from '@/views/warehouse/useWarehousePageMode';

const { wm_stocktake_type, wm_stocktake_status } = toRefs<any>(useDict('wm_stocktake_type', 'wm_stocktake_status'));
const query = reactive<StocktakeQuery>({ pageNum: 1, pageSize: 10 });
const rows = ref<StocktakeVO[]>([]),
  total = ref(0),
  visible = ref(false),
  readonly = ref(false);
const warehouses = ref<DocumentWarehouseOptionVO[]>([]),
  zones = ref<DocumentZoneOptionVO[]>([]),
  locations = ref<DocumentLocationOptionVO[]>([]),
  materials = ref<DocumentMaterialOptionVO[]>([]);
const form = reactive<StocktakeForm>({ stocktakeType: 'FULL', scopeType: 'WAREHOUSE', items: [] });
const modal = getCurrentInstance()!.proxy!.$modal;
let acceptedWarehouseId: number | string | undefined;
const load = async () => {
  if (!canList.value) return;
  const r = await listStocktake(query);
  rows.value = r.data?.rows || [];
  total.value = r.data?.total || 0;
};
const clear = () => {
  Object.assign(form, {
    id: undefined,
    warehouseId: undefined,
    stocktakeType: 'FULL',
    scopeType: 'WAREHOUSE',
    zoneId: undefined,
    locationId: undefined,
    items: []
  });
  zones.value = [];
  locations.value = [];
  materials.value = [];
  acceptedWarehouseId = undefined;
};
const loadWarehouses = async () => {
  warehouses.value = (await stocktakeWarehouseOptions()).data || [];
};
const loadQueryWarehouses = async () => {
  try {
    warehouses.value = (await stocktakeQueryWarehouseOptions()).data || [];
  } catch {
    modal.msgError('盘点单筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};
const loadWarehouseContext = async (warehouseId: number | string) => {
  const [z, l, m] = await Promise.all([
    stocktakeZoneOptions(warehouseId),
    stocktakeLocationOptions(warehouseId),
    stocktakeMaterialOptions(warehouseId)
  ]);
  zones.value = z.data || [];
  locations.value = l.data || [];
  materials.value = m.data || [];
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
      await modal.confirm('切换仓库将清空已填写和已生成的盘点明细，确定继续吗？');
    } catch {
      form.warehouseId = acceptedWarehouseId;
      return;
    }
  }
  form.items = [];
  form.zoneId = undefined;
  form.locationId = undefined;
  zones.value = [];
  locations.value = [];
  materials.value = [];
  acceptedWarehouseId = selected;
  if (selected) await loadWarehouseContext(selected);
};
const refreshBook = async (i: StocktakeItem) => {
  i.bookQuantity = 0;
  if (!form.warehouseId || !i.locationId || !i.materialId) {
    difference(i);
    return;
  }
  const r = await stocktakeInventoryOption(form.warehouseId, i.locationId, i.materialId);
  i.bookQuantity = r.data?.quantity || 0;
  difference(i);
};
const materialChanged = async (i: StocktakeItem) => {
  const m = materials.value.find(x => x.id === i.materialId);
  i.unitId = m?.baseUnitId;
  i.unitName = m?.unitName;
  i.precisionScale = m?.precisionScale;
  await refreshBook(i);
};
const difference = (i: StocktakeItem) =>
  (i.differenceQuantity = Number(i.actualQuantity || 0) - Number(i.bookQuantity || 0));
const appendReadonlyOptions = (d: StocktakeVO) => {
  warehouses.value = [
    {
      id: d.warehouseId,
      companyId: d.companyId,
      projectId: d.projectId,
      warehouseScope: d.projectId ? 'PROJECT' : 'COMPANY',
      warehouseCode: '',
      warehouseName: d.warehouseName
    }
  ];
  zones.value = d.zoneId
    ? [{ id: d.zoneId, warehouseId: d.warehouseId, zoneCode: '', zoneName: d.zoneName || '' }]
    : [];
  locations.value = (d.items || []).map(i => ({
    id: i.locationId!,
    warehouseId: d.warehouseId,
    zoneId: d.zoneId || 0,
    zoneName: i.zoneName || '',
    locationCode: i.locationCode || '',
    locationName: i.locationName || ''
  }));
  materials.value = (d.items || []).map(i => ({
    id: i.materialId!,
    companyId: d.companyId,
    materialCode: i.materialCode || '',
    materialName: i.materialName || '',
    baseUnitId: i.unitId!,
    specification: i.specification,
    unitName: i.unitName || '',
    precisionScale: i.precisionScale || 0
  }));
};
const open = async (id: string | number, ro: boolean) => {
  clear();
  const r = ro ? await getStocktake(id) : await getStocktakeEditContext(id);
  const d = r.data;
  Object.assign(form, d);
  const saved = d.items || [];
  acceptedWarehouseId = d.warehouseId;
  if (ro) appendReadonlyOptions(d as StocktakeVO);
  else {
    try {
      await loadWarehouses();
      await loadWarehouseContext(d.warehouseId!);
    } catch {
      return;
    }
  }
  form.items = saved;
  readonly.value = ro;
  visible.value = true;
};
const save = async () => {
  if (form.id) await updateStocktake(form);
  else await addStocktake(form);
  visible.value = false;
  load();
};
const act = async (id: string | number, t: string) => {
  if (t === 'complete') await modal.confirm('完成将按盘点差异修正库存；若盘点期间库存变化会整单失败。确定继续吗？');
  if (t === 'confirm') await confirmStocktake(id);
  else if (t === 'complete') await completeStocktake(id);
  else await cancelStocktake(id);
  load();
};
const remove = async (id: string | number) => {
  await delStocktake(id);
  load();
};
const exportList = () => download('/warehouse/stocktake/export', { ...query }, `盘点单_${Date.now()}.xlsx`);
const { canList } = useWarehousePageMode({
  permissionPrefix: 'warehouse:stocktake',
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
