#Modulo de Concurrendia y Sincronizacion

from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
import numpy as np

@dataclass
#Funcion de Semaforo
class Semaphore:
    name: str
    value: int
    max_value: int
    waiting_queue: List[int] = field(default_factory=list)
    
    def wait(self, pid: int) -> bool:
        if self.value > 0:
            self.value -= 1
            print(f"Proceso {pid} adquirió semáforo {self.name} (valor={self.value})")
            return True
        else:
            if pid not in self.waiting_queue:
                self.waiting_queue.append(pid)
            print(f"Proceso {pid} bloqueado esperando semáforo {self.name}")
            return False
    
    def signal(self, pid: int):
        self.value = min(self.value + 1, self.max_value)
        print(f"Proceso {pid} liberó semáforo {self.name} (valor={self.value})")
        
        # Despertar proceso en espera
        if self.waiting_queue:
            woken_pid = self.waiting_queue.pop(0)
            print(f"  Despertando proceso {woken_pid}")
            return woken_pid
        return None

@dataclass
#Funcion Mutex
class Mutex:
    name: str
    locked: bool = False
    owner: Optional[int] = None
    waiting_queue: List[int] = field(default_factory=list)
    
    def lock(self, pid: int) -> bool:
        if not self.locked:
            self.locked = True
            self.owner = pid
            print(f"Proceso {pid} adquirió mutex {self.name}")
            return True
        else:
            if pid not in self.waiting_queue:
                self.waiting_queue.append(pid)
            print(f"Proceso {pid} bloqueado esperando mutex {self.name} (dueño: {self.owner})")
            return False
    
    def unlock(self, pid: int) -> Optional[int]:
        if self.owner != pid:
            print(f"Error: Proceso {pid} no es dueño del mutex {self.name}")
            return None
            
        self.locked = False
        self.owner = None
        print(f"Proceso {pid} liberó mutex {self.name}")
        
        # Despertar proceso
        if self.waiting_queue:
            woken_pid = self.waiting_queue.pop(0)
            print(f"  Despertando proceso {woken_pid}")
            return woken_pid
        return None

#Funcion de deteccion de deadlock
class DeadlockDetector:
    def __init__(self):
        self.allocation: Dict[int, Set[str]] = {}  # pid -> recursos asignados
        self.request: Dict[int, Set[str]] = {}     # pid -> recursos solicitados
        
    def add_allocation(self, pid: int, resource: str):
        """Registra asignación de recurso"""
        if pid not in self.allocation:
            self.allocation[pid] = set()
        self.allocation[pid].add(resource)
        
    def add_request(self, pid: int, resource: str):
        """Registra solicitud de recurso"""
        if pid not in self.request:
            self.request[pid] = set()
        self.request[pid].add(resource)
        
    def remove_allocation(self, pid: int, resource: str):
        """Remueve asignación"""
        if pid in self.allocation and resource in self.allocation[pid]:
            self.allocation[pid].remove(resource)
            
    def remove_request(self, pid: int, resource: str):
        """Remueve solicitud"""
        if pid in self.request and resource in self.request[pid]:
            self.request[pid].remove(resource)
    
    def detect_deadlock(self) -> Optional[List[int]]:
        # Construir grafo de espera
        wait_for: Dict[int, Set[int]] = {}
        
        for requesting_pid, resources in self.request.items():
            wait_for[requesting_pid] = set()
            for resource in resources:
                # Encontrar quién tiene el recurso
                for holding_pid, allocated in self.allocation.items():
                    if resource in allocated and holding_pid != requesting_pid:
                        wait_for[requesting_pid].add(holding_pid)
        
        # Detectar ciclos usando DFS
        def has_cycle(node, visited, rec_stack):
            visited.add(node)
            rec_stack.add(node)
            
            if node in wait_for:
                for neighbor in wait_for[node]:
                    if neighbor not in visited:
                        if has_cycle(neighbor, visited, rec_stack):
                            return True
                    elif neighbor in rec_stack:
                        return True
            
            rec_stack.remove(node)
            return False
        
        visited = set()
        for pid in wait_for.keys():
            if pid not in visited:
                rec_stack = set()
                if has_cycle(pid, visited, rec_stack):
                    # Encontrado deadlock
                    return list(wait_for.keys())
        
        return None

