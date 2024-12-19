import axios from 'axios';

interface TableData {
  id: number;
  name: string;
  age: number;
}

const BASE_URL = 'https://dahua.metcfire.com.tw/api/CRUDTest';

// 查詢所有資料
export const getAllData = async (): Promise<TableData[]> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/a`);
    return data;
  } catch (error) {
    console.error('查詢失敗:', error);
    throw error;
  }
};

type CreateData = Omit<TableData, 'id'>;

// 新增資料
export const createData = async (data: CreateData): Promise<TableData> => {
  try {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('新增失敗:', error);
    throw error;
  }
};

// 修改資料
export const updateData = async (data: TableData): Promise<void> => {
  try {
    const response = await axios.patch(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('修改失敗:', error);
    throw error;
  }
};

// 刪除資料
export const deleteData = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error('刪除失敗:', error);
    throw error;
  }
};
