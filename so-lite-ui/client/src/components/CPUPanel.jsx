import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function CPUPanel() {
  const [cpuState, setCpuState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);
  const [executionLog, setExecutionLog] = useState([]);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchCPUState(),
        fetchCPUMetrics(),
        fetchProcesses()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCPUState = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm,
        time_quantum: quantum
      });
      setCpuState(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estado CPU:", error);
    }
  };

  const fetchCPUMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/cpu/metrics`);
      setMetrics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo métricas:", error);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get(`${API_URL}/processes`);
      setProcesses(response.data.data || []);
    } catch (error) {
      console.error("Error obteniendo procesos:", error);
    }
  };

  const scheduleCPU = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm,
        time_quantum: quantum
      });
      
      setCpuState(response.data.data);
      
      // Agregar al log de ejecución
      const timestamp = new Date().toLocaleTimeString();
      setExecutionLog(prev => [{
        time: timestamp,
        action: `Ejecutando ${algorithm}`,
        details: response.data.data.running_process ? 
          `Proceso: ${response.data.data.running_process.name}` : 
          'CPU Idle'
      }, ...prev].slice(0, 20));
      
      await fetchCPUMetrics();
      await fetchProcesses();
    } catch (error) {
      console.error("Error en schedule:", error);
    }
  };

  const startScheduling = () => {
    setIsRunning(true);
    const interval = setInterval(() => {
      scheduleCPU();
    }, simulationSpeed);

    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 30000); // 30 segundos
  };

  const stopScheduling = () => {
    setIsRunning(false);
  };

  const createNewProcess = async () => {
    const name = prompt("Nombre del proceso:");
    if (!name) return;

    const priority = parseInt(prompt("Prioridad (1-10, menor = mayor prioridad):", "5"));
    const burstTime = parseInt(prompt("Tiempo de ráfaga (unidades):", "10"));
    const memoryRequired = parseInt(prompt("Memoria requerida (KB):", "100"));

    try {
      await axios.post(`${API_URL}/processes/create`, {
        name,
        priority,
        burst_time: burstTime,
        memory_required: memoryRequired
      });
      
      alert(`✅ Proceso "${name}" creado exitosamente`);
      await fetchProcesses();
    } catch (error) {
      console.error("Error creando proceso:", error);
      alert("❌ Error al crear proceso: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStateColor = (state) => {
    const colors = {
      'NEW': '#9e9e9e',
      'READY': '#2196f3',
      'RUNNING': '#4caf50',
      'WAITING': '#ff9800',
      'TERMINATED': '#f44336'
    };
    return colors[state] || '#9e9e9e';
  };

  const getStateBadge = (state) => {
    const badges = {
      'NEW': '🆕',
      'READY': '⏸️',
      'RUNNING': '▶️',
      'WAITING': '⏳',
      'TERMINATED': '✅'
    };
    return badges[state] || '❓';
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2>⚙️ Planificador de CPU</h2>
        <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: 5}}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-actualizar
          </label>
          <button 
            onClick={fetchAllData}
            style={{
              padding: '8px 16px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Configuración y Controles */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{marginTop: 0, color: 'white'}}>🎛️ Control de Planificación</h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 15,
          marginBottom: 15
        }}>
          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 'bold'}}>
              Algoritmo de Planificación
            </label>
            <select 
              value={algorithm} 
              onChange={e => setAlgorithm(e.target.value)}
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '2px solid white',
                fontSize: 14
              }}
            >
              <option value="FCFS">FCFS (First Come First Served)</option>
              <option value="SJF">SJF (Shortest Job First)</option>
              <option value="RR">Round Robin</option>
              <option value="PRIORITY">Prioridades</option>
            </select>
          </div>

          {algorithm === "RR" && (
            <div>
              <label style={{display: 'block', marginBottom: 5, fontWeight: 'bold'}}>
                Quantum (tiempo de CPU)
              </label>
              <input 
                type="number" 
                min="1"
                max="10"
                value={quantum} 
                onChange={e => setQuantum(parseInt(e.target.value))}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: '2px solid white',
                  fontSize: 14
                }}
              />
            </div>
          )}

          <div>
            <label style={{display: 'block', marginBottom: 5, fontWeight: 'bold'}}>
              Velocidad de Simulación (ms)
            </label>
            <input 
              type="range"
              min="500"
              max="3000"
              step="500"
              value={simulationSpeed}
              onChange={e => setSimulationSpeed(parseInt(e.target.value))}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
            <div style={{textAlign: 'center', fontSize: 12}}>{simulationSpeed}ms</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={scheduleCPU}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: 8,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            ⏭️ Ejecutar 1 Paso
          </button>

          {!isRunning ? (
            <button 
              onClick={startScheduling}
              style={{
                padding: '12px 24px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}
            >
              ▶️ Iniciar Auto-Ejecución
            </button>
          ) : (
            <button 
              onClick={stopScheduling}
              style={{
                padding: '12px 24px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}
            >
              ⏸️ Detener
            </button>
          )}

          <button 
            onClick={createNewProcess}
            style={{
              padding: '12px 24px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            ➕ Crear Proceso
          </button>
        </div>
      </div>

      {/* Estado del CPU */}
      {cpuState && (
        <div style={{ 
          background: '#e3f2fd',
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          border: '2px solid #2196f3'
        }}>
          <h3 style={{marginTop: 0}}>🖥️ Estado Actual del CPU</h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 15
          }}>
            <div>
              <div style={{fontSize: 12, color: '#666', marginBottom: 5}}>Algoritmo Activo</div>
              <div style={{fontSize: 20, fontWeight: 'bold', color: '#2196f3'}}>
                {cpuState.algorithm}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: '#666', marginBottom: 5}}>Quantum</div>
              <div style={{fontSize: 20, fontWeight: 'bold', color: '#2196f3'}}>
                {cpuState.time_quantum}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: '#666', marginBottom: 5}}>Contador Quantum</div>
              <div style={{fontSize: 20, fontWeight: 'bold', color: '#ff9800'}}>
                {cpuState.quantum_counter} / {cpuState.time_quantum}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: '#666', marginBottom: 5}}>Cola Ready</div>
              <div style={{fontSize: 20, fontWeight: 'bold', color: '#4caf50'}}>
                {cpuState.ready_queue_size} procesos
              </div>
            </div>
          </div>
          
          {cpuState.running_process ? (
            <div style={{ 
              marginTop: 15,
              padding: 15,
              background: 'white',
              borderRadius: 8,
              border: '3px solid #4caf50'
            }}>
              <strong style={{fontSize: 16}}>🟢 Proceso en Ejecución</strong>
              <div style={{marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                <div><strong>PID:</strong> {cpuState.running_process.pid}</div>
                <div><strong>Nombre:</strong> {cpuState.running_process.name}</div>
                <div><strong>Tiempo restante:</strong> {cpuState.running_process.remaining_time} unidades</div>
              </div>
            </div>
          ) : (
            <div style={{ 
              marginTop: 15,
              padding: 15,
              background: '#fff',
              borderRadius: 8,
              textAlign: 'center',
              color: '#999',
              border: '2px dashed #ccc'
            }}>
              💤 CPU en estado IDLE - No hay procesos en ejecución
            </div>
          )}
        </div>
      )}

      {/* Tabla de Procesos */}
      <div style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{marginTop: 0}}>📋 Lista de Procesos ({processes.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{padding: 10, textAlign: 'left'}}>PID</th>
                <th style={{padding: 10, textAlign: 'left'}}>Nombre</th>
                <th style={{padding: 10, textAlign: 'center'}}>Estado</th>
                <th style={{padding: 10, textAlign: 'center'}}>Prioridad</th>
                <th style={{padding: 10, textAlign: 'center'}}>Burst Time</th>
                <th style={{padding: 10, textAlign: 'center'}}>Tiempo Restante</th>
                <th style={{padding: 10, textAlign: 'center'}}>Tiempo Espera</th>
                <th style={{padding: 10, textAlign: 'center'}}>Memoria</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{padding: 20, textAlign: 'center', color: '#999'}}>
                    No hay procesos. Crea uno nuevo con el botón "➕ Crear Proceso"
                  </td>
                </tr>
              ) : (
                processes.map(proc => (
                  <tr 
                    key={proc.pid}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: proc.state === 'RUNNING' ? '#e8f5e9' : 'transparent'
                    }}
                  >
                    <td style={{padding: 10, fontWeight: 'bold'}}>{proc.pid}</td>
                    <td style={{padding: 10}}>{proc.name}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        background: getStateColor(proc.state),
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {getStateBadge(proc.state)} {proc.state}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: proc.priority <= 3 ? '#f44336' : proc.priority <= 7 ? '#ff9800' : '#4caf50',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        P{proc.priority}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.burst_time}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <strong style={{color: proc.remaining_time === 0 ? '#4caf50' : '#ff9800'}}>
                        {proc.remaining_time}
                      </strong>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.waiting_time}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.memory_required} KB</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      {metrics && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: 20,
          borderRadius: 12,
          color: 'white',
          marginBottom: 20
        }}>
          <h3 style={{marginTop: 0, color: 'white'}}>📊 Métricas de Rendimiento</h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 20
          }}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>⏱️ Tiempo de Espera</div>
              <div style={{fontSize: 32, fontWeight: 'bold'}}>
                {metrics.avg_waiting_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 12, opacity: 0.8}}>unidades</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>🔄 Tiempo de Retorno</div>
              <div style={{fontSize: 32, fontWeight: 'bold'}}>
                {metrics.avg_turnaround_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 12, opacity: 0.8}}>unidades</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>⚡ Tiempo de Respuesta</div>
              <div style={{fontSize: 32, fontWeight: 'bold'}}>
                {metrics.avg_response_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 12, opacity: 0.8}}>unidades</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>✅ Throughput</div>
              <div style={{fontSize: 32, fontWeight: 'bold'}}>
                {metrics.throughput || 0}
              </div>
              <div style={{fontSize: 12, opacity: 0.8}}>procesos</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>🔄 Context Switches</div>
              <div style={{fontSize: 32, fontWeight: 'bold'}}>
                {metrics.total_context_switches || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log de Ejecución */}
      {executionLog.length > 0 && (
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <h3 style={{margin: 0}}>📜 Log de Ejecución</h3>
            <button 
              onClick={() => setExecutionLog([])}
              style={{
                padding: '6px 12px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              🗑️ Limpiar
            </button>
          </div>
          <div style={{
            maxHeight: 300,
            overflowY: 'auto',
            background: '#f5f5f5',
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'monospace'
          }}>
            {executionLog.map((log, idx) => (
              <div key={idx} style={{
                padding: 8,
                borderBottom: '1px solid #ddd',
                background: idx % 2 === 0 ? 'white' : 'transparent'
              }}>
                <strong style={{color: '#2196f3'}}>[{log.time}]</strong> {log.action}
                <div style={{color: '#666', fontSize: 11, marginTop: 2}}>{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}