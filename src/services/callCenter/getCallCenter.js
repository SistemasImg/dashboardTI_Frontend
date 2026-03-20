import api from '@/services/auth';

export const getAllCallCenters = async () => {
  try {
    const res = await api.get(`/callcenter`);
    return res.data;
  } catch (error) {
    console.error('Error function getAllCallCenters:', error);
    throw error;
  }
};
