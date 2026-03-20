import api from '@/services/auth';

export const getAllUsers = async (filters = {}) => {
  try {
    const res = await api.get('/users/all', {
      params: filters,
    });
    return res.data;
  } catch (error) {
    console.error('Error function getAllUsers:', error);
    throw error;
  }
};
