<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" shadow="hover" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline
        ><el-form-item label="单位编码"
          ><el-input
            v-model="queryParams.unitCode"
            clearable
            @keyup.enter="handleQuery" /></el-form-item
        ><el-form-item label="单位名称"
          ><el-input
            v-model="queryParams.unitName"
            clearable
            @keyup.enter="handleQuery" /></el-form-item
        ><el-form-item label="状态"
          ><el-select v-model="queryParams.status" clearable
            ><el-option
              v-for="d in sys_normal_disable"
              :key="d.value"
              :label="d.label"
              :value="d.value" /></el-select></el-form-item
        ><el-form-item
          ><el-button type="primary" icon="Search" @click="handleQuery"
            >搜索</el-button
          ><el-button icon="Refresh" @click="resetQuery"
            >重置</el-button
          ></el-form-item
        ></el-form
      ></el-card
    >
    <el-card shadow="hover"
      ><template #header
        ><el-row :gutter="10"
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:unit:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              >新增</el-button
            ></el-col
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:unit:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
              >修改</el-button
            ></el-col
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:unit:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
              >删除</el-button
            ></el-col
          ><right-toolbar v-if="canList"
            v-model:show-search="showSearch"
            @query-table="getList" /></el-row
      ></template>
      <el-table v-if="canList"
        v-loading="loading"
        :data="rows"
        border
        @selection-change="selectionChange"
        ><el-table-column type="selection" width="50" /><el-table-column
          label="单位编码"
          prop="unitCode"
          width="140" /><el-table-column
          label="单位名称"
          prop="unitName" /><el-table-column
          label="符号"
          prop="symbol"
          width="100" /><el-table-column
          label="小数精度"
          prop="precisionScale"
          width="100" /><el-table-column label="状态" width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:unit:edit']"
              active-value="0"
              inactive-value="1"
              @change="changeStatus(s.row)" /></template></el-table-column
        ><el-table-column label="操作" width="120"
          ><template #default="s"
            ><el-button
              v-hasPermi="['warehouse:unit:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(s.row)" /><el-button
              v-hasPermi="['warehouse:unit:remove']"
              link
              type="danger"
              icon="Delete"
              @click="
                handleDelete(s.row)
              " /></template></el-table-column></el-table
      ><pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px"
      ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
        ><el-form-item label="单位编码" prop="unitCode"
          ><el-input v-model="form.unitCode" maxlength="32" /></el-form-item
        ><el-form-item label="单位名称" prop="unitName"
          ><el-input v-model="form.unitName" maxlength="64" /></el-form-item
        ><el-form-item label="单位符号"
          ><el-input v-model="form.symbol" maxlength="32" /></el-form-item
        ><el-form-item label="小数精度" prop="precisionScale"
          ><el-input-number
            v-model="form.precisionScale"
            :min="0"
            :max="6" /></el-form-item
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
        ><el-button type="primary" :loading="submitting" @click="submit"
          >确定</el-button
        ><el-button @click="closeDialog">取消</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup name="WarehouseUnit" lang="ts">
import {
  addUnit,
  changeUnitStatus,
  delUnit,
  getUnitEditContext,
  listUnit,
  updateUnit,
} from "@/api/warehouse/unit";
import type { UnitForm, UnitQuery, UnitVO } from "@/api/warehouse/unit/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"));
const { showSearch } = useSearchToggle();
const rows = ref<UnitVO[]>([]);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const initForm = (): UnitForm => ({
  unitCode: "",
  unitName: "",
  precisionScale: 0,
  status: "0",
  sort: 0,
});
const data = reactive<PageData<UnitForm, UnitQuery>>({
  form: initForm(),
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    unitCode: [
      { required: true, message: "单位编码不能为空", trigger: "blur" },
    ],
    unitName: [
      { required: true, message: "单位名称不能为空", trigger: "blur" },
    ],
    precisionScale: [
      { required: true, message: "小数精度不能为空", trigger: "change" },
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
    const r = await listUnit(queryParams.value);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryRef.value?.resetFields();
  handleQuery();
};
const selectionChange = (s: UnitVO[]) => {
  ids.value = s.map((x) => x.id);
  single.value = s.length !== 1;
  multiple.value = !s.length;
};
const handleAdd = () => {
  resetForm();
  showDialog("新增计量单位");
};
const handleUpdate = async (row?: UnitVO | Record<PropertyKey, any>) => {
  const id = row?.id ?? ids.value[0];
  if (!id) return;
  const r = await getUnitEditContext(id);
  resetForm();
  Object.assign(form.value, r.data);
  showDialog("修改计量单位");
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  submitting.value = true;
  try {
    await (form.value.id ? updateUnit(form.value) : addUnit(form.value));
    modal.msgSuccess("操作成功");
    closeDialog();
    await getList();
  } finally {
    submitting.value = false;
  }
};
const changeStatus = async (row: UnitVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await modal.confirm(
      `确认${status === "0" ? "启用" : "停用"}单位“${row.unitName}”吗？`,
    );
    await changeUnitStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const handleDelete = async (row?: UnitVO | Record<PropertyKey, any>) => {
  await modal.confirm("确认删除选中的计量单位吗？");
  await delUnit(row?.id ?? ids.value);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:unit",
  loadList: getList,
  openAdd: handleAdd,
  openEdit: (id) => handleUpdate({ id }),
  clearList: () => { closeDialog(); rows.value = []; total.value = 0; },
});
</script>
