<template>
  <div class="p-2 app-container project-page">
    <el-card v-show="showSearch" shadow="hover" class="mb-2">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="项目编码" prop="projectCode">
          <el-input
            v-model="queryParams.projectCode"
            clearable
            placeholder="请输入项目编码"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input
            v-model="queryParams.projectName"
            clearable
            placeholder="请输入项目名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="项目类型" prop="projectType">
          <el-select v-model="queryParams.projectType" clearable placeholder="请选择项目类型">
            <el-option v-for="dict in pm_project_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目负责人" prop="managerEmployeeId">
          <el-select v-model="queryParams.managerEmployeeId" clearable filterable placeholder="请选择负责人">
            <el-option
              v-for="employee in managerOptions"
              :key="employee.id"
              :label="employeeLabel(employee)"
              :value="employee.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" clearable placeholder="请选择状态">
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb-2">
          <el-col :span="1.5">
            <el-button v-hasPermi="['property:project:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['property:project:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['property:project:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['property:project:export']"
              type="warning"
              plain
              icon="Download"
              @click="handleExport"
            >
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="projectList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="项目编码" prop="projectCode" min-width="120" />
        <el-table-column label="项目名称" prop="projectName" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <el-button v-hasPermi="['property:project:query']" link type="primary" @click="handleDetail(scope.row)">
              {{ scope.row.projectName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="项目类型" prop="projectType" width="110">
          <template #default="scope"><dict-tag :options="pm_project_type" :value="scope.row.projectType" /></template>
        </el-table-column>
        <el-table-column label="项目负责人" min-width="150">
          <template #default="scope">
            {{
              scope.row.managerEmployeeName
                ? `${scope.row.managerEmployeeName}（${scope.row.managerEmployeeNo || '-'}）`
                : '-'
            }}
          </template>
        </el-table-column>
        <el-table-column label="行政区划" min-width="150" show-overflow-tooltip>
          <template #default="scope">{{ regionText(scope.row) || '-' }}</template>
        </el-table-column>
        <el-table-column label="服务电话" prop="servicePhone" width="130" />
        <el-table-column label="交付日期" prop="deliveryDate" width="115" />
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="scope">
            <el-switch
              v-hasPermi="['property:project:edit']"
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button
                v-hasPermi="['property:project:query']"
                link
                type="primary"
                icon="View"
                @click="handleDetail(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button
                v-hasPermi="['property:project:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['property:project:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              />
            </el-tooltip>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="900px" append-to-body>
      <el-form ref="projectFormRef" :model="form" :rules="rules" label-width="100px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目编码" prop="projectCode">
              <el-input v-model="form.projectCode" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="form.projectName" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目简称" prop="projectShortName">
              <el-input v-model="form.projectShortName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型" prop="projectType">
              <el-select v-model="form.projectType" clearable>
                <el-option v-for="dict in pm_project_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目负责人" prop="managerEmployeeId">
              <el-select v-model="form.managerEmployeeId" clearable filterable placeholder="请选择在职且启用的员工">
                <el-option
                  v-for="employee in managerOptions"
                  :key="employee.id"
                  :label="employeeLabel(employee)"
                  :value="employee.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务电话" prop="servicePhone">
              <el-input v-model="form.servicePhone" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交付日期" prop="deliveryDate">
              <el-date-picker v-model="form.deliveryDate" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启停状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">位置与地址</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份编码" prop="provinceCode">
              <el-input v-model="form.provinceCode" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市编码" prop="cityCode">
              <el-input v-model="form.cityCode" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县编码" prop="districtCode">
              <el-input v-model="form.districtCode" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="form.address" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number
                v-model="form.longitude"
                :min="-180"
                :max="180"
                :precision="7"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="form.latitude" :min="-90" :max="90" :precision="7" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="物业项目详情" width="850px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="项目编码">{{ detail.projectCode }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ detail.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目简称">{{ detail.projectShortName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">
          <dict-tag :options="pm_project_type" :value="detail.projectType" />
        </el-descriptions-item>
        <el-descriptions-item label="项目负责人">
          {{ detail.managerEmployeeName ? `${detail.managerEmployeeName}（${detail.managerEmployeeNo || '-'}）` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="服务电话">{{ detail.servicePhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="行政区划">{{ regionText(detail) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交付日期">{{ detail.deliveryDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址" :span="2">{{ detail.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ detail.longitude ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ detail.latitude ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="sys_normal_disable" :value="detail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="显示顺序">{{ detail.sort }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="Project" lang="ts">
import type { EmployeeOptionVO } from '@/api/hr/employee/types';
import type { ProjectForm, ProjectQuery, ProjectVO } from '@/api/property/project/types';
import { employeeOptions } from '@/api/hr/employee';
import {
  addProject,
  changeProjectStatus,
  delProject,
  getProject,
  listProject,
  updateProject
} from '@/api/property/project';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';

const { pm_project_type, sys_normal_disable } = toRefs<any>(useDict('pm_project_type', 'sys_normal_disable'));
const projectList = ref<ProjectVO[]>([]);
const managerOptions = ref<EmployeeOptionVO[]>([]);
const detail = ref<ProjectVO>();
const detailVisible = ref(false);
const total = ref(0);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<ProjectVO>(item => item.id);
const queryFormRef = ref<ElFormInstance>();
const projectFormRef = ref<ElFormInstance>();

const initFormData: ProjectForm = {
  id: undefined,
  projectCode: '',
  projectName: '',
  projectShortName: '',
  projectType: undefined,
  provinceCode: '',
  cityCode: '',
  districtCode: '',
  address: '',
  servicePhone: '',
  managerEmployeeId: undefined,
  deliveryDate: undefined,
  longitude: undefined,
  latitude: undefined,
  sort: 0,
  status: '0',
  remark: ''
};

const data = reactive<PageData<ProjectForm, ProjectQuery>>({
  form: { ...initFormData },
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    projectCode: [{ required: true, message: '项目编码不能为空', trigger: 'blur' }],
    projectName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '启停状态不能为空', trigger: 'change' }]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: projectFormRef,
  initialFormData: initFormData
});

const employeeLabel = (employee: EmployeeOptionVO) => `${employee.employeeName}（${employee.employeeNo}）`;
const regionText = (project: Partial<ProjectVO>) =>
  [project.provinceCode, project.cityCode, project.districtCode].filter(Boolean).join('/');
const loadManagerOptions = async () => {
  const res = await employeeOptions();
  managerOptions.value = res.data || [];
};
const getList = async () => {
  await withLoading(async () => {
    const res = await listProject(queryParams.value);
    projectList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
const handleAdd = () => openDialog('新增物业项目');
const handleUpdate = async (row?: Partial<ProjectVO>) => {
  resetForm();
  const id = row?.id || ids.value[0];
  if (!id) return;
  const res = await getProject(id);
  Object.assign(form.value, res.data);
  showDialog('修改物业项目');
};
const handleDetail = async (row: Partial<ProjectVO>) => {
  if (!row.id) return;
  const res = await getProject(row.id);
  detail.value = res.data;
  detailVisible.value = true;
};
const cancel = () => {
  closeDialog();
  resetForm();
};
const submitForm = () => {
  projectFormRef.value?.validate(async valid => {
    if (!valid) return;
    form.value.id ? await updateProject(form.value) : await addProject(form.value);
    modal.msgSuccess('操作成功');
    closeDialog();
    await getList();
  });
};
const handleDelete = async (row?: Partial<ProjectVO>) => {
  const projectIds = row?.id || ids.value;
  await modal.confirm(`是否确认删除物业项目“${row?.projectName || projectIds}”？`);
  await delProject(projectIds);
  modal.msgSuccess('删除成功');
  await getList();
};
const handleStatusChange = async (row: Partial<ProjectVO>) => {
  if (!row.id || !row.status) return;
  const targetStatus = row.status;
  try {
    await modal.confirm(`确认${targetStatus === '0' ? '启用' : '停用'}项目“${row.projectName}”吗？`);
    await changeProjectStatus(row.id, targetStatus);
    modal.msgSuccess('状态修改成功');
  } catch {
    row.status = targetStatus === '0' ? '1' : '0';
  }
};
const handleExport = () => {
  requestDownload('property/project/export', { ...queryParams.value }, `project_${Date.now()}.xlsx`);
};

onMounted(async () => {
  await Promise.all([loadManagerOptions(), getList()]);
});
</script>

<style lang="scss" scoped>
.project-page :deep(.el-select),
.project-page :deep(.el-date-editor) {
  width: 220px;
}

.project-page :deep(.el-input-number) {
  width: 100%;
}
</style>
