import { create } from 'zustand';
import { getCampusData } from '../services/digitalTwinApi';

const useDigitalTwinStore = create((set) => ({
  campusData: [],
  selectedBuilding: null,
  error: null,
  isLoading: false,

  fetchCampusData: async () => {
    set({ isLoading: true, error: null });
    console.log('开始获取园区数据...');
    try {
      const data = await getCampusData();
      set({ campusData: data, isLoading: false });
      console.log('园区数据获取成功:', data);
    } catch (error) {
      set({ error: error.message || '获取园区数据失败', isLoading: false });
      console.error('园区数据获取失败:', error);
    }
  },

  setSelectedBuilding: (buildingId) => set({ selectedBuilding: buildingId }),

  setCampusData: (data) => set({ campusData: data })
}));

export default useDigitalTwinStore;