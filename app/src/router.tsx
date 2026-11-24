import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { TrackDetail } from './pages/TrackDetail';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login'; import { Register } from './pages/Register'; import { Profile } from './pages/Profile'; import { RequireAuth } from './auth/RequireAuth';
import { ForYou } from './pages/ForYou';

export const routes: RouteObject[] = [{
  element: <Layout />, errorElement: <NotFound unexpected />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/search', element: <Search /> },
    { path: '/tracks/:id', element: <TrackDetail /> },
    { path: '/login', element: <Login /> }, { path: '/register', element: <Register /> },
    { element: <RequireAuth />, children: [{ path: '/profile', element: <Profile /> }, { path: '/for-you', element: <ForYou /> }] },
    { path: '*', element: <NotFound /> },
  ],
}];
