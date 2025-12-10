#Modulo de Gestion de dispositivos E/S

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import random
import time

#Definimos tipos de dispositivos
class DeviceType(Enum):
    DISK = "DISK"
    PRINTER = "PRINTER"
    KEYBOARD = "KEYBOARD"
    NETWORK = "NETWORK"
    USB = "USB"
#Estados de los dispositivos
class DeviceStatus(Enum):
    IDLE = "IDLE"
    BUSY = "BUSY"
    ERROR = "ERROR"

@dataclass
#Solicitud de E/S al SO
class IORequest:
    request_id: int
    process_id: int
    device_name: str
    operation: str  # "read", "write"
    data_size: int
    priority: int = 5
    arrival_time: float = 0.0
    start_time: float = 0.0
    completion_time: float = 0.0
    
    def __post_init__(self):
        if self.arrival_time == 0.0:
            self.arrival_time = time.time()

@dataclass
#Definir dispisitivo E/S en el SO
class Device:
    name: str
    device_type: DeviceType
    status: DeviceStatus = DeviceStatus.IDLE
    speed: int = 100  # operaciones por segundo
    queue: List[IORequest] = field(default_factory=list)
    current_request: Optional[IORequest] = None
    total_operations: int = 0
    total_waiting_time: float = 0.0
    
    def is_available(self) -> bool:
        return self.status == DeviceStatus.IDLE
    
    def add_request(self, request: IORequest):
        self.queue.append(request)
        print(f"  Solicitud {request.request_id} añadida a {self.name} "
              f"(cola: {len(self.queue)})")
    
    def process_next(self, current_time: float) -> Optional[IORequest]:
        if not self.queue or self.status != DeviceStatus.IDLE:
            return None
        # Obtener siguiente solicitud
        request = self.queue.pop(0)
        self.current_request = request
        self.status = DeviceStatus.BUSY
        request.start_time = current_time
        waiting_time = request.start_time - request.arrival_time
        self.total_waiting_time += waiting_time
        print(f"  {self.name} procesando solicitud {request.request_id} "
              f"(P{request.process_id}) - {request.operation}")
        
        return request
    
    def complete_current(self, current_time: float) -> Optional[IORequest]:
        if not self.current_request:
            return None
            
        request = self.current_request
        request.completion_time = current_time
        service_time = request.completion_time - request.start_time
        print(f"  {self.name} completó solicitud {request.request_id} "
              f"(tiempo servicio: {service_time:.2f})")
        self.status = DeviceStatus.IDLE
        self.current_request = None
        self.total_operations += 1  
        return request

#Controla las interrupciones
class InterruptController:
    def __init__(self):
        self.interrupt_queue: List[dict] = []
        self.interrupt_counter = 0
        
    def raise_interrupt(self, interrupt_type: str, device_name: str, 
                       process_id: int, data: dict = None):
        self.interrupt_counter += 1
        interrupt = {
            'id': self.interrupt_counter,
            'type': interrupt_type,
            'device': device_name,
            'process_id': process_id,
            'data': data or {}
        }
        self.interrupt_queue.append(interrupt)
        print(f"  🔔 Interrupción {self.interrupt_counter}: {interrupt_type} "
              f"desde {device_name} (P{process_id})")
        
    def handle_interrupts(self) -> List[dict]:
        handled = []
        while self.interrupt_queue:
            interrupt = self.interrupt_queue.pop(0)
            self._handle_single_interrupt(interrupt)
            handled.append(interrupt)
        return handled
        
    def _handle_single_interrupt(self, interrupt: dict):
        print(f"Manejando interrupción {interrupt['id']}: {interrupt['type']}")
#Controlador de Memoria Directa
class DMAController:
    def __init__(self):
        self.active_transfers: Dict[str, dict] = {}
        self.transfer_counter = 0
        
    def start_transfer(self, device_name: str, source: int, 
                      dest: int, size: int) -> int:
        self.transfer_counter += 1
        transfer_id = self.transfer_counter
        
        self.active_transfers[device_name] = {
            'id': transfer_id,
            'source': source,
            'dest': dest,
            'size': size,
            'transferred': 0
        }
        
        print(f"  DMA: Iniciando transferencia {transfer_id} "
              f"({size} bytes) para {device_name}")
        return transfer_id
        
    def update_transfers(self, rate: int = 1024) -> List[str]:
        completed = []
        
        for device_name, transfer in list(self.active_transfers.items()):
            transfer['transferred'] += rate
            
            if transfer['transferred'] >= transfer['size']:
                print(f"  DMA: Transferencia {transfer['id']} completada")
                completed.append(device_name)
                del self.active_transfers[device_name]
                
        return completed
