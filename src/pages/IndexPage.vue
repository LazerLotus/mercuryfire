<template>
  <q-page class="row q-pt-xl">
    <div class="full-width q-px-xl">
      <div class="q-mb-xl">
        <q-input
          v-model="tempData.name"
          label="姓名"
          :rules="[(val) => !!val?.trim() || '姓名不得為空']"
          lazy-rules
        />
        <q-input
          v-model="tempData.age"
          label="年齡"
          type="number"
          :rules="[
            (val) => !!val || '年齡不得為空',
            (val) => val > 0 || '年齡必須為正整數',
            (val) => Number.isInteger(Number(val)) || '年齡必須為整數',
          ]"
          lazy-rules
        />
        <q-btn color="primary" class="q-mt-md" @click="handleAddData"
          >新增</q-btn
        >
      </div>

      <q-table
        flat
        bordered
        ref="tableRef"
        :rows="filteredData"
        :columns="(tableConfig as QTableProps['columns'])"
        row-key="id"
        :pagination="pagination"
        :filter="filter"
        @request="onRequest"
        binary-state-sort
        hide-pagination
        separator="cell"
        :rows-per-page-options="[0]"
      >
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
            <q-th></q-th>
          </q-tr>
        </template>
        <template v-slot:top>
          <div class="row full-width">
            <div class="col-6">
              <q-input
                v-model="searchText"
                placeholder="搜尋姓名..."
                dense
                outlined
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              style="min-width: 120px"
            >
              <div v-if="!isEditing(props.row.id, col.name)">
                {{ col.value }}
              </div>
              <q-input
                v-else
                v-model="props.row[col.name]"
                dense
                outlined
                :type="col.name === 'age' ? 'number' : 'text'"
                :rules="
                  col.name === 'age'
                    ? [
                        (val) => !!val || '年齡不得為空',
                        (val) => val > 0 || '年齡必須為正整數',
                        (val) =>
                          Number.isInteger(Number(val)) || '年齡必須為整數',
                      ]
                    : [(val) => !!val?.trim() || '姓名不得為空']
                "
                lazy-rules
              />
            </q-td>
            <q-td class="text-right" auto-width>
              <q-btn
                @click="handleClickOption(btn, props.row)"
                v-for="(btn, index) in tableButtons(props.row.id)"
                :key="index"
                size="sm"
                :color="btn.color"
                round
                dense
                :icon="btn.icon"
                class="q-ml-md"
                padding="5px 5px"
              >
                <q-tooltip
                  transition-show="scale"
                  transition-hide="scale"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[10, 10]"
                >
                  {{ btn.label }}
                </q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
        <template v-slot:no-data="{ icon }">
          <div
            class="full-width row flex-center items-center text-primary q-gutter-sm"
            style="font-size: 18px"
          >
            <q-icon size="2em" :name="icon" />
            <span> 無相關資料 </span>
          </div>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { QTableProps } from 'quasar';
import { ref, onMounted, computed } from 'vue';
import { getAllData, createData, updateData, deleteData } from '../api/api';
import { useQuasar } from 'quasar';

interface btnType {
  label: string;
  icon: string;
  status: string;
  color?: string;
}

interface TableData {
  id: number;
  name: string;
  age: number;
}
const filter = ref('');

// 由於沒有使用Get API，先暫時使用 mock data
const blockData = ref<TableData[]>([
  {
    id: 1,
    name: 'test',
    age: 18,
  },
  {
    id: 2,
    name: 'test2',
    age: 19,
  },
]);
const tableConfig = ref([
  {
    label: '姓名',
    name: 'name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    label: '年齡',
    name: 'age',
    field: 'age',
    align: 'left',
    sortable: true,
  },
]);

const tempData = ref({
  name: '',
  age: '',
});

const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await getAllData();
    console.log(data);
    blockData.value = data as unknown as TableData[];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

interface EditingState {
  [key: number]: Set<string>;
}

const editingIds = ref<EditingState>({});

