<template>
  <div>
  <el-dialog v-model="visible" title="登记收款" width="760px" append-to-body :close-on-click-modal="false" @closed="reset">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="18">
        <el-col :span="12"><el-form-item label="当前项目"><el-input :model-value="projectName" disabled /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="房屋" prop="roomId"><el-select v-model="form.roomId" filterable :disabled="Boolean(fixedRoom)" placeholder="请选择有未结清应收的房屋" @change="loadDebt"><el-option v-for="room in rooms" :key="room.roomId" :label="roomLabel(room)" :value="room.roomId"><span>{{ room.roomFullName }}</span><span class="room-option-amount">未收 {{ money(room.outstandingAmount) }}</span></el-option></el-select></el-form-item></el-col>
      </el-row>
      <el-alert v-if="form.roomId" :title="debt.outstandingTotal > 0 ? `当前未收：¥ ${money(debt.outstandingTotal)}；未结清：${unsettledCount}笔；最早账期：${earliestPeriod}` : '当前房屋无未结清应收，不能登记收款'" :type="debt.outstandingTotal > 0 ? 'info' : 'warning'" :closable="false" show-icon class="mb-3" />
      <el-row :gutter="18">
        <el-col :span="12"><el-form-item label="付款人方式"><el-radio-group v-model="payerMode" @change="clearPayer"><el-radio value="MANUAL">临时付款人</el-radio><el-radio value="CUSTOMER">已有客户</el-radio></el-radio-group></el-form-item></el-col>
        <el-col v-if="payerMode === 'CUSTOMER'" :span="12"><el-form-item label="已有客户" prop="payerCustomerId"><el-select v-model="form.payerCustomerId" filterable remote :remote-method="searchCustomers" :loading="customerLoading" placeholder="输入姓名搜索"><el-option v-for="customer in customers" :key="customer.id" :label="`${customer.customerName}（${customer.customerNo}）`" :value="customer.id" /></el-select></el-form-item></el-col>
        <el-col v-else :span="12"><el-form-item label="付款人" prop="payerName"><el-input v-model="form.payerName" maxlength="100" placeholder="例如：张三家属" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="收款金额" prop="paymentAmount"><el-input-number v-model="form.paymentAmount" :min="0.01" :max="debt.outstandingTotal > 0 ? Number(debt.outstandingTotal) : undefined" :precision="2" controls-position="right" /><div class="form-tip">最大可收 ¥ {{ money(debt.outstandingTotal) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="收款方式" prop="paymentMethod"><el-select v-model="form.paymentMethod"><el-option v-for="item in pm_payment_method" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="交易流水号"><el-input v-model="form.transactionNo" maxlength="100" clearable /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="收款时间" prop="paymentTime"><el-date-picker v-model="form.paymentTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :disabled-date="disableFuture" /></el-form-item></el-col>
        <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
      </el-row>
      <el-alert title="系统将按最早到期账单优先自动核销。" type="warning" :closable="false" show-icon />
    </el-form>
    <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="submitting" :disabled="debt.outstandingTotal <= 0" @click="submit">确认收款</el-button></template>
  </el-dialog>

  <el-dialog v-model="resultVisible" title="收款及自动核销结果" width="820px" append-to-body>
    <el-descriptions v-if="result" :column="3" border class="mb-3"><el-descriptions-item label="收款编号">{{ result.paymentNo }}</el-descriptions-item><el-descriptions-item label="收款金额">¥ {{ money(result.paymentAmount) }}</el-descriptions-item><el-descriptions-item label="已核销">¥ {{ money(result.allocatedAmount) }}</el-descriptions-item></el-descriptions>
    <el-table :data="result?.allocations || []" border><el-table-column label="应收编号" prop="receivableNo" min-width="180" /><el-table-column label="收费项目" prop="chargeItemNameSnapshot" min-width="120" /><el-table-column label="责任人" prop="responsibleCustomerNameSnapshot" min-width="100" /><el-table-column label="应收账期" min-width="190"><template #default="s">{{ s.row.periodStart }} ~ {{ s.row.periodEnd }}</template></el-table-column><el-table-column label="本次核销" align="right"><template #default="s">{{ money(s.row.allocationAmount) }}</template></el-table-column><el-table-column label="核销后状态" width="110"><template #default="s"><dict-tag :options="pm_payment_status" :value="s.row.paymentStatus" /></template></el-table-column></el-table>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { addPayment, paymentContextCustomers, paymentContextReceivables, paymentContextRooms } from '@/api/property/charge/payment';
import type { PaymentCreateForm, PaymentCustomerOptionVO, PaymentReceivableOptionVO, PaymentRoomOptionVO, PaymentVO } from '@/api/property/charge/payment/types';
import type { ReceivableSummaryVO } from '@/api/property/charge/receivable/types';
import type { RoomOptionVO, RoomVO } from '@/api/property/resource/room/types';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const props = defineProps<{ projectId?: number | string; projectName: string }>();
const emit = defineEmits<{ success: [payment: PaymentVO] }>();
const visible = defineModel<boolean>({ default: false });
const { pm_payment_method, pm_payment_status } = toRefs<any>(useDict('pm_payment_method', 'pm_payment_status'));
const resultVisible = ref(false), submitting = ref(false), customerLoading = ref(false);
const formRef = ref<FormInstance>(), rooms = ref<PaymentRoomOptionVO[]>([]), customers = ref<PaymentCustomerOptionVO[]>([]), fixedRoom = ref<RoomVO | RoomOptionVO>(), result = ref<PaymentVO>();
const payerMode = ref<'MANUAL' | 'CUSTOMER'>('MANUAL'), unsettled = ref<PaymentReceivableOptionVO[]>([]), debt = ref<ReceivableSummaryVO>({ receivableTotal: 0, paidTotal: 0, outstandingTotal: 0, overdueOutstandingTotal: 0 });
const emptyForm = (): PaymentCreateForm => ({ projectId: props.projectId || '', roomId: '', payerName: '', paymentAmount: 0.01, paymentMethod: 'CASH', paymentTime: nowText() });
const form = ref<PaymentCreateForm>(emptyForm());
const rules: FormRules<PaymentCreateForm> = { roomId: [{ required: true, message: '请选择房屋', trigger: 'change' }], payerCustomerId: [{ validator: (_r, v, cb) => payerMode.value === 'CUSTOMER' && !v ? cb(new Error('请选择付款客户')) : cb(), trigger: 'change' }], payerName: [{ validator: (_r, v, cb) => payerMode.value === 'MANUAL' && !String(v || '').trim() ? cb(new Error('请输入付款人')) : cb(), trigger: 'blur' }], paymentAmount: [{ required: true, message: '请输入收款金额', trigger: 'change' }], paymentMethod: [{ required: true, message: '请选择收款方式', trigger: 'change' }], paymentTime: [{ required: true, message: '请选择收款时间', trigger: 'change' }] };
const unsettledCount = computed(() => unsettled.value.length), earliestPeriod = computed(() => unsettled.value.length ? `${unsettled.value[0].periodStartDate} ~ ${unsettled.value[0].periodEndDate}` : '-');
function nowText() { const d = new Date(), pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
const money = (v?: number) => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const roomLabel = (room: PaymentRoomOptionVO) => `${room.roomFullName}　未收 ${money(room.outstandingAmount)}`;
const disableFuture = (date: Date) => date.getTime() > Date.now();
function clearPayer() { form.value.payerCustomerId = undefined; form.value.payerName = ''; customers.value = []; formRef.value?.clearValidate(['payerCustomerId', 'payerName']); }
async function searchCustomers(keyword: string) { const p=props.projectId;if (!p||keyword.trim().length<2) { customers.value = []; return; } customerLoading.value = true; try { const res = await paymentContextCustomers(p,keyword.trim()); customers.value = res.data || []; } finally { customerLoading.value = false; } }
async function loadDebt() { const p = props.projectId, roomId = form.value.roomId; debt.value = { receivableTotal: 0, paidTotal: 0, outstandingTotal: 0, overdueOutstandingTotal: 0 }; unsettled.value = []; if (!p || !roomId) return; const res=await paymentContextReceivables(p,roomId);if (String(p) !== String(props.projectId) || String(roomId) !== String(form.value.roomId)) return; unsettled.value=res.data||[];const today=new Date().toISOString().slice(0,10);debt.value={receivableTotal:unsettled.value.reduce((s,x)=>s+Number(x.receivableAmount||0),0),paidTotal:unsettled.value.reduce((s,x)=>s+Number(x.paidAmount||0),0),outstandingTotal:unsettled.value.reduce((s,x)=>s+Number(x.outstandingAmount||0),0),overdueOutstandingTotal:unsettled.value.filter(x=>x.dueDate<today).reduce((s,x)=>s+Number(x.outstandingAmount||0),0)};form.value.paymentAmount=Number(debt.value.outstandingTotal||0); }
async function loadRooms() { const p = props.projectId, room = fixedRoom.value; if (!p) return; const res = await paymentContextRooms(p); if (!visible.value || String(p) !== String(props.projectId)) return; rooms.value = res.data || []; if (room?.id) { const option = rooms.value.find(x => String(x.roomId) === String(room.id)); if (!option) { visible.value = false; return modal.msgWarning('当前房屋没有可核销应收'); } form.value.roomId = option.roomId; await loadDebt(); } }
function open(room?: RoomVO | RoomOptionVO) { if (!props.projectId) return modal.msgWarning('请先选择项目'); reset(); fixedRoom.value = room; visible.value = true; }
function reset() { form.value = emptyForm(); rooms.value = []; customers.value = []; fixedRoom.value = undefined; payerMode.value = 'MANUAL'; debt.value = { receivableTotal: 0, paidTotal: 0, outstandingTotal: 0, overdueOutstandingTotal: 0 }; unsettled.value = []; formRef.value?.clearValidate(); }
async function submit() { if (!props.projectId || String(form.value.projectId) !== String(props.projectId)) { visible.value = false; return modal.msgWarning('当前项目已切换，请重新登记'); } await formRef.value?.validate(); if (Number(debt.value.outstandingTotal) <= 0) return modal.msgWarning('当前房屋无未结清应收'); if (Number(form.value.paymentAmount) > Number(debt.value.outstandingTotal)) return modal.msgWarning(`当前最多可收 ${money(debt.value.outstandingTotal)} 元`); if (new Date(form.value.paymentTime).getTime() > Date.now()) return modal.msgWarning('收款时间不能晚于当前时间'); await ElMessageBox.confirm(`房屋：${rooms.value.find(x => String(x.roomId) === String(form.value.roomId))?.roomFullName || ''}\n收款金额：${money(form.value.paymentAmount)}\n当前欠费：${money(debt.value.outstandingTotal)}\n\n系统将按最早到期账单优先自动核销。`, '确认收款', { type: 'warning' }); submitting.value = true; try { const res = await addPayment({ ...form.value, payerName: payerMode.value === 'MANUAL' ? form.value.payerName : undefined, payerCustomerId: payerMode.value === 'CUSTOMER' ? form.value.payerCustomerId : undefined }); result.value = res.data; visible.value = false; resultVisible.value = true; modal.msgSuccess('收款及自动核销成功'); emit('success', res.data); } finally { submitting.value = false; } }
watch(visible, shown => { if (shown) { if (!fixedRoom.value) reset(); loadRooms(); } });
watch(() => props.projectId, () => { visible.value = false; resultVisible.value = false; result.value = undefined; reset(); });
defineExpose({ open, close: () => { visible.value = false; resultVisible.value = false; } });
</script>

<style scoped>.form-tip{color:var(--el-text-color-secondary);font-size:12px}.room-option-amount{float:right;margin-left:24px;color:var(--el-text-color-secondary)}.el-select,.el-date-editor,.el-input-number{width:100%}</style>
