import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { TrackDetail } from './pages/TrackDetail';
import { NotFound } from './pages/NotFound';

export const routes: RouteObject[] = [{
  element: <Layout />, errorElement: <NotFound unexpected />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/search', element: <Search /> },
    { path: '/tracks/:id', element: <TrackDetail /> },
    { path: '*', element: <NotFound /> },
  ],
}];
