<template>
  <div class="p-2">
    <el-alert
      title="主管审核通过后进入待财务核销；此操作不确认到账、不生成正式收款。"
      type="info"
      :closable="false"
      class="mb-3"
    />
    <el-empty v-if="!projectId" description="请先选择物业工作项目" />
    <template v-else>
      <el-card class="mb-3">
        <el-form inline @submit.prevent="search">
          <el-form-item label="登记单号"><el-input v-model="query.registrationNo" clearable /></el-form-item>
          <el-form-item label="房屋"><el-input v-model="query.roomKeyword" clearable /></el-form-item>
          <el-form-item label="登记人ID"><el-input v-model="query.registrarUserId" clearable /></el-form-item>
          <el-form-item label="金额下限"><el-input v-model="query.amountFrom" clearable /></el-form-item>
          <el-form-item label="金额上限"><el-input v-model="query.amountTo" clearable /></el-form-item>
          <el-form-item label="收款方式">
            <el-select v-model="query.paymentMethod" clearable class="w-40">
              <el-option v-for="(v, k) in methods" :key="k" :value="k" :label="v" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" class="w-40">
              <el-option v-for="(v, k) in labels" :key="k" :value="k" :label="v" />
            </el-select>
          </el-form-item>
          <el-form-item label="提交日期">
            <el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-button v-hasPermi="['property:collectionReview:list']" type="primary" @click="search">查询</el-button>
        </el-form>
      </el-card>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="registrationNo" label="登记单号" min-width="190" />
        <el-table-column prop="roomFullNameSnapshot" label="房屋" />
        <el-table-column prop="registrarUserId" label="登记人ID" />
        <el-table-column prop="registeredAmount" label="登记金额" />
        <el-table-column prop="submittedAt" label="提交时间" min-width="170" />
        <el-table-column label="状态">
          <template #default="s">{{ labels[s.row.status as Status] }}</template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="s">
            <el-button v-hasPermi="['property:collectionRegistration:query']" link @click="open(s.row.id)">
              审核详情
            </el-button>
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
    <el-drawer v-model="visible" title="主管审核详情" size="85%" :before-close="closeDrawer">
      <div v-loading="detailLoading">
        <template v-if="detail && registration">
          <el-form inline>
            <el-form-item label="已提交版本">
              <el-select
                :model-value="registration.contentVersion"
                :disabled="busy"
                class="w-40"
                @change="versionChanged"
              >
                <el-option v-for="v in detail.submittedVersions" :key="v" :value="v" :label="`版本 ${v}`" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="登记单号">{{ registration.registrationNo }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">{{ labels[detail.currentStatus] }}</el-descriptions-item>
            <el-descriptions-item label="房屋">{{ registration.roomFullNameSnapshot }}</el-descriptions-item>
            <el-descriptions-item label="付款人">{{ registration.payerNameSnapshot }}</el-descriptions-item>
            <el-descriptions-item label="付款客户ID">
              {{ registration.payerCustomerId || '临时付款人' }}
            </el-descriptions-item>
            <el-descriptions-item label="登记金额">{{ registration.registeredAmount }}</el-descriptions-item>
            <el-descriptions-item label="收款方式">
              {{ methods[registration.paymentMethod || ''] || registration.paymentMethod }}
            </el-descriptions-item>
            <el-descriptions-item label="收款时间">{{ registration.paymentTime }}</el-descriptions-item>
            <el-descriptions-item label="流水号">{{ registration.transactionNo }}</el-descriptions-item>
            <el-descriptions-item label="登记人ID">{{ registration.registrarUserId }}</el-descriptions-item>
            <el-descriptions-item label="审核人ID">{{ registration.reviewedBy }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ registration.reviewedAt }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ registration.remark }}</el-descriptions-item>
          </el-descriptions>
          <el-alert
            v-if="selfReview"
            title="经办、提交人员不能审核自己的登记，管理员也适用。"
            type="warning"
            :closable="false"
            class="my-3"
          />
          <el-alert
            v-if="changed"
            title="账单余额或状态已发生变化，请比较提交快照与最新数据；余额不足或失效时不能通过。"
            type="warning"
            :closable="false"
            class="my-3"
          />
          <el-table :data="detail.snapshot.details" border class="my-3">
            <el-table-column prop="receivableNoSnapshot" label="应收账单" min-width="180" />
            <el-table-column prop="chargeItemNameSnapshot" label="收费项目" />
            <el-table-column label="账期" min-width="170">
              <template #default="s">{{ s.row.periodStartDate }} ～ {{ s.row.periodEndDate }}</template>
            </el-table-column>
            <el-table-column prop="receivableAmountSnapshot" label="提交时应收" />
            <el-table-column prop="paidAmountSnapshot" label="提交时已收" />
            <el-table-column prop="outstandingAmountSnapshot" label="提交时未收" />
            <el-table-column prop="plannedAllocationAmount" label="本次拟核销" />
            <el-table-column label="最新应收">
              <template #default="s">{{ latest(s.row.receivableId)?.receivableAmount ?? '不可用' }}</template>
            </el-table-column>
            <el-table-column label="最新已收">
              <template #default="s">{{ latest(s.row.receivableId)?.paidAmount ?? '不可用' }}</template>
            </el-table-column>
            <el-table-column label="最新未收">
              <template #default="s">{{ latest(s.row.receivableId)?.outstandingAmount ?? '不可用' }}</template>
            </el-table-column>
            <el-table-column label="最新校验">
              <template #default="s">{{ latest(s.row.receivableId)?.sufficient ? '金额足够' : '不可通过' }}</template>
            </el-table-column>
          </el-table>
          <div v-for="f in detail.snapshot.attachments" :key="f.id">
            {{ f.fileNameSnapshot }}
            <el-button v-hasPermi="['property:collectionRegistration:attachment']" link @click="download(f)">
              下载凭证
            </el-button>
          </div>
          <el-timeline class="mt-4">
            <el-timeline-item v-for="e in detail.snapshot.logs" :key="e.id" :timestamp="e.occurredAt">
              版本{{ e.contentVersion }} · {{ e.action }} · {{ e.actorNameSnapshot || e.actorUserId }} {{ e.reason }}
            </el-timeline-item>
          </el-timeline>
          <template v-if="canDecide">
            <el-input
              v-model="reason"
              type="textarea"
              maxlength="500"
              show-word-limit
              placeholder="驳回原因（2～500字）"
              :disabled="busy"
            />
            <div class="mt-3">
              <el-button
                v-hasPermi="['property:collectionRegistration:approve']"
                type="primary"
                :disabled="busy || selfReview || detail.latestBills.some(b => !b.sufficient)"
                @click="decide('approve')"
              >
                审核通过
              </el-button>
              <el-button
                v-hasPermi="['property:collectionRegistration:reject']"
                type="danger"
                :disabled="busy || selfReview"
                @click="decide('reject')"
              >
                驳回
              </el-button>
            </div>
          </template>
        </template>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Attachment, Id, Registration, Status } from '@/api/property/charge/collection/types';
