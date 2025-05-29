import { addNewStory } from '../../data/api.js';

const AddStoryPresenter = {
  async addNewStory({ description, photo, audioRecording = null, lat = null, lon = null }) {
    return await addNewStory({ description, photo, audioRecording, lat, lon });
  }
};

export default AddStoryPresenter;