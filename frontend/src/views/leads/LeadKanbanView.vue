<template>
  <div class="lead-kanban-container">
    <n-page-header title="線索漏斗管理" subtitle="追蹤潛在客戶轉換流程">
      <template #extra>
        <n-button type="primary" @click="showAddModal = true">新增線索</n-button>
      </template>
    </n-page-header>

    <n-grid :cols="5" :x-gap="12" class="kanban-grid">
      <n-gi v-for="status in statusList" :key="status.key">
        <div class="kanban-column">
          <div class="column-header">
            <n-text strong>{{ status.label }}</n-text>
            <n-badge :value="getLeadsByStatus(status.key).length" type="info" />
          </div>
          <div class="column-content">
            <n-card
              v-for="lead in getLeadsByStatus(status.key)"
              :key="lead.id"
              class="lead-card"
              size="small"
              hoverable
            >
              <template #header>
                <div class="card-header">
                  <n-text strong>{{ lead.name }}</n-text>
                </div>
              </template>
              <n-space vertical size="small">
                <n-text depth="3" size="small">{{ lead.phoneNumber || '無電話' }}</n-text>
                <n-tag size="tiny" :type="getSourceTagType(lead.source)">{{ lead.source || '未知來源' }}</n-tag>
                <n-text type="warning" size="small">預估: ${{ lead.estimatedValue }}</n-text>
              </n-space>
              <template #action>
                <n-space justify="space-between">
                  <n-button size="tiny" quaternary @click="handleEdit(lead)">編輯</n-button>
                  <n-dropdown
                    :options="getActionOptions(lead)"
                    @select="(key) => handleAction(key, lead)"
                  >
                    <n-button size="tiny" secondary>操作</n-button>
                  </n-dropdown>
                </n-space>
              </template>
            </n-card>
          </div>
        </div>
      </n-gi>
    </n-grid>

    <!-- 新增/編輯線索彈窗 -->
    <n-modal v-model:show="showAddModal" preset="card" :title="editingLead ? '編輯線索' : '新增線索'" style="width: 500px">
      <n-form :model="formModel" label-placement="left" label-width="80">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formModel.name" placeholder="請輸入姓名" />
        </n-form-item>
        <n-form-item label="電話" path="phoneNumber">
          <n-input v-model:value="formModel.phoneNumber" placeholder="請輸入電話" />
        </n-form-item>
        <n-form-item label="來源" path="source">
          <n-input v-model:value="formModel.source" placeholder="例如：FB, Google" />
        </n-form-item>
        <n-form-item label="預估價值" path="estimatedValue">
          <n-input-number v-model:value="formModel.estimatedValue" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="備註" path="notes">
          <n-input v-model:value="formModel.notes" type="textarea" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 轉化為病患彈窗 -->
    <n-modal v-model:show="showConvertModal" preset="dialog" title="轉化為正式病患" positive-text="確認轉化" negative-text="取消" @positive-click="handleConvert">
      <n-p>即將為 <strong>{{ targetLead?.name }}</strong> 建立正式病患檔案。</n-p>
      <n-form-item label="身分證號碼" required>
        <n-input v-model:value="idNumber" placeholder="請輸入身分證字號" />
      </n-form-item>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useMessage } from 'naive-ui';
import { leadsApi, type Lead, type CreateLeadDto } from '@/services/leads-api';

const message = useMessage();
const leads = ref<Lead[]>([]);
const showAddModal = ref(false);
const showConvertModal = ref(false);
const editingLead = ref<Lead | null>(null);
const targetLead = ref<Lead | null>(null);
const idNumber = ref('');
const saving = ref(false);

const statusList = [
  { key: 'new', label: '新線索' },
  { key: 'contacted', label: '已聯繫' },
  { key: 'consulted', label: '已諮詢' },
  { key: 'converted', label: '已轉化' },
  { key: 'lost', label: '已流失' },
];

const formModel = ref<CreateLeadDto>({
  name: '',
  phoneNumber: '',
  source: '',
  estimatedValue: 0,
  notes: '',
});

const loadLeads = async () => {
  try {
    const { data } = await leadsApi.findAll();
    leads.value = data;
  } catch (err) {
    message.error('載入線索失敗');
  }
};

const getLeadsByStatus = (status: string) => {
  return leads.value.filter(l => l.status === status);
};

const getSourceTagType = (source?: string) => {
  if (source?.toLowerCase().includes('fb')) return 'info';
  if (source?.toLowerCase().includes('google')) return 'success';
  return 'default';
};

const getActionOptions = (lead: Lead) => {
  const options = statusList
    .filter(s => s.key !== lead.status)
    .map(s => ({ label: `移至 ${s.label}`, key: s.key }));
  
  if (lead.status !== 'converted') {
    options.push({ label: '轉化為病患', key: 'convert' });
  }
  
  options.push({ label: '刪除線索', key: 'delete' });
  return options;
};

const handleAction = async (key: string, lead: Lead) => {
  if (key === 'delete') {
    if (confirm('確定要刪除此線索嗎？')) {
      await leadsApi.remove(lead.id);
      message.success('已刪除');
      loadLeads();
    }
  } else if (key === 'convert') {
    targetLead.value = lead;
    idNumber.value = '';
    showConvertModal.value = true;
  } else {
    await leadsApi.updateStatus(lead.id, key as any);
    message.success('狀態已更新');
    loadLeads();
  }
};

const handleEdit = (lead: Lead) => {
  editingLead.value = lead;
  formModel.value = {
    name: lead.name,
    phoneNumber: lead.phoneNumber,
    source: lead.source,
    estimatedValue: lead.estimatedValue,
    notes: lead.notes,
  };
  showAddModal.value = true;
};

const handleSave = async () => {
  saving.value = true;
  try {
    if (editingLead.value) {
      await leadsApi.update(editingLead.value.id, formModel.value);
      message.success('更新成功');
    } else {
      await leadsApi.create(formModel.value);
      message.success('新增成功');
    }
    showAddModal.value = false;
    loadLeads();
  } catch (err) {
    message.error('保存失敗');
  } finally {
    saving.value = false;
  }
};

const handleConvert = async () => {
  if (!idNumber.value) {
    message.warning('請輸入身分證號碼');
    return false;
  }
  try {
    await leadsApi.convert(targetLead.value!.id, idNumber.value);
    message.success('已成功轉化為正式病患');
    showConvertModal.value = false;
    loadLeads();
  } catch (err) {
    message.error('轉化失敗');
  }
};

onMounted(loadLeads);
</script>

<style scoped>
.lead-kanban-container {
  padding: 16px;
}
.kanban-grid {
  margin-top: 24px;
  height: calc(100vh - 200px);
}
.kanban-column {
  background-color: #f5f5f7;
  border-radius: 8px;
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}
.column-content {
  flex: 1;
  overflow-y: auto;
}
.lead-card {
  margin-bottom: 12px;
}
.card-header {
  font-size: 14px;
}
</style>
