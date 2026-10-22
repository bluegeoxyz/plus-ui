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
        <el-form-item v-if="mode === 'detail'" label="库区">
          <el-select v-model="queryParams.zoneId" clearable filterable @change="zoneChanged">
            <el-option v-for="z in zones" :key="z.id" :label="z.zoneName" :value="z.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="mode === 'detail'" label="库位">
          <el-select v-model="queryParams.locationId" clearable filterable>
            <el-option
              v-for="l in locations"
              :key="l.id"
              :label="`${l.locationCode} ${l.locationName}`"
              :value="l.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物料分类">
          <el-tree-select
            v-model="queryParams.categoryId"
            :data="categories"
            :props="treeProps"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="queryParams.materialCode" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="queryParams.materialName" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item v-if="mode === 'detail'" label="库存状态">
          <el-select v-model="queryParams.zeroStock" clearable>
            <el-option label="有库存" :value="false" />
            <el-option label="零库存" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="库存状态">
          <el-checkbox v-model="queryParams.lowStock">仅看低库存</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <template #header>
        <el-row justify="space-between">
          <el-radio-group v-model="mode" @change="modeChanged">
            <el-radio-button value="detail">库位明细</el-radio-button>
            <el-radio-button value="summary">仓库物料汇总</el-radio-button>
          </el-radio-group>
          <div>
            <el-button
              v-if="mode === 'detail'"
              v-hasPermi="['warehouse:inventory:export']"
              type="warning"
              plain
              icon="Download"
              @click="handleExport"
            >
              导出
            </el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </div>
        </el-row>
      </template>
      <el-table v-if="mode === 'detail'" v-loading="loading" :data="detailRows" border>
        <el-table-column label="所属公司" prop="companyName" min-width="130" />
        <el-table-column label="仓库" prop="warehouseName" min-width="130" />
        <el-table-column label="库区" prop="zoneName" min-width="110" />
        <el-table-column label="库位" min-width="150">
          <template #default="s">{{ s.row.locationCode }} {{ s.row.locationName }}</template>
        </el-table-column>
        <el-table-column label="物料编码" prop="materialCode" width="130" />
        <el-table-column label="物料名称" prop="materialName" min-width="140" />
        <el-table-column label="规格" prop="specification" min-width="110" />
        <el-table-column label="型号" prop="model" min-width="100" />
        <el-table-column label="单位" width="90">
          <template #default="s">{{ s.row.baseUnitSymbol || s.row.baseUnitName }}</template>
        </el-table-column>
        <el-table-column label="当前数量" prop="quantity" width="110" align="right" />
        <el-table-column label="锁定数量" prop="lockedQuantity" width="110" align="right" />
        <el-table-column label="可用数量" prop="availableQuantity" width="110" align="right" />
        <el-table-column label="安全库存" prop="safetyStock" width="110" align="right" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="s">
            <el-button v-hasPermi="['warehouse:inventory:query']" link type="primary" @click="showDetail(s.row.id)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-table v-else v-loading="loading" :data="summaryRows" border>
        <el-table-column label="所属公司" prop="companyName" min-width="140" />
        <el-table-column label="仓库" prop="warehouseName" min-width="140" />
        <el-table-column label="物料编码" prop="materialCode" width="140" />
        <el-table-column label="物料名称" prop="materialName" min-width="150" />
        <el-table-column label="规格" prop="specification" min-width="120" />
        <el-table-column label="型号" prop="model" min-width="110" />
        <el-table-column label="单位" prop="baseUnitName" width="90" />
        <el-table-column label="当前数量" prop="quantity" width="110" align="right" />
        <el-table-column label="锁定数量" prop="lockedQuantity" width="110" align="right" />
        <el-table-column label="可用数量" prop="availableQuantity" width="110" align="right" />
        <el-table-column label="安全库存" prop="safetyStock" width="110" align="right" />
        <el-table-column label="库存状态" width="100">
          <template #default="s">
            <el-tag :type="s.row.lowStock ? 'danger' : 'success'">{{ s.row.lowStock ? '库存不足' : '正常' }}</el-tag>
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
    <el-dialog v-model="detailVisible" title="库存余额详情" width="680px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="仓库">{{ detail.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ detail.locationCode }} {{ detail.locationName }}</el-descriptions-item>
        <el-descriptions-item label="物料">{{ detail.materialCode }} {{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ detail.baseUnitName }}</el-descriptions-item>
        <el-descriptions-item label="当前数量">{{ detail.quantity }}</el-descriptions-item>
        <el-descriptions-item label="锁定数量">{{ detail.lockedQuantity }}</el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ detail.availableQuantity }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ detail.version }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup name="Inventory" lang="ts">
