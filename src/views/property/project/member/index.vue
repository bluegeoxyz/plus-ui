<template>
  <div class="p-2 app-container project-member-page">
    <el-card v-show="showSearch" shadow="hover" class="mb-2">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="物业项目" prop="projectId">
          <el-select v-model="queryParams.projectId" clearable filterable placeholder="请选择项目">
            <el-option v-for="item in projectOptionList" :key="item.id" :label="projectLabel(item)" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="员工" prop="employeeId">
          <el-select v-model="queryParams.employeeId" clearable filterable placeholder="请选择员工">
            <el-option
              v-for="item in employeeOptionList"
              :key="item.id"
              :label="employeeLabel(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目角色" prop="memberRole">
          <el-select v-model="queryParams.memberRole" clearable placeholder="请选择角色">
            <el-option v-for="dict in pm_member_role" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="成员状态" prop="memberStatus">
          <el-select v-model="queryParams.memberStatus" clearable placeholder="请选择成员状态">
            <el-option v-for="dict in pm_member_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="isManager">
          <el-select v-model="queryParams.isManager" clearable placeholder="是否负责人">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="启停状态" prop="status">
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
            <el-button v-hasPermi="['property:projectMember:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增成员
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['property:projectMember:export']"
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

      <el-table v-loading="loading" border :data="memberList">
        <el-table-column label="物业项目" min-width="190" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.projectName }}（{{ scope.row.projectCode }}）</template>
        </el-table-column>
        <el-table-column label="员工" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <el-button
              v-hasPermi="['property:projectMember:query']"
              link
              type="primary"
              @click="handleDetail(scope.row)"
            >
              {{ scope.row.employeeName }}（{{ scope.row.employeeNo }}）
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="部门 / 岗位" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ [scope.row.deptName, scope.row.postName].filter(Boolean).join(' / ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="项目角色" prop="memberRole" width="125">
          <template #default="scope"><dict-tag :options="pm_member_role" :value="scope.row.memberRole" /></template>
        </el-table-column>
        <el-table-column label="负责人" prop="isManager" width="90" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isManager === '1'" type="danger">是</el-tag>
            <span v-else>否</span>
          </template>
        </el-table-column>
        <el-table-column label="开始日期" prop="startDate" width="110" />
        <el-table-column label="结束日期" prop="endDate" width="110">
          <template #default="scope">{{ scope.row.endDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="成员状态" prop="memberStatus" width="100">
          <template #default="scope"><dict-tag :options="pm_member_status" :value="scope.row.memberStatus" /></template>
        </el-table-column>
        <el-table-column label="启停状态" prop="status" width="100">
          <template #default="scope"><dict-tag :options="sys_normal_disable" :value="scope.row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button
                v-hasPermi="['property:projectMember:query']"
                link
                type="primary"
                icon="View"
                @click="handleDetail(scope.row)"
              />
            </el-tooltip>
            <template v-if="scope.row.memberStatus === 'ACTIVE'">
              <el-tooltip content="修改" placement="top">
                <el-button
                  v-hasPermi="['property:projectMember:edit']"
                  link
                  type="primary"
                  icon="Edit"
                  @click="handleUpdate(scope.row)"
                />
              </el-tooltip>
              <el-tooltip :content="scope.row.isManager === '1' ? '取消负责人' : '设为负责人'" placement="top">
                <el-button
                  v-hasPermi="['property:projectMember:edit']"
                  link
                  type="primary"
                  :icon="scope.row.isManager === '1' ? 'RemoveFilled' : 'UserFilled'"
                  @click="handleManager(scope.row)"
                />
              </el-tooltip>
              <el-tooltip content="移出项目" placement="top">
                <el-button
                  v-hasPermi="['property:projectMember:remove']"
                  link
                  type="danger"
                  icon="CircleClose"
                  @click="handleEnd(scope.row)"
                />
              </el-tooltip>
            </template>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body>
      <el-form ref="memberFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物业项目" prop="projectId">
              <el-select v-model="form.projectId" filterable :disabled="Boolean(form.id)" placeholder="请选择项目">
                <el-option
                  v-for="item in projectOptionList"
                  :key="item.id"
                  :label="projectLabel(item)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工" prop="employeeId">
              <el-select v-model="form.employeeId" filterable :disabled="Boolean(form.id)" placeholder="请选择员工">
                <el-option
                  v-for="item in employeeOptionList"
                  :key="item.id"
                  :label="employeeLabel(item)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目角色" prop="memberRole">
              <el-select v-model="form.memberRole" placeholder="请选择角色">
                <el-option v-for="dict in pm_member_role" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否负责人" prop="isManager">
              <el-radio-group v-model="form.isManager">
                <el-radio value="1">是</el-radio>
                <el-radio value="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" />
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
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="项目成员详情" width="680px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="物业项目" :span="2">
          {{ detail.projectName }}（{{ detail.projectCode }}）
        </el-descriptions-item>
        <el-descriptions-item label="员工">{{ detail.employeeName }}（{{ detail.employeeNo }}）</el-descriptions-item>
        <el-descriptions-item label="部门 / 岗位">
          {{ [detail.deptName, detail.postName].filter(Boolean).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="项目角色">
          <dict-tag :options="pm_member_role" :value="detail.memberRole" />
        </el-descriptions-item>
        <el-descriptions-item label="是否负责人">{{ detail.isManager === '1' ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detail.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ detail.endDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="成员状态">
          <dict-tag :options="pm_member_status" :value="detail.memberStatus" />
        </el-descriptions-item>
        <el-descriptions-item label="启停状态">
          <dict-tag :options="sys_normal_disable" :value="detail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="ProjectMember" lang="ts">
import type { EmployeeOptionVO } from '@/api/hr/employee/types';
import type { ProjectMemberForm, ProjectMemberQuery, ProjectMemberVO } from '@/api/property/project/member/types';
import type { ProjectOptionVO } from '@/api/property/project/types';
import { employeeOptions } from '@/api/hr/employee';
import { projectOptions } from '@/api/property/project';
import {
  addProjectMember,
  cancelProjectMemberManager,
  endProjectMember,
  getProjectMember,
  listProjectMember,
  setProjectMemberManager,
  updateProjectMember
} from '@/api/property/project/member';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';

const { pm_member_role, pm_member_status, sys_normal_disable } = toRefs<any>(
  useDict('pm_member_role', 'pm_member_status', 'sys_normal_disable')
);
const memberList = ref<ProjectMemberVO[]>([]);
const projectOptionList = ref<ProjectOptionVO[]>([]);
const employeeOptionList = ref<EmployeeOptionVO[]>([]);
const detail = ref<ProjectMemberVO>();
const detailVisible = ref(false);
const total = ref(0);
const submitLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const queryFormRef = ref<ElFormInstance>();
const memberFormRef = ref<ElFormInstance>();

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const initFormData = (): ProjectMemberForm => ({
  id: undefined,
  projectId: undefined,
  employeeId: undefined,
  memberRole: 'MEMBER',
  isManager: '0',
  startDate: localToday(),
  endDate: undefined,
  memberStatus: 'ACTIVE',
  sort: 0,
  status: '0',
  remark: ''
});
const data = reactive<PageData<ProjectMemberForm, ProjectMemberQuery>>({
  form: initFormData(),
  queryParams: { pageNum: 1, pageSize: 10, memberStatus: 'ACTIVE' },
  rules: {
    projectId: [{ required: true, message: '物业项目不能为空', trigger: 'change' }],
    employeeId: [{ required: true, message: '员工不能为空', trigger: 'change' }],
    memberRole: [{ required: true, message: '项目角色不能为空', trigger: 'change' }],
    startDate: [{ required: true, message: '开始日期不能为空', trigger: 'change' }]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: memberFormRef,
  initialFormData: initFormData()
});

const projectLabel = (item: ProjectOptionVO) => `${item.projectName}（${item.projectCode}）`;
const employeeLabel = (item: EmployeeOptionVO) => `${item.employeeName}（${item.employeeNo}）`;
const loadOptions = async () => {
  const [projects, employees] = await Promise.all([projectOptions(), employeeOptions()]);
  projectOptionList.value = projects.data || [];
  employeeOptionList.value = employees.data || [];
};
const getList = async () => {
  await withLoading(async () => {
    const res = await listProjectMember(queryParams.value);
    memberList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.memberStatus = 'ACTIVE';
  handleQuery();
};
const handleAdd = () => openDialog('新增项目成员');
const handleUpdate = async (row: Partial<ProjectMemberVO>) => {
  if (!row.id) return;
  resetForm();
  const res = await getProjectMember(row.id);
  Object.assign(form.value, res.data);
  showDialog('修改项目成员');
};
const handleDetail = async (row: Partial<ProjectMemberVO>) => {
  if (!row.id) return;
  const res = await getProjectMember(row.id);
  detail.value = res.data;
  detailVisible.value = true;
};
const cancel = () => {
  closeDialog();
  resetForm();
};
const submitForm = () => {
  memberFormRef.value?.validate(async valid => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      form.value.id ? await updateProjectMember(form.value) : await addProjectMember(form.value);
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    } finally {
      submitLoading.value = false;
    }
  });
};
const handleManager = async (row: Partial<ProjectMemberVO>) => {
  if (!row.id) return;
  const isCancel = row.isManager === '1';
  await modal.confirm(`确认${isCancel ? '取消' : '设置'}“${row.employeeName}”为项目负责人吗？`);
  isCancel ? await cancelProjectMemberManager(row.id) : await setProjectMemberManager(row.id);
  modal.msgSuccess('操作成功');
  await getList();
};
const handleEnd = async (row: Partial<ProjectMemberVO>) => {
  if (!row.id) return;
  await modal.confirm(`确认将“${row.employeeName}”移出“${row.projectName}”吗？成员历史将被保留。`);
  await endProjectMember(row.id);
  modal.msgSuccess('已移出项目');
  await getList();
};
const handleExport = () => {
  requestDownload('property/project/member/export', { ...queryParams.value }, `project_member_${Date.now()}.xlsx`);
};

onMounted(async () => {
  await Promise.all([loadOptions(), getList()]);
});
</script>

<style lang="scss" scoped>
.project-member-page :deep(.el-select),
.project-member-page :deep(.el-date-editor) {
  width: 220px;
}

.project-member-page :deep(.el-input-number) {
  width: 100%;
}
</style>
