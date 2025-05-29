import loginPage from '../pages/login/login-page';
import registerPage from '../pages/register/register-page';
import DashboardPage from '../pages/home/dashboard-page';
import AddStoryPage from '../pages/add/add-story-page.js';

const routes = {
  '/login': new loginPage(),
  '/register': new registerPage(),
  '/dashboard': new DashboardPage(),
  '/add-story': new AddStoryPage(),
};

export default routes;
