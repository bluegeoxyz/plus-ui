<template>
  <div class="p-2">
    <el-card v-show="showSearch" shadow="hover" class="mb-2">
      <el-form ref="queryRef" :model="queryParams" inline>
        <el-form-item label="所属公司">
          <el-select v-model="queryParams.companyId" clearable filterable @change="companyChanged">
            <el-option v-for="c in companies" :key="c.deptId" :label="c.deptName" :value="c.deptId" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="queryParams.warehouseId" clearable filterable @change="warehouseChanged">
            <el-option v-for="w in filteredWarehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区">
          <el-select v-model="queryParams.zoneId" clearable filterable @change="zoneChanged">
            <el-option v-for="z in zones" :key="z.id" :label="z.zoneName" :value="z.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="库位">
          <el-select v-model="queryParams.locationId" clearable filterable>
            <el-option
              v-for="l in locations"
              :key="l.id"
              :label="`${l.locationCode} ${l.locationName}`"
              :value="l.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="流水类型">
          <el-select v-model="queryParams.transactionType" clearable>
            <el-option v-for="d in wm_inventory_transaction_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="queryParams.materialCode" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="queryParams.materialName" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="来源类型"><el-input v-model="queryParams.sourceType" clearable /></el-form-item>
        <el-form-item label="来源单号">
          <el-input v-model="queryParams.sourceNo" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="发生时间">
          <el-date-picker
            v-model="occurredRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <template #header>
        <el-row justify="end">
          <el-button
            v-hasPermi="['warehouse:inventoryTransaction:export']"
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
          >
            导出
          </el-button>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column label="流水号" prop="transactionNo" width="185" />
        <el-table-column label="流水类型" width="100">
          <template #default="s">
            <dict-tag :options="wm_inventory_transaction_type" :value="s.row.transactionType" />
          </template>
        </el-table-column>
        <el-table-column label="公司" prop="companyName" min-width="130" />
        <el-table-column label="项目" prop="projectName" min-width="130" />
        <el-table-column label="仓库" prop="warehouseName" min-width="130" />
        <el-table-column label="库区" prop="zoneName" min-width="100" />
        <el-table-column label="库位" min-width="140">
          <template #default="s">{{ s.row.locationCode }} {{ s.row.locationName }}</template>
        </el-table-column>
        <el-table-column label="物料编码" prop="materialCode" width="130" />
        <el-table-column label="物料名称" prop="materialName" min-width="140" />
        <el-table-column label="变更前" prop="quantityBefore" width="100" align="right" />
        <el-table-column label="变化量" width="105" align="right">
          <template #default="s">
            <span :class="Number(s.row.quantityChange) > 0 ? 'text-success' : 'text-danger'">
              {{ formatChange(s.row.quantityChange) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变更后" prop="quantityAfter" width="100" align="right" />
        <el-table-column label="来源类型" prop="sourceType" width="120" />
        <el-table-column label="来源单号" prop="sourceNo" width="150" />
        <el-table-column label="发生时间" prop="occurredAt" width="165" />
        <el-table-column label="操作人" prop="operatorName" width="110" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="s">
            <el-button
              v-hasPermi="['warehouse:inventoryTransaction:query']"
              link
              type="primary"
              @click="showDetail(s.row.id)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
    <el-dialog v-model="detailVisible" title="库存流水详情" width="780px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="流水号">{{ detail.transactionNo }}</el-descriptions-item>
        <el-descriptions-item label="流水类型">
          <dict-tag :options="wm_inventory_transaction_type" :value="detail.transactionType" />
        </el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ detail.locationCode }} {{ detail.locationName }}</el-descriptions-item>
        <el-descriptions-item label="物料">{{ detail.materialCode }} {{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ detail.specification }}</el-descriptions-item>
        <el-descriptions-item label="实际库存">
          {{ detail.quantityBefore }} → {{ formatChange(detail.quantityChange) }} → {{ detail.quantityAfter }}
        </el-descriptions-item>
        <el-descriptions-item label="锁定数量">
          {{ detail.lockedBefore }} → {{ formatChange(detail.lockedChange) }} → {{ detail.lockedAfter }}
        </el-descriptions-item>
        <el-descriptions-item label="来源类型">{{ detail.sourceType }}</el-descriptions-item>
        <el-descriptions-item label="来源ID">{{ detail.sourceId }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ detail.sourceNo }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ detail.occurredAt }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup name="InventoryTransaction" lang="ts">
