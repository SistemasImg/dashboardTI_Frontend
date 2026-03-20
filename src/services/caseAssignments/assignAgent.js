import api from '@/services/auth';

export const assignAgents = async (payload) => {
  try {
    const response = await api.post('/assign/agent', payload);
    return await response.data;
  } catch (error) {
    console.error('Error function assignAgents:', error);
    throw error;
  }
};
