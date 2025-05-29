import { getAllStories, getAllStoriesWithLocation } from '../../data/api.js';

const DashboardPresenter = {
  async getAllStories() {
    return await getAllStories();
  },
  
  async getAllStoriesWithLocation() {
    return await getAllStoriesWithLocation();
  }
};

export default DashboardPresenter;