#Funcion de planificacion de dispositivos
class IOScheduler:
    @staticmethod
    def fcfs_schedule(queue: List[IORequest]) -> List[IORequest]:
        return queue.copy()
    
    @staticmethod
    def sstf_schedule(queue: List[IORequest], current_position: int = 0) -> List[IORequest]:
        if not queue:
            return []
            
        # Simular posiciones de disco
        sorted_queue = sorted(queue, 
                            key=lambda r: abs(hash(r.request_id) % 1000 - current_position))
        return sorted_queue
    
    @staticmethod
    def scan_schedule(queue: List[IORequest], direction: str = "up") -> List[IORequest]:
        if not queue:
            return []
            
        # Simular ordenamiento por posición
        positions = [(r, hash(r.request_id) % 1000) for r in queue]
        
        if direction == "up":
            sorted_queue = sorted(positions, key=lambda x: x[1])
        else:
            sorted_queue = sorted(positions, key=lambda x: x[1], reverse=True)
            
        return [r for r, _ in sorted_queue]
    
    @staticmethod
    def priority_schedule(queue: List[IORequest]) -> List[IORequest]:
        return sorted(queue, key=lambda r: r.priority)

#Planficador de dispositivos
class IOManager:
    def __init__(self):
        self.devices: Dict[str, Device] = {}
        self.interrupt_controller = InterruptController()
        self.dma_controller = DMAController()
        self.request_counter = 0
        self.completed_requests: List[IORequest] = []
        
    def initialize(self):
        # Crear dispositivos comunes
        self.add_device("disk0", DeviceType.DISK, speed=50)
        self.add_device("disk1", DeviceType.DISK, speed=50)
        self.add_device("printer0", DeviceType.PRINTER, speed=10)
        self.add_device("network0", DeviceType.NETWORK, speed=100)
        
        print("Dispositivos E/S inicializados")
        
    def add_device(self, name: str, device_type: DeviceType, speed: int = 100):
        device = Device(name, device_type, speed=speed)
        self.devices[name] = device
        print(f"  Dispositivo añadido: {name} ({device_type.value})")
        
    def request_io(self, process_id: int, device_name: str, 
                   operation: str, data_size: int, priority: int = 5) -> Optional[int]:
        if device_name not in self.devices:
            print(f"  Error: Dispositivo {device_name} no existe")
            return None
            
        self.request_counter += 1
        request = IORequest(
            request_id=self.request_counter,
            process_id=process_id,
            device_name=device_name,
            operation=operation,
            data_size=data_size,
            priority=priority
        )
        
        device = self.devices[device_name]
        device.add_request(request)
        
        return request.request_id
        
    def process_io_queues(self, current_time: float, scheduler: str = 'FCFS'):
        for device_name, device in self.devices.items():
            # Si el dispositivo está ocupado, simular progreso
            if device.status == DeviceStatus.BUSY and device.current_request:
                # Simular tiempo de operación
                elapsed = current_time - device.current_request.start_time
                estimated_time = device.current_request.data_size / device.speed
                
                if elapsed >= estimated_time or random.random() < 0.3:  # 30% de completar
                    # Completar operación
                    completed_request = device.complete_current(current_time)
                    
                    if completed_request:
                        # Generar interrupción
                        self.interrupt_controller.raise_interrupt(
                            'IO_COMPLETE',
                            device_name,
                            completed_request
                        )
                        
                        self.completed_requests.append(completed_request)
            
            # Procesar siguiente si está idle
            if device.is_available() and device.queue:
                # Aplicar algoritmo de planificación
                if scheduler == 'SSTF':
                    device.queue = IOScheduler.sstf_schedule(device.queue)
                elif scheduler == 'SCAN':
                    device.queue = IOScheduler.scan_schedule(device.queue)
                elif scheduler == 'PRIORITY':
                    device.queue = IOScheduler.priority_schedule(device.queue)
                
                device.process_next(current_time)
        
        # Manejar interrupciones
        self.interrupt_controller.handle_interrupts()
        
        # Actualizar transferencias DMA
        self.dma_controller.update_transfers()
        
    def get_devices_state(self) -> List[dict]:
        return [
            {
                'name': device.name,
                'type': device.device_type.value,
                'status': device.status.value,
                'queue_length': len(device.queue),
                'current_request': device.current_request.request_id if device.current_request else None,
                'total_operations': device.total_operations,
                'avg_waiting_time': (device.total_waiting_time / device.total_operations 
                                    if device.total_operations > 0 else 0)
            }
            for device in self.devices.values()
        ]
    
    def get_statistics(self) -> dict:
        total_requests = self.request_counter
        completed = len(self.completed_requests)
        
        if completed > 0:
            avg_turnaround = sum(r.completion_time - r.arrival_time for r in self.completed_requests) / completed
        else:
            avg_turnaround = 0
        return {
            'total_requests': total_requests,
            'completed_requests': completed,
            'pending_requests': total_requests - completed,
            'avg_turnaround_time': avg_turnaround,
            'total_interrupts': self.interrupt_controller.interrupt_counter
        }
