<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" shadow="hover" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline>
        <el-form-item label="所属公司"
          ><el-select v-model="queryParams.companyId" clearable filterable
            ><el-option
              v-for="c in queryCompanies"
              :key="c.deptId"
              :label="c.deptName"
              :value="c.deptId" /></el-select
        ></el-form-item>
        <el-form-item label="分类编码"
          ><el-input
            v-model="queryParams.categoryCode"
            clearable
            @keyup.enter="getList"
        /></el-form-item>
        <el-form-item label="分类名称"
          ><el-input
            v-model="queryParams.categoryName"
            clearable
            @keyup.enter="getList"
        /></el-form-item>
        <el-form-item label="状态"
          ><el-select v-model="queryParams.status" clearable
            ><el-option
              v-for="d in sys_normal_disable"
              :key="d.value"
              :label="d.label"
              :value="d.value" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" icon="Search" @click="getList"
            >搜索</el-button
          ><el-button icon="Refresh" @click="resetQuery"
            >重置</el-button
          ></el-form-item
        >
      </el-form></el-card
    >
    <el-card shadow="hover"
      ><template #header
        ><el-row :gutter="10"
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:materialCategory:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd()"
              >新增</el-button
            ></el-col
          ><right-toolbar v-if="canList"
            v-model:show-search="showSearch"
            @query-table="getList" /></el-row
      ></template>
      <el-table v-if="canList"
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        default-expand-all
      >
        <el-table-column
          label="分类名称"
          prop="categoryName"
          min-width="200"
        /><el-table-column
          label="分类编码"
          prop="categoryCode"
          width="150"
        /><el-table-column
          label="所属公司"
          prop="companyName"
          min-width="140"
        />
        <el-table-column label="排序" prop="sort" width="80" /><el-table-column
          label="状态"
          width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:materialCategory:edit']"
              active-value="0"
              inactive-value="1"
              @change="changeStatus(s.row)" /></template
        ></el-table-column>
        <el-table-column label="操作" width="180" fixed="right"
          ><template #default="s"
            ><el-button
              v-hasPermi="['warehouse:materialCategory:add']"
              link
              type="primary"
              @click="handleAdd(s.row)"
              >新增子类</el-button
            ><el-button
              v-hasPermi="['warehouse:materialCategory:edit']"
              link
              type="primary"
              @click="handleUpdate(s.row)"
              >修改</el-button
            ><el-button
              v-hasPermi="['warehouse:materialCategory:remove']"
              link
              type="danger"
              @click="handleDelete(s.row)"
              >删除</el-button
            ></template
          ></el-table-column
        >
      </el-table>
    </el-card>
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="620px"
      ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属公司" prop="companyId"
          ><el-select
            v-model="form.companyId"
            filterable
            :disabled="!!form.id"
            @change="companyChanged"
            ><el-option
              v-for="c in formCompanies"
              :key="c.deptId"
              :label="c.deptName"
              :value="c.deptId" /></el-select
        ></el-form-item>
        <el-form-item label="上级分类" prop="parentId"
          ><el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="treeProps"
            check-strictly
            default-expand-all
            :render-after-expand="false"
        /></el-form-item>
        <el-form-item label="分类编码" prop="categoryCode"
          ><el-input v-model="form.categoryCode" maxlength="64" /></el-form-item
        ><el-form-item label="分类名称" prop="categoryName"
          ><el-input v-model="form.categoryName" maxlength="128"
        /></el-form-item>
        <el-form-item label="状态"
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
          ><el-input v-model="form.remark" type="textarea" maxlength="500"
        /></el-form-item> </el-form
      ><template #footer
        ><el-button type="primary" :loading="submitting" @click="submit"
          >确定</el-button
        ><el-button @click="closeDialog">取消</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup name="MaterialCategory" lang="ts">
