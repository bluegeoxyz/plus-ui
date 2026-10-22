<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" shadow="hover" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline>
        <el-form-item label="仓库编码" prop="warehouseCode"
          ><el-input
            v-model="queryParams.warehouseCode"
            clearable
            @keyup.enter="handleQuery"
        /></el-form-item>
        <el-form-item label="仓库名称" prop="warehouseName"
          ><el-input
            v-model="queryParams.warehouseName"
            clearable
            @keyup.enter="handleQuery"
        /></el-form-item>
        <el-form-item label="归属类型" prop="warehouseScope"
          ><el-select v-model="queryParams.warehouseScope" clearable
            ><el-option
              v-for="d in wm_warehouse_scope"
              :key="d.value"
              :label="d.label"
              :value="d.value" /></el-select
        ></el-form-item>
        <el-form-item label="状态" prop="status"
          ><el-select v-model="queryParams.status" clearable
            ><el-option
              v-for="d in sys_normal_disable"
              :key="d.value"
              :label="d.label"
              :value="d.value" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" icon="Search" @click="handleQuery"
            >搜索</el-button
          ><el-button icon="Refresh" @click="resetQuery"
            >重置</el-button
          ></el-form-item
        >
      </el-form></el-card
    >
    <el-card shadow="hover"
      ><template #header
        ><el-row :gutter="10">
          <el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:warehouse:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              >新增</el-button
            ></el-col
          >
          <el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:warehouse:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
              >修改</el-button
            ></el-col
          >
          <el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:warehouse:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
              >删除</el-button
            ></el-col
          >
          <right-toolbar v-if="canList"
            v-model:show-search="showSearch"
            @query-table="getList"
          /> </el-row
      ></template>
      <el-table v-if="canList"
        v-loading="loading"
        :data="rows"
        border
        @selection-change="selectionChange"
      >
        <el-table-column type="selection" width="50" /><el-table-column
          label="仓库编码"
          prop="warehouseCode"
          min-width="130"
        /><el-table-column
          label="仓库名称"
          prop="warehouseName"
          min-width="150"
        />
        <el-table-column label="归属类型" width="120"
          ><template #default="s"
            ><dict-tag
              :options="wm_warehouse_scope"
              :value="s.row.warehouseScope" /></template
        ></el-table-column>
        <el-table-column
          label="所属公司"
          prop="companyName"
          min-width="140"
        /><el-table-column
          label="所属项目"
          prop="projectName"
          min-width="140"
        /><el-table-column label="负责人" prop="managerName" width="110" />
        <el-table-column label="状态" width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:warehouse:edit']"
              active-value="0"
              inactive-value="1"
              @change="changeStatus(s.row)" /></template
        ></el-table-column>
        <el-table-column label="操作" width="120" fixed="right"
          ><template #default="s"
            ><el-button
              v-hasPermi="['warehouse:warehouse:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(s.row)" /><el-button
              v-hasPermi="['warehouse:warehouse:remove']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(s.row)" /></template
        ></el-table-column> </el-table
      ><pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px"
      ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
        ><el-row :gutter="16">
          <el-col :span="12"
            ><el-form-item label="所属公司" prop="companyId"
              ><el-select v-model="form.companyId" filterable
                ><el-option
                  v-for="d in departments"
                  :key="d.deptId"
                  :label="d.deptName"
                  :value="d.deptId" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="归属类型" prop="warehouseScope"
              ><el-radio-group
                v-model="form.warehouseScope"
                @change="scopeChanged"
                ><el-radio
                  v-for="d in wm_warehouse_scope"
                  :key="d.value"
                  :value="d.value"
                  >{{ d.label }}</el-radio
                ></el-radio-group
              ></el-form-item
            ></el-col
          >
          <el-col v-if="form.warehouseScope === 'PROJECT'" :span="12"
            ><el-form-item label="所属项目" prop="projectId"
              ><el-select v-model="form.projectId" filterable
                ><el-option
                  v-for="p in projects"
                  :key="p.id"
                  :label="p.projectName"
                  :value="p.id" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="仓库编码" prop="warehouseCode"
              ><el-input
                v-model="form.warehouseCode"
                maxlength="64" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="仓库名称" prop="warehouseName"
              ><el-input
                v-model="form.warehouseName"
                maxlength="128" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="负责人ID" prop="managerId"
              ><el-input v-model="form.managerId" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="联系电话" prop="contactPhone"
              ><el-input
                v-model="form.contactPhone"
                maxlength="32" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="状态"
              ><el-radio-group v-model="form.status"
                ><el-radio
                  v-for="d in sys_normal_disable"
                  :key="d.value"
                  :value="d.value"
                  >{{ d.label }}</el-radio
                ></el-radio-group
              ></el-form-item
            ></el-col
          >
          <el-col :span="12"
            ><el-form-item label="排序"
              ><el-input-number v-model="form.sort" :min="0" /></el-form-item
          ></el-col>
          <el-col :span="24"
            ><el-form-item label="地址"
              ><el-input
                v-model="form.address"
                maxlength="255" /></el-form-item></el-col
          ><el-col :span="24"
            ><el-form-item label="备注"
              ><el-input
                v-model="form.remark"
                type="textarea"
                maxlength="500" /></el-form-item
          ></el-col> </el-row></el-form
      ><template #footer
        ><el-button type="primary" :loading="submitting" @click="submit"
          >确定</el-button
        ><el-button @click="closeDialog">取消</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup name="Warehouse" lang="ts">
