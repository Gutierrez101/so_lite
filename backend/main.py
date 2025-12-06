#Modulo principal del backend

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.process_manager import ProcessManager
from core.cpu_scheduler import CPUScheduler
from core.memory_manager import MemoryManager
from core.io_manager import IOManager
from core.concurrency_manager import ConcurrencyManager
import time

#Definimos la clase principal que es el kernel
class Kernel:
    def __init__(self):
        self.process_manager=ProcessManager()
        self.cpu_scheduler=CPUScheduler(self.process_manager)
        self.memory_manager=MemoryManager()
        self.io_manager=IOManager()
        self.concurrency_manager=ConcurrencyManager()
        self.running=False
        self.clock=0
    
    def initialize(self):
        #Inicializa el kernel
        print("="*60)
        print("Iniciando SO-LITE kernel...")
        print("="*60)
        self.memory_manager.initialize()
        self.io_manager.initialize()
        print("✅ Sistema operagtivo listo.\n")
    
    def create_process(self, name, priority=5, burst_time=10, memory_required=100):
        pid = self.process_manager.create_process(name, priority, burst_time, memory_required)
        # Intentar asignar memoria
        if self.memory_manager.allocate(pid, memory_required):
            print(f"✅ Proceso {pid} ({name}) creado y memoria asignada.")
            return pid
        else:
            print(f"❌ Error: No hay memoria suficiente para proceso {pid}")
            self.process_manager.terminate_process(pid)
            return None
    
    def run_simulation(self, algorithm='FCFS', time_quantum=4, steps=20):
        print(f"\n{'='*60}")
        print(f"INICIANDO SIMULACIÓN CON {algorithm}")
        print(f"Quantum: {time_quantum}, Pasos: {steps}")
        print('='*60)
        self.running = True
        
        for step in range(steps):
            if not self.running:
                break
            
            # Verificar si hay procesos activos
            active = len([p for p in self.process_manager.processes.values() 
                         if p.state != 'TERMINATED'])
            if active == 0:
                print("\n⚠️ No hay procesos activos, finalizando simulación.")
                break
                
            self.clock += 1
            print(f"\n{'─'*60}")
            print(f"⏰ Clock: {self.clock}")
            print('─'*60)
            
            # Ejecutar scheduler
            self.cpu_scheduler.schedule(algorithm, time_quantum)
            
            # Procesar E/S
            self.io_manager.process_io_queues(time.time())
            
            # Actualizar estadísticas
            self._update_statistics()
            
            time.sleep(0.3)  # Pausa para visualización
            
        print(f"\n{'='*60}")
        print("SIMULACIÓN FINALIZADA")
        print('='*60)
        self._print_final_statistics()
    
    #Actualiza estadisticas del sistema
    def _update_statistics(self):
        ready = len([p for p in self.process_manager.processes.values() if p.state == 'READY'])
        running = len([p for p in self.process_manager.processes.values() if p.state == 'RUNNING'])
        waiting = len([p for p in self.process_manager.processes.values() if p.state == 'WAITING'])
        terminated = len([p for p in self.process_manager.processes.values() if p.state == 'TERMINATED'])
        
        print(f"📊 Estado - Ready: {ready}, Running: {running}, Waiting: {waiting}, Terminated: {terminated}")
    
    def _print_final_statistics(self):
        print("\n Estadisticas Finales")
        print("-"*60)

        for pid, process in self.process_manager.processes.items():
            print(f"\nPID {pid}: {process.name}")
            print(f"  Estado: {process.state}")
            print(f"  Prioridad: {process.priority}")
            print(f"  Tiempo espera: {process.waiting_time}")
            print(f"  Tiempo retorno: {process.turnaround_time}")
            print(f"  Tiempo respuesta: {process.response_time}")
            print(f"  Cambios de contexto: {process.context_switches}")
        
        metrics = self.cpu_scheduler.calculate_metrics()
        print("\n Metricas del Sistema")
        print("─" * 60)
        for key, value in metrics.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.2f}")
            else:
                print(f"  {key}: {value}")
        
        mem_state = self.memory_manager.get_memory_state()
        print("\n Estado de Memoria")
        print("─" * 60)
        print(f"  Modo: {mem_state['mode']}")
        if mem_state['mode'] == 'paging':
            print(f"  Page Faults: {mem_state.get('page_faults', 0)}")
            print(f"  Frames totales: {mem_state.get('total_frames', 0)}")
            
        # Estadísticas de E/S
        io_stats = self.io_manager.get_statistics()
        print("\n Estadisticas de E/S")
        print("─" * 60)
        for key, value in io_stats.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.2f}")
            else:
                print(f"  {key}: {value}")
            
    def get_system_state(self):
        return {
            'clock': self.clock,
            'processes': self.process_manager.get_all_processes_info(),
            'memory': self.memory_manager.get_memory_state(),
            'io_devices': self.io_manager.get_devices_state(),
            'cpu': self.cpu_scheduler.get_cpu_state()
        }