import {
  addMaterialCategory,
  changeMaterialCategoryStatus,
  delMaterialCategory,
  getMaterialCategoryEditContext,
  listMaterialCategory,
  materialCategoryMaintainCategoryOptions,
  materialCategoryMaintainCompanyOptions,
  materialCategoryQueryCompanyOptions,
  updateMaterialCategory,
} from "@/api/warehouse/materialCategory";
import type {
  MaterialCategoryForm,
  MaterialCategoryOptionVO,
  MaterialCategoryQuery,
  MaterialCategoryVO,
} from "@/api/warehouse/materialCategory/types";
import type { CompanyOptionVO } from "@/api/warehouse/material/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"));
const { showSearch } = useSearchToggle();
const rows = ref<MaterialCategoryVO[]>([]);
const queryCompanies = ref<CompanyOptionVO[]>([]);
const formCompanies = ref<CompanyOptionVO[]>([]);
const parentOptions = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const treeProps = { value: "id", label: "categoryName", children: "children" };
const initForm = (): MaterialCategoryForm => ({
  parentId: 0,
  categoryCode: "",
  categoryName: "",
  status: "0",
  sort: 0,
});
const data = reactive<PageData<MaterialCategoryForm, MaterialCategoryQuery>>({
  form: initForm(),
  queryParams: {},
  rules: {
    companyId: [
      { required: true, message: "所属公司不能为空", trigger: "change" },
    ],
    categoryCode: [
      { required: true, message: "分类编码不能为空", trigger: "blur" },
    ],
    categoryName: [
      { required: true, message: "分类名称不能为空", trigger: "blur" },
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
    const r = await listMaterialCategory(queryParams.value);
    rows.value = r.data || [];
  } finally {
    loading.value = false;
  }
};
const loadFormCompanies = async () => {
  const r = await materialCategoryMaintainCompanyOptions();
  formCompanies.value = r.data || [];
};
const loadQueryCompanies = async () => {
  try {
    const r = await materialCategoryQueryCompanyOptions();
    queryCompanies.value = r.data || [];
  } catch {
    modal.msgError("物料分类筛选的公司选项加载失败，列表数据仍可继续查询");
  }
};
const loadParents = async (companyId?: number | string) => {
  const r = await materialCategoryMaintainCategoryOptions(companyId);
  parentOptions.value = [
    { id: 0, categoryName: "顶级分类", children: r.data || [] },
  ];
};
const companyChanged = async () => {
  form.value.parentId = 0;
  await loadParents(form.value.companyId);
};
const resetQuery = () => {
  queryRef.value?.resetFields();
  getList();
};
const handleAdd = async (row?: MaterialCategoryVO | Record<PropertyKey, any>) => {
  resetForm();
  try {
    await loadFormCompanies();
  } catch {
    return modal.msgError("无物料分类维护所需的公司选项权限");
  }
  form.value.companyId = row?.companyId ?? formCompanies.value[0]?.deptId;
  form.value.parentId = row?.id ?? 0;
  await loadParents(form.value.companyId);
  showDialog(row ? "新增子分类" : "新增物料分类");
};
const handleUpdate = async (row: MaterialCategoryVO | Record<PropertyKey, any>) => {
  let r;
  try {
    [r] = await Promise.all([
      getMaterialCategoryEditContext(row.id),
      loadFormCompanies(),
      loadParents(row.companyId),
    ]);
  } catch {
    return modal.msgError("无物料分类维护所需的引用数据权限");
  }
  resetForm();
  Object.assign(form.value, r.data);
  showDialog("修改物料分类");
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  submitting.value = true;
  try {
    await (form.value.id
      ? updateMaterialCategory(form.value)
      : addMaterialCategory(form.value));
    modal.msgSuccess("操作成功");
    closeDialog();
    await getList();
  } finally {
    submitting.value = false;
  }
};
const changeStatus = async (row: MaterialCategoryVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await modal.confirm(
      `确认${status === "0" ? "启用" : "停用"}分类“${row.categoryName}”吗？`,
    );
    await changeMaterialCategoryStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const handleDelete = async (row: MaterialCategoryVO | Record<PropertyKey, any>) => {
  await modal.confirm(`确认删除分类“${row.categoryName}”吗？`);
  await delMaterialCategory(row.id);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:materialCategory",
  loadList: async () => { await Promise.allSettled([getList(), loadQueryCompanies()]); },
  openAdd: () => handleAdd(),
  openEdit: (id) => handleUpdate({ id }),
  clearList: () => { closeDialog(); rows.value = []; queryCompanies.value = []; },
});
</script>
