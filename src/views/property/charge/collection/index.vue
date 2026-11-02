<template>
  <div class="p-2">
    <el-alert title="提交审核不代表财务已确认到账或正式核销。" type="info" :closable="false" class="mb-3" />
    <el-empty v-if="!projectId" description="请先选择物业工作项目" />
    <template v-else>
      <el-card class="mb-3">
        <el-form inline @submit.prevent="search">
          <el-form-item label="登记单号"><el-input v-model="query.registrationNo" clearable /></el-form-item>
          <el-form-item label="房屋"><el-input v-model="query.roomKeyword" clearable /></el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" clearable class="w-40">
              <el-option v-for="(label, key) in labels" :key="key" :value="key" :label="label" />
            </el-select>
          </el-form-item>
          <el-form-item label="收款日期">
            <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-button v-hasPermi="['property:collectionRegistration:list']" type="primary" @click="search">
            查询
          </el-button>
          <el-button v-hasPermi="['property:collectionRegistration:add']" @click="openCreate">新建登记</el-button>
        </el-form>
      </el-card>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column label="登记单号" prop="registrationNo" min-width="190" />
        <el-table-column label="房屋" prop="roomFullNameSnapshot" />
        <el-table-column label="付款人" prop="payerNameSnapshot" />
        <el-table-column label="登记金额" prop="registeredAmount" />
        <el-table-column label="收款时间" prop="paymentTime" min-width="170" />
        <el-table-column label="状态">
          <template #default="s">{{ labels[s.row.status as Status] }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="s">
            <el-button
              v-hasPermi="['property:collectionRegistration:query']"
              link
              @click="showDetail(s.row as Registration)"
            >
              详情
            </el-button>
            <template v-if="editable(s.row as Registration)">
              <el-button
                v-hasPermi="['property:collectionRegistration:edit']"
                link
                @click="openEdit(s.row as Registration)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['property:collectionRegistration:submit']"
                link
                :disabled="busy"
                @click="submitRow(s.row as Registration)"
              >
                提交
              </el-button>
              <el-button
                v-hasPermi="['property:collectionRegistration:cancel']"
                link
                type="danger"
                :disabled="busy"
                @click="cancelRow(s.row as Registration)"
              >
                取消
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="load"
      />
    </template>
    <el-dialog
      v-model="dialog"
      :title="editing ? '编辑收款登记' : '新建收款登记'"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" :disabled="busy">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属项目"><el-input :model-value="store.currentProjectName" disabled /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房屋" required>
              <el-select
                v-model="form.roomId"
                filterable
                remote
                :remote-method="searchRooms"
                :disabled="Boolean(editing && (editing.status !== 'DRAFT' || editing.firstSubmittedAt))"
                @change="roomChanged"
              >
                <el-option v-for="r in rooms" :key="r.id" :value="r.id" :label="r.label" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-table v-loading="debtLoading" :data="debts" border max-height="280">
          <el-table-column label="本次选择" width="90">
            <template #default="s">
              <el-checkbox :model-value="selected(s.row.id)" @change="toggle(s.row as Receivable, Boolean($event))" />
            </template>
          </el-table-column>
          <el-table-column prop="receivableNo" label="应收账单" min-width="170" />
          <el-table-column prop="chargeItem" label="收费项目" />
          <el-table-column prop="receivableAmount" label="原应收" />
          <el-table-column prop="paidAmount" label="已核销" />
          <el-table-column prop="outstandingAmount" label="未收" />
          <el-table-column label="本次登记" min-width="135">
            <template #default="s">
              <el-input v-if="selected(s.row.id)" v-model="amounts[String(s.row.id)]" placeholder="0.00" />
            </template>
          </el-table-column>
        </el-table>
        <p>本次登记金额：{{ calculated }} 元</p>
        <el-alert
          v-if="staleBills"
          title="部分历史所选账单已失效或结清，请重新选择；提交时后端仍会重新校验。"
          type="warning"
          :closable="false"
        />
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="付款人">
              <el-input
                v-model="form.payerName"
                maxlength="128"
                :disabled="Boolean(form.payerCustomerId)"
                placeholder="临时付款人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已有客户">
              <el-select v-model="form.payerCustomerId" clearable filterable remote :remote-method="searchCustomers">
                <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="c.label" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款方式">
              <el-select v-model="form.paymentMethod" clearable>
                <el-option v-for="(label, key) in methods" :key="key" :value="key" :label="label" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款时间">
              <el-date-picker
                v-model="form.paymentTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                :disabled-date="d => d.getTime() > Date.now()"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="交易流水号"><el-input v-model="form.transactionNo" maxlength="128" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="收款凭证">
          <div>
            <el-upload
              v-if="canAttachment"
              :auto-upload="false"
              :show-file-list="false"
              accept=".png,.jpg,.jpeg,.pdf"
              :on-change="onFile"
            >
              <el-button :disabled="uploading">上传私有凭证</el-button>
            </el-upload>
            <p>支持 PNG、JPEG、PDF，单个不超过5MB；最多20个。</p>
            <div v-for="(file, i) in files" :key="file.ossId">
              {{ file.fileName }}
              <el-button v-if="canAttachment" link @click="removeFile(i)">移除此版本引用</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="busy" @click="dialog = false">关闭</el-button>
        <el-button type="primary" :loading="busy" :disabled="uploading" @click="save(false)">保存草稿</el-button>
        <el-button
          v-hasPermi="['property:collectionRegistration:submit']"
          type="success"
          :loading="busy"
          :disabled="uploading"
          @click="save(true)"
        >
          保存并提交审核
        </el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="收款登记详情" width="950px">
      <template v-if="detail">
        <el-form inline>
          <el-form-item label="查看内容版本">
            <el-select v-model="viewVersion" class="w-40" @change="changeVersion">
              <el-option
                v-for="version in historyVersions"
                :key="version"
                :value="version"
                :label="`版本 ${version}`"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <el-alert title="这里展示所选版本的内容快照；当前处理状态以登记列表为准。" type="info" :closable="false" />

        <el-descriptions :column="3" border>
          <el-descriptions-item label="房屋">{{ detail.registration.roomFullNameSnapshot }}</el-descriptions-item>
          <el-descriptions-item label="付款人">{{ detail.registration.payerNameSnapshot || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登记金额">
            {{ detail.registration.registeredAmount || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="收款方式">
            {{ methods[detail.registration.paymentMethod as keyof typeof methods] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="收款时间">{{ detail.registration.paymentTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ detail.registration.transactionNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.registration.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登记单号">{{ detail.registration.registrationNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ labels[detail.registration.status] }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ detail.registration.contentVersion }}</el-descriptions-item>
          <el-descriptions-item label="经办人ID">{{ detail.registration.registrarUserId }}</el-descriptions-item>
          <el-descriptions-item label="首次提交">
            {{ detail.registration.firstSubmittedAt || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="退回原因">
            {{ detail.registration.lastReturnReason || '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <el-table :data="detail.details">
          <el-table-column label="应收账单" prop="receivableNoSnapshot" />
          <el-table-column label="原应收" prop="receivableAmountSnapshot" />
          <el-table-column label="已核销" prop="paidAmountSnapshot" />
          <el-table-column label="未收" prop="outstandingAmountSnapshot" />
          <el-table-column label="本次分配" prop="plannedAllocationAmount" />
        </el-table>
        <p v-for="file in detail.attachments" :key="file.id">
          <el-button v-hasPermi="['property:collectionRegistration:attachment']" link @click="preview(file)">
            {{ file.fileNameSnapshot }}
          </el-button>
        </p>
        <el-table :data="detail.logs">
          <el-table-column label="内容版本" prop="contentVersion" />
          <el-table-column label="动作" prop="action" />
          <el-table-column label="发生时间" prop="occurredAt" />
          <el-table-column label="原因" prop="reason" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import type { UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import type {
  Attachment,
  Content,
  Detail,
  Id,
  Option,
  Receivable,
  Registration,
  Status
} from '@/api/property/charge/collection/types';
import * as api from '@/api/property/charge/collection';
import auth from '@/plugins/auth';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { cents, totalAmount } from './money';
const store = useCurrentProjectStore(),
  projectId = computed(() => store.currentProjectId);
const labels: Record<Status, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待主管审核',
  REJECTED: '已退回',
  PENDING_WRITE_OFF: '待财务核销',
  WRITTEN_OFF: '已核销',
  CANCELLED: '已取消'
};
const methods = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  BANK_TRANSFER: '银行转账',
  POS: 'POS',
  OTHER: '其他'
};
const rows = ref<Registration[]>([]),
  total = ref(0),
  loading = ref(false),
  busy = ref(false),
  dialog = ref(false),
  detailVisible = ref(false),
  detail = ref<Detail>();
const query = reactive({ pageNum: 1, pageSize: 10, registrationNo: '', roomKeyword: '', status: '' }),
  dateRange = ref<string[]>([]);
const editing = ref<Registration>(),
  rooms = ref<Option[]>([]),
  customers = ref<Option[]>([]),
  debts = ref<Receivable[]>([]),
  debtLoading = ref(false),
  uploading = ref(false),
  amounts = reactive<Record<string, string>>({}),
  files = ref<{ ossId: Id; fileName: string }[]>([]),
  staleBills = ref(false);
const empty = (): Content => ({ projectId: projectId.value || '', roomId: '', details: [], attachments: [] });
const form = ref<Content>(empty());
const canAttachment = computed(() => auth.hasPermi('property:collectionRegistration:attachment'));
let epoch = 0,
  listVersion = 0,
  roomVersion = 0,
  customerVersion = 0,
  saveKey = '',
  savePayload = '',
  submitKey = '';
const keys = new Map<string, string>();
const viewVersion = ref(1);
const historyVersions = computed(() =>
  [...new Set(detail.value?.logs.map(log => log.contentVersion) || [])].toSorted((a, b) => b - a)
);
let detailVersion = 0,
  debtVersion = 0;
async function changeVersion(version: number) {
  const e = epoch,
    token = ++detailVersion,
    id = detail.value!.registration.id;
  const res = await api.getRegistrationVersion(id, version);
  if (e === epoch && token === detailVersion && detailVisible.value) detail.value = res.data;
}
const keyFor = (action: string, row: Registration) => {
  const id = `${action}:${row.id}:${row.rowVersion}`;
  if (!keys.has(id)) keys.set(id, crypto.randomUUID());
  return keys.get(id)!;
};
const editable = (row: Registration) => ['DRAFT', 'REJECTED'].includes(row.status);
const selected = (id: Id) => String(id) in amounts;
const calculated = computed(() => {
  try {
    return totalAmount(Object.values(amounts));
  } catch {
    return '金额格式有误';
  }
});
async function load() {
  const p = projectId.value,
    token = ++listVersion;
  if (!p) return;
  loading.value = true;
  try {
    const res = await api.listRegistrations({
      ...query,
      projectId: p,
      paymentTimeFrom: dateRange.value[0] ? `${dateRange.value[0]} 00:00:00` : undefined,
      paymentTimeTo: dateRange.value[1] ? `${dateRange.value[1]} 23:59:59` : undefined
    });
    if (token !== listVersion || p !== projectId.value) return;
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    if (token === listVersion) loading.value = false;
  }
}
const search = () => {
  query.pageNum = 1;
  load();
};
async function searchRooms(keyword = '') {
  const p = projectId.value,
    e = epoch,
    token = ++roomVersion;
  if (!p) return;
  const res = await api.collectionRooms(p, keyword);
  if (e === epoch && token === roomVersion && p === projectId.value) rooms.value = res.data || [];
}
async function searchCustomers(keyword: string) {
  const p = projectId.value,
    e = epoch,
    token = ++customerVersion;
  if (!p) return;
  const res = await api.collectionCustomers(p, keyword);
  if (e === epoch && token === customerVersion) customers.value = res.data || [];
}
function reset() {
  epoch++;
  editing.value = undefined;
  form.value = empty();
  debts.value = [];
  files.value = [];
  rooms.value = [];
  customers.value = [];
  staleBills.value = false;
  Object.keys(amounts).forEach(k => delete amounts[k]);
  saveKey = '';
  savePayload = '';
  submitKey = '';
}
async function openCreate() {
  reset();
  dialog.value = true;
  await searchRooms();
}
async function openEdit(row: Registration) {
  const e = ++epoch;
  const res = await api.getRegistration(row.id);
  if (e !== epoch || String(row.projectId) !== String(projectId.value)) return;
  reset();
  const data = res.data!;
  editing.value = data.registration;
  const r = data.registration;
  form.value = {
    projectId: r.projectId,
    roomId: r.roomId,
    payerCustomerId: r.payerCustomerId,
    payerName: r.payerNameSnapshot,
    payerType: r.payerTypeSnapshot,
    paymentMethod: r.paymentMethod,
    paymentTime: r.paymentTime,
    transactionNo: r.transactionNo,
    remark: r.remark,
    details: [],
    attachments: []
  };
  rooms.value = [{ id: r.roomId, label: r.roomFullNameSnapshot || String(r.roomId) }];
  if (r.payerCustomerId) customers.value = [{ id: r.payerCustomerId, label: r.payerNameSnapshot || '' }];
  files.value = data.attachments.map(a => ({ ossId: a.ossId, fileName: a.fileNameSnapshot }));
  dialog.value = true;
  if (r.status === 'DRAFT' && !r.firstSubmittedAt) searchRooms();
  const editEpoch = epoch;
  await fetchDebts();
  if (editEpoch !== epoch) return;
  for (const d of data.details) {
    if (debts.value.some(b => String(b.id) === String(d.receivableId)))
      amounts[String(d.receivableId)] = String(d.plannedAllocationAmount);
    else staleBills.value = true;
  }
}
async function fetchDebts() {
  const token = ++debtVersion;
  const e = epoch,
    room = form.value.roomId;
  if (!projectId.value || !room) return;
  debtLoading.value = true;
  try {
    const res = await api.collectionReceivables(projectId.value, room);
    if (e === epoch && token === debtVersion && String(room) === String(form.value.roomId))
      debts.value = res.data || [];
  } finally {
    if (e === epoch && token === debtVersion) debtLoading.value = false;
  }
}
function roomChanged() {
  Object.keys(amounts).forEach(k => delete amounts[k]);
  debts.value = [];
  fetchDebts();
}
function toggle(row: Receivable, on: boolean) {
  if (on) amounts[String(row.id)] = String(row.outstandingAmount);
  else delete amounts[String(row.id)];
}
function removeFile(i: number) {
  files.value.splice(i, 1);
}
async function onFile(file: UploadFile) {
  if (!file.raw || !projectId.value || uploading.value) return;
  if (files.value.length >= 20 || file.size! > 5 * 1024 * 1024)
    return ElMessage.warning('最多20个凭证，单文件不超过5MB');
  const e = epoch,
    p = projectId.value;
  uploading.value = true;
  try {
    const res = await api.uploadProof(p, file.raw);
    if (e === epoch && p === projectId.value) files.value.push(res.data!);
  } finally {
    uploading.value = false;
  }
}
function content(complete: boolean): Content {
  if (!form.value.roomId) throw new Error('请选择房屋');
  const ds = Object.entries(amounts).map(([receivableId, plannedAllocationAmount]) => {
    const debt = debts.value.find(d => String(d.id) === receivableId);
    if (!debt || cents(plannedAllocationAmount) <= 0n || cents(plannedAllocationAmount) > cents(debt.outstandingAmount))
      throw new Error('账单分配金额必须大于0且不超过未收金额');
    return { receivableId, plannedAllocationAmount };
  });
  if (
    complete &&
    (!ds.length ||
      (!form.value.payerName?.trim() && !form.value.payerCustomerId) ||
      !form.value.paymentMethod ||
      !form.value.paymentTime)
  )
    throw new Error('提交前请完整填写付款人、收款方式、时间和账单分配');
  return {
    ...form.value,
    registeredAmount: ds.length ? totalAmount(ds.map(d => d.plannedAllocationAmount)) : undefined,
    details: ds,
    attachments: files.value.map(f => ({ ossId: f.ossId }))
  };
}
async function save(andSubmit: boolean) {
  if (busy.value) return;
  let data: Content;
  try {
    data = content(andSubmit);
  } catch (e) {
    return ElMessage.warning((e as Error).message);
  }
  const payload = JSON.stringify(data);
  if (payload !== savePayload) {
    savePayload = payload;
    saveKey = crypto.randomUUID();
  }
  const e = epoch;
  busy.value = true;
  try {
    const res = await api.saveRegistration(data, saveKey, editing.value);
    if (e !== epoch) return;
    const row = { ...editing.value, id: res.data!.registrationId, ...res.data! } as Registration;
    dialog.value = false;
    if (andSubmit) {
      if (!submitKey) submitKey = crypto.randomUUID();
      try {
        await api.submitRegistration(row, submitKey);
      } catch (error) {
        await load();
        ElMessage.warning('草稿已保存，请刷新列表确认提交状态后继续提交');
        throw error;
      }
      if (e !== epoch) return;
    }
    dialog.value = false;
    ElMessage.success(andSubmit ? '已提交主管审核，尚未正式核销' : '草稿已保存');
    await load();
  } finally {
    busy.value = false;
  }
}
async function submitRow(row: Registration) {
  await ElMessageBox.confirm('提交后本版本不可直接修改，且不会生成正式收款或核销。', '提交审核');
  const e = epoch;
  busy.value = true;
  try {
    await api.submitRegistration(row, keyFor('submit', row));
    if (e === epoch) {
      ElMessage.success('已提交主管审核');
      await load();
    }
  } finally {
    busy.value = false;
  }
}
async function cancelRow(row: Registration) {
  const { value } = await ElMessageBox.prompt('请填写取消原因', '取消登记', {
    inputValidator: v => (v?.trim().length >= 2 && v.trim().length <= 500) || '原因应为2至500个字符'
  });
  const e = epoch;
  busy.value = true;
  try {
    await api.cancelRegistration(row, keyFor('cancel', row), value.trim());
    if (e === epoch) await load();
  } finally {
    busy.value = false;
  }
}
async function showDetail(row: Registration) {
  const e = epoch;
  const res = await api.getRegistration(row.id);
  if (e === epoch) {
    detail.value = res.data;
    viewVersion.value = res.data!.registration.contentVersion;
    detailVisible.value = true;
  }
}
async function preview(file: Attachment) {
  const e = epoch;
  const blob = await api.downloadProof(detail.value!.registration.id, file.id);
  if (e !== epoch) return;
  if (!(blob instanceof Blob) || blob.type.includes('json')) return ElMessage.error('凭证读取失败');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileNameSnapshot;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
watch(
  projectId,
  () => {
    reset();
    listVersion++;
    rows.value = [];
    total.value = 0;
    loading.value = false;
    dialog.value = false;
    detailVisible.value = false;
    detail.value = undefined;
    dateRange.value = [];
    Object.assign(query, { pageNum: 1, pageSize: 10, registrationNo: '', roomKeyword: '', status: '' });
    load();
  },
  { immediate: true }
);
</script>
