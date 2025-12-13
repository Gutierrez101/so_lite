from typing import Optional, List
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.process_manager import ProcessManager, PCB

class CPUScheduler:
    def __init__(self, process_manager: ProcessManager):
        self.pm = process_manager
        self.current_algorithm = 'FCFS'
        self.time_quantum = 4
        self.quantum_counter = 0
        
    def schedule(self, algorithm: str = 'FCFS', time_quantum: int = 4):
        """Ejecuta un ciclo del algoritmo de planificación"""
        # Aseguramos mayúsculas para evitar errores de string
        self.current_algorithm = algorithm.upper()
        self.time_quantum = time_quantum
        
        # Actualizar tiempos de espera de todos los procesos en READY
        self.pm.update_waiting_times()
        
        # Dispatcher
        if self.current_algorithm == 'FCFS':
            self._schedule_fcfs()
        elif self.current_algorithm == 'SJF':
            self._schedule_sjf()
        elif self.current_algorithm == 'RR':
            self._schedule_round_robin()
        elif self.current_algorithm == 'PRIORITY':
            self._schedule_priority()
        else:
            print(f"Algoritmo desconocido: {algorithm}, usando FCFS")
            self._schedule_fcfs()
    
    # 1. FCFS (First Come First Served)
    def _schedule_fcfs(self):
        if self.pm.running_process is not None:
            # Ejecutar proceso actual
            self.pm.execute_process(self.pm.running_process, 1)
        elif self.pm.ready_queue:
            # Seleccionar siguiente de la cola (FIFO)
            next_pid = self.pm.ready_queue[0]
            if self.pm.transition_to_running(next_pid):
                self.pm.execute_process(next_pid, 1)

    # 2. SJF (Shortest Job First - Non Preemptive)
    def _schedule_sjf(self):
        # Si hay proceso corriendo, DEJARLO terminar (No Apropiativo)
        if self.pm.running_process is not None:
            self.pm.execute_process(self.pm.running_process, 1)
            return

        # Si no hay nadie corriendo, buscar el más corto
        if not self.pm.ready_queue:
            return
            
        # Buscar PID con menor remaining_time
        shortest_pid = min(
            self.pm.ready_queue,
            key=lambda pid: self.pm.processes[pid].remaining_time
        )
        
        if self.pm.transition_to_running(shortest_pid):
            self.pm.execute_process(shortest_pid, 1)

    # 3. Round Robin (RR)
    def _schedule_round_robin(self):
        current_pid = self.pm.running_process
        
        if current_pid is not None:
            # Ejecutar un tick
            completed = self.pm.execute_process(current_pid, 1)
            self.quantum_counter += 1
            
            if completed:
                self.quantum_counter = 0
                # Si terminó, intentar meter el siguiente inmediatamente
                if self.pm.ready_queue:
                    next_pid = self.pm.ready_queue[0]
                    if self.pm.transition_to_running(next_pid):
                        # NO ejecutar aquí para no dar doble tick, espera al sig ciclo
                        pass
            elif self.quantum_counter >= self.time_quantum:
                # Se acabó el Quantum -> Cambio de contexto
                pcb = self.pm.processes[current_pid]
                pcb.context_switches += 1
                self.pm.transition_to_ready(current_pid) # Esto lo manda al final de la cola
                self.quantum_counter = 0
                
                # Cargar el siguiente inmediatamente
                if self.pm.ready_queue:
                    next_pid = self.pm.ready_queue[0]
                    self.pm.transition_to_running(next_pid)
        else:
            # CPU Libre: Cargar siguiente
            if self.pm.ready_queue:
                next_pid = self.pm.ready_queue[0]
                if self.pm.transition_to_running(next_pid):
                    self.quantum_counter = 1 # Primer tick cuenta
                    self.pm.execute_process(next_pid, 1)

    # 4. Priority (Preemptive/Apropiativo)
    def _schedule_priority(self):
        # Verificar si hay alguien corriendo
        if self.pm.running_process is not None:
            current_pid = self.pm.running_process
            current_pcb = self.pm.processes[current_pid]
            
            # Revisar si llegó alguien con MEJOR prioridad (menor número)
            if self.pm.ready_queue:
                highest_priority_pid = min(
                    self.pm.ready_queue,
                    key=lambda pid: self.pm.processes[pid].priority
                )
                best_priority_in_queue = self.pm.processes[highest_priority_pid].priority
                
                # Si hay alguien más importante, expropiar CPU
                if best_priority_in_queue < current_pcb.priority:
                    current_pcb.context_switches += 1
                    self.pm.transition_to_ready(current_pid)
                    if self.pm.transition_to_running(highest_priority_pid):
                        self.pm.execute_process(highest_priority_pid, 1)
                    return

            # Si nadie es más importante, continuar ejecutando
            self.pm.execute_process(current_pid, 1)
            
        else:
            # CPU Libre: Elegir el de mayor prioridad
            if self.pm.ready_queue:
                highest_priority_pid = min(
                    self.pm.ready_queue,
                    key=lambda pid: self.pm.processes[pid].priority
                )
                if self.pm.transition_to_running(highest_priority_pid):
                    self.pm.execute_process(highest_priority_pid, 1)

    def get_cpu_state(self) -> dict:
        running_info = None
        if self.pm.running_process:
            pcb = self.pm.processes[self.pm.running_process]
            running_info = {
                'pid': pcb.pid,
                'name': pcb.name,
                'remaining_time': pcb.remaining_time
            }
        
        return {
            'algorithm': self.current_algorithm,
            'time_quantum': self.time_quantum,
            'running_process': running_info,
            'quantum_counter': self.quantum_counter,
            'ready_queue_size': len(self.pm.ready_queue)
        }
    
    def calculate_metrics(self) -> dict:
        completed = [p for p in self.pm.processes.values() if p.state == 'TERMINATED']
        
        if not completed:
            return {
                'avg_waiting_time': 0,
                'avg_turnaround_time': 0,
                'avg_response_time': 0,
                'throughput': 0,
                'total_context_switches': 0
            }
        
        avg_waiting = sum(p.waiting_time for p in completed) / len(completed)
        avg_turnaround = sum(p.turnaround_time for p in completed) / len(completed)
        avg_response = sum(p.response_time for p in completed if p.response_time >= 0) / len(completed)
        
        return {
            'avg_waiting_time': avg_waiting,
            'avg_turnaround_time': avg_turnaround,
            'avg_response_time': avg_response,
            'throughput': len(completed),
            'total_context_switches': sum(p.context_switches for p in completed)
        }