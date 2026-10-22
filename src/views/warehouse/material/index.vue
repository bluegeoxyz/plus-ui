<template>
  <div class="p-2">
    <el-card v-if="canList" v-show="showSearch" shadow="hover" class="mb-2"
      ><el-form ref="queryRef" :model="queryParams" inline
        ><el-form-item label="所属公司"
          ><el-select
            v-model="queryParams.companyId"
            clearable
            filterable
            @change="queryCompanyChanged"
            ><el-option
              v-for="c in queryCompanies"
              :key="c.deptId"
              :label="c.deptName"
              :value="c.deptId" /></el-select></el-form-item
        ><el-form-item label="物料分类"
          ><el-tree-select
            v-model="queryParams.categoryId"
            :data="queryCategories"
            :props="treeProps"
            clearable
            check-strictly /></el-form-item
        ><el-form-item label="物料编码"
          ><el-input
            v-model="queryParams.materialCode"
            clearable
            @keyup.enter="handleQuery" /></el-form-item
        ><el-form-item label="物料名称"
          ><el-input
            v-model="queryParams.materialName"
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
              v-hasPermi="['warehouse:material:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              >新增</el-button
            ></el-col
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:material:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
              >修改</el-button
            ></el-col
          ><el-col :span="1.5"
            ><el-button
              v-hasPermi="['warehouse:material:remove']"
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
          label="物料编码"
          prop="materialCode"
          width="140" /><el-table-column
          label="物料名称"
          prop="materialName"
          min-width="150" /><el-table-column
          label="分类"
          prop="categoryName"
          min-width="130" /><el-table-column
          label="规格"
          prop="specification"
          min-width="130" /><el-table-column
          label="型号"
          prop="model"
          width="120" /><el-table-column label="基础单位" min-width="100"
          ><template #default="s"
            >{{ s.row.baseUnitName
            }}<span v-if="s.row.baseUnitSymbol"
              >（{{ s.row.baseUnitSymbol }}）</span
            ></template
          ></el-table-column
        ><el-table-column
          label="条码"
          prop="barcode"
          width="150" /><el-table-column
          label="安全库存"
          prop="safetyStock"
          width="110" /><el-table-column
          label="所属公司"
          prop="companyName"
          min-width="140" /><el-table-column label="状态" width="90"
          ><template #default="s"
            ><el-switch
              v-model="s.row.status"
              v-hasPermi="['warehouse:material:edit']"
              active-value="0"
              inactive-value="1"
              @change="changeStatus(s.row)" /></template></el-table-column
        ><el-table-column label="操作" width="120" fixed="right"
          ><template #default="s"
            ><el-button
              v-hasPermi="['warehouse:material:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(s.row)" /><el-button
              v-hasPermi="['warehouse:material:remove']"
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
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px"
      ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
        ><el-row :gutter="16"
          ><el-col :span="12"
            ><el-form-item label="所属公司" prop="companyId"
              ><el-select
                v-model="form.companyId"
                filterable
                @change="formCompanyChanged"
                ><el-option
                  v-for="c in formCompanies"
                  :key="c.deptId"
                  :label="c.deptName"
                  :value="c.deptId" /></el-select></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="物料分类" prop="categoryId"
              ><el-tree-select
                v-model="form.categoryId"
                :data="formCategories"
                :props="treeProps"
                check-strictly
                default-expand-all /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="物料编码" prop="materialCode"
              ><el-input
                v-model="form.materialCode"
                maxlength="64" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="物料名称" prop="materialName"
              ><el-input
                v-model="form.materialName"
                maxlength="128" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="规格"
              ><el-input
                v-model="form.specification"
                maxlength="255" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="型号"
              ><el-input
                v-model="form.model"
                maxlength="128" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="基础单位" prop="baseUnitId"
              ><el-select v-model="form.baseUnitId" filterable
                ><el-option
                  v-for="u in units"
                  :key="u.id"
                  :label="`${u.unitName}${u.symbol ? ` (${u.symbol})` : ''}`"
                  :value="u.id" /></el-select></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="条码"
              ><el-input
                v-model="form.barcode"
                maxlength="128" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="安全库存" prop="safetyStock"
              ><el-input-number
                v-model="form.safetyStock"
                :min="0"
                :precision="selectedPrecision" /></el-form-item></el-col
          ><el-col :span="12"
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
          ><el-col :span="12"
            ><el-form-item label="排序"
              ><el-input-number
                v-model="form.sort"
                :min="0" /></el-form-item></el-col
          ><el-col :span="24"
            ><el-form-item label="备注"
              ><el-input
                v-model="form.remark"
                type="textarea"
                maxlength="500" /></el-form-item></el-col></el-row></el-form
      ><template #footer
        ><el-button type="primary" :loading="submitting" @click="submit"
          >确定</el-button
        ><el-button @click="closeDialog">取消</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup name="Material" lang="ts">