import type {
  ContextCompanyOptionVO,
  DocumentLocationOptionVO,
  DocumentWarehouseOptionVO,
  DocumentZoneOptionVO
} from '@/api/warehouse/context/types';
import type { InventoryTransactionQuery, InventoryTransactionVO } from '@/api/warehouse/inventoryTransaction/types';
import {
  getInventoryTransaction,
  inventoryTransactionCompanyOptions,
  inventoryTransactionLocationOptions,
  inventoryTransactionWarehouseOptions,
  inventoryTransactionZoneOptions,
  listInventoryTransaction
} from '@/api/warehouse/inventoryTransaction';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
const { wm_inventory_transaction_type } = toRefs<any>(useDict('wm_inventory_transaction_type'));
const { showSearch } = useSearchToggle();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const rows = ref<InventoryTransactionVO[]>([]);
const loading = ref(false);
const total = ref(0);
const detail = ref<InventoryTransactionVO>();
const detailVisible = ref(false);
const queryRef = ref<ElFormInstance>();
const occurredRange = ref<[string, string]>();
const companies = ref<ContextCompanyOptionVO[]>([]);
const warehouses = ref<DocumentWarehouseOptionVO[]>([]);
const zones = ref<DocumentZoneOptionVO[]>([]);
const locations = ref<DocumentLocationOptionVO[]>([]);
const queryParams = reactive<InventoryTransactionQuery>({ pageNum: 1, pageSize: 10 });
const filteredWarehouses = computed(() =>
  queryParams.companyId ? warehouses.value.filter(w => w.companyId === queryParams.companyId) : warehouses.value
);
const applyRange = () => {
  queryParams.beginOccurredAt = occurredRange.value?.[0];
  queryParams.endOccurredAt = occurredRange.value?.[1];
};
const getList = async () => {
  loading.value = true;
  try {
    applyRange();
    const r = await listInventoryTransaction(queryParams);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const companyChanged = () => {
  queryParams.warehouseId = undefined;
  queryParams.zoneId = undefined;
  queryParams.locationId = undefined;
  zones.value = [];
  locations.value = [];
};
const warehouseChanged = async () => {
  queryParams.zoneId = undefined;
  queryParams.locationId = undefined;
  locations.value = [];
  if (!queryParams.warehouseId) return;
  try {
    zones.value = (await inventoryTransactionZoneOptions(queryParams.warehouseId)).data || [];
  } catch {
    zones.value = [];
    proxy?.$modal.msgError('库存流水筛选的库区加载失败，请检查仓库访问范围');
  }
};
const zoneChanged = async () => {
  queryParams.locationId = undefined;
  if (!queryParams.warehouseId) {
    locations.value = [];
    return;
  }
  try {
    locations.value =
      (await inventoryTransactionLocationOptions(queryParams.warehouseId, queryParams.zoneId)).data || [];
  } catch {
    locations.value = [];
    proxy?.$modal.msgError('库存流水筛选的库位加载失败，请检查仓库和库区归属');
  }
};
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryRef.value?.resetFields();
  occurredRange.value = undefined;
  companyChanged();
  handleQuery();
};
const showDetail = async (id: number | string) => {
  detail.value = (await getInventoryTransaction(id)).data;
  detailVisible.value = true;
};
const formatChange = (value: number) => (Number(value) > 0 ? `+${value}` : String(value));
const handleExport = () => {
  applyRange();
  download('/warehouse/inventoryTransaction/export', { ...queryParams }, `库存流水_${Date.now()}.xlsx`);
};
const loadInitialOptions = async () => {
  try {
    companies.value = (await inventoryTransactionCompanyOptions()).data || [];
  } catch {
    proxy?.$modal.msgError('库存流水筛选的公司选项加载失败，列表数据仍可继续查询');
  }
  try {
    warehouses.value = (await inventoryTransactionWarehouseOptions()).data || [];
  } catch {
    proxy?.$modal.msgError('库存流水筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};
onMounted(() => {
  void getList();
  void loadInitialOptions();
});
</script>
<style scoped>
.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}
.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>
