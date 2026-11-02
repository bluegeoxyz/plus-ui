<template>
  <div class="p-2">
    <el-row v-if="canStatistics && statistics" :gutter="12" class="mb-2">
      <el-col v-for="card in cards" :key="card.key" :span="6">
        <el-card shadow="hover"><el-statistic :title="card.label" :value="statistics[card.key]" /></el-card>
      </el-col>
    </el-row>
    <el-alert v-if="statisticsError" :title="statisticsError" type="error" :closable="false" class="mb-2" />
    <el-card v-if="canList" class="mb-2" shadow="hover">
      <el-form inline @submit.prevent="search">
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" clearable filterable class="w-60">
            <el-option v-for="w in warehouses" :key="w.id" :value="w.id" :label="w.warehouseName" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="query.materialCode" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="query.materialName" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="风险类型">
          <el-select v-model="query.riskType" clearable class="w-40">
            <el-option label="全部预警" value="WARNING" />
            <el-option label="低库存" value="LOW" />
            <el-option label="高库存" value="HIGH" />
            <el-option label="高低双风险" value="BOTH" />
            <el-option label="正常库存" value="NORMAL" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <template #header>
        <el-row justify="space-between" align="middle">
          <span>库存风险预警</span>
          <el-button v-if="canEdit" type="primary" @click="openConfiguration()">配置库存阈值</el-button>
        </el-row>
      </template>
      <el-alert v-if="!canList" title="当前账号无预警列表权限" type="info" :closable="false" />
      <el-alert v-if="listError" :title="listError" type="error" :closable="false" class="mb-2" />
      <el-table v-if="canList" v-loading="loading" :data="rows" border>
        <el-table-column label="仓库" prop="warehouseName" min-width="140" />
        <el-table-column label="物料编码" prop="materialCode" min-width="130" />
        <el-table-column label="物料名称" prop="materialName" min-width="140" />
        <el-table-column label="单位" prop="baseUnitName" width="80" />
        <el-table-column label="实际库存" prop="quantity" min-width="110" align="right" />
        <el-table-column label="锁定库存" prop="lockedQuantity" min-width="110" align="right" />
        <el-table-column label="可用库存" prop="availableQuantity" min-width="110" align="right" />
        <el-table-column label="下限" prop="safetyStock" min-width="100" align="right" />
        <el-table-column label="上限" prop="upperStock" min-width="100" align="right" />
        <el-table-column label="阈值来源" width="110">
          <template #default="s">
            {{ s.row.thresholdSource === 'WAREHOUSE_OVERRIDE' ? '仓库独立' : '物料默认' }}
          </template>
        </el-table-column>
        <el-table-column label="风险状态" min-width="185">
          <template #default="s">
            <el-tag v-if="s.row.lowStock" type="danger">低库存</el-tag>
            <el-tag v-if="s.row.highStock" type="warning">高库存</el-tag>
            <el-tag v-if="!s.row.lowStock && !s.row.highStock" type="success">正常</el-tag>
            <el-tag v-if="s.row.disabled" type="info">含停用资源</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="s">
            <el-button v-if="canInventory" link type="primary" @click="showInventory(s.row as InventorySummaryVO)">
              库存明细
            </el-button>
            <el-button
              v-if="canEdit && !s.row.disabled"
              link
              type="primary"
              @click="openConfiguration(s.row as InventorySummaryVO)"
            >
              配置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-if="canList"
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="loadList"
      />
    </el-card>
    <el-dialog v-model="configurationVisible" title="仓库物料库存阈值" width="560px" destroy-on-close>
      <el-alert
        title="仓库独立配置优先；0 关闭对应预警。未配置时继承物料默认下限。"
        type="info"
        :closable="false"
        class="mb-4"
      />
      <el-form label-width="100px" v-loading="configurationLoading">
        <el-form-item label="仓库">
          <el-select v-model="selectedWarehouse" filterable class="w-full" @change="configurationWarehouseChanged">
            <el-option v-for="w in editableWarehouses" :key="w.id" :value="w.id" :label="w.warehouseName" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料">
          <el-select v-model="selectedMaterial" filterable class="w-full" @change="loadConfiguration">
            <el-option
              v-for="m in materials"
              :key="m.id"
              :value="m.id"
              :label="`${m.materialCode} ${m.materialName}`"
            />
          </el-select>
        </el-form-item>
        <template v-if="form">
          <el-form-item label="当前来源">
            {{ form.thresholdSource === 'WAREHOUSE_OVERRIDE' ? '仓库独立配置' : '继承物料默认' }}
          </el-form-item>
          <el-form-item label="下限"><el-input v-model="form.safetyStock" inputmode="decimal" /></el-form-item>
          <el-form-item label="上限"><el-input v-model="form.upperStock" inputmode="decimal" /></el-form-item>
          <el-form-item label="数量精度">有效小数最多 {{ form.precisionScale }} 位</el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="configurationVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!form || configurationLoading"
          @click="submitConfiguration"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup name="InventoryWarning" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { DocumentMaterialOptionVO, DocumentWarehouseOptionVO } from '@/api/warehouse/context/types';
import type { InventoryQuery, InventorySummaryVO } from '@/api/warehouse/inventory/types';
import type { InventoryStatistics, InventoryThreshold } from '@/api/warehouse/inventory/warnings';
import {
  getThreshold,
  listWarnings,
  saveThreshold,
  thresholdMaterials,
  thresholdWarehouses,
  warningStatistics,
  warningWarehouses
} from '@/api/warehouse/inventory/warnings';
import auth from '@/plugins/auth';
import modal from '@/plugins/modal';
import { validateThreshold } from './thresholdValidation';

