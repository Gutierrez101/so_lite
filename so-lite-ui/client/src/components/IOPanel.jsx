import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function IOPanel() {
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [processId, setProcessId] = useState(1);
  const [operation, setOperation] = useState("read");
  const [dataSize, setDataSize] = useState(1024);
  const [autoProcess, setAutoProcess] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const intervalRef = useRef(null);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/devices`);
      setDevices(response.data.data);
    } catch (error) {
      console.error("Error obteniendo dispositivos:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/statistics`);
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
    }
  };

  const createIORequest = async () => {
    if (!selectedDevice) {
      alert("⚠️ Selecciona un dispositivo");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/io/request`, {
        process_id: parseInt(processId),
        device_name: selectedDevice,
        operation: operation,
        data_size: parseInt(dataSize),
        priority: 5
      });
      
      const newRequest = {
        id: response.data.request_id,
        device: selectedDevice,
        process: processId,
        operation: operation,
        size: dataSize,
        time: new Date().toLocaleTimeString()
      };
      
      setRequestHistory(prev => [newRequest, ...prev].slice(0, 10));
      
      await fetchDevices();
      await fetchStatistics();
      
      console.log("✅ Solicitud creada:", response.data);
    } catch (error) {
      console.error("Error creando solicitud:", error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    }
  };

  const processIOQueues = async () => {
    try {
      const response = await axios.post(`${API_URL}/io/process`, {
        scheduler: "FCFS"
      });
      await fetchDevices();
      await fetchStatistics();
      console.log("✅ Colas procesadas:", response.data);
    } catch (error) {
      console.error("Error procesando colas:", error);
    }
  };

  const clearHistory = () => {
    setRequestHistory([]);
  };

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
    
    // Auto-refresh cada 2 segundos
    const refreshInterval = setInterval(() => {
      fetchDevices();
      fetchStatistics();
    }, 2000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Auto-procesamiento de colas
    if (autoProcess) {
      intervalRef.current = setInterval(() => {
        processIOQueues();
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoProcess]);

  const getDeviceIcon = (type) => {
    const icons = {
      "DISK": "💾",
      "PRINTER": "🖨️",
      "KEYBOARD": "⌨️",
      "NETWORK": "🌐",
      "USB": "🔌"
    };
    return icons[type] || "📡";
  };

  const getStatusColor = (status) => {
    const colors = {
      "IDLE": "#4caf50",
      "BUSY": "#ff9800",
      "ERROR": "#f44336"
    };
    return colors[status] || "#9e9e9e";
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h2>📡 Gestión de Dispositivos E/S</h2>
        <div style={{display: 'flex', gap: 10}}>
          <button 
            onClick={() => {fetchDevices(); fetchStatistics();}}
            style={{
              padding: '8px 16px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🔄 Actualizar
          </button>
          <button 
            onClick={clearHistory}
            style={{
              padding: '8px 16px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🗑️ Limpiar Historial
          </button>
        </div>
      </div>

      {/* Controles de Solicitud */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 20,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        color: 'white'
      }}>
        <h3 style={{marginTop: 0, color: 'white'}}>✨ Crear Nueva Solicitud de E/S</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 15,
          marginBottom: 15
        }}>
          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 600}}>
              Dispositivo:
            </label>
            <select 
              value={selectedDevice} 
              onChange={e => setSelectedDevice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '2px solid white',
                fontSize: 14
              }}
            >
              <option value="">Seleccionar...</option>
              {devices.map(dev => (
                <option key={dev.name} value={dev.name}>
                  {getDeviceIcon(dev.type)} {dev.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 600}}>
              Proceso ID:
            </label>
            <input 
              type="number" 
              min="1" 
              value={processId} 
              onChange={e => setProcessId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '2px solid white',
                fontSize: 14
              }}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 600}}>
              Operación:
            </label>
            <select 
              value={operation} 
              onChange={e => setOperation(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '2px solid white',
                fontSize: 14
              }}
            >
              <option value="read">📖 Lectura</option>
              <option value="write">✍️ Escritura</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 600}}>
              Tamaño (bytes):
            </label>
            <input 
              type="number" 
              min="512" 
              step="512"
              value={dataSize} 
              onChange={e => setDataSize(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '2px solid white',
                fontSize: 14
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={createIORequest}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              flex: 1
            }}
          >
            ➕ Crear Solicitud
          </button>

          <button 
            onClick={processIOQueues}
            style={{
              padding: '10px 20px',
              background: autoProcess ? '#4caf50' : 'white',
              color: autoProcess ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              flex: 1
            }}
          >
            ⚡ Procesar Colas Ahora
          </button>

          <button 
            onClick={() => setAutoProcess(!autoProcess)}
            style={{
              padding: '10px 20px',
              background: autoProcess ? '#f44336' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {autoProcess ? '⏸️ Detener Auto' : '▶️ Auto Procesar'}
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {statistics && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          padding: 20, 
          borderRadius: 12, 
          marginBottom: 20,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          color: 'white'
        }}>
          <h3 style={{marginTop: 0, color: 'white'}}>📊 Estadísticas del Sistema</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Total Solicitudes</div>
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>
                {statistics.total_requests}
              </div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Completadas</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#a5d6a7' }}>
                {statistics.completed_requests}
              </div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Pendientes</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ffcc80' }}>
                {statistics.pending_requests}
              </div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Interrupciones</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ce93d8' }}>
                {statistics.total_interrupts}
              </div>
            </div>
          </div>
          {statistics.avg_turnaround_time > 0 && (
            <div style={{ marginTop: 15, textAlign: 'center', paddingTop: 15, borderTop: '2px solid rgba(255,255,255,0.3)' }}>
              <strong>⏱️ Tiempo Promedio de Retorno: </strong>
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>
                {statistics.avg_turnaround_time.toFixed(2)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Historial de Solicitudes Recientes */}
      {requestHistory.length > 0 && (
        <div style={{ background: '#fff3e0', padding: 15, borderRadius: 12, marginBottom: 20 }}>
          <h3 style={{marginTop: 0}}>📜 Historial de Solicitudes Recientes</h3>
          <div style={{maxHeight: 200, overflowY: 'auto'}}>
            {requestHistory.map((req, idx) => (
              <div 
                key={idx}
                style={{
                  padding: 10,
                  background: 'white',
                  marginBottom: 8,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 13
                }}
              >
                <strong>#{req.id}</strong> - {req.device} | P{req.process} | {req.operation} | {req.size} bytes
                <div style={{fontSize: 11, color: '#666', marginTop: 3}}>{req.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispositivos */}
      <h3>🖥️ Dispositivos Disponibles</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 15 
      }}>
        {devices.map((device) => (
          <div
            key={device.name}
            style={{
              padding: 20,
              borderRadius: 12,
              background: 'white',
              border: `3px solid ${getStatusColor(device.status)}`,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 48, marginBottom: 10, textAlign: 'center' }}>
              {getDeviceIcon(device.type)}
            </div>
            <h4 style={{ margin: '5px 0', textAlign: 'center', fontSize: 18 }}>{device.name}</h4>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 15, textAlign: 'center' }}>
              {device.type}
            </div>
            
            <div style={{ 
              padding: '8px 12px', 
              borderRadius: 6, 
              background: getStatusColor(device.status),
              color: 'white',
              textAlign: 'center',
              marginBottom: 15,
              fontWeight: 'bold',
              fontSize: 14
            }}>
              {device.status}
            </div>

            <div style={{ fontSize: 14, borderTop: '2px solid #f0f0f0', paddingTop: 10 }}>
              <div style={{marginBottom: 8}}>
                <strong>📋 Cola:</strong> 
                <span style={{
                  float: 'right',
                  padding: '2px 8px',
                  background: device.queue_length > 0 ? '#ff9800' : '#4caf50',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {device.queue_length}
                </span>
              </div>
              <div style={{marginBottom: 8}}>
                <strong>✅ Operaciones:</strong> 
                <span style={{float: 'right', fontWeight: 'bold'}}>{device.total_operations}</span>
              </div>
              
              {device.current_request && (
                <div style={{ 
                  marginTop: 10, 
                  padding: 8, 
                  background: '#fff3e0', 
                  borderRadius: 6,
                  border: '2px solid #ff9800',
                  animation: 'pulse 1.5s infinite'
                }}>
                  <strong>🔄 Procesando:</strong> #{device.current_request}
                </div>
              )}
              
              {device.avg_waiting_time > 0 && (
                <div style={{marginTop: 8, fontSize: 12, color: '#666'}}>
                  <strong>⏱️ Espera Promedio:</strong> {device.avg_waiting_time.toFixed(2)}s
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}