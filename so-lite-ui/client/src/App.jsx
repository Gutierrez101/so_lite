import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import AlgorithmForm from "./components/AlgorithmForm";
import GanttChart from "./components/GanttChart";
import StatsPanel from "./components/StatsPanel";
import CPUPanel from "./components/CPUPanel";
import MemoryPanel from "./components/MemoryPanel";
import IOPanel from "./components/IOPanel";
import SystemControls from "./components/controls/SystemControls";
import "./index.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("processes");

  const renderContent = () => {
    switch (activeTab) {
      case "processes":
        return (
          <div className="content">
            {/* Panel de Control del Sistema - Solo en la pestaña de procesos */}
            <div style={{ gridColumn: '1 / -1', marginBottom: 20 }}>
              <SystemControls />
            </div>
            
            <div className="left-panel">
              <AlgorithmForm />
              <div className="gantt-wrapper">
                <GanttChart />
              </div>
            </div>
            <div className="right-panel">
              <StatsPanel />
            </div>
          </div>
        );
      
      case "cpu":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <CPUPanel />
          </>
        );
      
      case "memory":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <MemoryPanel />
          </>
        );
      
      case "io":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <IOPanel />
          </>
        );
      
      default:
        return <div>Selecciona una pestaña</div>;
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main">
        <TopBar />
        {renderContent()}
      </div>
    </div>
  );
}