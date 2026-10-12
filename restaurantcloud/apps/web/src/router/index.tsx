import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { WelcomePage } from '@/modules/cliente/pages/WelcomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <WelcomePage />,
      },
    ],
  },
]);
