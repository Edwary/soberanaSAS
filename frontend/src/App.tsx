/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Warehouse, 
  LogOut, 
  Plus, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface User {
  id: string | number;
  identification: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  assignedWarehouses?: Warehouse[];
}

interface Warehouse {
  code: string;
  description: string;
  status: string;
}

interface Product {
  code: string;
  description: string;
  inventory_unit: string;
  packaging_unit: string;
  conversion_factor: number;
}

interface InventoryRecord {
  id: number;
  count_number: number;
  cut_off_date: string;
  warehouse_code: string;
  warehouse_name: string;
  product_code: string;
  product_name: string;
  quantity_packaging: number;
  quantity_units: number;
  user_name: string;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'counts' | 'users' | 'reports'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form States
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [countForm, setCountForm] = useState({
    count_number: 1,
    cut_off_date: new Date().toISOString().split('T')[0],
    warehouse_code: '',
    product_code: '',
    quantity_packaging: 0
  });

  // Data States
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, view]);

  const fetchData = async () => {
    try {
      const [whRes, prodRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);
      setWarehouses(await whRes.json());
      setProducts(await prodRes.json());

      if (user?.role === 'admin') {
        const [usersRes, reportsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/reports')
        ]);
        setUsers(await usersRes.json());
        setReports(await reportsRes.json());
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setView('dashboard');
      } else {
        setMessage({ type: 'error', text: 'Credenciales incorrectas' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync-users', { method: 'POST' });
      const data = await res.json();
      setMessage({ type: 'success', text: `Sincronizados ${data.count} usuarios` });
      fetchData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al sincronizar' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...countForm, user_id: user.id })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Conteo registrado exitosamente' });
        setCountForm({ ...countForm, quantity_packaging: 0 });
      } else {
        setMessage({ type: 'error', text: 'Error al registrar conteo' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de red' });
    } finally {
      setLoading(false);
    }
  };

  const assignWarehouse = async (userId: number, whCode: string) => {
    try {
      await fetch('/api/assign-warehouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, warehouse_code: whCode })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-200"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
              <Warehouse className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Alimenta Bienestar</h1>
            <p className="text-stone-500 text-sm">Gestión de Inventarios Soberana SAS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Usuario</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Entrar al Sistema'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-bottom border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Warehouse className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-stone-800">Soberana SAS</span>
          </div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">Panel de Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setView('counts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'counts' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <ClipboardList className="w-5 h-5" />
            Registrar Conteo
          </button>

          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => setView('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'users' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                <Users className="w-5 h-5" />
                Usuarios
              </button>
              <button 
                onClick={() => setView('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'reports' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                <Search className="w-5 h-5" />
                Reportes
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-stone-600 font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-800 truncate">{user?.name}</p>
              <p className="text-xs text-stone-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setUser(null) || setView('login')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-stone-900">Bienvenido, {user?.name.split(' ')[0]}</h2>
                <p className="text-stone-500">Resumen del sistema de inventarios para hoy.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <p className="text-stone-500 text-sm font-medium">Bodegas Activas</p>
                  <p className="text-3xl font-bold text-stone-900">{warehouses.filter(w => w.status === 'Activo').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-stone-500 text-sm font-medium">Productos en Catálogo</p>
                  <p className="text-3xl font-bold text-stone-900">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <p className="text-stone-500 text-sm font-medium">Conteos Registrados</p>
                  <p className="text-3xl font-bold text-stone-900">{reports.length}</p>
                </div>
              </div>

              <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
                <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl font-bold mb-2">¿Listo para el conteo mensual?</h3>
                  <p className="text-emerald-100 mb-6 opacity-80">Recuerda que el corte es el último día del mes. Asegúrate de seleccionar la bodega correcta.</p>
                  <button 
                    onClick={() => setView('counts')}
                    className="bg-white text-emerald-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2"
                  >
                    Empezar Registro <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <Warehouse className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
              </div>
            </motion.div>
          )}

          {view === 'counts' && (
            <motion.div 
              key="counts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
                <div className="bg-stone-900 p-6 text-white">
                  <h3 className="text-xl font-bold">Registro de Conteo Físico</h3>
                  <p className="text-stone-400 text-sm">Diligencie las cantidades según la unidad de empaque.</p>
                </div>
                <form onSubmit={handleSubmitCount} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Número de Conteo</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={countForm.count_number}
                        onChange={e => setCountForm({ ...countForm, count_number: parseInt(e.target.value) })}
                      >
                        <option value={1}>Conteo 1</option>
                        <option value={2}>Conteo 2</option>
                        <option value={3}>Conteo 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Fecha de Corte</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={countForm.cut_off_date}
                        onChange={e => setCountForm({ ...countForm, cut_off_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Bodega</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={countForm.warehouse_code}
                      onChange={e => setCountForm({ ...countForm, warehouse_code: e.target.value })}
                    >
                      <option value="">Seleccione una bodega...</option>
                      {(user?.role === 'admin' ? warehouses : user?.assignedWarehouses || []).map(wh => (
                        <option key={wh.code} value={wh.code}>{wh.code} - {wh.description} ({wh.status})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Producto</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={countForm.product_code}
                      onChange={e => setCountForm({ ...countForm, product_code: e.target.value })}
                    >
                      <option value="">Seleccione un producto...</option>
                      {products.map(p => (
                        <option key={p.code} value={p.code}>{p.code} - {p.description}</option>
                      ))}
                    </select>
                  </div>

                  {countForm.product_code && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-stone-50 p-4 rounded-2xl border border-stone-100"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase">Unidad de Empaque</p>
                          <p className="text-lg font-bold text-stone-800">{products.find(p => p.code === countForm.product_code)?.packaging_unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-400 uppercase">Factor de Conversión</p>
                          <p className="text-lg font-bold text-stone-800">x{products.find(p => p.code === countForm.product_code)?.conversion_factor}</p>
                        </div>
                      </div>
                      
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Cantidad en {products.find(p => p.code === countForm.product_code)?.packaging_unit}s</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-4 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 outline-none text-2xl font-bold text-emerald-700"
                        value={countForm.quantity_packaging}
                        onChange={e => setCountForm({ ...countForm, quantity_packaging: parseFloat(e.target.value) || 0 })}
                      />
                      
                      <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Total Calculado en Unidades:</span>
                        <span className="text-2xl font-black text-stone-900">
                          {(countForm.quantity_packaging * (products.find(p => p.code === countForm.product_code)?.conversion_factor || 0)).toLocaleString()} UND
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <button 
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    Registrar Conteo Físico
                  </button>
                  
                  {message && (
                    <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      {message.text}
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          )}

          {view === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Gestión de Usuarios</h2>
                  <p className="text-stone-500">Administre los accesos y asigne bodegas a los operarios.</p>
                </div>
                <button 
                  onClick={handleSyncUsers}
                  disabled={loading}
                  className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Sincronizar Empleados
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Identificación</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Asignar Bodega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-stone-50 transition-all">
                        <td className="px-6 py-4 text-sm font-medium text-stone-600">{u.identification}</td>
                        <td className="px-6 py-4 text-sm font-bold text-stone-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-stone-500">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            className="text-xs border border-stone-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500"
                            onChange={(e) => assignWarehouse(u.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Asignar...</option>
                            {warehouses.map(wh => (
                              <option key={wh.code} value={wh.code}>{wh.description}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <header>
                <h2 className="text-2xl font-bold text-stone-900">Reporte de Conteos</h2>
                <p className="text-stone-500">Visualización detallada de todos los registros realizados.</p>
              </header>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Fecha/Hora</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Conteo #</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Bodega</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Cant. Empaque</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Cant. Unidades</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Operario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {reports.map(r => (
                        <tr key={r.id} className="hover:bg-stone-50 transition-all">
                          <td className="px-6 py-4 text-xs text-stone-500">
                            {new Date(r.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-stone-900">#{r.count_number}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-600">{r.warehouse_name}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-stone-900">{r.product_name}</p>
                            <p className="text-xs text-stone-400">Cod: {r.product_code}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-stone-900 text-right">
                            {r.quantity_packaging.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">
                            {r.quantity_units.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-500">{r.user_name}</td>
                        </tr>
                      ))}
                      {reports.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">
                            No hay registros de conteo disponibles.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
