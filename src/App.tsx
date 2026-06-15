import { lazy } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import RailLayout from './components/RailLayout';
import HomePage from './pages/HomePage';
import { I18nProvider } from './i18n/I18nContext';

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
const UnitsPage = lazy(() => import('./pages/UnitsPage'));
const DatesPage = lazy(() => import('./pages/DatesPage'));
const SizesPage = lazy(() => import('./pages/SizesPage'));
const TripCostPage = lazy(() => import('./pages/TripCostPage'));
const QrPage = lazy(() => import('./pages/QrPage'));
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const IndicatorsPage = lazy(() => import('./pages/IndicatorsPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const BusinessDaysPage = lazy(() => import('./pages/BusinessDaysPage'));
const MortgagePage = lazy(() => import('./pages/MortgagePage'));
const SeverancePage = lazy(() => import('./pages/SeverancePage'));
const SellingPricePage = lazy(() => import('./pages/SellingPricePage'));
const ProPage = lazy(() => import('./pages/ProPage'));

// Layout raíz: el provider de i18n deriva el idioma de la URL, así que debe vivir dentro
// del router y por encima del riel. Envuelve ambos árboles (ES y /en).
function I18nLayout() {
  return (
    <I18nProvider>
      <Outlet />
    </I18nProvider>
  );
}

// Páginas del hub, con su subruta relativa (sin barra inicial) para poder montarlas tanto
// en la raíz (ES) como bajo `/en` (EN) reutilizando los mismos componentes.
const PAGE_ROUTES: RouteObject[] = [
  { path: 'convertir', element: <ConvertPage /> },
  { path: 'comprimir', element: <CompressPage /> },
  { path: 'editor', element: <EditorPage /> },
  { path: 'redimensionar', element: <ResizePage /> },
  { path: 'lote', element: <BatchPage /> },
  { path: 'pdf', element: <PdfPage /> },
  { path: 'crear', element: <CreatePage /> },
  { path: 'herramientas', element: <ToolsPage /> },
  { path: 'unidades', element: <UnitsPage /> },
  { path: 'fechas', element: <DatesPage /> },
  { path: 'tallas', element: <SizesPage /> },
  { path: 'costo-viaje', element: <TripCostPage /> },
  { path: 'qr', element: <QrPage /> },
  { path: 'cotizaciones', element: <QuotesPage /> },
  { path: 'indicadores', element: <IndicatorsPage /> },
  { path: 'sueldo-liquido', element: <PayrollPage /> },
  { path: 'dias-habiles', element: <BusinessDaysPage /> },
  { path: 'credito', element: <MortgagePage /> },
  { path: 'finiquito', element: <SeverancePage /> },
  { path: 'precio-venta', element: <SellingPricePage /> },
  { path: 'pro', element: <ProPage /> },
];

/** Riel + páginas para un idioma; el catch-all cae a la home de ESE idioma. */
function railTree(home: string): RouteObject {
  return {
    element: <RailLayout />,
    children: [
      { index: true, element: <HomePage /> },
      ...PAGE_ROUTES,
      { path: '*', element: <Navigate to={home} replace /> },
    ],
  };
}

const router = createBrowserRouter([
  {
    element: <I18nLayout />,
    children: [
      railTree('/'),
      { path: 'en', children: [railTree('/en')] },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
