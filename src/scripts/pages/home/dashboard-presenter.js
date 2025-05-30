import { getAllStories, getAllStoriesWithLocation, getStoryDetail } from '../../data/api.js';

const DashboardPresenter = {
  async getAllStories() {
    return await getAllStories();
  },
  
  async getAllStoriesWithLocation() {
    return await getAllStoriesWithLocation();
  },
  
  async getStoryDetail(id) {
    return await getStoryDetail(id);
  }
};

export default DashboardPresenter;