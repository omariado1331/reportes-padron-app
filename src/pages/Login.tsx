import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { User, AlertCircle } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';

// Esquema de validación
const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  role: z.enum(['Operador', 'Coordinador'])
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const role = authService.getCurrentRole();
      if (role === 'Operador') {
        navigate('/operador');
      } else if (role === 'Coordinador') {
        navigate('/coordinador');
      }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'Operador'
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(data);
      // Redirigir según el rol
      if (data.role === 'Operador') {
        navigate('/operador');
      } else {
        navigate('/coordinador');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (error.message.includes('no tiene una estación asignada')) {
        setError(error.message);
      } else if (error.message.includes('no tiene el rol de')) {
        setError('El usuario no tiene el rol seleccionado');
      } else {
        setError(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-gray-800">
            REGISTRO EMPADRONAMIENTO
          </CardTitle>
          <p className="text-sm text-center text-gray-600">
            Sistema de gestión para operadores y coordinadores
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <Input
                label="Usuario"
                placeholder="Ingrese su usuario"
                {...register('username')}
                error={errors.username?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Contraseña"
                type="password"
                placeholder="Ingrese su contraseña"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <Select
                label="Rol"
                options={[
                  { value: 'Operador', label: 'Operador' },
                  { value: 'Coordinador', label: 'Coordinador' }
                ]}
                {...register('role')}
                error={errors.role?.message}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Seleccione su rol en el sistema
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-2">Información:</h4>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Operador:</strong> Ingresa reportes diarios y visualiza tu estación</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Coordinador:</strong> Supervisa operadores y gestiona registros</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-gray-500">
            © {new Date().getFullYear()} Sistema de Empadronamiento
          </p>
          <p className="text-xs text-center text-gray-500">
            Acceso restringido a personal autorizado
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;