# ============= DEMOS Y EJEMPLOS =============

def demo_basic():
    """Demo básica del sistema"""
    print("\n" + "="*60)
    print("DEMO BÁSICA - SO-Lite")
    print("="*60)
    
    kernel = Kernel()
    kernel.initialize()
    
    # Crear procesos
    kernel.create_process("Editor", priority=3, burst_time=8, memory_required=50)
    kernel.create_process("Browser", priority=5, burst_time=12, memory_required=150)
    kernel.create_process("Compilador", priority=2, burst_time=15, memory_required=200)
    
    # Ejecutar simulación
    kernel.run_simulation(algorithm='RR', time_quantum=4, steps=30)


def demo_compare_algorithms():
    """Compara diferentes algoritmos de planificación"""
    print("\n" + "="*60)
    print("DEMO COMPARACIÓN DE ALGORITMOS")
    print("="*60)
    
    algorithms = ['FCFS', 'SJF', 'RR', 'PRIORITY']
    
    for algo in algorithms:
        print(f"\n\n{'#'*60}")
        print(f"# ALGORITMO: {algo}")
        print('#'*60)
        
        kernel = Kernel()
        kernel.initialize()
        
        # Crear mismos procesos para comparación justa
        kernel.create_process("P1", priority=3, burst_time=6, memory_required=50)
        kernel.create_process("P2", priority=1, burst_time=4, memory_required=30)
        kernel.create_process("P3", priority=5, burst_time=8, memory_required=70)
        kernel.create_process("P4", priority=2, burst_time=5, memory_required=40)
        
        # Ejecutar
        kernel.run_simulation(algorithm=algo, time_quantum=3, steps=25)
        
        time.sleep(1)  # Pausa entre algoritmos


def demo_concurrency():
    """Demo de concurrencia y sincronización"""
    print("\n" + "="*60)
    print("DEMO CONCURRENCIA Y SINCRONIZACIÓN")
    print("="*60)
    
    kernel = Kernel()
    kernel.initialize()
    
    # Crear semáforos
    print("\n1. Creando mecanismos de sincronización...")
    kernel.concurrency_manager.create_semaphore("buffer", 3)
    kernel.concurrency_manager.create_mutex("critical_section")
    
    # Crear procesos que usarán sincronización
    kernel.create_process("Producer", priority=3, burst_time=10)
    kernel.create_process("Consumer", priority=3, burst_time=10)
    
    # Simular operaciones de sincronización
    print("\n2. Simulando operaciones...")
    sem = kernel.concurrency_manager.semaphores["buffer"]
    sem.wait(1)
    sem.wait(2)
    
    mtx = kernel.concurrency_manager.mutexes["critical_section"]
    mtx.lock(1)
    mtx.lock(2)
    mtx.unlock(1)
    
    # Algoritmo del banquero
    print("\n3. Probando Algoritmo del Banquero...")
    kernel.concurrency_manager.initialize_bankers([10, 5, 7])
    banker = kernel.concurrency_manager.bankers_algorithm
    banker.add_process(1, [7, 5, 3])
    banker.add_process(2, [3, 2, 2])
    banker.request_resources(1, [0, 1, 0])
    banker.request_resources(2, [2, 0, 0])


