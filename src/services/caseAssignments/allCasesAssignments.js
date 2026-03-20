import api from '@/services/auth';

export const casesAssignmentsAll = async (filters = {}) => {
  try {
    const res = await api.get(`/assign/`, { params: filters });
    return res.data;
  } catch (error) {
    console.error('Error function casesAssignmentsAll:', error);
    throw error;
  }
};
