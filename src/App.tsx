import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OperadorDashboard from './pages/OperadorDashboard';
import CoordinadorDashboard from './pages/CoordinadorDashboard';
import { authService } from './services/auth';

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Operador' | 'Coordinador';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getCurrentRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifica un rol requerido, verificar que coincida
  if (requiredRole && userRole !== requiredRole) {
    // Redirigir al dashboard correspondiente según el rol
    if (userRole === 'Operador') {
      return <Navigate to="/operador" replace />;
    } else if (userRole === 'Coordinador') {
      return <Navigate to="/coordinador" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta por defecto redirige a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Página de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route
          path="/operador"
          element={
            <ProtectedRoute requiredRole="Operador">
              <OperadorDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/coordinador"
          element={
            <ProtectedRoute requiredRole="Coordinador">
              <CoordinadorDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Ruta para manejar URLs no válidas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;