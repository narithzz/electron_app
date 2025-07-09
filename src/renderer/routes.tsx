import { lazy, Suspense } from 'react'
import { Route, Navigate } from 'react-router-dom'

import { Router } from 'lib/electron-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthenticatedLayout } from './components/AuthenticatedLayout'
import { MinimalLoader } from './components/LoadingSpinner'

// Lazy load screens for better performance and to trigger Suspense
const LoginScreen = lazy(() => import('./screens/login.screen').then(module => ({ default: module.LoginScreen })))
const DashboardScreen = lazy(() => import('./screens/dashboard.screen').then(module => ({ default: module.DashboardScreen })))
const AboutScreen = lazy(() => import('./screens/about.screen').then(module => ({ default: module.AboutScreen })))
const TodosScreen = lazy(() => import('./screens/todos.screen').then(module => ({ default: module.TodosScreen })))
const ExampleUsageScreen = lazy(() => import('./screens/example-usage.screen').then(module => ({ default: module.ExampleUsageScreen })))
const CsvUploadScreen = lazy(() => import('./screens/csv-upload.screen').then(module => ({ default: module.CsvUploadScreen })))
const DatabaseTestScreen = lazy(() => import('./screens/database-test.screen').then(module => ({ default: module.DatabaseTestScreen })))
const AdminScreen = lazy(() => import('./screens/admin.screen').then(module => ({ default: module.AdminScreen })))
const LoginHistoryScreen = lazy(() => import('./screens/login-history.screen'))

export function Routes() {
  return (
    <AuthProvider>
      <Router
        main={
          <>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<MinimalLoader />}>
                  <LoginScreen />
                </Suspense>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <DashboardScreen />
                  </Suspense>
                }
              />

              <Route
                path="about"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <AboutScreen />
                  </Suspense>
                }
              />

              <Route
                path="todos"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <TodosScreen />
                  </Suspense>
                }
              />

              <Route
                path="example-usage"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <ExampleUsageScreen />
                  </Suspense>
                }
              />

              <Route
                path="csv-upload"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <CsvUploadScreen />
                  </Suspense>
                }
              />

              <Route
                path="database-test"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <DatabaseTestScreen />
                  </Suspense>
                }
              />

              <Route
                path="admin"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <AdminScreen />
                  </Suspense>
                }
              />

              <Route
                path="login-history"
                element={
                  <Suspense fallback={<MinimalLoader />}>
                    <LoginHistoryScreen />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        }
      />
    </AuthProvider>
  )
}