def demo_memory():
    """Demo de gestión de memoria"""
    print("\n" + "="*60)
    print("DEMO GESTIÓN DE MEMORIA")
    print("="*60)
    
    # Probar paginación
    print("\n1. PAGINACIÓN CON LRU")
    print("-" * 60)
    kernel = Kernel()
    kernel.memory_manager = MemoryManager(total_memory=1024, mode='paging')
    kernel.memory_manager.initialize()
    
    kernel.process_manager.create_process("MemTest", burst_time=5, memory_required=100)
    kernel.memory_manager.allocate(1, 100)
    
    # Simular accesos a páginas
    paging = kernel.memory_manager.paging_manager
    pages = [0, 1, 2, 3, 0, 1, 4, 0, 1, 2, 3, 4]
    
    for page in pages:
        fault = paging.access_page(1, page)
        if fault:
            paging.load_page(1, page, 'LRU')
    
    print(f"\n📊 Resultados:")
    print(f"  Total accesos: {paging.page_accesses}")
    print(f"  Page faults: {paging.page_faults}")
    print(f"  Tasa de aciertos: {((paging.page_accesses - paging.page_faults) / paging.page_accesses * 100):.1f}%")


def demo_io():
    """Demo de gestión de E/S"""
    print("\n" + "="*60)
    print("DEMO GESTIÓN DE E/S")
    print("="*60)
    
    kernel = Kernel()
    kernel.initialize()
    
    # Crear procesos
    kernel.create_process("IOProcess1", priority=3, burst_time=5)
    kernel.create_process("IOProcess2", priority=5, burst_time=5)
    
    # Solicitar operaciones de E/S
    print("\n1. Creando solicitudes de E/S...")
    kernel.io_manager.request_io(1, "disk0", "read", 4096, priority=3)
    kernel.io_manager.request_io(2, "disk0", "write", 2048, priority=1)
    kernel.io_manager.request_io(1, "printer0", "write", 1024, priority=5)
    
    # Procesar E/S
    print("\n2. Procesando colas de E/S...")
    for i in range(10):
        print(f"\n--- Ciclo {i+1} ---")
        kernel.io_manager.process_io_queues(time.time(), scheduler='PRIORITY')
        time.sleep(0.5)


if __name__ == "__main__":
    # Menú de demos
    print("\n" + "="*60)
    print("SO-LITE - SISTEMA OPERATIVO EDUCATIVO")
    print("="*60)
    print("\nSeleccione una demo:")
    print("1. Demo básica")
    print("2. Comparar algoritmos de planificación")
    print("3. Concurrencia y sincronización")
    print("4. Gestión de memoria")
    print("5. Gestión de E/S")
    print("0. Ejecutar todas")
    
    try:
        choice = input("\nOpción: ").strip()
        
        if choice == "1":
            demo_basic()
        elif choice == "2":
            demo_compare_algorithms()
        elif choice == "3":
            demo_concurrency()
        elif choice == "4":
            demo_memory()
        elif choice == "5":
            demo_io()
        elif choice == "0":
            demo_basic()
            input("\nPresione Enter para continuar...")
            demo_compare_algorithms()
            input("\nPresione Enter para continuar...")
            demo_concurrency()
            input("\nPresione Enter para continuar...")
            demo_memory()
            input("\nPresione Enter para continuar...")
            demo_io()
        else:
            print("Opción inválida, ejecutando demo básica...")
            demo_basic()
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Simulación interrumpida por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60)
    print("¡Gracias por usar SO-Lite!")
    print("="*60)
