<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline
        ><el-form-item label="仓库" prop="warehouseId"
          ><el-select
            v-model="queryParams.warehouseId"
            clearable
            filterable
            @change="queryWarehouseChanged"
            ><el-option
              v-for="w in queryWarehouses"
              :key="w.id"
              :label="w.warehouseName"
              :value="w.id" /></el-select></el-form-item
        ><el-form-item label="库区" prop="zoneId"
          ><el-select v-model="queryParams.zoneId" clearable
            ><el-option
              v-for="z in queryZones"
              :key="z.id"
              :label="z.zoneName"
              :value="z.id" /></el-select></el-form-item
        ><el-form-item label="库位编码" prop="locationCode"
          ><el-input
            v-model="queryParams.locationCode"
            clearable /></el-form-item
        ><el-form-item
          ><el-button type="primary" @click="query">搜索</el-button
          ><el-button @click="reset">重置</el-button></el-form-item
        ></el-form
      ></el-card
    >
    <el-card
      ><template #header
        ><el-button
          v-hasPermi="['warehouse:location:add']"
          type="primary"
          plain
          @click="add"
          >新增</el-button
        ><el-button
          v-hasPermi="['warehouse:location:edit']"
          type="success"
          plain
          :disabled="single"
          @click="edit()"
          >修改</el-button
        ><el-button
          v-hasPermi="['warehouse:location:remove']"
          type="danger"
          plain
          :disabled="multiple"
          @click="remove()"
          >删除</el-button
        ><right-toolbar v-if="canList" v-model:show-search="showSearch" @query-table="getList"
      /></template>
      <el-table v-if="canList"
        v-loading="loading"
        :data="rows"
        border
        @selection-change="selection"
        ><el-table-column type="selection" width="50" /><el-table-column
          label="仓库"
          prop="warehouseName"
        /><el-table-column label="库区" prop="zoneName" /><el-table-column
          label="库位编码"
          prop="locationCode"
        /><el-table-column
          label="库位名称"
          prop="locationName"
        /><el-table-column label="状态" width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:location:edit']"
              active-value="0"
              inactive-value="1"
              @change="statusChange(s.row)" /></template></el-table-column
        ><el-table-column label="操作" width="120"
          ><template #default="s"
            ><el-button v-hasPermi="['warehouse:location:edit']" link type="primary" @click="edit(s.row)">修改</el-button
            ><el-button v-hasPermi="['warehouse:location:remove']" link type="danger" @click="remove(s.row)"
              >删除</el-button
            ></template
          ></el-table-column
        ></el-table
      ><pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
    /></el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px"
      ><el-form ref="formRef" :model="form" :rules="rules" label-width="90px"
        ><el-form-item label="仓库" prop="warehouseId"
          ><el-select
            v-model="form.warehouseId"
            filterable
            @change="formWarehouseChanged"
            ><el-option
              v-for="w in formWarehouses"
              :key="w.id"
              :label="w.warehouseName"
              :value="w.id" /></el-select></el-form-item
        ><el-form-item label="库区" prop="zoneId"
          ><el-select v-model="form.zoneId" filterable
            ><el-option
              v-for="z in formZones"
              :key="z.id"
              :label="z.zoneName"
              :value="z.id" /></el-select></el-form-item
        ><el-form-item label="库位编码" prop="locationCode"
          ><el-input v-model="form.locationCode" maxlength="64" /></el-form-item
        ><el-form-item label="库位名称" prop="locationName"
          ><el-input
            v-model="form.locationName"
            maxlength="128" /></el-form-item
        ><el-form-item label="状态"
          ><el-radio-group v-model="form.status"
            ><el-radio
              v-for="d in sys_normal_disable"
              :key="d.value"
              :value="d.value"
              >{{ d.label }}</el-radio
            ></el-radio-group
          ></el-form-item
        ><el-form-item label="排序"
          ><el-input-number v-model="form.sort" :min="0" /></el-form-item
        ><el-form-item label="备注"
          ><el-input
            v-model="form.remark"
            type="textarea"
            maxlength="500" /></el-form-item></el-form
      ><template #footer
        ><el-button type="primary" @click="submit">确定</el-button
        ><el-button @click="closeDialog">取消</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup name="WarehouseLocation" lang="ts">
