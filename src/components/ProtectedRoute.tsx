import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Operador' | 'Coordinador';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login'
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userRole, setUserRole] = useState<'Operador' | 'Coordinador' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        const role = authService.getCurrentRole();
        const user = authService.getCurrentUser();

        if (!authenticated) {
          setIsValid(false);
          setIsChecking(false);
          return;
        }

        // Verificar rol si es requerido
        if (requiredRole && role !== requiredRole) {
          // Verificar que los datos del rol sean válidos
          if (requiredRole === 'Operador' && !user?.operador) {
            setIsValid(false);
          } else if (requiredRole === 'Coordinador' && !user?.coordinador) {
            setIsValid(false);
          } else {
            setUserRole(role);
            setIsValid(true);
          }
        } else {
          setUserRole(role);
          setIsValid(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando autenticación...</p>
      </div>
    );
  }

  if (!isValid) {
    // Si no está autenticado, redirige al login
    if (!authService.isAuthenticated()) {
      return <Navigate to={redirectTo} replace />;
    }

    // Si está autenticado pero con rol incorrecto
    if (requiredRole && userRole) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta sección.
              Tu rol actual es: <span className="font-semibold">{userRole}</span>
            </p>
            <div className="space-y-3">
              {userRole === 'Operador' && (
                <a
                  href="/operador"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Ir a Panel de Operador
                </a>
              )}
              {userRole === 'Coordinador' && (
                <a
                  href="/coordinador"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Ir a Panel de Coordinador
                </a>
              )}
              <button
                onClick={() => {
                  authService.logout();
                  window.location.href = '/login';
                }}
                className="block w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;