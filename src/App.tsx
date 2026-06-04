import { lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import RailLayout from './components/RailLayout';

// Rutas cargadas de forma diferida: cada página es su propio chunk, así el bundle
// inicial se mantiene liviano a medida que crece el número de funciones.
const ConvertPage = lazy(() => import('./pages/ConvertPage'));
const CompressPage = lazy(() => import('./pages/CompressPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const ResizePage = lazy(() => import('./pages/ResizePage'));
const BatchPage = lazy(() => import('./pages/BatchPage'));
const PdfPage = lazy(() => import('./pages/PdfPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));

// El riel lateral es el layout persistente que envuelve todas las rutas.
const router = createBrowserRouter([
  {
    element: <RailLayout />,
    children: [
      { index: true, element: <Navigate to="/convertir" replace /> },
      { path: '/convertir', element: <ConvertPage /> },
      { path: '/comprimir', element: <CompressPage /> },
      { path: '/editor', element: <EditorPage /> },
      { path: '/redimensionar', element: <ResizePage /> },
      { path: '/lote', element: <BatchPage /> },
      { path: '/pdf', element: <PdfPage /> },
      { path: '/crear', element: <CreatePage /> },
      { path: '/herramientas', element: <ToolsPage /> },
      { path: '*', element: <Navigate to="/convertir" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
