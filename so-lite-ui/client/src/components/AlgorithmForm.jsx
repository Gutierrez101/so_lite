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
      // Inicializar kernel
      await initializeKernel({
        memory_mode: 'paging',
        total_memory: 1024
      });

      // Crear procesos de ejemplo
      const sampleProcesses = [
        { name: "P1", priority: 2, burst_time: 4, memory_required: 50 },
        { name: "P2", priority: 1, burst_time: 6, memory_required: 80 },
        { name: "P3", priority: 3, burst_time: 2, memory_required: 30 },
        { name: "P4", priority: 2, burst_time: 3, memory_required: 60 },
      ];

      for (const proc of sampleProcesses) {
        await createProcess(proc);
      }

      setIsInitialized(true);
      alert('Sistema inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando:', error);
      alert('Error al inicializar el sistema: ' + error.message);
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
        steps: 30
      });

      console.log('Resultado de simulación:', result);

      // Generar timeline para Gantt desde los procesos completados
      if (result.processes && result.processes.length > 0) {
        const colors = ['#1e90ff', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da'];
        
        const timeline = result.processes
          .filter(proc => proc.state === 'TERMINATED' || proc.remaining_time < proc.burst_time)
          .map((proc, idx) => ({
            pid: proc.name,
            start: 0, // Simplificado - en una implementación real calcularías esto
            duration: proc.burst_time - proc.remaining_time,
            color: colors[idx % colors.length]
          }));

        setTimeline(timeline);
      }

      // Actualizar estadísticas
      setStats({
        waitingAvg: result.metrics.avg_waiting_time || 0,
        turnaroundAvg: result.metrics.avg_turnaround_time || 0
      });

      alert(`✅ Simulación completada
      
📊 Resultados:
- Tiempo de espera: ${result.metrics.avg_waiting_time?.toFixed(2)} unidades
- Tiempo de retorno: ${result.metrics.avg_turnaround_time?.toFixed(2)} unidades
- Procesos completados: ${result.metrics.throughput}
- Context Switches: ${result.metrics.total_context_switches}`);

    } catch (error) {
      console.error('Error ejecutando simulación:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Simulador SO-Lite</h3>
      
      {/* Estado de la API */}
      <div style={{marginBottom: 12, padding: 8, background: apiStatus === 'connected' ? '#e8f5e9' : '#ffebee', borderRadius: 4}}>
        <small>
          API: {apiStatus === 'connected' ? '🟢 Conectada' : apiStatus === 'checking' ? '🟡 Verificando...' : '🔴 Desconectada'}
        </small>
      </div>

      {/* Botón de inicialización */}
      {!isInitialized && (
        <button 
          className="start-btn" 
          onClick={initializeSystem} 
          disabled={loading || apiStatus !== 'connected'}
          style={{marginBottom: 12}}
        >
          {loading ? 'Inicializando...' : 'Inicializar Sistema'}
        </button>
      )}

      {isInitialized && (
        <>
          <div className="form-row">
            <label>Algoritmo de Planificación</label>
            <select className="select" value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>
              <option value="fcfs">FCFS (First Come First Served)</option>
              <option value="sjf">SJF (Shortest Job First)</option>
              <option value="rr">Round Robin</option>
              <option value="priority">Prioridades</option>
            </select>
          </div>

          {algorithm === 'rr' && (
            <div className="form-row">
              <label>Quantum (Round Robin)</label>
              <input 
                type="number" 
                min="1" 
                value={quantum} 
                onChange={e=>setQuantum(e.target.value)} 
              />
            </div>
          )}

          <button 
            className="start-btn" 
            onClick={runAlgorithm} 
            disabled={loading}
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Simulación'}
          </button>
        </>
      )}
    </div>
  );
}