import React, { useState, useEffect, useContext } from "react";
import { SimulatorContext } from "../../context/SimulatorContext";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function SystemControls() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [systemState, setSystemState] = useState(null);
  const { resetState } = useContext(SimulatorContext);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus('connected');
      return response.data;
    } catch (error) {
      setApiStatus('disconnected');
      return null;
    }
  };

  const getSystemState = async () => {
    try {
      const response = await axios.get(`${API_URL}/system/state`);
      setSystemState(response.data.data);
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
    }
  };

  const resetBackend = async () => {
    if (!confirm('⚠️ ¿Estás seguro de reiniciar completamente el sistema?\n\nEsto eliminará:\n- Todos los procesos\n- Memoria asignada\n- Solicitudes de E/S\n- Historial de ejecución')) {
      return;
    }

    try {
      // Reinicializar el kernel
      await axios.post(`${API_URL}/kernel/initialize`, {
        memory_mode: 'paging',
        total_memory: 1024
      });

      // Limpiar estado del frontend
      resetState();
      localStorage.clear();

      alert('✅ Sistema reiniciado completamente');
      window.location.reload();
    } catch (error) {
      console.error('Error reiniciando backend:', error);
      alert('❌ Error al reiniciar: ' + (error.response?.data?.message || error.message));
    }
  };

  const clearFrontendState = () => {
    if (confirm('🗑️ ¿Limpiar el estado del frontend?\n\nEsto NO afectará el backend.')) {
      resetState();
      localStorage.clear();
      alert('✅ Estado del frontend limpiado');
    }
  };

  useEffect(() => {
    checkHealth();
    getSystemState();

    const interval = setInterval(() => {
      checkHealth();
      if (apiStatus === 'connected') {
        getSystemState();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [apiStatus]);

  const getStatusBadge = () => {
    if (apiStatus === 'connected') {
      return {
        color: '#4caf50',
        icon: '🟢',
        text: 'Conectado',
        bg: '#e8f5e9'
      };
    } else if (apiStatus === 'checking') {
      return {
        color: '#ff9800',
        icon: '🟡',
        text: 'Verificando...',
        bg: '#fff3e0'
      };
    } else {
      return {
        color: '#f44336',
        icon: '🔴',
        text: 'Desconectado',
        bg: '#ffebee'
      };
    }
  };

  const badge = getStatusBadge();

  return (
    <div style={{
      background: 'white',
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: 20
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h3 style={{ margin: 0 }}>🎛️ Control del Sistema</h3>
        
        {/* Estado de la API */}
        <div style={{
          padding: '8px 16px',
          background: badge.bg,
          borderRadius: 20,
          border: `2px solid ${badge.color}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 'bold',
          fontSize: 14
        }}>
          <span style={{ fontSize: 16 }}>{badge.icon}</span>
          <span style={{ color: badge.color }}>{badge.text}</span>
        </div>
      </div>

      {/* Información del sistema */}
      {systemState && (
        <div style={{
          background: '#f5f5f5',
          padding: 15,
          borderRadius: 8,
          marginBottom: 15
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 15,
            fontSize: 14
          }}>
            <div>
              <div style={{ color: '#666', marginBottom: 5 }}>⏰ Reloj del Sistema</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2196f3' }}>
                {systemState.clock || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 5 }}>📋 Procesos Activos</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50' }}>
                {systemState.processes?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 5 }}>📡 Dispositivos E/S</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
                {systemState.io_devices?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 5 }}>🧠 Modo de Memoria</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#9c27b0', textTransform: 'uppercase' }}>
                {systemState.memory?.mode || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de control */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10
      }}>
        <button
          onClick={checkHealth}
          style={{
            padding: '12px 20px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          🔄 Verificar Conexión
        </button>

        <button
          onClick={clearFrontendState}
          style={{
            padding: '12px 20px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          🗑️ Limpiar Frontend
        </button>

        <button
          onClick={resetBackend}
          disabled={apiStatus !== 'connected'}
          style={{
            padding: '12px 20px',
            background: apiStatus === 'connected' ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: apiStatus === 'connected' ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          ⚠️ Reiniciar Sistema Completo
        </button>
      </div>

      {/* Ayuda */}
      <div style={{
        marginTop: 15,
        padding: 12,
        background: '#e3f2fd',
        borderRadius: 8,
        fontSize: 13,
        border: '1px solid #2196f3'
      }}>
        <strong>💡 Ayuda:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
          <li><strong>Limpiar Frontend:</strong> Elimina datos locales sin afectar el backend</li>
          <li><strong>Reiniciar Sistema:</strong> Reinicia completamente backend y frontend</li>
          <li><strong>Si el backend no responde:</strong> Verifica que esté ejecutándose en http://localhost:5000</li>
        </ul>
      </div>
    </div>
  );
}