import React, { useContext } from "react";
import { SimulatorContext } from "../context/SimulatorContext";

export default function StatsPanel(){
  const { stats } = useContext(SimulatorContext);
  
  // Función para formatear números
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    return Number(num).toFixed(2);
  };

  // Determinar el color según el valor
  const getPerformanceColor = (value, type) => {
    if (type === 'waiting' || type === 'turnaround') {
      if (value < 5) return '#4caf50';
      if (value < 10) return '#ff9800';
      return '#f44336';
    }
    return '#2196f3';
  };

  return (
    <div className="stats-card" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: 20,
        fontSize: 24,
        textAlign: 'center',
        color: 'white'
      }}>
        📊 Métricas de Rendimiento
      </h3>

      {/* Tiempo de Espera */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{
          fontSize: 14,
          opacity: 0.9,
          marginBottom: 8,
          fontWeight: 600
        }}>
          ⏱️ Tiempo de Espera Promedio
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'baseline',
          gap: 5
        }}>
          {formatNumber(stats.waitingAvg)}
          <span style={{fontSize: 16, opacity: 0.8}}>unidades</span>
        </div>
        <div style={{
          marginTop: 8,
          height: 8,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((stats.waitingAvg || 0) * 5, 100)}%`,
            background: getPerformanceColor(stats.waitingAvg || 0, 'waiting'),
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Tiempo de Retorno */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{
          fontSize: 14,
          opacity: 0.9,
          marginBottom: 8,
          fontWeight: 600
        }}>
          🔄 Tiempo de Retorno Promedio
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'baseline',
          gap: 5
        }}>
          {formatNumber(stats.turnaroundAvg)}
          <span style={{fontSize: 16, opacity: 0.8}}>unidades</span>
        </div>
        <div style={{
          marginTop: 8,
          height: 8,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((stats.turnaroundAvg || 0) * 5, 100)}%`,
            background: getPerformanceColor(stats.turnaroundAvg || 0, 'turnaround'),
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Tiempo de Respuesta */}
      {stats.responseAvg !== undefined && (
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: 15,
          borderRadius: 10,
          marginBottom: 15,
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{
            fontSize: 14,
            opacity: 0.9,
            marginBottom: 8,
            fontWeight: 600
          }}>
            ⚡ Tiempo de Respuesta Promedio
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'baseline',
            gap: 5
          }}>
            {formatNumber(stats.responseAvg)}
            <span style={{fontSize: 16, opacity: 0.8}}>unidades</span>
          </div>
        </div>
      )}

      {/* Métricas Adicionales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10
      }}>
        {/* Throughput */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: 12,
          borderRadius: 8,
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{fontSize: 11, opacity: 0.8, marginBottom: 5}}>
            ✅ Throughput
          </div>
          <div style={{fontSize: 24, fontWeight: 'bold'}}>
            {stats.throughput || 0}
          </div>
          <div style={{fontSize: 10, opacity: 0.7}}>procesos</div>
        </div>

        {/* Context Switches */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: 12,
          borderRadius: 8,
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{fontSize: 11, opacity: 0.8, marginBottom: 5}}>
            🔄 Context Switches
          </div>
          <div style={{fontSize: 24, fontWeight: 'bold'}}>
            {stats.contextSwitches || 0}
          </div>
        </div>
      </div>

      {/* Indicador de Estado */}
      <div style={{
        marginTop: 20,
        padding: 10,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 12,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {stats.throughput > 0 ? (
          <>
            <span style={{fontSize: 16}}>✅</span> Simulación completada
          </>
        ) : (
          <>
            <span style={{fontSize: 16}}>⏳</span> Esperando simulación...
          </>
        )}
      </div>
    </div>
  );
}