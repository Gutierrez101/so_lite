import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function MemoryPanel() {
  const [memoryState, setMemoryState] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const fetchMemoryState = async () => {
    try {
      const response = await axios.get(`${API_URL}/memory/state`);
      setMemoryState(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estado de memoria:", error);
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

  const allocateMemory = async () => {
    const pidStr = prompt("Ingresa el PID del proceso:");
    if (!pidStr) return;
    
    const pid = parseInt(pidStr);
    const sizeStr = prompt("Tamaño de memoria a asignar (KB):", "100");
    if (!sizeStr) return;
    
    const size = parseInt(sizeStr);
    
    const algorithm = prompt(
      "Algoritmo de asignación:\n" +
      "1. first_fit\n" +
      "2. best_fit\n" +
      "3. worst_fit\n" +
      "Ingresa el nombre:", 
      "first_fit"
    );

    try {
      const response = await axios.post(`${API_URL}/memory/allocate`, {
        pid,
        size,
        algorithm
      });
      
      if (response.data.allocated) {
        alert(`✅ Memoria asignada exitosamente al proceso ${pid}`);
      } else {
        alert(`❌ No hay memoria disponible para el proceso ${pid}`);
      }
      
      await fetchMemoryState();
      await fetchProcesses();
    } catch (error) {
      console.error("Error asignando memoria:", error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    }
  };

  const deallocateMemory = async () => {
    const pidStr = prompt("Ingresa el PID del proceso a liberar:");
    if (!pidStr) return;
    
    const pid = parseInt(pidStr);

    try {
      await axios.post(`${API_URL}/memory/deallocate`, { pid });
      alert(`✅ Memoria liberada para el proceso ${pid}`);
      await fetchMemoryState();
      await fetchProcesses();
    } catch (error) {
      console.error("Error liberando memoria:", error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchMemoryState();
    fetchProcesses();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMemoryState();
        fetchProcesses();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!memoryState) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{fontSize: 48, marginBottom: 20}}>⏳</div>
        <div style={{fontSize: 18, color: '#666'}}>Cargando estado de memoria...</div>
      </div>
    );
  }

  // Calcular estadísticas
  const totalMemory = memoryState.mode === 'partitions' 
    ? memoryState.partitions?.reduce((sum, p) => sum + p.size, 0) || 0
    : memoryState.total_frames * 4; // 4KB por frame

  const usedMemory = memoryState.mode === 'partitions'
    ? memoryState.partitions?.filter(p => p.allocated).reduce((sum, p) => sum + p.size, 0) || 0
    : memoryState.frames?.filter(f => f.occupied).length * 4 || 0;

  const freeMemory = totalMemory - usedMemory;
  const utilizationPercent = (usedMemory / totalMemory * 100) || 0;

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2>🧠 Gestión de Memoria RAM</h2>
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
            onClick={() => {fetchMemoryState(); fetchProcesses();}}
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

      {/* Información General de Memoria */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{marginTop: 0, color: 'white'}}>📊 Resumen de Memoria</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 20
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Modo de Gestión</div>
            <div style={{
              fontSize: 24,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.2)',
              padding: 10,
              borderRadius: 8
            }}>
              {memoryState.mode}
            </div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Memoria Total</div>
            <div style={{fontSize: 32, fontWeight: 'bold'}}>
              {totalMemory}
            </div>
            <div style={{fontSize: 12, opacity: 0.8}}>KB</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Memoria Usada</div>
            <div style={{fontSize: 32, fontWeight: 'bold'}}>
              {usedMemory}
            </div>
            <div style={{fontSize: 12, opacity: 0.8}}>KB</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Memoria Libre</div>
            <div style={{fontSize: 32, fontWeight: 'bold'}}>
              {freeMemory}
            </div>
            <div style={{fontSize: 12, opacity: 0.8}}>KB</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Utilización</div>
            <div style={{fontSize: 32, fontWeight: 'bold'}}>
              {utilizationPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{marginTop: 20}}>
          <div style={{
            height: 30,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 15,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${utilizationPercent}%`,
              background: utilizationPercent > 80 ? '#f44336' : utilizationPercent > 60 ? '#ff9800' : '#4caf50',
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {utilizationPercent > 10 && `${utilizationPercent.toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Memoria */}
      <div style={{
        background: '#f5f5f5',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20
      }}>
        <h3 style={{marginTop: 0}}>🎛️ Operaciones de Memoria</h3>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          <button 
            onClick={allocateMemory}
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
            ➕ Asignar Memoria
          </button>
          <button 
            onClick={deallocateMemory}
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
            ➖ Liberar Memoria
          </button>
        </div>
      </div>

      {/* Modo Particiones */}
      {memoryState.mode === "partitions" && memoryState.partitions && (
        <div style={{marginBottom: 20}}>
          <h3>📦 Particiones de Memoria</h3>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 15
          }}>
            {memoryState.partitions.map((partition) => (
              <div
                key={partition.id}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: partition.allocated ? '#ffebee' : '#e8f5e9',
                  border: `3px solid ${partition.allocated ? '#f44336' : '#4caf50'}`,
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  fontSize: 36,
                  textAlign: 'center',
                  marginBottom: 10
                }}>
                  {partition.allocated ? '🔴' : '🟢'}
                </div>
                <div style={{textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
                  Partición {partition.id}
                </div>
                <div style={{
                  padding: 10,
                  background: 'white',
                  borderRadius: 8,
                  marginBottom: 10
                }}>
                  <div style={{marginBottom: 5}}>
                    <strong>Tamaño:</strong> {partition.size} KB
                  </div>
                  <div style={{marginBottom: 5}}>
                    <strong>Estado:</strong> {partition.allocated ? "Ocupada" : "Libre"}
                  </div>
                  {partition.allocated && (
                    <div style={{
                      marginTop: 10,
                      padding: 8,
                      background: '#ffebee',
                      borderRadius: 6,
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      Proceso P{partition.process_id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo Paginación */}
      {memoryState.mode === "paging" && (
        <>
          {/* Estadísticas de Paginación */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            color: 'white'
          }}>
            <h3 style={{marginTop: 0, color: 'white'}}>📊 Estadísticas de Paginación</h3>
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 20
            }}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Total Frames</div>
                <div style={{fontSize: 32, fontWeight: 'bold'}}>
                  {memoryState.total_frames}
                </div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Page Faults</div>
                <div style={{fontSize: 32, fontWeight: 'bold'}}>
                  {memoryState.page_faults}
                </div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Page Accesses</div>
                <div style={{fontSize: 32, fontWeight: 'bold'}}>
                  {memoryState.page_accesses}
                </div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Tasa de Aciertos</div>
                <div style={{fontSize: 32, fontWeight: 'bold'}}>
                  {memoryState.page_accesses > 0 
                    ? (((memoryState.page_accesses - memoryState.page_faults) / memoryState.page_accesses) * 100).toFixed(2)
                    : 0}%
                </div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, opacity: 0.9, marginBottom: 5}}>Tasa de Fallos</div>
                <div style={{fontSize: 32, fontWeight: 'bold'}}>
                  {memoryState.page_accesses > 0 
                    ? ((memoryState.page_faults / memoryState.page_accesses) * 100).toFixed(2)
                    : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Visualización de Frames */}
          <div style={{
            background: 'white',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: 20
          }}>
            <h3 style={{marginTop: 0}}>🗂️ Frames de Memoria ({memoryState.frames?.length || 0})</h3>
            <div style={{
              marginBottom: 15,
              padding: 10,
              background: '#f5f5f5',
              borderRadius: 8,
              display: 'flex',
              gap: 20,
              fontSize: 14
            }}>
              <div><span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                background: '#ff9800',
                borderRadius: 4,
                marginRight: 5
              }}></span> Ocupado</div>
              <div><span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                background: '#e0e0e0',
                borderRadius: 4,
                marginRight: 5
              }}></span> Libre</div>
            </div>
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
              gap: 8
            }}>
              {memoryState.frames?.map((frame) => (
                <div
                  key={frame.frame}
                  style={{
                    padding: 12,
                    textAlign: "center",
                    borderRadius: 8,
                    background: frame.occupied ? '#ff9800' : '#e0e0e0',
                    color: frame.occupied ? 'white' : '#666',
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: `2px solid ${frame.occupied ? '#f57c00' : '#bdbdbd'}`
                  }}
                  title={frame.occupied ? `Frame ${frame.frame} - Proceso P${frame.process}` : `Frame ${frame.frame} - Libre`}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    setSelectedProcess(frame.occupied ? frame.process : null);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    setSelectedProcess(null);
                  }}
                >
                  {frame.frame}
                  {frame.occupied && (
                    <div style={{fontSize: 10, marginTop: 4}}>P{frame.process}</div>
                  )}
                </div>
              ))}
            </div>
            {selectedProcess !== null && (
              <div style={{
                marginTop: 15,
                padding: 15,
                background: '#fff3e0',
                borderRadius: 8,
                border: '2px solid #ff9800'
              }}>
                <strong>🔍 Proceso seleccionado: P{selectedProcess}</strong>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modo Segmentación */}
      {memoryState.mode === "segmentation" && memoryState.segments && (
        <div>
          <h3>🗂️ Segmentos de Memoria</h3>
          {memoryState.segments.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              background: '#f5f5f5',
              borderRadius: 12,
              color: '#999'
            }}>
              No hay segmentos asignados
            </div>
          ) : (
            memoryState.segments.map((proc) => (
              <div 
                key={proc.process}
                style={{ 
                  background: 'white',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 15,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #2196f3'
                }}
              >
                <h4 style={{
                  marginTop: 0,
                  color: '#2196f3',
                  fontSize: 18
                }}>
                  📋 Proceso {proc.process}
                </h4>
                <div style={{ 
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 15
                }}>
                  {proc.segments.map((seg) => (
                    <div 
                      key={seg.num}
                      style={{ 
                        background: '#f5f5f5',
                        padding: 15,
                        borderRadius: 8,
                        border: "2px solid #2196f3"
                      }}
                    >
                      <div style={{
                        fontWeight: 'bold',
                        marginBottom: 10,
                        color: '#2196f3',
                        fontSize: 16
                      }}>
                        {seg.name || `Segmento ${seg.num}`}
                      </div>
                      <div style={{marginBottom: 5}}>
                        <strong>Base:</strong> {seg.base}
                      </div>
                      <div>
                        <strong>Tamaño:</strong> {seg.size} KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tabla de Procesos con Memoria Asignada */}
      <div style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: 20
      }}>
        <h3 style={{marginTop: 0}}>💾 Procesos y Memoria Asignada</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{padding: 10, textAlign: 'left'}}>PID</th>
                <th style={{padding: 10, textAlign: 'left'}}>Nombre</th>
                <th style={{padding: 10, textAlign: 'center'}}>Estado</th>
                <th style={{padding: 10, textAlign: 'center'}}>Memoria Requerida</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{padding: 20, textAlign: 'center', color: '#999'}}>
                    No hay procesos activos
                  </td>
                </tr>
              ) : (
                processes.map(proc => (
                  <tr 
                    key={proc.pid}
                    style={{borderBottom: '1px solid #eee'}}
                  >
                    <td style={{padding: 10, fontWeight: 'bold'}}>{proc.pid}</td>
                    <td style={{padding: 10}}>{proc.name}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        background: proc.state === 'RUNNING' ? '#4caf50' : 
                                   proc.state === 'READY' ? '#2196f3' :
                                   proc.state === 'WAITING' ? '#ff9800' : '#9e9e9e',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {proc.state}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <strong style={{color: '#2196f3'}}>{proc.memory_required} KB</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}