import * as api from '@/api/property/charge/collection-review';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useUserStore } from '@/store/modules/user';
const store = useCurrentProjectStore(),
  user = useUserStore();
const projectId = computed(() => store.currentProjectId);
const labels: Partial<Record<Status, string>> = {
  PENDING_REVIEW: '待主管审核',
  REJECTED: '已退回',
  PENDING_WRITE_OFF: '待财务核销',
  WRITTEN_OFF: '已核销',
  CANCELLED: '已取消'
};
const methods: Record<string, string> = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  BANK_TRANSFER: '银行转账',
  POS: 'POS',
  OTHER: '其他'
};
const query = reactive({
  pageNum: 1,
  pageSize: 10,
  registrationNo: '',
  roomKeyword: '',
  registrarUserId: '',
  amountFrom: '',
  amountTo: '',
  paymentMethod: '',
  status: 'PENDING_REVIEW'
});
const dates = ref<string[]>([]),
  rows = ref<Registration[]>([]),
  total = ref(0),
  loading = ref(false),
  busy = ref(false),
  visible = ref(false),
  detailLoading = ref(false),
  detail = ref<api.ReviewDetail>(),
  reason = ref('');
const registration = computed(() => detail.value?.snapshot.registration);
const selfReview = computed(() =>
  Boolean(
    registration.value &&
    [registration.value.registrarUserId, registration.value.submitterUserId].some(
      id => String(id) === String(user.userId)
    )
  )
);
const canDecide = computed(
  () =>
    detail.value?.currentStatus === 'PENDING_REVIEW' &&
    registration.value?.contentVersion === detail.value?.latestSubmittedVersion
);
const changed = computed(() => detail.value?.latestBills.some(b => b.balanceChanged || !b.sufficient));
let epoch = 0,
  listEpoch = 0,
  detailEpoch = 0;
