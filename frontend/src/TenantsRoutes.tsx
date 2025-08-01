import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SelectTenant from 'pages/SelectTenant/SelectTenant'
import AuthLayout from 'layouts/AuthLayout'
import { routes } from 'routes/routes'
import UniversalConfigurations from 'pages/UniversalConfigurations/UniversalConfigurations'

const TenantsRoutes = () => {
  return (
    <AuthLayout>
      <Routes>
        <Route path={routes.home} element={<SelectTenant />} />
        <Route path={routes.universalConfigurations} element={<UniversalConfigurations />} />
        <Route path='*' element={<SelectTenant />} />
      </Routes>
    </AuthLayout>
  )
}

export default TenantsRoutes
