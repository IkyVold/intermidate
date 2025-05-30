import { getStoryDetail } from '../../data/api.js';

const BookmarkPresenter = {
  getBookmarkedStories() {
    return JSON.parse(localStorage.getItem('bookmarkedStories')) || [];
  },

  async getStoryDetail(id) {
    return await getStoryDetail(id);
  }
};

export default BookmarkPresenter;