import type { WarehouseOptionVO } from "@/api/warehouse/warehouse/types";
import {
  addWarehouseLocation,
  changeWarehouseLocationStatus,
  delWarehouseLocation,
  getWarehouseLocationEditContext,
  listWarehouseLocation,
  updateWarehouseLocation,
  warehouseLocationMaintainWarehouseOptions,
  warehouseLocationMaintainZoneOptions,
  warehouseLocationQueryWarehouseOptions,
  warehouseLocationQueryZoneOptions,
} from "@/api/warehouse/location";
import type {
  WarehouseLocationForm,
  WarehouseLocationQuery,
  WarehouseLocationVO,
} from "@/api/warehouse/location/types";
import type { WarehouseZoneOptionVO } from "@/api/warehouse/zone/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"));
const { showSearch } = useSearchToggle();
const queryWarehouses = ref<WarehouseOptionVO[]>([]);
const formWarehouses = ref<WarehouseOptionVO[]>([]);
const queryZones = ref<WarehouseZoneOptionVO[]>([]);
const formZones = ref<WarehouseZoneOptionVO[]>([]);
const rows = ref<WarehouseLocationVO[]>([]);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const init = (): WarehouseLocationForm => ({
  locationCode: "",
  locationName: "",
  status: "0",
  sort: 0,
});
const data = reactive<PageData<WarehouseLocationForm, WarehouseLocationQuery>>({
  form: init(),
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    warehouseId: [
      { required: true, message: "仓库不能为空", trigger: "change" },
    ],
    zoneId: [{ required: true, message: "库区不能为空", trigger: "change" }],
    locationCode: [
      { required: true, message: "库位编码不能为空", trigger: "blur" },
    ],
    locationName: [
      { required: true, message: "库位名称不能为空", trigger: "blur" },
    ],
  },
});
const { form, queryParams, rules } = toRefs(data);
const { dialog, resetForm, showDialog, closeDialog } = useFormDialog({
  form,
  formRef,
  initialFormData: init(),
});
const getList = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listWarehouseLocation(queryParams.value);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const loadFormZones = async (
  warehouseId: number | string,
  target: Ref<WarehouseZoneOptionVO[]>,
) => {
  const r = await warehouseLocationMaintainZoneOptions(warehouseId);
  target.value = r.data || [];
};
const loadQueryZones = async (warehouseId: number | string) => {
  const r = await warehouseLocationQueryZoneOptions(warehouseId);
  queryZones.value = r.data || [];
};
const loadQueryWarehouses = async () => {
  try {
    const r = await warehouseLocationQueryWarehouseOptions();
    queryWarehouses.value = r.data || [];
  } catch {
    modal.msgError("库位筛选的仓库选项加载失败，列表数据仍可继续查询");
  }
};
const loadFormWarehouses = async () => {
  const r = await warehouseLocationMaintainWarehouseOptions();
  formWarehouses.value = r.data || [];
};
const queryWarehouseChanged = async (id?: number | string) => {
  queryParams.value.zoneId = undefined;
  queryZones.value = [];
  if (id) {
    try {
      await loadQueryZones(id);
    } catch {
      modal.msgError("库位筛选的库区选项加载失败，列表数据仍可继续查询");
    }
  }
};
const formWarehouseChanged = async (id?: number | string) => {
  form.value.zoneId = undefined;
  formZones.value = [];
  if (id) await loadFormZones(id, formZones);
};
const query = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const reset = () => {
  queryRef.value?.resetFields();
  queryZones.value = [];
  query();
};
const selection = (s: WarehouseLocationVO[]) => {
  ids.value = s.map((x) => x.id);
  single.value = s.length !== 1;
  multiple.value = !s.length;
};
const add = async () => {
  resetForm();
  formZones.value = [];
  try {
    await loadFormWarehouses();
  } catch {
    return modal.msgError("无库位维护所需的仓库选项权限");
  }
  showDialog("新增库位");
};
const edit = async (row?: WarehouseLocationVO | Record<PropertyKey, any>) => {
  const id = row?.id ?? ids.value[0];
  if (!id) return;
  let r;
  try {
    [r] = await Promise.all([getWarehouseLocationEditContext(id), loadFormWarehouses()]);
  } catch {
    return modal.msgError("无库位维护所需的仓库选项权限");
  }
  resetForm();
  Object.assign(form.value, r.data);
  if (form.value.warehouseId)
    await loadFormZones(form.value.warehouseId, formZones);
  showDialog("修改库位");
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  await (form.value.id
    ? updateWarehouseLocation(form.value)
    : addWarehouseLocation(form.value));
  modal.msgSuccess("操作成功");
  closeDialog();
  getList();
};
const statusChange = async (row: WarehouseLocationVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await changeWarehouseLocationStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const remove = async (row?: WarehouseLocationVO | Record<PropertyKey, any>) => {
  await modal.confirm("确认删除选中的库位吗？");
  await delWarehouseLocation(row?.id ?? ids.value);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:location",
  loadList: async () => { await Promise.allSettled([getList(), loadQueryWarehouses()]); },
  openAdd: add,
  openEdit: (id) => edit({ id }),
  clearList: () => { closeDialog(); rows.value = []; total.value = 0; queryWarehouses.value = []; },
});
</script>
