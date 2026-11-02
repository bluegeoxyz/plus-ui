<template>
  <div class="p-2">
    <el-alert
      title="财务必须人工核实到账；登记金额、实际到账金额和核销金额须完全一致。截图和交易号不能自动证明到账。"
      type="info"
      :closable="false"
      class="mb-3"
    />
    <el-alert
      v-if="resultId"
      title="正式核销成功，可查看正式流水及来源。"
      type="success"
      :closable="false"
      class="mb-3"
    >
      <el-button link @click="showPayment(resultId)">查看正式流水</el-button>
    </el-alert>
    <el-empty v-if="!projectId" description="请先选择物业工作项目" />
    <template v-else>
      <el-card class="mb-3">
        <el-form inline @submit.prevent="search">
          <el-form-item label="登记单号"><el-input v-model="query.registrationNo" clearable /></el-form-item>
          <el-form-item label="房屋"><el-input v-model="query.roomKeyword" clearable /></el-form-item>
          <el-form-item label="登记人ID"><el-input v-model="query.registrarUserId" clearable /></el-form-item>
          <el-form-item label="主管审核人ID"><el-input v-model="query.reviewerUserId" clearable /></el-form-item>
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
          <el-form-item label="审核日期">
            <el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-button v-hasPermi="['property:collectionWriteOff:list']" type="primary" @click="search">查询</el-button>
        </el-form>
      </el-card>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="registrationNo" label="登记单号" min-width="190" />
        <el-table-column prop="roomFullNameSnapshot" label="房屋" />
        <el-table-column prop="registrarUserId" label="登记人ID" />
        <el-table-column prop="registeredAmount" label="登记金额" />
        <el-table-column prop="reviewedAt" label="主管审核时间" min-width="170" />
        <el-table-column label="状态">
          <template #default="s">{{ labels[s.row.status as Status] }}</template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="s">
            <el-button v-hasPermi="['property:collectionRegistration:query']" link @click="open(s.row.id)">
              核销详情
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
    <el-drawer v-model="visible" title="财务核销详情" size="85%" :before-close="closeDrawer">
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
            title="经办、提交和主管审核人员不能核销同笔登记，管理员也适用。"
            type="warning"
            :closable="false"
            class="my-3"
          />
          <el-alert
            v-if="changed"
            title="账单余额或状态已发生变化，请比较提交快照与最新数据；余额不足或失效时不能核销，应退回修订。"
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
            {{ f.attachmentType === 'ARRIVAL_PROOF' ? '到账证明：' : '收款凭证：' }}{{ f.fileNameSnapshot }}
            <el-button v-hasPermi="['property:collectionRegistration:attachment']" link @click="download(f)">
              下载凭证
            </el-button>
          </div>
          <el-timeline class="mt-4">
            <el-timeline-item v-for="e in detail.snapshot.logs" :key="e.id" :timestamp="e.occurredAt">
              版本{{ e.contentVersion }} · {{ e.action }} · {{ e.actorNameSnapshot || e.actorUserId }} {{ e.reason }}
            </el-timeline-item>
          </el-timeline>
          <el-button v-if="registration.paymentId" @click="showPayment(registration.id)">查看正式流水</el-button>
          <template v-if="canDecide">
            <el-form label-width="120px" :disabled="busy || uploading">
              <el-form-item label="实际到账金额" required>
                <el-input v-model="arrival.actualReceivedAmount" placeholder="请输入人工核实的到账金额" />
              </el-form-item>
              <el-form-item label="实际到账时间" required>
                <el-date-picker
                  v-model="arrival.actualReceivedTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  :disabled-date="d => d.getTime() > Date.now()"
                />
              </el-form-item>
              <el-form-item label="到账证明">
                <el-upload
                  v-hasPermi="['property:collectionRegistration:attachment']"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept=".png,.jpg,.jpeg,.pdf"
                  :on-change="onFile"
                >
                  <el-button>上传到账证明</el-button>
                </el-upload>
                <span>可选，PNG/JPEG/PDF，单个5MB以内</span>
              </el-form-item>
              <div v-for="(f, i) in arrivalFiles" :key="f.ossId">
                {{ f.fileName }}
                <el-button link @click="arrivalFiles.splice(i, 1)">移除此证明</el-button>
              </div>
              <el-form-item>
                <el-checkbox v-model="arrival.arrivalConfirmed">我已人工核实实际到账、收款方式和交易信息</el-checkbox>
              </el-form-item>
            </el-form>
            <el-input
              v-model="reason"
              type="textarea"
              maxlength="500"
              show-word-limit
              placeholder="退回原因（2～500字）"
              :disabled="busy"
            />
            <div class="mt-3">
              <el-button
                v-hasPermi="['property:collectionRegistration:writeOff']"
                type="primary"
                :disabled="
                  busy ||
                  uploading ||
                  selfReview ||
                  !arrival.arrivalConfirmed ||
                  detail.latestBills.some(b => !b.sufficient)
                "
                @click="decide('write-off')"
              >
                正式核销
              </el-button>
              <el-button
                v-hasPermi="['property:collectionRegistration:return']"
                type="danger"
                :disabled="busy || uploading || selfReview"
                @click="decide('return')"
              >
                财务退回
              </el-button>
            </div>
          </template>
        </template>
      </div>
    </el-drawer>
    <el-dialog v-model="paymentVisible" title="正式收款流水" width="900px">
      <el-descriptions v-if="payment" :column="2" border>
        <el-descriptions-item label="正式收款编号">{{ payment.paymentNo }}</el-descriptions-item>
        <el-descriptions-item label="来源登记单">{{ payment.sourceRegistrationNo }}</el-descriptions-item>
        <el-descriptions-item label="收款金额">{{ payment.paymentAmount }}</el-descriptions-item>
        <el-descriptions-item label="核销金额">{{ payment.allocatedAmount }}</el-descriptions-item>
        <el-descriptions-item label="客服经办ID">{{ payment.collectorUserId }}</el-descriptions-item>
        <el-descriptions-item label="主管审核ID">{{ payment.reviewerUserId }}</el-descriptions-item>
        <el-descriptions-item label="财务核销ID">{{ payment.writerUserId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ payment.status }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="payment?.reversal"
        title="该笔收款已整笔冲销；原登记及核销历史保留，不能再次核销。冲销不代表实际退款。"
        type="warning"
        :closable="false"
      />
      <el-table :data="payment?.allocations || []" border>
        <el-table-column prop="id" label="分配ID" min-width="180" />
        <el-table-column prop="receivableNo" label="应收账单" min-width="180" />
        <el-table-column prop="allocationAmount" label="本次核销金额" />
        <el-table-column prop="receivablePaidAmount" label="最新已收" />
        <el-table-column prop="receivableOutstandingAmount" label="最新未收" />
      </el-table>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import type { UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Attachment, Id, Registration, Status } from '@/api/property/charge/collection/types';
import * as api from '@/api/property/charge/collection-writeoff';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useUserStore } from '@/store/modules/user';
import { cents } from '../collection/money';
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
  reviewerUserId: '',
  amountFrom: '',
  amountTo: '',
  paymentMethod: '',
  status: 'PENDING_WRITE_OFF'
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
    [registration.value.registrarUserId, registration.value.submitterUserId, registration.value.reviewedBy].some(
      id => String(id) === String(user.userId)
    )
  )
);
const canDecide = computed(
  () =>
    detail.value?.currentStatus === 'PENDING_WRITE_OFF' &&
    registration.value?.contentVersion === detail.value?.latestSubmittedVersion
);
const changed = computed(() => detail.value?.latestBills.some(b => b.balanceChanged || !b.sufficient));
const arrival = reactive({ actualReceivedAmount: '', actualReceivedTime: '', arrivalConfirmed: false });
const arrivalFiles = ref<{ ossId: Id; fileName: string }[]>([]),
  uploading = ref(false),
  paymentVisible = ref(false),
  payment = ref<api.FinancePayment>(),
  resultId = ref<Id>();
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
        reviewedFrom: dates.value[0] ? `${dates.value[0]} 00:00:00` : undefined,
        reviewedTo: dates.value[1] ? `${dates.value[1]} 23:59:59` : undefined
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
  Object.assign(arrival, { actualReceivedAmount: '', actualReceivedTime: '', arrivalConfirmed: false });
  arrivalFiles.value = [];
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
async function decide(action: 'write-off' | 'return') {
  const row = registration.value;
  if (!row || !canDecide.value || busy.value || uploading.value || selfReview.value) return;
  const text = reason.value.trim();
  if (action === 'return' && (text.length < 2 || text.length > 500)) {
    ElMessage.warning('请输入2～500字退回原因');
    return;
  }
  if (action === 'write-off') {
    try {
      if (
        cents(arrival.actualReceivedAmount) !== cents(row.registeredAmount || '0') ||
        !arrival.arrivalConfirmed ||
        !arrival.actualReceivedTime ||
        new Date(arrival.actualReceivedTime).getTime() > Date.now()
      )
        throw Error();
    } catch {
      ElMessage.warning('请人工确认到账，填写等额到账金额及实际到账时间；金额不符请退回');
      return;
    }
  }
  const confirmation: api.Arrival = { ...arrival, arrivalProofOssIds: arrivalFiles.value.map(f => f.ossId) };
  try {
    await ElMessageBox.confirm(
      action === 'write-off'
        ? `确认已人工核实到账 ${arrival.actualReceivedAmount} 元，并核销本次 ${detail.value?.snapshot.details.length} 张指定账单？`
        : '确认退回客服修改并重新进行主管审核？',
      '财务确认'
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
    action === 'return' ? text : confirmation
  ]);
  if (pending?.fingerprint !== fingerprint) pending = { fingerprint, key: crypto.randomUUID() };
  const e = epoch;
  busy.value = true;
  try {
    const response = await api.decideReview(row, action, pending.key, text, confirmation);
    if (action === 'write-off' && e === epoch) resultId.value = response.data.registrationId;
    if (e !== epoch) return;
    ElMessage.success(action === 'write-off' ? '正式核销成功' : '已退回，须修改重提并重新审核');
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
async function onFile(upload: UploadFile) {
  const file = upload.raw;
  if (!file || !projectId.value) return;
  if (file.size > 5 * 1024 * 1024 || !/\.(png|jpe?g|pdf)$/i.test(file.name) || arrivalFiles.value.length >= 20) {
    ElMessage.warning('到账证明限20个，每个5MB以内，支持PNG/JPEG/PDF');
    return;
  }
  const e = epoch,
    v = detailEpoch;
  uploading.value = true;
  try {
    const { data } = await api.uploadArrival(projectId.value, file);
    if (e === epoch && v === detailEpoch) arrivalFiles.value.push(data);
  } finally {
    if (e === epoch) uploading.value = false;
  }
}
async function showPayment(id: Id) {
  const e = epoch;
  const { data } = await api.getPayment(id);
  if (e !== epoch) return;
  payment.value = data;
  paymentVisible.value = true;
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
    resultId.value = undefined;
    paymentVisible.value = false;
    payment.value = undefined;
    arrivalFiles.value = [];
    uploading.value = false;
    query.pageNum = 1;
    load();
  },
  { immediate: true }
);
</script>