const router = useRouter();
const canList = computed(() => auth.hasPermi('warehouse:inventory:warning:list'));
const canStatistics = computed(() => auth.hasPermi('warehouse:inventory:warning:query'));
const canEdit = computed(() => auth.hasPermi('warehouse:inventory:threshold:edit'));
const canInventory = computed(() => auth.hasPermi('warehouse:inventory:list'));
const query = reactive<InventoryQuery>({ pageNum: 1, pageSize: 10, riskType: 'WARNING' });
const rows = ref<InventorySummaryVO[]>([]);
const total = ref(0);
const loading = ref(false);
const listError = ref('');
const statisticsError = ref('');
const statistics = ref<InventoryStatistics>();
const cards: { key: keyof InventoryStatistics; label: string }[] = [
  { key: 'lowCount', label: '低库存' },
  { key: 'highCount', label: '高库存' },
  { key: 'normalCount', label: '正常库存' },
  { key: 'warningCount', label: '预警总数（组合去重）' }
];
const warehouses = ref<DocumentWarehouseOptionVO[]>([]);
let listVersion = 0;
let statisticsVersion = 0;
const loadList = async () => {
  if (!canList.value) return;
  const version = ++listVersion;
  loading.value = true;
  listError.value = '';
  try {
    const res = await listWarnings({ ...query });
    if (version !== listVersion) return;
    rows.value = res.data.rows;
    total.value = res.data.total;
  } catch {
    if (version === listVersion) {
      rows.value = [];
      total.value = 0;
      listError.value = '预警列表加载失败，请重试';
    }
  } finally {
    if (version === listVersion) loading.value = false;
  }
};
const loadStatistics = async () => {
  if (!canStatistics.value) return;
  const version = ++statisticsVersion;
  statistics.value = undefined;
  statisticsError.value = '';
  try {
    const res = await warningStatistics({
      warehouseId: query.warehouseId,
      materialCode: query.materialCode,
      materialName: query.materialName
    });
    if (version === statisticsVersion) statistics.value = res.data;
  } catch {
    if (version === statisticsVersion) statisticsError.value = '库存风险统计加载失败，请重试';
  }
};
const refresh = () => Promise.all([loadList(), loadStatistics()]);
const search = () => {
  query.pageNum = 1;
  void refresh();
};
const reset = () => {
  query.warehouseId = undefined;
  query.materialCode = undefined;
  query.materialName = undefined;
  query.riskType = 'WARNING';
  search();
};
const showInventory = (row: InventorySummaryVO) => {
  if (!canInventory.value) return;
  void router.push({
    path: '/warehouse/inventory/realtime',
    query: { warehouseId: String(row.warehouseId), materialId: String(row.materialId) }
  });
};
const configurationVisible = ref(false);
const configurationLoading = ref(false);
const saving = ref(false);
const editableWarehouses = ref<DocumentWarehouseOptionVO[]>([]);
const materials = ref<DocumentMaterialOptionVO[]>([]);
const selectedWarehouse = ref<number | string>();
const selectedMaterial = ref<number | string>();
const form = ref<InventoryThreshold>();
let configurationVersion = 0;
const loadConfiguration = async () => {
  const version = ++configurationVersion;
  form.value = undefined;
  if (!canEdit.value || !selectedWarehouse.value || !selectedMaterial.value) return;
  configurationLoading.value = true;
  try {
    const res = await getThreshold(selectedWarehouse.value, selectedMaterial.value);
    if (version === configurationVersion)
      form.value = { ...res.data, safetyStock: String(res.data.safetyStock), upperStock: String(res.data.upperStock) };
  } catch {
    modal.msgError('阈值配置加载失败，请重试');
  } finally {
    if (version === configurationVersion) configurationLoading.value = false;
  }
};
const configurationWarehouseChanged = async () => {
  const version = ++configurationVersion;
  selectedMaterial.value = undefined;
  form.value = undefined;
  materials.value = [];
  if (!selectedWarehouse.value || !canEdit.value) return;
  configurationLoading.value = true;
  try {
    const res = await thresholdMaterials(selectedWarehouse.value);
    if (version === configurationVersion) materials.value = res.data;
  } catch {
    modal.msgError('物料选项加载失败，请重试');
  } finally {
    if (version === configurationVersion) configurationLoading.value = false;
  }
};
const openConfiguration = async (row?: InventorySummaryVO) => {
  if (!canEdit.value) return;
  configurationVisible.value = true;
  form.value = undefined;
  selectedWarehouse.value = undefined;
  selectedMaterial.value = undefined;
  materials.value = [];
  try {
    editableWarehouses.value = (await thresholdWarehouses()).data;
    if (row) {
      selectedWarehouse.value = row.warehouseId;
      await configurationWarehouseChanged();
      selectedMaterial.value = row.materialId;
      await loadConfiguration();
    }
  } catch {
    modal.msgError('仓库选项加载失败，请重试');
  }
};
const submitConfiguration = async () => {
  if (!canEdit.value || !form.value || saving.value) return;
  const error = validateThreshold(form.value.safetyStock, form.value.upperStock, form.value.precisionScale);
  if (error) return modal.msgError(error);
  saving.value = true;
  try {
    await saveThreshold({ ...form.value });
    modal.msgSuccess('库存阈值已保存');
    configurationVisible.value = false;
    await refresh();
  } catch {
    modal.msgError('保存失败，请核对阈值；如已被其他用户修改，请重新打开配置');
  } finally {
    saving.value = false;
  }
};
onMounted(async () => {
  void refresh();
  if (canList.value) {
    try {
      warehouses.value = (await warningWarehouses()).data;
    } catch {
      modal.msgError('仓库筛选加载失败，请重试');
    }
  }
});
</script>