import type {
  ContextCompanyOptionVO,
  ContextMaterialCategoryOptionVO,
  DocumentLocationOptionVO,
  DocumentWarehouseOptionVO,
  DocumentZoneOptionVO
} from '@/api/warehouse/context/types';
import type { InventoryQuery, InventorySummaryVO, InventoryVO } from '@/api/warehouse/inventory/types';
import {
  getInventory,
  inventoryCategoryOptions,
  inventoryCompanyOptions,
  inventoryLocationOptions,
  inventoryWarehouseOptions,
  inventoryZoneOptions,
  listInventory,
  listInventorySummary
} from '@/api/warehouse/inventory';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { download } from '@/utils/request';
const { showSearch } = useSearchToggle();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const mode = ref<'detail' | 'summary'>('detail');
const loading = ref(false);
const total = ref(0);
const detailRows = ref<InventoryVO[]>([]);
const summaryRows = ref<InventorySummaryVO[]>([]);
const detail = ref<InventoryVO>();
const detailVisible = ref(false);
const queryRef = ref<ElFormInstance>();
const companies = ref<ContextCompanyOptionVO[]>([]);
const warehouses = ref<DocumentWarehouseOptionVO[]>([]);
const zones = ref<DocumentZoneOptionVO[]>([]);
const locations = ref<DocumentLocationOptionVO[]>([]);
const categories = ref<ContextMaterialCategoryOptionVO[]>([]);
const treeProps = { value: 'id', label: 'categoryName', children: 'children' };
const queryParams = reactive<InventoryQuery>({ pageNum: 1, pageSize: 10 });
const filteredWarehouses = computed(() =>
  queryParams.companyId ? warehouses.value.filter(w => w.companyId === queryParams.companyId) : warehouses.value
);
const getList = async () => {
  loading.value = true;
  try {
    if (mode.value === 'detail') {
      const r = await listInventory(queryParams);
      detailRows.value = r.data?.rows || [];
      total.value = r.data?.total || 0;
    } else {
      const r = await listInventorySummary(queryParams);
      summaryRows.value = r.data?.rows || [];
      total.value = r.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};
const companyChanged = async () => {
  queryParams.warehouseId = undefined;
  queryParams.zoneId = undefined;
  queryParams.locationId = undefined;
  zones.value = [];
  locations.value = [];
  try {
    categories.value = (await inventoryCategoryOptions(queryParams.companyId)).data || [];
  } catch {
    categories.value = [];
    proxy?.$modal.msgError('库存筛选的物料分类加载失败，请检查库存查询权限和数据范围');
  }
};
const warehouseChanged = async () => {
  queryParams.zoneId = undefined;
  queryParams.locationId = undefined;
  locations.value = [];
  if (!queryParams.warehouseId) return;
  try {
    zones.value = (await inventoryZoneOptions(queryParams.warehouseId)).data || [];
  } catch {
    zones.value = [];
    proxy?.$modal.msgError('库存筛选的库区加载失败，请检查仓库访问范围');
  }
};
const zoneChanged = async () => {
  queryParams.locationId = undefined;
  if (!queryParams.warehouseId) return;
  try {
    locations.value = (await inventoryLocationOptions(queryParams.warehouseId, queryParams.zoneId)).data || [];
  } catch {
    locations.value = [];
    proxy?.$modal.msgError('库存筛选的库位加载失败，请检查仓库和库区归属');
  }
};
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
const resetQuery = async () => {
  queryRef.value?.resetFields();
  await companyChanged();
  handleQuery();
};
const modeChanged = () => {
  queryParams.pageNum = 1;
  queryParams.zeroStock = undefined;
  queryParams.lowStock = undefined;
  getList();
};
const showDetail = async (id: number | string) => {
  detail.value = (await getInventory(id)).data;
  detailVisible.value = true;
};
const handleExport = () => download('/warehouse/inventory/export', { ...queryParams }, `实时库存_${Date.now()}.xlsx`);
const loadInitialOptions = async () => {
  try {
    companies.value = (await inventoryCompanyOptions()).data || [];
  } catch {
    proxy?.$modal.msgError('库存筛选的公司选项加载失败，列表数据仍可继续查询');
  }
  try {
    warehouses.value = (await inventoryWarehouseOptions()).data || [];
  } catch {
    proxy?.$modal.msgError('库存筛选的仓库选项加载失败，列表数据仍可继续查询');
  }
};
onMounted(() => {
  void getList();
  void loadInitialOptions();
});
</script>
