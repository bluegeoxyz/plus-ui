<template>
  <div class="p-2 app-container employee-page">
    <el-card v-show="showSearch" shadow="hover" class="mb-2">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="员工编号" prop="employeeNo">
          <el-input
            v-model="queryParams.employeeNo"
            clearable
            placeholder="请输入员工编号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="employeeName">
          <el-input
            v-model="queryParams.employeeName"
            clearable
            placeholder="请输入员工姓名"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptId">
          <el-tree-select
            v-model="queryParams.deptId"
            :data="deptOptions"
            :props="treeProps"
            value-key="id"
            check-strictly
            clearable
            placeholder="请选择部门"
            @change="handleQueryDeptChange"
          />
        </el-form-item>
        <el-form-item label="主岗位" prop="postId">
          <el-select v-model="queryParams.postId" clearable placeholder="请选择岗位" :disabled="!queryParams.deptId">
            <el-option
              v-for="post in queryPostOptions"
              :key="post.postId"
              :label="post.postName"
              :value="post.postId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用工类型" prop="employmentType">
          <el-select v-model="queryParams.employmentType" clearable placeholder="请选择用工类型">
            <el-option v-for="dict in hr_employment_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="员工状态" prop="employmentStatus">
          <el-select v-model="queryParams.employmentStatus" clearable placeholder="请选择员工状态">
            <el-option v-for="dict in hr_employment_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="启停状态" prop="status">
          <el-select v-model="queryParams.status" clearable placeholder="请选择状态">
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号码" prop="mobile">
          <el-input v-model="queryParams.mobile" clearable placeholder="请输入手机号码" @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['hr:employee:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['hr:employee:edit']"
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
              v-hasPermi="['hr:employee:remove']"
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
            <el-button v-hasPermi="['hr:employee:export']" type="warning" plain icon="Download" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="employeeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="员工编号" prop="employeeNo" min-width="110" />
        <el-table-column label="员工姓名" prop="employeeName" min-width="100">
          <template #default="scope">
            <el-button v-hasPermi="['hr:employee:query']" link type="primary" @click="handleDetail(scope.row)">
              {{ scope.row.employeeName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="部门" prop="deptName" min-width="120" show-overflow-tooltip />
        <el-table-column label="岗位" prop="postName" min-width="110" show-overflow-tooltip />
        <el-table-column label="手机号码" prop="mobile" min-width="130" />
        <el-table-column label="用工类型" prop="employmentType" min-width="100">
          <template #default="scope">
            <dict-tag :options="hr_employment_type" :value="scope.row.employmentType" />
          </template>
        </el-table-column>
        <el-table-column label="员工状态" prop="employmentStatus" min-width="100">
          <template #default="scope">
            <dict-tag :options="hr_employment_status" :value="scope.row.employmentStatus" />
          </template>
        </el-table-column>
        <el-table-column label="系统账号" min-width="180">
          <template #default="scope">
            <div v-if="scope.row.userId" class="account-cell">
              <span>{{ scope.row.userName }} / {{ scope.row.nickName || '-' }}</span>
              <el-tag v-if="scope.row.userStatus === '1'" type="danger" size="small">已停用</el-tag>
              <el-tag v-if="scope.row.employmentStatus === 'LEFT'" type="warning" size="small">已离职 / 仍绑定</el-tag>
            </div>
            <el-tag v-else type="info">未绑定</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="scope">
            <el-switch
              v-hasPermi="['hr:employee:edit']"
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="入职日期" prop="entryDate" width="115" />
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button
                v-hasPermi="['hr:employee:query']"
                link
                type="primary"
                icon="View"
                @click="handleDetail(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button
                v-hasPermi="['hr:employee:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['hr:employee:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              />
            </el-tooltip>
            <el-tooltip
              v-if="!scope.row.userId"
              :content="scope.row.employmentStatus === 'LEFT' || scope.row.status === '1' ? '离职或停用员工不能绑定账号' : '绑定账号'"
              placement="top"
            >
              <el-button
                v-hasPermi="['hr:employee:bindUser']"
                link
                type="primary"
                icon="Link"
                :disabled="scope.row.employmentStatus === 'LEFT' || scope.row.status === '1'"
                @click="handleOpenBind(scope.row)"
              />
            </el-tooltip>
            <el-tooltip v-else content="解绑账号" placement="top">
              <el-button
                v-hasPermi="['hr:employee:bindUser']"
                link
                type="danger"
                icon="Connection"
                @click="handleUnbind(scope.row)"
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="860px" append-to-body>
      <el-form ref="employeeFormRef" :model="form" :rules="rules" label-width="100px">
        <el-divider content-position="left">任职信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工编号" prop="employeeNo">
              <el-input v-model="form.employeeNo" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeName">
              <el-input v-model="form.employeeName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptOptions"
                :props="treeProps"
                value-key="id"
                check-strictly
                @change="handleFormDeptChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主岗位" prop="postId">
              <el-select v-model="form.postId" clearable :disabled="!form.deptId" placeholder="请选择岗位">
                <el-option
                  v-for="post in formPostOptions"
                  :key="post.postId"
                  :label="post.postName"
                  :value="post.postId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用工类型" prop="employmentType">
              <el-select v-model="form.employmentType" clearable>
                <el-option
                  v-for="dict in hr_employment_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工状态" prop="employmentStatus">
              <el-select v-model="form.employmentStatus">
                <el-option
                  v-for="dict in hr_employment_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entryDate">
              <el-date-picker v-model="form.entryDate" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="离职日期" prop="leaveDate">
              <el-date-picker v-model="form.leaveDate" type="date" value-format="YYYY-MM-DD" />
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
        <el-divider content-position="left">个人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" clearable>
                <el-option v-for="dict in sys_user_gender" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="mobile">
              <el-input v-model="form.mobile" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email"><el-input v-model="form.email" maxlength="128" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件类型" prop="idType">
              <el-select v-model="form.idType" clearable>
                <el-option v-for="dict in zbm_id_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号码" prop="idNo"><el-input v-model="form.idNo" maxlength="64" /></el-form-item>
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

    <el-dialog v-model="detailVisible" title="员工档案详情" width="820px" append-to-body>
      <template v-if="detail">
        <el-descriptions title="任职信息" :column="2" border>
          <el-descriptions-item label="员工编号">{{ detail.employeeNo }}</el-descriptions-item>
          <el-descriptions-item label="员工姓名">{{ detail.employeeName }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ detail.deptName }}</el-descriptions-item>
          <el-descriptions-item label="主岗位">{{ detail.postName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用工类型">
            <dict-tag :options="hr_employment_type" :value="detail.employmentType" />
          </el-descriptions-item>
          <el-descriptions-item label="员工状态">
            <dict-tag :options="hr_employment_status" :value="detail.employmentStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="入职日期">{{ detail.entryDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="离职日期">{{ detail.leaveDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绑定账号">
            <template v-if="detail.userId">
              {{ detail.userName }} / {{ detail.nickName || '-' }}
              <el-tag v-if="detail.userStatus === '1'" type="danger" size="small" class="ml-2">账号已停用</el-tag>
            </template>
            <template v-else>未绑定</template>
          </el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <dict-tag v-if="detail.userId" :options="sys_normal_disable" :value="detail.userStatus" />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="启停状态">
            <dict-tag :options="sys_normal_disable" :value="detail.status" />
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions title="个人信息" :column="2" border class="mt-4">
          <el-descriptions-item label="性别">
            <dict-tag :options="sys_user_gender" :value="detail.gender" />
          </el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ detail.birthDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ detail.mobile || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detail.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">
            <dict-tag :options="zbm_id_type" :value="detail.idType" />
          </el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ detail.idNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <el-dialog v-model="bindDialogVisible" title="绑定系统账号" width="820px" append-to-body>
      <el-descriptions v-if="bindingEmployee" :column="2" border class="mb-4">
        <el-descriptions-item label="员工">{{ bindingEmployee.employeeNo }} {{ bindingEmployee.employeeName }}</el-descriptions-item>
        <el-descriptions-item label="当前部门">{{ bindingEmployee.deptName || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="账号搜索">
          <el-select v-model="userSearchType" style="width: 120px">
            <el-option label="用户名" value="userName" />
            <el-option label="昵称" value="nickName" />
            <el-option label="手机号" value="phoneNumber" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="userSearchKeyword" clearable placeholder="请输入搜索内容" @keyup.enter="handleUserSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleUserSearch">搜索</el-button>
          <el-button icon="Refresh" @click="resetUserSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="userOptionsLoading" :data="userOptions" border height="330">
        <el-table-column label="选择" width="70" align="center">
          <template #default="scope">
            <el-radio v-model="selectedUserId" :value="scope.row.userId" :disabled="scope.row.bound">
              <span />
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="用户名" prop="userName" min-width="120" />
        <el-table-column label="昵称" prop="nickName" min-width="120" />
        <el-table-column label="部门" prop="deptName" min-width="130" show-overflow-tooltip />
        <el-table-column label="账号状态" width="100" align="center">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="绑定状态" width="105" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.bound" type="info">已被占用</el-tag>
            <el-tag v-else type="success">可绑定</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="userOptionsTotal > 0"
        v-model:page="userOptionQuery.pageNum"
        v-model:limit="userOptionQuery.pageSize"
        :total="userOptionsTotal"
        @pagination="loadUserOptions"
      />
      <el-alert
        v-if="selectedUser"
        class="mt-3"
        :closable="false"
        type="info"
        :title="`已选择：${selectedUser.userName} / ${selectedUser.nickName || '-'}，${selectedUser.status === '1' ? '账号已停用（仍允许绑定）' : '账号正常'}`"
      />
      <template #footer>
        <el-button type="primary" :disabled="!selectedUserId" @click="submitBind">确认绑定</el-button>
        <el-button @click="bindDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Employee" lang="ts">
import type {
  EmployeeForm,
  EmployeeQuery,
  EmployeeUserOptionQuery,
  EmployeeUserOptionVO,
  EmployeeVO
} from '@/api/hr/employee/types';
import type { DeptTreeVO } from '@/api/system/dept/types';
import type { PostVO } from '@/api/system/post/types';
import {
  addEmployee,
  bindEmployeeUser,
  changeEmployeeStatus,
  delEmployee,
  employeeDeptTree,
  employeePostOptions,
  getEmployee,
  getEmployeeUserOptions,
  listEmployee,
  unbindEmployeeUser,
  updateEmployee
} from '@/api/hr/employee';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';

const { hr_employment_type, hr_employment_status, zbm_id_type, sys_user_gender, sys_normal_disable } = toRefs<any>(
  useDict('hr_employment_type', 'hr_employment_status', 'zbm_id_type', 'sys_user_gender', 'sys_normal_disable')
);
const treeProps = { value: 'id', label: 'label', children: 'children' };
const employeeList = ref<EmployeeVO[]>([]);
const deptOptions = ref<DeptTreeVO[]>([]);
const queryPostOptions = ref<PostVO[]>([]);
const formPostOptions = ref<PostVO[]>([]);
const detail = ref<EmployeeVO>();
const detailVisible = ref(false);
const bindDialogVisible = ref(false);
const bindingEmployee = ref<Partial<EmployeeVO>>();
const userOptions = ref<EmployeeUserOptionVO[]>([]);
const userOptionsTotal = ref(0);
const userOptionsLoading = ref(false);
const selectedUserId = ref<number | string>();
const userSearchType = ref<'userName' | 'nickName' | 'phoneNumber'>('userName');
const userSearchKeyword = ref('');
const userOptionQuery = reactive<EmployeeUserOptionQuery>({ pageNum: 1, pageSize: 10 });
const selectedUser = computed(() => userOptions.value.find(user => user.userId === selectedUserId.value));
const total = ref(0);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<EmployeeVO>(item => item.id);
const queryFormRef = ref<ElFormInstance>();
const employeeFormRef = ref<ElFormInstance>();

const initFormData: EmployeeForm = {
  id: undefined,
  employeeNo: '',
  employeeName: '',
  deptId: undefined,
  postId: undefined,
  gender: undefined,
  mobile: '',
  email: '',
  idType: undefined,
  idNo: '',
  birthDate: undefined,
  entryDate: undefined,
  leaveDate: undefined,
  employmentType: undefined,
  employmentStatus: 'ACTIVE',
  sort: 0,
  status: '0',
  remark: ''
};

const data = reactive<PageData<EmployeeForm, EmployeeQuery>>({
  form: { ...initFormData },
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {
    employeeNo: [{ required: true, message: '员工编号不能为空', trigger: 'blur' }],
    employeeName: [{ required: true, message: '员工姓名不能为空', trigger: 'blur' }],
    deptId: [{ required: true, message: '所属部门不能为空', trigger: 'change' }],
    employmentStatus: [{ required: true, message: '员工状态不能为空', trigger: 'change' }],
    status: [{ required: true, message: '启停状态不能为空', trigger: 'change' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: employeeFormRef,
  initialFormData: initFormData
});

const loadPosts = async (deptId: number | string | undefined, target: Ref<PostVO[]>) => {
  if (!deptId) {
    target.value = [];
    return;
  }
  const res = await employeePostOptions(deptId);
  target.value = res.data || [];
};
const getList = async () => {
  await withLoading(async () => {
    const res = await listEmployee(queryParams.value);
    employeeList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryPostOptions.value = [];
  handleQuery();
};
const handleQueryDeptChange = async () => {
  queryParams.value.postId = undefined;
  await loadPosts(queryParams.value.deptId, queryPostOptions);
};
const handleFormDeptChange = async () => {
  form.value.postId = undefined;
  await loadPosts(form.value.deptId, formPostOptions);
};
const handleAdd = () => {
  formPostOptions.value = [];
  openDialog('新增员工档案');
};
const handleUpdate = async (row?: Partial<EmployeeVO>) => {
  resetForm();
  const id = row?.id || ids.value[0];
  if (!id) return;
  const res = await getEmployee(id);
  Object.assign(form.value, res.data);
  await loadPosts(form.value.deptId, formPostOptions);
  showDialog('修改员工档案');
};
const handleDetail = async (row: Partial<EmployeeVO>) => {
  if (!row.id) return;
  const res = await getEmployee(row.id);
  detail.value = res.data;
  detailVisible.value = true;
};
const loadUserOptions = async () => {
  userOptionsLoading.value = true;
  try {
    const res = await getEmployeeUserOptions(userOptionQuery);
    userOptions.value = res.data?.rows || [];
    userOptionsTotal.value = res.data?.total || 0;
  } finally {
    userOptionsLoading.value = false;
  }
};
const applyUserSearch = () => {
  userOptionQuery.userName = undefined;
  userOptionQuery.nickName = undefined;
  userOptionQuery.phoneNumber = undefined;
  const keyword = userSearchKeyword.value.trim();
  if (keyword) userOptionQuery[userSearchType.value] = keyword;
};
const handleUserSearch = async () => {
  applyUserSearch();
  userOptionQuery.pageNum = 1;
  selectedUserId.value = undefined;
  await loadUserOptions();
};
const resetUserSearch = async () => {
  userSearchType.value = 'userName';
  userSearchKeyword.value = '';
  await handleUserSearch();
};
const handleOpenBind = async (row: Partial<EmployeeVO>) => {
  if (!row.id) return;
  bindingEmployee.value = row;
  selectedUserId.value = undefined;
  userSearchType.value = 'userName';
  userSearchKeyword.value = '';
  Object.assign(userOptionQuery, { pageNum: 1, pageSize: 10, userName: undefined, nickName: undefined, phoneNumber: undefined });
  bindDialogVisible.value = true;
  await loadUserOptions();
};
const submitBind = async () => {
  if (!bindingEmployee.value?.id || !selectedUserId.value) return;
  await bindEmployeeUser(bindingEmployee.value.id, { userId: selectedUserId.value });
  modal.msgSuccess('账号绑定成功');
  bindDialogVisible.value = false;
  await getList();
};
const handleUnbind = async (row: Partial<EmployeeVO>) => {
  if (!row.id) return;
  await modal.confirm(`确认解除员工“${row.employeeName}”与系统账号“${row.userName}”的绑定关系？`);
  await unbindEmployeeUser(row.id);
  modal.msgSuccess('账号解绑成功');
  await getList();
};
const cancel = () => {
  closeDialog();
  resetForm();
};
const submitForm = () => {
  employeeFormRef.value?.validate(async valid => {
    if (!valid) return;
    form.value.id ? await updateEmployee(form.value) : await addEmployee(form.value);
    modal.msgSuccess('操作成功');
    closeDialog();
    await getList();
  });
};
const handleDelete = async (row?: Partial<EmployeeVO>) => {
  const employeeIds = row?.id || ids.value;
  await modal.confirm(`是否确认删除员工档案“${row?.employeeName || employeeIds}”？`);
  await delEmployee(employeeIds);
  modal.msgSuccess('删除成功');
  await getList();
};
const handleStatusChange = async (row: Partial<EmployeeVO>) => {
  if (!row.id || !row.status) return;
  const targetStatus = row.status;
  try {
    await modal.confirm(`确认${targetStatus === '0' ? '启用' : '停用'}员工“${row.employeeName}”吗？`);
    await changeEmployeeStatus(row.id, targetStatus);
    modal.msgSuccess('状态修改成功');
  } catch {
    row.status = targetStatus === '0' ? '1' : '0';
  }
};
const handleExport = () => {
  requestDownload('hr/employee/export', { ...queryParams.value }, `employee_${Date.now()}.xlsx`);
};

onMounted(async () => {
  const res = await employeeDeptTree();
  deptOptions.value = res.data || [];
  await getList();
});
</script>

<style lang="scss" scoped>
.employee-page :deep(.el-select),
.employee-page :deep(.el-tree-select),
.employee-page :deep(.el-date-editor) {
  width: 220px;
}

.account-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>
