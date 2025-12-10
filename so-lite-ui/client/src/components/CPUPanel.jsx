import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function CPUPanel() {
  const [cpuState, setCpuState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(4);
  const [isRunning, setIsRunning] = useState(false);

  const fetchCPUMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/cpu/metrics`);
      setMetrics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo métricas:", error);
    }
  };

  const scheduleCPU = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm,
        time_quantum: quantum
      });
      setCpuState(response.data.data);
      await fetchCPUMetrics();
    } catch (error) {
      console.error("Error en schedule:", error);
    }
  };

  const startScheduling = () => {
    setIsRunning(true);
    const interval = setInterval(() => {
      scheduleCPU();
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 20000); // 20 segundos
  };

  useEffect(() => {
    fetchCPUMetrics();
    const interval = setInterval(fetchCPUMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>⚙️ Planificador de CPU</h2>

      {/* Configuración */}
      <div style={{ background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>Configuración</h3>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div>
            <label>Algoritmo: </label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
              <option value="FCFS">FCFS</option>
              <option value="SJF">SJF</option>
              <option value="RR">Round Robin</option>
              <option value="PRIORITY">Prioridades</option>
            </select>
          </div>

          {algorithm === "RR" && (
            <div>
              <label>Quantum: </label>
              <input 
                type="number" 
                min="1" 
                value={quantum} 
                onChange={e => setQuantum(e.target.value)}
                style={{ width: 60 }}
              />
            </div>
          )}

          <button 
            onClick={scheduleCPU}
            disabled={isRunning}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Ejecutar Paso
          </button>

          <button 
            onClick={startScheduling}
            disabled={isRunning}
            style={{ padding: "8px 16px", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: 4 }}
          >
            {isRunning ? "Ejecutando..." : "Auto Ejecutar"}
          </button>
        </div>
      </div>

      {/* Estado del CPU */}
      {cpuState && (
        <div style={{ background: "#e3f2fd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h3>Estado Actual del CPU</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><strong>Algoritmo:</strong> {cpuState.algorithm}</div>
            <div><strong>Quantum:</strong> {cpuState.time_quantum}</div>
            <div><strong>Contador Quantum:</strong> {cpuState.quantum_counter}</div>
            <div><strong>Cola Ready:</strong> {cpuState.ready_queue_size} procesos</div>
          </div>
          
          {cpuState.running_process && (
            <div style={{ marginTop: 10, padding: 10, background: "#fff", borderRadius: 4 }}>
              <strong>🟢 Proceso en Ejecución:</strong>
              <div>PID: {cpuState.running_process.pid} - {cpuState.running_process.name}</div>
              <div>Tiempo restante: {cpuState.running_process.remaining_time}</div>
            </div>
          )}
        </div>
      )}

      {/* Métricas */}
      {metrics && (
        <div style={{ background: "#fff3e0", padding: 15, borderRadius: 8 }}>
          <h3>📊 Métricas de Rendimiento</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
            <div>
              <strong>Tiempo de Espera Promedio:</strong>
              <div style={{ fontSize: 24, color: "#ff9800" }}>
                {metrics.avg_waiting_time?.toFixed(2) || 0} unidades
              </div>
            </div>
            <div>
              <strong>Tiempo de Retorno Promedio:</strong>
              <div style={{ fontSize: 24, color: "#ff5722" }}>
                {metrics.avg_turnaround_time?.toFixed(2) || 0} unidades
              </div>
            </div>
            <div>
              <strong>Tiempo de Respuesta Promedio:</strong>
              <div style={{ fontSize: 24, color: "#2196f3" }}>
                {metrics.avg_response_time?.toFixed(2) || 0} unidades
              </div>
            </div>
            <div>
              <strong>Throughput:</strong>
              <div style={{ fontSize: 24, color: "#4caf50" }}>
                {metrics.throughput || 0} procesos
              </div>
            </div>
            <div>
              <strong>Context Switches:</strong>
              <div style={{ fontSize: 24, color: "#9c27b0" }}>
                {metrics.total_context_switches || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}