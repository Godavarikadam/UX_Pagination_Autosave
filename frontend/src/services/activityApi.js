import { api } from './api';

// Get activity log
export const getActivities = () => {
  return api.get('/activity');
};

// Retry failed activity
export const retryActivity = (activityId) => {
  return api.post(`/activity/${activityId}/retry`);
};
