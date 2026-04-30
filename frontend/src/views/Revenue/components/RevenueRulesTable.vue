<template>
  <div class="rules-table-container">
    <n-data-table
      :columns="ruleColumns"
      :data="revenueRules"
      :loading="loadingRules"
      :pagination="pagination"
      :row-key="(row) => row.id"
    />

    <!-- 新增規則模態框 -->
    <n-modal
      v-model:show="showCreateRuleModal"
      preset="dialog"
      title="新增分潤規則"
      positive-text="確認"
      negative-text="取消"
      @positive-click="handleCreateRule"
    >
      <n-form ref="ruleFormRef" :model="ruleFormValue" :rules="ruleRules">
        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="ruleFormValue.role"
            :options="roleOptions"
            placeholder="請選擇適用角色"
          />
        </n-form-item>
        <n-form-item label="規則類型" path="ruleType">
          <n-select
            v-model:value="ruleFormValue.ruleType"
            :options="ruleTypeOptions"
            placeholder="請選擇規則類型"
          />
        </n-form-item>
        <n-form-item label="生效日期" path="effectiveFrom">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveFrom"
            type="date"
            style="width: 100%"
            placeholder="請選擇生效日期"
          />
        </n-form-item>
        <n-form-item label="失效日期" path="effectiveTo">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveTo"
            type="date"
            style="width: 100%"
            placeholder="請選擇失效日期（可選）"
            clearable
          />
        </n-form-item>
        
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="ruleFormValue.description"
            type="textarea"
            placeholder="請輸入規則描述（可選）"
            :autosize="{ minRows: 2, maxRows: 5 }"
          />
        </n-form-item>
        
        <!-- 動態規則參數字段 -->
        <n-form-item v-if="showPercentageField" label="百分比 (%)" path="rulePayload.percentage">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.percentage"
            :min="0"
            :max="100"
            :step="0.1"
            placeholder="請輸入百分比"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showFixedField" label="固定金額" path="rulePayload.amount">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.amount"
            :min="0"
            :step="100"
            placeholder="請輸入固定金額"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showTieredFields" label="階梯設定" path="rulePayload.tiers">
          <div style="width: 100%">
            <div v-for="(tier, index) in ruleFormValue.rulePayload.tiers" :key="index" style="margin-bottom: 12px; display: flex; gap: 8px;">
              <n-input-number
                v-model:value="tier.threshold"
                :min="0"
                :step="1000"
                placeholder="門檻金額"
                style="flex: 1"
              />
              <n-input-number
                v-model:value="tier.percentage"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比 (%)"
                style="flex: 1"
              />
              <n-button
                size="small"
                @click="removeTier(index)"
                :disabled="ruleFormValue.rulePayload.tiers.length <= 1"
              >
                移除
              </n-button>
            </div>
            <n-button @click="addTier" size="small">添加階梯</n-button>
          </div>
        </n-form-item>
        
        <n-form-item label="是否啟用" path="isActive">
          <n-switch v-model:value="ruleFormValue.isActive" />
        </n-form-item>
      </n-form>
    </n-modal>
    
    <!-- 編輯規則模態框 -->
    <n-modal
      v-model:show="showEditRuleModal"
      preset="dialog"
      title="編輯分潤規則"
      positive-text="確認"
      negative-text="取消"
      @positive-click="handleUpdateRule"
    >
      <n-form ref="ruleFormRef" :model="ruleFormValue" :rules="ruleRules">
        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="ruleFormValue.role"
            :options="roleOptions"
            placeholder="請選擇適用角色"
          />
        </n-form-item>
        <n-form-item label="規則類型" path="ruleType">
          <n-select
            v-model:value="ruleFormValue.ruleType"
            :options="ruleTypeOptions"
            placeholder="請選擇規則類型"
          />
        </n-form-item>
        <n-form-item label="生效日期" path="effectiveFrom">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveFrom"
            type="date"
            style="width: 100%"
            placeholder="請選擇生效日期"
          />
        </n-form-item>
        <n-form-item label="失效日期" path="effectiveTo">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveTo"
            type="date"
            style="width: 100%"
            placeholder="請選擇失效日期（可選）"
            clearable
          />
        </n-form-item>
        
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="ruleFormValue.description"
            type="textarea"
            placeholder="請輸入規則描述（可選）"
            :autosize="{ minRows: 2, maxRows: 5 }"
          />
        </n-form-item>
        
        <!-- 動態規則參數字段 -->
        <n-form-item v-if="showPercentageField" label="百分比 (%)" path="rulePayload.percentage">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.percentage"
            :min="0"
            :max="100"
            :step="0.1"
            placeholder="請輸入百分比"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showFixedField" label="固定金額" path="rulePayload.amount">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.amount"
            :min="0"
            :step="100"
            placeholder="請輸入固定金額"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showTieredFields" label="階梯設定" path="rulePayload.tiers">
          <div style="width: 100%">
            <div v-for="(tier, index) in ruleFormValue.rulePayload.tiers" :key="index" style="margin-bottom: 12px; display: flex; gap: 8px;">
              <n-input-number
                v-model:value="tier.threshold"
                :min="0"
                :step="1000"
                placeholder="門檻金額"
                style="flex: 1"
              />
              <n-input-number
                v-model:value="tier.percentage"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比 (%)"
                style="flex: 1"
              />
              <n-button
                size="small"
                @click="removeTier(index)"
                :disabled="ruleFormValue.rulePayload.tiers.length <= 1"
              >
                移除
              </n-button>
            </div>
            <n-button @click="addTier" size="small">添加階梯</n-button>
          </div>
        </n-form-item>
        
        <n-form-item label="是否啟用" path="isActive">
          <n-switch v-model:value="ruleFormValue.isActive" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  NDataTable, NModal, NForm, NFormItem, NSelect, NDatePicker,
  NInput, NInputNumber, NSwitch, NButton
} from 'naive-ui';
import { useRevenue } from '@/composables/useRevenue';

const {
  ruleColumns,
  revenueRules,
  loadingRules,
  showCreateRuleModal,
  showEditRuleModal,
  ruleFormRef,
  ruleFormValue,
  roleOptions,
  ruleTypeOptions,
  ruleRules,
  showPercentageField,
  showFixedField,
  showTieredFields,
  handleCreateRule,
  handleUpdateRule,
  addTier,
  removeTier
} = useRevenue();

const pagination = {
  pageSize: 10,
};
</script>
