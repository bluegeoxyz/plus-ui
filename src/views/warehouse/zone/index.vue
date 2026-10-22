<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline
        ><el-form-item label="仓库" prop="warehouseId"
          ><el-select v-model="queryParams.warehouseId" clearable filterable
            ><el-option
              v-for="w in queryWarehouses"
              :key="w.id"
              :label="w.warehouseName"
              :value="w.id" /></el-select></el-form-item
        ><el-form-item label="库区编码" prop="zoneCode"
          ><el-input v-model="queryParams.zoneCode" clearable /></el-form-item
        ><el-form-item label="库区名称" prop="zoneName"
          ><el-input v-model="queryParams.zoneName" clearable /></el-form-item
        ><el-form-item
          ><el-button type="primary" @click="query">搜索</el-button
          ><el-button @click="reset">重置</el-button></el-form-item
        ></el-form
      ></el-card
    >
    <el-card
      ><template #header
        ><el-button
          v-hasPermi="['warehouse:zone:add']"
          type="primary"
          plain
          @click="add"
          >新增</el-button
        ><el-button
          v-hasPermi="['warehouse:zone:edit']"
          type="success"
          plain
          :disabled="single"
          @click="edit()"
          >修改</el-button
        ><el-button
          v-hasPermi="['warehouse:zone:remove']"
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
        /><el-table-column label="库区编码" prop="zoneCode" /><el-table-column
          label="库区名称"
          prop="zoneName"
        /><el-table-column label="状态" width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:zone:edit']"
              active-value="0"
              inactive-value="1"
              @change="statusChange(s.row)" /></template></el-table-column
        ><el-table-column label="排序" prop="sort" width="80" /><el-table-column
          label="操作"
          width="120"
          ><template #default="s"
            ><el-button v-hasPermi="['warehouse:zone:edit']" link type="primary" @click="edit(s.row)">修改</el-button
            ><el-button v-hasPermi="['warehouse:zone:remove']" link type="danger" @click="remove(s.row)"
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
          ><el-select v-model="form.warehouseId" filterable
            ><el-option
              v-for="w in formWarehouses"
              :key="w.id"
              :label="w.warehouseName"
              :value="w.id" /></el-select></el-form-item
        ><el-form-item label="库区编码" prop="zoneCode"
          ><el-input v-model="form.zoneCode" maxlength="64" /></el-form-item
        ><el-form-item label="库区名称" prop="zoneName"
          ><el-input v-model="form.zoneName" maxlength="128" /></el-form-item
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
<script setup name="WarehouseZone" lang="ts">
import type { WarehouseOptionVO } from "@/api/warehouse/warehouse/types";
import {
  addWarehouseZone,
  changeWarehouseZoneStatus,
  delWarehouseZone,
  getWarehouseZoneEditContext,
  listWarehouseZone,
  updateWarehouseZone,
  warehouseZoneMaintainWarehouseOptions,
  warehouseZoneQueryWarehouseOptions,
} from "@/api/warehouse/zone";
import type {
  WarehouseZoneForm,
  WarehouseZoneQuery,
  WarehouseZoneVO,
} from "@/api/warehouse/zone/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"));
const { showSearch } = useSearchToggle();
const queryWarehouses = ref<WarehouseOptionVO[]>([]);
const formWarehouses = ref<WarehouseOptionVO[]>([]);
const rows = ref<WarehouseZoneVO[]>([]);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const init = (): WarehouseZoneForm => ({
  zoneCode: "",
  zoneName: "",
  status: "0",
  sort: 0,
});
const data = reactive<PageData<WarehouseZoneForm, WarehouseZoneQuery>>({
  form: init(),
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    warehouseId: [
      { required: true, message: "仓库不能为空", trigger: "change" },
    ],
    zoneCode: [
      { required: true, message: "库区编码不能为空", trigger: "blur" },
    ],
    zoneName: [
      { required: true, message: "库区名称不能为空", trigger: "blur" },
    ],
  },
});
const { form, queryParams, rules } = toRefs(data);
const { dialog, resetForm, showDialog, closeDialog } = useFormDialog({
  form,
  formRef,
  initialFormData: init(),
});
const loadFormWarehouses = async () => {
  const r = await warehouseZoneMaintainWarehouseOptions();
  formWarehouses.value = r.data || [];
};
const loadQueryWarehouses = async () => {
  try {
    const r = await warehouseZoneQueryWarehouseOptions();
    queryWarehouses.value = r.data || [];
  } catch {
    modal.msgError("库区筛选的仓库选项加载失败，列表数据仍可继续查询");
  }
};
const getList = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listWarehouseZone(queryParams.value);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const query = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const reset = () => {
  queryRef.value?.resetFields();
  query();
};
const selection = (s: WarehouseZoneVO[]) => {
  ids.value = s.map((x) => x.id);
  single.value = s.length !== 1;
  multiple.value = !s.length;
};
const add = async () => {
  resetForm();
  try {
    await loadFormWarehouses();
  } catch {
    return modal.msgError("无库区维护所需的仓库选项权限");
  }
  showDialog("新增库区");
};
const edit = async (row?: WarehouseZoneVO | Record<PropertyKey, any>) => {
  const id = row?.id ?? ids.value[0];
  if (!id) return;
  let r;
  try {
    [r] = await Promise.all([getWarehouseZoneEditContext(id), loadFormWarehouses()]);
  } catch {
    return modal.msgError("无库区维护所需的仓库选项权限");
  }
  resetForm();
  Object.assign(form.value, r.data);
  showDialog("修改库区");
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  await (form.value.id
    ? updateWarehouseZone(form.value)
    : addWarehouseZone(form.value));
  modal.msgSuccess("操作成功");
  closeDialog();
  getList();
};
const statusChange = async (row: WarehouseZoneVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await changeWarehouseZoneStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const remove = async (row?: WarehouseZoneVO | Record<PropertyKey, any>) => {
  await modal.confirm("确认删除选中的库区吗？");
  await delWarehouseZone(row?.id ?? ids.value);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:zone",
  loadList: async () => { await Promise.allSettled([getList(), loadQueryWarehouses()]); },
  openAdd: add,
  openEdit: (id) => edit({ id }),
  clearList: () => { closeDialog(); rows.value = []; total.value = 0; queryWarehouses.value = []; },
});
</script>
