#Modelo de Manejo de Procesos
#Implementa el algoritmo de PCB 

from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import time

class ProcessState(Enum):
    nuevo = "NEW"
    listo = "READY"
    corriendo = "RUNNING"
    esperando = "WAITING"
    terminado = "TERMINATED"

@dataclass
class PCB:
    pid: int
    name: str
    state: str = "NEW"
    priority: int = 5
    program_counter: int = 0
    cpu_registers: dict = field(default_factory=dict)
    
    # Tiempos
    arrival_time: float = 0.0
    burst_time: int = 0
    remaining_time: int = 0
    waiting_time: int = 0
    turnaround_time: int = 0
    response_time: int = -1
    
    # Memoria
    memory_base: Optional[int] = None
    memory_limit: Optional[int] = None
    memory_required: int = 0
    
    # Recursos
    allocated_resources: List[str] = field(default_factory=list)
    requested_resources: List[str] = field(default_factory=list)
    
    # Estadísticas
    context_switches: int = 0
    io_operations: int = 0
    
    def __post_init__(self):
        self.remaining_time = self.burst_time
        self.arrival_time = time.time()

#Manejador de Procesos
class ProcessManager:
    def __init__(self):
        self.processes: Dict[int, PCB] = {}
        self.next_pid = 1
        self.ready_queue: List[int] = []
        self.waiting_queue: List[int] = []
        self.running_process: Optional[int] = None
        
    def create_process(self, name: str, priority: int = 5, 
                      burst_time: int = 10, memory_required: int = 100) -> int:
        #Crea un nuevo procesos y retorna su PID
        pid = self.next_pid
        self.next_pid += 1
        
        pcb = PCB(
            pid=pid,
            name=name,
            priority=priority,
            burst_time=burst_time,
            memory_required=memory_required
        )
        
        self.processes[pid] = pcb
        self.transition_to_ready(pid)
        
        return pid
    
    def transition_to_ready(self, pid: int):
        #Transicion a READY
        if pid not in self.processes:
            return
            
        pcb = self.processes[pid]
        old_state = pcb.state
        pcb.state = ProcessState.nuevo.value
        
        if pid not in self.ready_queue:
            self.ready_queue.append(pid)
            
        if pid in self.waiting_queue:
            self.waiting_queue.remove(pid)
            
        print(f"Proceso {pid} ({pcb.name}): {old_state} -> READY")
    
    def transition_to_running(self, pid: int):
        #Trancisicion a Running
        if pid not in self.processes:
            return False
            
        pcb = self.processes[pid]
        old_state = pcb.state
        
        # Solo un proceso puede correr a la vez
        if self.running_process is not None and self.running_process != pid:
            return False
            
        pcb.state = ProcessState.corriendo.value
        self.running_process = pid
        
        if pid in self.ready_queue:
            self.ready_queue.remove(pid)
            
        # Registrar tiempo de respuesta
        if pcb.response_time == -1:
            pcb.response_time = int(time.time() - pcb.arrival_time)
            
        print(f"Proceso {pid} ({pcb.name}): {old_state} -> RUNNING")
        return True
    
    def transition_to_waiting(self, pid: int, reason: str = "IO"):
        #Transicion a Waiting
        if pid not in self.processes:
            return
            
        pcb = self.processes[pid]
        old_state = pcb.state
        pcb.state = ProcessState.esperando.value
        
        if pid not in self.waiting_queue:
            self.waiting_queue.append(pid)
            
        if self.running_process == pid:
            self.running_process = None
            
        pcb.io_operations += 1
        print(f"Proceso {pid} ({pcb.name}): {old_state} -> WAITING ({reason})")
    
    def terminate_process(self, pid: int):
        #Transicion a Terminated
        if pid not in self.processes:
            return
            
        pcb = self.processes[pid]
        pcb.state = ProcessState.terminado.value
        pcb.turnaround_time = int(time.time() - pcb.arrival_time)
        
        # Limpiar de todas las colas
        if pid in self.ready_queue:
            self.ready_queue.remove(pid)
        if pid in self.waiting_queue:
            self.waiting_queue.remove(pid)
        if self.running_process == pid:
            self.running_process = None
            
        print(f"Proceso {pid} ({pcb.name}) TERMINADO")
    
    def execute_process(self, pid: int, time_slice: int = 1) -> bool:
        #Ejecuta un proceso por un time slice
        if pid not in self.processes:
            return False
            
        pcb = self.processes[pid]
    
        if pcb.state != ProcessState.corriendo.value:
            return False
            
        # Ejecutar
        execution_time = min(time_slice, pcb.remaining_time)
        pcb.remaining_time -= execution_time
        pcb.program_counter += execution_time
        
        print(f"  Ejecutando {pcb.name} (PID {pid}): {execution_time} unidades")
        print(f"  Tiempo restante: {pcb.remaining_time}")
        
        # Verificar si terminó
        if pcb.remaining_time <= 0:
            self.terminate_process(pid)
            return True
            
        return False
    #Obtiene un proceso por PID
    def get_process(self, pid: int) -> Optional[PCB]:
        return self.processes.get(pid)
    
    #Retorna información de todos los procesos
    def get_all_processes_info(self) -> List[dict]:
        return [
            {
                'pid': pcb.pid,
                'name': pcb.name,
                'state': pcb.state,
                'priority': pcb.priority,
                'burst_time': pcb.burst_time,
                'remaining_time': pcb.remaining_time,
                'waiting_time': pcb.waiting_time,
                'turnaround_time': pcb.turnaround_time,
                'memory_required': pcb.memory_required
            }
            for pcb in self.processes.values()
        ]
    
    #Actualiza tiempos de espera
    def update_waiting_times(self):
        for pid in self.ready_queue:
            if pid in self.processes:
                self.processes[pid].waiting_time += 1


# ============= PRUEBA UNITARIA =============
if __name__ == "__main__":
    print("=== PRUEBA UNITARIA: Process Manager ===\n")
    
    pm = ProcessManager()
    
    # Crear procesos
    print("1. Creando procesos...")
    pid1 = pm.create_process("Editor", priority=3, burst_time=8)
    pid2 = pm.create_process("Browser", priority=5, burst_time=12)
    pid3 = pm.create_process("Compilador", priority=1, burst_time=15)
    
    print(f"\nProcesos creados: {pm.next_pid - 1}")
    print(f"Cola READY: {pm.ready_queue}")
    
    # Ejecutar un proceso
    print("\n2. Ejecutando proceso 1...")
    pm.transition_to_running(pid1)
    pm.execute_process(pid1, 3)
    
    # Mover a waiting
    print("\n3. Mover proceso 1 a WAITING...")
    pm.transition_to_waiting(pid1, "Esperando disco")
    
    # Ejecutar otro proceso
    print("\n4. Ejecutando proceso 2...")
    pm.transition_to_running(pid2)
    pm.execute_process(pid2, 5)
    
    # Volver proceso 1 a ready
    print("\n5. Proceso 1 vuelve a READY...")
    pm.transition_to_ready(pid1)
    
    # Mostrar estado final
    print("\n6. Estado final de procesos:")
    for info in pm.get_all_processes_info():
        print(f"  PID {info['pid']}: {info['name']} - Estado: {info['state']} - Restante: {info['remaining_time']}")
    
    print("\n✅ Prueba completada")