import {
  addMaterial,
  changeMaterialStatus,
  delMaterial,
  getMaterialEditContext,
  listMaterial,
  materialMaintainCategoryOptions,
  materialMaintainCompanyOptions,
  materialMaintainUnitOptions,
  materialQueryCategoryOptions,
  materialQueryCompanyOptions,
  updateMaterial,
} from "@/api/warehouse/material";
import type {
  CompanyOptionVO,
  MaterialForm,
  MaterialQuery,
  MaterialVO,
} from "@/api/warehouse/material/types";
import type { MaterialCategoryOptionVO } from "@/api/warehouse/materialCategory/types";
import type { UnitOptionVO } from "@/api/warehouse/unit/types";
import { useFormDialog } from "@/hooks/dialog/useFormDialog";
import { useSearchToggle } from "@/hooks/form/useSearchToggle";
import modal from "@/plugins/modal";
import { useDict } from "@/utils/dict";
import { useWarehousePageMode } from "@/views/warehouse/useWarehousePageMode";
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"));
const { showSearch } = useSearchToggle();
const rows = ref<MaterialVO[]>([]);
const queryCompanies = ref<CompanyOptionVO[]>([]);
const formCompanies = ref<CompanyOptionVO[]>([]);
const queryCategories = ref<MaterialCategoryOptionVO[]>([]);
const formCategories = ref<MaterialCategoryOptionVO[]>([]);
const units = ref<UnitOptionVO[]>([]);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);
const queryRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const treeProps = { value: "id", label: "categoryName", children: "children" };
const initForm = (): MaterialForm => ({
  materialCode: "",
  materialName: "",
  safetyStock: 0,
  status: "0",
  sort: 0,
});
const data = reactive<PageData<MaterialForm, MaterialQuery>>({
  form: initForm(),
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    companyId: [
      { required: true, message: "所属公司不能为空", trigger: "change" },
    ],
    materialCode: [
      { required: true, message: "物料编码不能为空", trigger: "blur" },
    ],
    materialName: [
      { required: true, message: "物料名称不能为空", trigger: "blur" },
    ],
    categoryId: [
      { required: true, message: "物料分类不能为空", trigger: "change" },
    ],
    baseUnitId: [
      { required: true, message: "基础单位不能为空", trigger: "change" },
    ],
    safetyStock: [
      { required: true, message: "安全库存不能为空", trigger: "change" },
    ],
  },
});
const { form, queryParams, rules } = toRefs(data);
const { dialog, resetForm, showDialog, closeDialog } = useFormDialog({
  form,
  formRef,
  initialFormData: initForm(),
});
const selectedPrecision = computed(
  () =>
    units.value.find((u) => u.id === form.value.baseUnitId)?.precisionScale ??
    6,
);
const getList = async () => {
  if (!canList.value) return;
  loading.value = true;
  try {
    const r = await listMaterial(queryParams.value);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const loadFormBaseOptions = async () => {
  const [c, u] = await Promise.all([
    materialMaintainCompanyOptions(),
    materialMaintainUnitOptions(),
  ]);
  formCompanies.value = c.data || [];
  units.value = u.data || [];
};
const loadQueryCompanies = async () => {
  try {
    const c = await materialQueryCompanyOptions();
    queryCompanies.value = c.data || [];
  } catch {
    modal.msgError("物料筛选的公司选项加载失败，列表数据仍可继续查询");
  }
};
const queryCompanyChanged = async () => {
  queryParams.value.categoryId = undefined;
  try {
    const r = await materialQueryCategoryOptions(queryParams.value.companyId);
    queryCategories.value = r.data || [];
  } catch {
    queryCategories.value = [];
    modal.msgError("物料筛选的分类选项加载失败，列表数据仍可继续查询");
  }
};
const formCompanyChanged = async () => {
  form.value.categoryId = undefined;
  const r = await materialMaintainCategoryOptions(form.value.companyId);
  formCategories.value = r.data || [];
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = async () => {
  queryRef.value?.resetFields();
  await queryCompanyChanged();
  handleQuery();
};
const selectionChange = (s: MaterialVO[]) => {
  ids.value = s.map((x) => x.id);
  single.value = s.length !== 1;
  multiple.value = !s.length;
};
const handleAdd = async () => {
  resetForm();
  try {
    await loadFormBaseOptions();
  } catch {
    return modal.msgError("无物料维护所需的公司或计量单位选项权限");
  }
  form.value.companyId = formCompanies.value[0]?.deptId;
  await formCompanyChanged();
  showDialog("新增物料");
};
const handleUpdate = async (row?: MaterialVO | Record<PropertyKey, any>) => {
  const id = row?.id ?? ids.value[0];
  if (!id) return;
  let r;
  try {
    [r] = await Promise.all([getMaterialEditContext(id), loadFormBaseOptions()]);
  } catch {
    return modal.msgError("无物料维护所需的公司或计量单位选项权限");
  }
  resetForm();
  Object.assign(form.value, r.data);
  const c = await materialMaintainCategoryOptions(form.value.companyId);
  formCategories.value = c.data || [];
  showDialog("修改物料");
};
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  submitting.value = true;
  try {
    await (form.value.id
      ? updateMaterial(form.value)
      : addMaterial(form.value));
    modal.msgSuccess("操作成功");
    closeDialog();
    await getList();
  } finally {
    submitting.value = false;
  }
};
const changeStatus = async (row: MaterialVO | Record<PropertyKey, any>) => {
  const status = row.status;
  try {
    await modal.confirm(
      `确认${status === "0" ? "启用" : "停用"}物料“${row.materialName}”吗？`,
    );
    await changeMaterialStatus({ id: row.id, status });
  } catch {
    row.status = status === "0" ? "1" : "0";
  }
};
const handleDelete = async (row?: MaterialVO | Record<PropertyKey, any>) => {
  await modal.confirm("确认删除选中的物料吗？");
  await delMaterial(row?.id ?? ids.value);
  modal.msgSuccess("删除成功");
  getList();
};
const { canList } = useWarehousePageMode({
  permissionPrefix: "warehouse:material",
  loadList: async () => { await Promise.allSettled([getList(), loadQueryCompanies(), queryCompanyChanged()]); },
  openAdd: handleAdd,
  openEdit: (id) => handleUpdate({ id }),
  clearList: () => { closeDialog(); rows.value = []; total.value = 0; queryCompanies.value = []; queryCategories.value = []; },
});
</script>