let pending: { fingerprint: string; key: string } | undefined;
function latest(id: Id) {
  return detail.value?.latestBills.find(b => String(b.receivableId) === String(id));
}
async function load() {
  if (!projectId.value) return;
  const e = ++listEpoch,
    p = projectId.value;
  loading.value = true;
  try {
    const params = Object.fromEntries(
      Object.entries({
        ...query,
        projectId: p,
        firstSubmittedFrom: dates.value[0] ? `${dates.value[0]} 00:00:00` : undefined,
        firstSubmittedTo: dates.value[1] ? `${dates.value[1]} 23:59:59` : undefined
      }).filter(([, v]) => v !== '' && v !== undefined)
    );
    const { data } = await api.listReviews(params);
    if (e !== listEpoch || p !== projectId.value) return;
    rows.value = data.rows;
    total.value = data.total;
  } finally {
    if (e === listEpoch) loading.value = false;
  }
}
function search() {
  query.pageNum = 1;
  load();
}
async function open(id: Id, version?: number) {
  const e = ++detailEpoch,
    session = epoch;
  visible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  reason.value = '';
  pending = undefined;
  try {
    const { data } = await api.getReview(id, version);
    if (e !== detailEpoch || session !== epoch) return;
    detail.value = data;
  } finally {
    if (e === detailEpoch) detailLoading.value = false;
  }
}
function versionChanged(v: number) {
  if (registration.value) open(registration.value.id, v);
}
function closeDrawer(done: () => void) {
  if (busy.value) return;
  detailEpoch++;
  detail.value = undefined;
  done();
}
async function decide(action: 'approve' | 'reject') {
  const row = registration.value;
  if (!row || !canDecide.value || busy.value || selfReview.value) return;
  const text = reason.value.trim();
  if (action === 'reject' && (text.length < 2 || text.length > 500)) {
    ElMessage.warning('请输入2～500字驳回原因');
    return;
  }
  try {
    await ElMessageBox.confirm(
      action === 'approve' ? '确认该提交版本审核通过并转交财务？' : '确认驳回并要求客服修改后重新提交？',
      '审核确认'
    );
  } catch {
    return;
  }
  if (row !== registration.value || !canDecide.value) return;
  const fingerprint = JSON.stringify([
    row.id,
    row.contentVersion,
    row.rowVersion,
    action,
    action === 'reject' ? text : ''
  ]);
  if (pending?.fingerprint !== fingerprint) pending = { fingerprint, key: crypto.randomUUID() };
  const e = epoch;
  busy.value = true;
  try {
    await api.decideReview(row, action, pending.key, text);
    if (e !== epoch) return;
    ElMessage.success(action === 'approve' ? '审核通过，等待财务核销' : '已驳回');
    visible.value = false;
    detail.value = undefined;
    pending = undefined;
    await load();
  } finally {
    if (e === epoch) busy.value = false;
  }
}
async function download(f: Attachment) {
  const row = registration.value;
  if (!row) return;
  const e = epoch;
  const blob = await api.downloadReviewProof(row.id, f.id);
  if (e !== epoch) return;
  if (!(blob instanceof Blob) || blob.type.includes('json')) {
    ElMessage.error('凭证读取失败，请确认权限及版本');
    return;
  }
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = f.fileNameSnapshot;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
watch(
  projectId,
  () => {
    epoch++;
    listEpoch++;
    detailEpoch++;
    rows.value = [];
    total.value = 0;
    visible.value = false;
    detail.value = undefined;
    busy.value = false;
    loading.value = false;
    detailLoading.value = false;
    pending = undefined;
    dates.value = [];
    query.pageNum = 1;
    load();
  },
  { immediate: true }
);
</script>
