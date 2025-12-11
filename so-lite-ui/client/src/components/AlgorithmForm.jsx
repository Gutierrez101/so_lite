import React, { useContext, useState, useEffect } from "react";
import { SimulatorContext } from "../context/SimulatorContext";
import { 
  initializeKernel, 
  createProcess, 
  runSimulation,
  getAllProcesses,
  healthCheck 
} from "../api/apiClient";

export default function AlgorithmForm(){
  const { setTimeline, setStats } = useContext(SimulatorContext);
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [quantum, setQuantum] = useState(3);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    try {
      await healthCheck();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('error');
      console.error('Error conectando con el backend:', error);
    }
  };

  const initializeSystem = async () => {
    setLoading(true);
    try {
      // Limpiar estado previo
      setTimeline([]);
      setStats({
        waitingAvg: 0,
        turnaroundAvg: 0,
        responseAvg: 0,
        throughput: 0,
        contextSwitches: 0
      });

      // Inicializar kernel
      const initResponse = await initializeKernel({
        memory_mode: 'paging',
        total_memory: 1024
      });

      console.log('Kernel inicializado:', initResponse);

      // Crear procesos de ejemplo
      const sampleProcesses = [
        { name: "P1", priority: 2, burst_time: 8, memory_required: 50 },
        { name: "P2", priority: 1, burst_time: 12, memory_required: 80 },
        { name: "P3", priority: 3, burst_time: 6, memory_required: 30 },
        { name: "P4", priority: 2, burst_time: 10, memory_required: 60 },
      ];

      for (const proc of sampleProcesses) {
        const response = await createProcess(proc);
        console.log('Proceso creado:', response);
      }

      setIsInitialized(true);
      alert('✅ Sistema inicializado correctamente con 4 procesos');
    } catch (error) {
      console.error('Error inicializando:', error);
      alert('❌ Error al inicializar el sistema: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const runAlgorithm = async () => {
    if (!isInitialized) {
      alert('Primero debes inicializar el sistema');
      return;
    }

    setLoading(true);
    try {
      // Mapeo de nombres de algoritmos
      const algorithmMap = {
        'fcfs': 'FCFS',
        'sjf': 'SJF',
        'rr': 'RR',
        'priority': 'PRIORITY'
      };

      const result = await runSimulation({
        algorithm: algorithmMap[algorithm] || 'FCFS',
        time_quantum: Number(quantum),
        steps: 40
      });

      console.log('✅ Resultado completo de simulación:', result);

      // Procesar timeline
      if (result.timeline && result.timeline.length > 0) {
        console.log('📊 Timeline recibido:', result.timeline);
        setTimeline(result.timeline);
      } else {
        console.warn('⚠️ No se recibió timeline del backend');
        setTimeline([]);
      }

      // Actualizar estadísticas - CORREGIDO: acceder correctamente a las métricas
      const cpuMetrics = result.metrics?.cpu || {};
      
      const newStats = {
        waitingAvg: cpuMetrics.avg_waiting_time || 0,
        turnaroundAvg: cpuMetrics.avg_turnaround_time || 0,
        responseAvg: cpuMetrics.avg_response_time || 0,
        throughput: cpuMetrics.throughput || 0,
        contextSwitches: cpuMetrics.total_context_switches || 0
      };

      console.log('📈 Estadísticas procesadas:', newStats);
      setStats(newStats);

      // Mostrar resultados
      const message = `✅ Simulación completada con ${algorithmMap[algorithm]}

📊 Resultados:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Tiempo de espera promedio: ${newStats.waitingAvg.toFixed(2)} unidades
⏱️  Tiempo de retorno promedio: ${newStats.turnaroundAvg.toFixed(2)} unidades
⚡ Tiempo de respuesta promedio: ${newStats.responseAvg.toFixed(2)} unidades
✅ Procesos completados: ${newStats.throughput}
🔄 Context Switches: ${newStats.contextSwitches}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      alert(message);

    } catch (error) {
      console.error('❌ Error ejecutando simulación:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert('❌ Error en la simulación: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    if (confirm('¿Estás seguro de que quieres reiniciar el sistema?')) {
      setIsInitialized(false);
      setTimeline([]);
      setStats({
        waitingAvg: 0,
        turnaroundAvg: 0,
        responseAvg: 0,
        throughput: 0,
        contextSwitches: 0
      });
      alert('Sistema reiniciado. Presiona "Inicializar Sistema" para empezar de nuevo.');
    }
  };

  return (
    <div className="form-card">
      <h3>🖥️ Simulador SO-Lite</h3>
      
      {/* Estado de la API */}
      <div style={{
        marginBottom: 12, 
        padding: 10, 
        background: apiStatus === 'connected' ? '#e8f5e9' : '#ffebee', 
        borderRadius: 6,
        border: `2px solid ${apiStatus === 'connected' ? '#4caf50' : '#f44336'}`
      }}>
        <strong style={{fontSize: 14}}>
          {apiStatus === 'connected' ? '🟢 API Conectada' : apiStatus === 'checking' ? '🟡 Verificando conexión...' : '🔴 API Desconectada'}
        </strong>
      </div>

      {/* Botón de inicialización */}
      {!isInitialized && (
        <button 
          className="start-btn" 
          onClick={initializeSystem} 
          disabled={loading || apiStatus !== 'connected'}
          style={{
            marginBottom: 12,
            background: apiStatus === 'connected' ? '#4caf50' : '#ccc',
            cursor: (loading || apiStatus !== 'connected') ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Inicializando...' : '🚀 Inicializar Sistema'}
        </button>
      )}

      {isInitialized && (
        <>
          <div style={{
            background: '#e3f2fd',
            padding: 10,
            borderRadius: 6,
            marginBottom: 15,
            border: '2px solid #2196f3'
          }}>
            <strong>✅ Sistema inicializado y listo</strong>
          </div>

          <div className="form-row">
            <label><strong>Algoritmo de Planificación</strong></label>
            <select 
              className="select" 
              value={algorithm} 
              onChange={e=>setAlgorithm(e.target.value)}
              disabled={loading}
            >
              <option value="fcfs">FCFS (First Come First Served)</option>
              <option value="sjf">SJF (Shortest Job First)</option>
              <option value="rr">Round Robin</option>
              <option value="priority">Prioridades</option>
            </select>
          </div>

          {algorithm === 'rr' && (
            <div className="form-row">
              <label><strong>Quantum (Round Robin)</strong></label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={quantum} 
                onChange={e=>setQuantum(e.target.value)}
                disabled={loading}
              />
              <small style={{color: '#666', display: 'block', marginTop: 4}}>
                Tiempo de CPU asignado a cada proceso
              </small>
            </div>
          )}

          <div style={{display: 'flex', gap: 10}}>
            <button 
              className="start-btn" 
              onClick={runAlgorithm} 
              disabled={loading}
              style={{
                flex: 1,
                background: loading ? '#ccc' : '#2196f3',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Ejecutando...' : '▶️ Ejecutar Simulación'}
            </button>

            <button 
              onClick={resetSystem}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#ff5722',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              🔄 Reiniciar
            </button>
          </div>
        </>
      )}
    </div>
  );
}