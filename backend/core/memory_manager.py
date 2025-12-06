#Modulo de Gestion de Memoria

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque
import time

# Creamos las particiones, la paginacion y segmentacion

@dataclass
class Partition:
    id: int
    base: int
    size: int
    allocated: bool = False
    process_id: Optional[int] = None
#Gestor de particion
class PartitionManager:
    def __init__(self, total_memory: int, partition_sizes: List[int]):
        self.total_memory = total_memory
        self.partitions: List[Partition] = []
        
        base = 0
        for i, size in enumerate(partition_sizes):
            self.partitions.append(Partition(i, base, size))
            base += size
            
    def allocate_first_fit(self, pid: int, size: int) -> Optional[int]:
        for partition in self.partitions:
            if not partition.allocated and partition.size >= size:
                partition.allocated = True
                partition.process_id = pid
                print(f"  Asignado P{pid} a partición {partition.id} (First Fit)")
                return partition.base
        return None
        
    def allocate_best_fit(self, pid: int, size: int) -> Optional[int]:
        best = None
        best_waste = float('inf')
        
        for partition in self.partitions:
            if not partition.allocated and partition.size >= size:
                waste = partition.size - size
                if waste < best_waste:
                    best = partition
                    best_waste = waste
                    
        if best:
            best.allocated = True
            best.process_id = pid
            print(f"  Asignado P{pid} a partición {best.id} (Best Fit, desperdicio={best_waste})")
            return best.base
        return None
        
    def allocate_worst_fit(self, pid: int, size: int) -> Optional[int]:
        worst = None
        max_size = -1
        
        for partition in self.partitions:
            if not partition.allocated and partition.size >= size:
                if partition.size > max_size:
                    worst = partition
                    max_size = partition.size
                    
        if worst:
            worst.allocated = True
            worst.process_id = pid
            print(f"  Asignado P{pid} a partición {worst.id} (Worst Fit)")
            return worst.base
        return None
        
    def deallocate(self, pid: int):
        for partition in self.partitions:
            if partition.process_id == pid:
                partition.allocated = False
                partition.process_id = None
                print(f"  Liberada partición {partition.id} de P{pid}")
                
    def get_fragmentation(self) -> Tuple[int, int]:
        internal = 0  # Espacio asignado pero no usado
        external = 0  # Espacio libre fragmentado
        
        for partition in self.partitions:
            if not partition.allocated:
                external += partition.size
                
        return internal, external

# ============= PAGINACIÓN =============

@dataclass
class Page:
    page_number: int
    frame_number: Optional[int] = None
    valid: bool = False
    referenced: bool = False
    modified: bool = False
    load_time: float = 0.0
    last_access_time: float = 0.0
    reference_count: int = 0

@dataclass
#Marco de pagina
class Frame:
    frame_number: int
    page_number: Optional[int] = None
    process_id: Optional[int] = None
    occupied: bool = False
