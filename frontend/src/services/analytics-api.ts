import api from './api';

export interface DistributionData {
  value: string;
  count: number;
}

export interface RevenueForecast {
  averageMonthlyRevenue: number;
  potentialActiveRevenue: number;
  forecastNextMonth: number;
}

export const analyticsApi = {
  getDistribution: (key: string) => api.get<DistributionData[]>(`/analytics/distribution?key=${key}`),
  getForecast: () => api.get<RevenueForecast>('/analytics/forecast'),
};
