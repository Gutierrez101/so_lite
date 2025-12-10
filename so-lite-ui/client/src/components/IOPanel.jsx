import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function IOPanel() {
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [processId, setProcessId] = useState(1);

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
      alert("Selecciona un dispositivo");
      return;
    }

    try {
      await axios.post(`${API_URL}/io/request`, {
        process_id: processId,
        device_name: selectedDevice,
        operation: "read",
        data_size: 1024,
        priority: 5
      });
      alert("Solicitud de E/S creada");
      fetchDevices();
    } catch (error) {
      console.error("Error creando solicitud:", error);
      alert("Error: " + error.message);
    }
  };

  const processIOQueues = async () => {
    try {
      await axios.post(`${API_URL}/io/process`, {
        scheduler: "FCFS"
      });
      fetchDevices();
      fetchStatistics();
    } catch (error) {
      console.error("Error procesando colas:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
    const interval = setInterval(() => {
      fetchDevices();
      fetchStatistics();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
      <h2>📡 Gestión de Dispositivos E/S</h2>

      {/* Controles */}
      <div style={{ background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>Crear Solicitud de E/S</h3>
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          <div>
            <label>Dispositivo: </label>
            <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
              <option value="">Seleccionar...</option>
              {devices.map(dev => (
                <option key={dev.name} value={dev.name}>{dev.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Proceso ID: </label>
            <input 
              type="number" 
              min="1" 
              value={processId} 
              onChange={e => setProcessId(e.target.value)}
              style={{ width: 80 }}
            />
          </div>
          <button onClick={createIORequest} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Crear Solicitud
          </button>
          <button 
            onClick={processIOQueues}
            style={{ padding: "8px 16px", cursor: "pointer", background: "#2196f3", color: "white", border: "none", borderRadius: 4 }}
          >
            Procesar Colas
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {statistics && (
        <div style={{ background: "#e3f2fd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h3>📊 Estadísticas Generales</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 15 }}>
            <div>
              <strong>Total Solicitudes:</strong>
              <div style={{ fontSize: 24, color: "#2196f3" }}>
                {statistics.total_requests}
              </div>
            </div>
            <div>
              <strong>Completadas:</strong>
              <div style={{ fontSize: 24, color: "#4caf50" }}>
                {statistics.completed_requests}
              </div>
            </div>
            <div>
              <strong>Pendientes:</strong>
              <div style={{ fontSize: 24, color: "#ff9800" }}>
                {statistics.pending_requests}
              </div>
            </div>
            <div>
              <strong>Interrupciones:</strong>
              <div style={{ fontSize: 24, color: "#9c27b0" }}>
                {statistics.total_interrupts}
              </div>
            </div>
          </div>
          {statistics.avg_turnaround_time > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong>Tiempo Promedio de Retorno:</strong>
              <span style={{ fontSize: 20, color: "#f44336", marginLeft: 10 }}>
                {statistics.avg_turnaround_time.toFixed(2)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dispositivos */}
      <h3>Dispositivos Disponibles</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
        {devices.map((device) => (
          <div
            key={device.name}
            style={{
              padding: 15,
              borderRadius: 8,
              background: "white",
              border: `3px solid ${getStatusColor(device.status)}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>
              {getDeviceIcon(device.type)}
            </div>
            <h4 style={{ margin: "5px 0" }}>{device.name}</h4>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
              {device.type}
            </div>
            
            <div style={{ 
              padding: "5px 10px", 
              borderRadius: 4, 
              background: getStatusColor(device.status),
              color: "white",
              textAlign: "center",
              marginBottom: 10
            }}>
              {device.status}
            </div>

            <div style={{ fontSize: 14 }}>
              <div><strong>Cola:</strong> {device.queue_length} solicitudes</div>
              <div><strong>Operaciones:</strong> {device.total_operations}</div>
              {device.current_request && (
                <div style={{ marginTop: 5, padding: 5, background: "#fff3e0", borderRadius: 4 }}>
                  🔄 Procesando solicitud #{device.current_request}
                </div>
              )}
              {device.avg_waiting_time > 0 && (
                <div><strong>Espera Promedio:</strong> {device.avg_waiting_time.toFixed(2)}s</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}