<template>
  <div>
  <el-dialog v-model="visible" title="冲销收款" width="680px" append-to-body :close-on-click-modal="false" @closed="reset">
    <template v-if="payment">
      <el-descriptions :column="2" border class="mb-3">
        <el-descriptions-item label="收款编号">{{ payment.paymentNo }}</el-descriptions-item>
        <el-descriptions-item label="房屋">{{ payment.roomFullNameSnapshot }}</el-descriptions-item>
        <el-descriptions-item label="付款人">{{ payment.payerNameSnapshot }}</el-descriptions-item>
        <el-descriptions-item label="收款金额">¥ {{ money(payment.paymentAmount) }}</el-descriptions-item>
        <el-descriptions-item label="收款时间" :span="2">{{ payment.paymentTime }}</el-descriptions-item>
      </el-descriptions>
      <el-alert type="warning" :closable="false" show-icon class="mb-3">
        <template #title>冲销后，该笔收款对应的全部核销将被撤销，相关应收的已收金额和支付状态将恢复。</template>
        <div>此操作不会删除原收款记录和核销记录，原收款将标记为“已冲销”，历史记录继续保留。</div>
        <div>本操作仅撤销系统中的收款及核销影响，不代表已实际向客户退还资金。</div>
      </el-alert>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="冲销原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入冲销原因（2~500字符）" />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button type="danger" :loading="submitting" @click="submit">确认冲销</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="resultVisible" title="冲销成功" width="720px" append-to-body>
    <el-result icon="success" title="冲销成功" sub-title="原收款与核销记录已保留，应收余额已按实际核销金额恢复" />
    <el-descriptions v-if="result" :column="2" border class="mb-3">
      <el-descriptions-item label="收款编号">{{ result.paymentNo }}</el-descriptions-item>
      <el-descriptions-item label="冲销单号">{{ result.reversalNo }}</el-descriptions-item>
      <el-descriptions-item label="冲销金额">¥ {{ money(result.reversalAmount) }}</el-descriptions-item>
      <el-descriptions-item label="受影响应收">{{ result.affectedReceivableCount }} 笔</el-descriptions-item>
      <el-descriptions-item label="冲销时间">{{ result.reversalTime }}</el-descriptions-item>
      <el-descriptions-item label="冲销原因">{{ result.reason }}</el-descriptions-item>
    </el-descriptions>
    <el-table v-if="result?.receivables?.length" :data="result.receivables" border max-height="300">
      <el-table-column label="应收编号" prop="receivableNo" min-width="180" />
      <el-table-column label="撤销核销" align="right"><template #default="s">¥ {{ money(s.row.reversedAllocationAmount) }}</template></el-table-column>
      <el-table-column label="恢复后已收" align="right"><template #default="s">¥ {{ money(s.row.paidAmountAfter) }}</template></el-table-column>
      <el-table-column label="恢复后未收" align="right"><template #default="s">¥ {{ money(s.row.outstandingAmountAfter) }}</template></el-table-column>
      <el-table-column label="恢复后状态"><template #default="s"><dict-tag :options="pm_payment_status" :value="s.row.paymentStatusAfter" /></template></el-table-column>
    </el-table>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reversePayment } from '@/api/property/charge/payment';
import type { PaymentReverseResultVO, PaymentVO } from '@/api/property/charge/payment/types';
import { useDict } from '@/utils/dict';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps<{ projectId?: number | string }>();
const emit = defineEmits<{ success: [result: PaymentReverseResultVO, payment: PaymentVO] }>();
const { pm_payment_status } = toRefs<any>(useDict('pm_payment_status'));
const visible = ref(false), resultVisible = ref(false), submitting = ref(false), payment = ref<PaymentVO>(), result = ref<PaymentReverseResultVO>(), dialogProjectId = ref<number | string>(), formRef = ref<FormInstance>();
const form = reactive({ reason: '' });
const rules: FormRules = { reason: [{ required: true, validator: (_rule, value: string, callback) => { const text = value?.trim() || ''; text.length >= 2 && text.length <= 500 ? callback() : callback(new Error('冲销原因长度必须在2到500字符之间')); }, trigger: 'blur' }] };
const money = (value?: number) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function open(row: PaymentVO) { if (row.status !== 'VALID') return ElMessage.warning('仅有效收款可以冲销'); if (!props.projectId || String(row.projectId) !== String(props.projectId)) return ElMessage.warning('当前项目已切换，请重新操作'); reset(); payment.value = row; dialogProjectId.value = props.projectId; visible.value = true; }
async function submit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid || !payment.value) return; if (!props.projectId || String(props.projectId) !== String(dialogProjectId.value) || String(payment.value.projectId) !== String(props.projectId)) { visible.value = false; return ElMessage.warning('当前项目已切换，请重新操作'); } submitting.value = true; try { const res = await reversePayment(payment.value.id, { reason: form.reason.trim() }); if (!visible.value || String(props.projectId) !== String(dialogProjectId.value)) return; result.value = res.data; const reversedPayment = payment.value; visible.value = false; resultVisible.value = true; emit('success', res.data, reversedPayment); } finally { submitting.value = false; } }
function reset() { form.reason = ''; payment.value = undefined; dialogProjectId.value = undefined; formRef.value?.clearValidate(); }
watch(() => props.projectId, () => { visible.value = false; resultVisible.value = false; result.value = undefined; reset(); });
defineExpose({ open, close: () => { visible.value = false; resultVisible.value = false; reset(); } });
</script>
