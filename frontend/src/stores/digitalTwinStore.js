import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getCampusData } from '../api/digitalTwinApi';

// 创建数字孪生状态存储
export const useDigitalTwinStore = create(
  devtools(
    persist(
      (set, get) => ({
        campusData: null,
        selectedBuilding: null,
        isLoading: false,
        error: null,
        fetchController: null,

        // 获取园区3D数据
        fetchCampusData: async () => {
          try {
            // 取消之前的请求
            const currentController = get().fetchController;
            if (currentController) {
              currentController.abort();
            }
            const controller = new AbortController();
            set({ isLoading: true, error: null, fetchController: controller });
            const response = await getCampusData({ signal: controller.signal });
            set({ campusData: response.data, isLoading: false });
          } catch (err) {
            if (err.name === 'AbortError') {
              console.log('Fetch campus data aborted');
              return;
            }
            console.error('Failed to fetch campus data:', err);
            const errorMessage = err.response?.data?.message || err.message || '获取园区数据失败';
              set({ error: errorMessage, isLoading: false });
          }
        },

        // 设置选中的建筑物
        setSelectedBuilding: (buildingId) => {
          set({ selectedBuilding: buildingId });
        },

        // 手动设置园区数据
        setCampusData: (data) => {
          set({ campusData: data });
        }
      }),
      {
        name: 'digital-twin-storage',
        partialize: (state) => ({ selectedBuilding: state.selectedBuilding }),
      }
    )
  )
);

// 状态选择器
export const selectCampusData = (state) => state.campusData;
export const selectSelectedBuilding = (state) => state.selectedBuilding;
export const selectIsLoading = (state) => state.isLoading;
export const selectError = (state) => state.error;
export const selectDigitalTwinState = (state) => state;