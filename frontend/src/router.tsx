import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/layout/AppShell'
import { CompanyModule } from '@/modules/CompanyModule'
import { TrafficModule } from '@/modules/TrafficModule'
import { ConversionModule } from '@/modules/ConversionModule'
import { ValueModule } from '@/modules/ValueModule'
import { RecurringModule } from '@/modules/RecurringModule'
import { CostsModule } from '@/modules/CostsModule'
import { RewardModule } from '@/modules/RewardModule'
import { RevenueXRay } from '@/dashboards/RevenueXRay'
import { FunnelMap } from '@/dashboards/FunnelMap'
import { ProductGPMap } from '@/dashboards/ProductGPMap'
import { ScenarioSimulator } from '@/dashboards/ScenarioSimulator'
import { ActionPlan } from '@/dashboards/ActionPlan'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/inputs/company" replace /> },
      { path: 'inputs/company', element: <CompanyModule /> },
      { path: 'inputs/traffic', element: <TrafficModule /> },
      { path: 'inputs/conversion', element: <ConversionModule /> },
      { path: 'inputs/value', element: <ValueModule /> },
      { path: 'inputs/recurring', element: <RecurringModule /> },
      { path: 'inputs/costs', element: <CostsModule /> },
      { path: 'inputs/reward', element: <RewardModule /> },
      { path: 'dashboards/xray', element: <RevenueXRay /> },
      { path: 'dashboards/funnelmap', element: <FunnelMap /> },
      { path: 'dashboards/product', element: <ProductGPMap /> },
      { path: 'dashboards/simulator', element: <ScenarioSimulator /> },
      { path: 'dashboards/plan', element: <ActionPlan /> },
      { path: '*', element: <Navigate to="/inputs/company" replace /> },
    ],
  },
])