#Gestor de paginaciones
class PagingManager:
    def __init__(self, total_frames: int, page_size: int = 4096):
        self.page_size = page_size
        self.frames: List[Frame] = [Frame(i) for i in range(total_frames)]
        self.page_tables: Dict[int, Dict[int, Page]] = {}  # pid -> {page_num: Page}
        self.page_faults = 0
        self.page_accesses = 0
        
    def create_page_table(self, pid: int, num_pages: int):
        self.page_tables[pid] = {
            i: Page(page_number=i) 
            for i in range(num_pages)
        }
        print(f"Tabla de páginas creada para P{pid}: {num_pages} páginas")
        
    def access_page(self, pid: int, page_number: int) -> bool:
        self.page_accesses += 1
        
        if pid not in self.page_tables:
            return False
            
        page = self.page_tables[pid].get(page_number)
        if not page:
            return False
            
        # Actualizar estadísticas
        page.last_access_time = time.time()
        page.reference_count += 1
        page.referenced = True
        
        # Si la página no está en memoria física
        if not page.valid:
            self.page_faults += 1
            print(f"  Page Fault: P{pid}, Página {page_number}")
            return True
            
        return False
        
    def load_page(self, pid: int, page_number: int, replacement_algo: str = 'FIFO') -> bool:
        if pid not in self.page_tables:
            return False
            
        page = self.page_tables[pid][page_number]
        
        # Buscar frame libre
        free_frame = self._find_free_frame()
        
        if free_frame is not None:
            # Hay frame libre
            frame = self.frames[free_frame]
            frame.occupied = True
            frame.process_id = pid
            frame.page_number = page_number
            
            page.frame_number = free_frame
            page.valid = True
            page.load_time = time.time()
            
            print(f"  Página {page_number} cargada en frame {free_frame}")
            return True
        else:
            # Necesita reemplazo
            victim_frame = self._select_victim(replacement_algo)
            if victim_frame is not None:
                self._replace_page(victim_frame, pid, page_number)
                return True
                
        return False
        
    def _find_free_frame(self) -> Optional[int]:
        for frame in self.frames:
            if not frame.occupied:
                return frame.frame_number
        return None
        
    def _select_victim(self, algorithm: str) -> Optional[int]:
        if algorithm == 'FIFO':
            return self._fifo_victim()
        elif algorithm == 'LRU':
            return self._lru_victim()
        elif algorithm == 'CLOCK':
            return self._clock_victim()
        return None
        
    def _fifo_victim(self) -> Optional[int]:
        oldest_time = float('inf')
        victim = None
        
        for frame in self.frames:
            if frame.occupied and frame.process_id in self.page_tables:
                page = self.page_tables[frame.process_id][frame.page_number]
                if page.load_time < oldest_time:
                    oldest_time = page.load_time
                    victim = frame.frame_number
                    
        return victim
        
    def _lru_victim(self) -> Optional[int]:
        oldest_access = float('inf')
        victim = None
        
        for frame in self.frames:
            if frame.occupied and frame.process_id in self.page_tables:
                page = self.page_tables[frame.process_id][frame.page_number]
                if page.last_access_time < oldest_access:
                    oldest_access = page.last_access_time
                    victim = frame.frame_number
                    
        return victim
        
    def _clock_victim(self) -> Optional[int]:
        # Implementación simplificada del algoritmo del reloj
        for frame in self.frames:
            if frame.occupied and frame.process_id in self.page_tables:
                page = self.page_tables[frame.process_id][frame.page_number]
                
                if not page.referenced:
                    return frame.frame_number
                else:
                    page.referenced = False  # Segunda oportunidad
                    
        # Si todos tienen bit de referencia, tomar el primero
        return 0 if self.frames[0].occupied else None
        
    def _replace_page(self, victim_frame: int, new_pid: int, new_page: int):
        frame = self.frames[victim_frame]
        
        # Invalidar página víctima
        if frame.process_id in self.page_tables and frame.page_number in self.page_tables[frame.process_id]:
            old_page = self.page_tables[frame.process_id][frame.page_number]
            old_page.valid = False
            old_page.frame_number = None
            print(f"  Reemplazando: P{frame.process_id}-Pg{frame.page_number} "
                  f"por P{new_pid}-Pg{new_page}")
        
        # Cargar nueva página
        frame.process_id = new_pid
        frame.page_number = new_page
        
        new_page_obj = self.page_tables[new_pid][new_page]
        new_page_obj.frame_number = victim_frame
        new_page_obj.valid = True
        new_page_obj.load_time = time.time()

# Definimos la segmentacion

@dataclass
class Segment:
    segment_number: int
    base: int
    limit: int
    name: str = ""
#Manejador de segmentaciones    
class SegmentationManager:
    
    def __init__(self, total_memory: int):
        self.total_memory = total_memory
        self.segment_tables: Dict[int, List[Segment]] = {}
        self.free_blocks: List[Tuple[int, int]] = [(0, total_memory)]  # (base, size)
        
    def create_segment(self, pid: int, segment_num: int, size: int, name: str = "") -> bool:
        # Buscar bloque libre
        for i, (base, block_size) in enumerate(self.free_blocks):
            if block_size >= size:
                # Asignar segmento
                segment = Segment(segment_num, base, size, name)
                
                if pid not in self.segment_tables:
                    self.segment_tables[pid] = []
                self.segment_tables[pid].append(segment)
                
                # Actualizar bloques libres
                if block_size == size:
                    self.free_blocks.pop(i)
                else:
                    self.free_blocks[i] = (base + size, block_size - size)
                    
                print(f"  Segmento '{name}' ({size} bytes) creado en base {base}")
                return True
                
        print(f"  No hay espacio para segmento de {size} bytes")
        return False
        
    def deallocate_segments(self, pid: int):
        if pid not in self.segment_tables:
            return
            
        for segment in self.segment_tables[pid]:
            self.free_blocks.append((segment.base, segment.limit))
            
        # Combinar bloques contiguos
        self.free_blocks.sort()
        merged = []
        for base, size in self.free_blocks:
            if merged and merged[-1][0] + merged[-1][1] == base:
                merged[-1] = (merged[-1][0], merged[-1][1] + size)
            else:
                merged.append((base, size))
        self.free_blocks = merged
        
        del self.segment_tables[pid]

#Se define el gesto de memoria