#Funcion Banquero
class BankersAlgorithm:
    def __init__(self, resources: List[int]):
        self.available = np.array(resources)
        self.max_resources = np.array(resources).copy()
        self.allocation: Dict[int, np.ndarray] = {}
        self.max_need: Dict[int, np.ndarray] = {}
        self.num_resources = len(resources)
        
    def add_process(self, pid: int, max_need: List[int]):
        self.allocation[pid] = np.zeros(self.num_resources, dtype=int)
        self.max_need[pid] = np.array(max_need)
        
    def request_resources(self, pid: int, request: List[int]) -> bool:
        request_arr = np.array(request)
        
        # Verificar que la solicitud no exceda la necesidad
        need = self.max_need[pid] - self.allocation[pid]
        if np.any(request_arr > need):
            print(f"Error: Proceso {pid} solicitó más de lo que necesita")
            return False
        
        # Verificar que hay recursos disponibles
        if np.any(request_arr > self.available):
            print(f"Proceso {pid} debe esperar (recursos insuficientes)")
            return False
        
        # Simular asignación
        self.available -= request_arr
        self.allocation[pid] += request_arr
        
        # Verificar si el estado es seguro
        if self._is_safe_state():
            print(f"Recursos asignados a proceso {pid}: {request}")
            return True
        else:
            # Revertir asignación
            self.available += request_arr
            self.allocation[pid] -= request_arr
            print(f"Solicitud de proceso {pid} denegada (estado inseguro)")
            return False
    #Liberar recursos
    def release_resources(self, pid: int, release: List[int]):
        release_arr = np.array(release)
        self.allocation[pid] -= release_arr
        self.available += release_arr
        print(f"Proceso {pid} liberó recursos: {release}")
    #Verifica si es seguro el estado actual
    def _is_safe_state(self) -> bool:
        work = self.available.copy()
        finish = {pid: False for pid in self.allocation.keys()}
        safe_sequence = []
        
        while True:
            found = False
            for pid in self.allocation.keys():
                if not finish[pid]:
                    need = self.max_need[pid] - self.allocation[pid]
                    if np.all(need <= work):
                        # Proceso puede terminar
                        work += self.allocation[pid]
                        finish[pid] = True
                        safe_sequence.append(pid)
                        found = True
                        break
            
            if not found:
                break
        
        # Si todos los procesos pueden terminar, el estado es seguro
        is_safe = all(finish.values())
        if is_safe:
            print(f"  Estado seguro. Secuencia: {safe_sequence}")
        return is_safe
#Clase de gestion de concurrencia y sincronizacion
class ConcurrencyManager:
    def __init__(self):
        self.semaphores: Dict[str, Semaphore] = {}
        self.mutexes: Dict[str, Mutex] = {}
        self.deadlock_detector = DeadlockDetector()
        self.bankers_algorithm: Optional[BankersAlgorithm] = None
        
    def create_semaphore(self, name: str, initial_value: int, max_value: int = None):
        """Crea un nuevo semáforo"""
        if max_value is None:
            max_value = initial_value
        self.semaphores[name] = Semaphore(name, initial_value, max_value)
        print(f"Semáforo '{name}' creado (valor={initial_value})")
        
    def create_mutex(self, name: str):
        """Crea un nuevo mutex"""
        self.mutexes[name] = Mutex(name)
        print(f"Mutex '{name}' creado")
        
    def initialize_bankers(self, resources: List[int]):
        """Inicializa el algoritmo del banquero"""
        self.bankers_algorithm = BankersAlgorithm(resources)
        print(f"Algoritmo del Banquero inicializado con recursos: {resources}")
        
    def check_deadlock(self) -> Optional[List[int]]:
        """Verifica si hay deadlock"""
        deadlocked = self.deadlock_detector.detect_deadlock()
        if deadlocked:
            print(f"⚠️  DEADLOCK DETECTADO en procesos: {deadlocked}")
        return deadlocked
        
    def get_concurrency_state(self) -> dict:
        """Retorna estado de sincronización"""
        return {
            'semaphores': [
                {
                    'name': s.name,
                    'value': s.value,
                    'waiting': len(s.waiting_queue)
                }
                for s in self.semaphores.values()
            ],
            'mutexes': [
                {
                    'name': m.name,
                    'locked': m.locked,
                    'owner': m.owner,
                    'waiting': len(m.waiting_queue)
                }
                for m in self.mutexes.values()
            ]
        }
