import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function MemoryPanel() {
  const [memoryState, setMemoryState] = useState(null);

  const fetchMemoryState = async () => {
    try {
      const response = await axios.get(`${API_URL}/memory/state`);
      setMemoryState(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estado de memoria:", error);
    }
  };

  useEffect(() => {
    fetchMemoryState();
    const interval = setInterval(fetchMemoryState, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!memoryState) {
    return <div style={{ padding: 20 }}>Cargando estado de memoria...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🧠 Gestión de Memoria RAM</h2>

      <div style={{ background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>Modo de Gestión: {memoryState.mode.toUpperCase()}</h3>
      </div>

      {/* Modo Particiones */}
      {memoryState.mode === "partitions" && memoryState.partitions && (
        <div>
          <h3>Particiones de Memoria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }}>
            {memoryState.partitions.map((partition) => (
              <div
                key={partition.id}
                style={{
                  padding: 15,
                  borderRadius: 8,
                  background: partition.allocated ? "#ffcdd2" : "#c8e6c9",
                  border: "2px solid " + (partition.allocated ? "#f44336" : "#4caf50")
                }}
              >
                <div><strong>Partición {partition.id}</strong></div>
                <div>Tamaño: {partition.size} KB</div>
                <div>Estado: {partition.allocated ? "🔴 Ocupada" : "🟢 Libre"}</div>
                {partition.allocated && (
                  <div>Proceso: P{partition.process_id}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo Paginación */}
      {memoryState.mode === "paging" && (
        <div>
          <div style={{ background: "#e3f2fd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <h3>Estadísticas de Paginación</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <div>
                <strong>Total Frames:</strong>
                <div style={{ fontSize: 32, color: "#2196f3" }}>
                  {memoryState.total_frames}
                </div>
              </div>
              <div>
                <strong>Page Faults:</strong>
                <div style={{ fontSize: 32, color: "#f44336" }}>
                  {memoryState.page_faults}
                </div>
              </div>
              <div>
                <strong>Page Accesses:</strong>
                <div style={{ fontSize: 32, color: "#4caf50" }}>
                  {memoryState.page_accesses}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 15 }}>
              <strong>Tasa de Aciertos:</strong>
              <div style={{ fontSize: 24, color: "#ff9800" }}>
                {memoryState.page_accesses > 0 
                  ? (((memoryState.page_accesses - memoryState.page_faults) / memoryState.page_accesses) * 100).toFixed(2)
                  : 0}%
              </div>
            </div>
          </div>

          <h3>Frames de Memoria</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
            {memoryState.frames?.map((frame) => (
              <div
                key={frame.frame}
                style={{
                  padding: 10,
                  textAlign: "center",
                  borderRadius: 4,
                  background: frame.occupied ? "#ff9800" : "#e0e0e0",
                  color: frame.occupied ? "white" : "#666",
                  fontSize: 12
                }}
                title={frame.occupied ? `P${frame.process}` : "Libre"}
              >
                {frame.frame}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo Segmentación */}
      {memoryState.mode === "segmentation" && memoryState.segments && (
        <div>
          <h3>Segmentos de Memoria</h3>
          {memoryState.segments.map((proc) => (
            <div key={proc.process} style={{ background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 15 }}>
              <h4>Proceso {proc.process}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {proc.segments.map((seg) => (
                  <div key={seg.num} style={{ background: "white", padding: 10, borderRadius: 4, border: "1px solid #ddd" }}>
                    <div><strong>{seg.name || `Segmento ${seg.num}`}</strong></div>
                    <div>Base: {seg.base}</div>
                    <div>Tamaño: {seg.size} KB</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}