class MemoryManager:
    
    def __init__(self, total_memory: int = 1024, mode: str = 'paging'):
        self.total_memory = total_memory
        self.mode = mode
        
        if mode == 'partitions':
            # Particiones fijas
            self.partition_manager = PartitionManager(
                total_memory, 
                [64, 128, 256, 512]  # Tamaños de particiones
            )
        elif mode == 'paging':
            # Paginación
            num_frames = total_memory // 4  # 4KB por frame
            self.paging_manager = PagingManager(num_frames, 4)
        elif mode == 'segmentation':
            # Segmentación
            self.segmentation_manager = SegmentationManager(total_memory)
            
    def initialize(self):
        print(f"Memoria inicializada: {self.total_memory} KB (modo: {self.mode})")
        
    def allocate(self, pid: int, size: int, algorithm: str = 'first_fit') -> bool:
        if self.mode == 'partitions':
            if algorithm == 'first_fit':
                result = self.partition_manager.allocate_first_fit(pid, size)
            elif algorithm == 'best_fit':
                result = self.partition_manager.allocate_best_fit(pid, size)
            elif algorithm == 'worst_fit':
                result = self.partition_manager.allocate_worst_fit(pid, size)
            else:
                result = None
            return result is not None
            
        elif self.mode == 'paging':
            num_pages = (size + self.paging_manager.page_size - 1) // self.paging_manager.page_size
            self.paging_manager.create_page_table(pid, num_pages)
            # Cargar páginas iniciales
            for page_num in range(min(num_pages, 3)):  # Cargar primeras 3 páginas
                self.paging_manager.load_page(pid, page_num)
            return True
            
        elif self.mode == 'segmentation':
            return self.segmentation_manager.create_segment(pid, 0, size, f"process_{pid}")
            
        return False
        
    def deallocate(self, pid: int):
        if self.mode == 'partitions':
            self.partition_manager.deallocate(pid)
        elif self.mode == 'paging':
            if pid in self.paging_manager.page_tables:
                del self.paging_manager.page_tables[pid]
        elif self.mode == 'segmentation':
            self.segmentation_manager.deallocate_segments(pid)
            
    def get_memory_state(self) -> dict:
        if self.mode == 'partitions':
            return {
                'mode': 'partitions',
                'partitions': [
                    {
                        'id': p.id,
                        'size': p.size,
                        'allocated': p.allocated,
                        'process_id': p.process_id
                    }
                    for p in self.partition_manager.partitions
                ]
            }
        elif self.mode == 'paging':
            return {
                'mode': 'paging',
                'total_frames': len(self.paging_manager.frames),
                'page_faults': self.paging_manager.page_faults,
                'page_accesses': self.paging_manager.page_accesses,
                'frames': [
                    {
                        'frame': f.frame_number,
                        'occupied': f.occupied,
                        'process': f.process_id
                    }
                    for f in self.paging_manager.frames[:20]  # Primeros 20
                ]
            }
        elif self.mode == 'segmentation':
            return {
                'mode': 'segmentation',
                'segments': [
                    {
                        'process': pid,
                        'segments': [
                            {'num': s.segment_number, 'base': s.base, 'size': s.limit, 'name': s.name}
                            for s in segs
                        ]
                    }
                    for pid, segs in self.segmentation_manager.segment_tables.items()
                ]
            }
        return {}


# ============= PRUEBA UNITARIA =============
if __name__ == "__main__":
    print("=== PRUEBA UNITARIA: Memory Manager ===\n")
    
    # Probar cada modo
    modes = ['partitions', 'paging', 'segmentation']
    
    for mode in modes:
        print(f"\n{'='*50}")
        print(f"Modo: {mode.upper()}")
        print('='*50)
        
        mm = MemoryManager(total_memory=1024, mode=mode)
        mm.initialize()
        
        if mode == 'partitions':
            print("\nProbando algoritmos de asignación...")
            mm.allocate(1, 50, 'first_fit')
            mm.allocate(2, 100, 'best_fit')
            mm.allocate(3, 200, 'worst_fit')
            
        elif mode == 'paging':
            print("\nProbando paginación y reemplazo...")
            mm.allocate(1, 100)  # Crea 25 páginas
            
            # Simular accesos (provocar page faults)
            paging = mm.paging_manager
            for page in [0, 1, 2, 3, 0, 1, 4]:
                fault = paging.access_page(1, page)
                if fault:
                    paging.load_page(1, page, 'LRU')
            
            print(f"\nPage faults: {paging.page_faults}")
            print(f"Tasa de aciertos: {((paging.page_accesses - paging.page_faults) / paging.page_accesses * 100):.1f}%")
            
        elif mode == 'segmentation':
            print("\nProbando segmentación...")
            seg = mm.segmentation_manager
            seg.create_segment(1, 0, 100, "code")
            seg.create_segment(1, 1, 50, "data")
            seg.create_segment(2, 0, 200, "heap")
        
        # Mostrar estado
        print("\nEstado de memoria:")
        state = mm.get_memory_state()
        print(f"  Modo: {state['mode']}")
        
    print("\n✅ Todas las pruebas completadas")