const isEditing = (rowId: number, colName: string) => {
  return editingIds.value[rowId]?.has(colName);
};

const originalData = ref<TableData | null>(null);

const $q = useQuasar();

const handleClickOption = async (btn: btnType, data: TableData) => {
  switch (btn.status) {
    case 'delete':
      $q.dialog({
        title: '確認刪除',
        message: '確定要刪除此筆資料嗎？',
        persistent: true,
        ok: {
          label: '確定',
          color: 'negative',
        },
        cancel: {
          label: '取消',
          color: 'grey',
        },
      }).onOk(async () => {
        try {
          await deleteData(data.id.toString());
          await fetchData();
          $q.notify({
            type: 'positive',
            message: '刪除成功',
          });
        } catch (error) {
          console.error('Delete failed:', error);
          $q.notify({
            type: 'negative',
            message: '刪除失敗',
          });
        }
      });
      break;

    case 'edit':
      originalData.value = { ...data };
      if (!editingIds.value[data.id]) {
        editingIds.value[data.id] = new Set();
      }
      tableConfig.value.forEach((col) => {
        editingIds.value[data.id].add(col.name);
      });
      break;

    case 'save':
      try {
        if (!data.name || !data.age) {
          console.error('請填寫所有欄位');
          return;
        }

        await updateData({
          id: data.id,
          name: data.name,
          age: Number(data.age),
        });
        await fetchData();
        delete editingIds.value[data.id];
      } catch (error) {
        console.error('更新失敗:', error);
        $q.notify({ type: 'negative', message: '更新失敗' });
      }
      break;

    case 'cancel':
      if (originalData.value) {
        const index = blockData.value.findIndex((item) => item.id === data.id);
        if (index !== -1) {
          blockData.value[index] = { ...originalData.value };
        }
      }
      delete editingIds.value[data.id];
      originalData.value = null;
      break;
  }
};

const handleAddData = async () => {
  try {
    // Validate inputs
    if (!tempData.value.name || !tempData.value.age) {
      console.error('Please fill in all fields');
      return;
    }

    // Create new data
    await createData({
      name: tempData.value.name,
      age: Number(tempData.value.age),
    });

    // Reset form
    tempData.value = {
      name: '',
      age: '',
    };

    // Refresh table data
    await fetchData();
  } catch (error) {
    $q.notify({ type: 'negative', message: '新增失敗' });
    console.error('Failed to add data:', error);
  }
};

const searchText = ref('');

const ageFilter = ref('');

const filteredData = computed(() => {
  let data = [...blockData.value];

  // Apply name search
  if (searchText.value) {
    data = data.filter((row) =>
      row.name.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }

  // Apply age filter
  if (ageFilter.value) {
    data = data.filter((row) => row.age === Number(ageFilter.value));
  }

  // Apply sorting
  if (pagination.value.sortBy) {
    const sortBy = pagination.value.sortBy as keyof TableData;
    data.sort((a, b) => {
      const direction = pagination.value.descending ? -1 : 1;
      return a[sortBy] > b[sortBy] ? direction : -direction;
    });
  }

  return data;
});

const tableButtons = computed(() => (rowId: number) => {
  if (editingIds.value[rowId]) {
    return [
      {
        label: '儲存',
        icon: 'save',
        status: 'save',
        color: 'primary',
      },
      {
        label: '取消',
        icon: 'close',
        status: 'cancel',
        color: 'grey-6',
      },
    ];
  }
  return [
    {
      label: '編輯',
      icon: 'edit',
      status: 'edit',
      color: 'primary',
    },
    {
      label: '刪除',
      icon: 'delete',
      status: 'delete',
      color: 'negative',
    },
  ];
});

const pagination = ref({
  sortBy: 'name',
  descending: false,
});

const onRequest = (props: { pagination: typeof pagination.value }) => {
  pagination.value = props.pagination;
};
</script>

<style lang="scss" scoped>
.q-table th {
  font-size: 20px;
  font-weight: bold;
}

.q-table tbody td {
  font-size: 18px;
}
</style>