import {
  addWarehouse,
  changeWarehouseStatus,
  delWarehouse,
  getWarehouseEditContext,
  listWarehouse,
  updateWarehouse,
  warehouseCompanyOptions,
  warehouseProjectOptions,
} from "@/api/warehouse/warehouse";
import type {
  CompanyOptionVO,
  ProjectOptionVO,
  WarehouseForm,
  WarehouseQuery,
  WarehouseVO,
} from "@/api/warehouse/warehouse/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { wm_warehouse_scope, sys_normal_disable } = toRefs<any>(
  useDict("wm_warehouse_scope", "sys_normal_disable"),
);
const { showSearch } = useSearchToggle();
const rows = ref<WarehouseVO[]>([]);
const departments = ref<CompanyOptionVO[]>([]);
const projects = ref<ProjectOptionVO[]>([]);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const initForm = (): WarehouseForm => ({
  warehouseScope: "PROJECT",
  warehouseCode: "",
  warehouseName: "",
  status: "0",
  sort: 0,
});
const data = reactive<PageData<WarehouseForm, WarehouseQuery>>({
  form: initForm(),
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    companyId: [
      { required: true, message: "所属公司不能为空", trigger: "change" },
    ],
    warehouseScope: [
      { required: true, message: "归属类型不能为空", trigger: "change" },
    ],
    warehouseCode: [
      { required: true, message: "仓库编码不能为空", trigger: "blur" },
    ],
    warehouseName: [
      { required: true, message: "仓库名称不能为空", trigger: "blur" },
    ],
    projectId: [
      {
        validator: (_r: unknown, v: unknown, cb: (e?: Error) => void) =>
          form.value.warehouseScope === "PROJECT" && !v
            ? cb(new Error("项目仓必须选择项目"))
            : cb(),
        trigger: "change",
      },
    ],
  },
});
const { form, queryParams, rules } = toRefs(data);
const { dialog, resetForm, showDialog, closeDialog } = useFormDialog({
  form,
  formRef,
  initialFormData: initForm(),
});
const getList = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listWarehouse(queryParams.value);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const loadOptions = async () => {
  const [d, p] = await Promise.all([
    warehouseCompanyOptions(),
    warehouseProjectOptions(),
  ]);
  departments.value = d.data || [];
  projects.value = p.data || [];
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryRef.value?.resetFields();
  handleQuery();
};
const selectionChange = (s: WarehouseVO[]) => {
  ids.value = s.map((x) => x.id);
  single.value = s.length !== 1;
  multiple.value = !s.length;
};
const handleAdd = async () => {
  resetForm();
  await loadOptions();
  showDialog("新增仓库");
};
const handleUpdate = async (row?: WarehouseVO | Record<PropertyKey, any>) => {
  const id = row?.id ?? ids.value[0];
  if (!id) return;
  const [r] = await Promise.all([getWarehouseEditContext(id), loadOptions()]);
  resetForm();
  Object.assign(form.value, r.data);
  showDialog("修改仓库");
};
const scopeChanged = () => {
  if (form.value.warehouseScope === "COMPANY") form.value.projectId = undefined;
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  submitting.value = true;
  try {
    await (form.value.id
      ? updateWarehouse(form.value)
      : addWarehouse(form.value));
    modal.msgSuccess("操作成功");
    closeDialog();
    await getList();
  } finally {
    submitting.value = false;
  }
};
const changeStatus = async (row: WarehouseVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await modal.confirm(
      `确认${status === "0" ? "启用" : "停用"}仓库“${row.warehouseName}”吗？`,
    );
    await changeWarehouseStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const handleDelete = async (row?: WarehouseVO | Record<PropertyKey, any>) => {
  const values = row?.id ?? ids.value;
  await modal.confirm("确认删除选中的仓库吗？");
  await delWarehouse(values);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:warehouse",
  loadList: getList,
  openAdd: handleAdd,
  openEdit: (id) => handleUpdate({ id }),
  clearList: () => { closeDialog(); rows.value = []; total.value = 0; },
});
</script>
