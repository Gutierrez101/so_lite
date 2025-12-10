from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import time

# Agregar el directorio parent al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import Kernel

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el frontend

# Instancia global del kernel
kernel = None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica que la API esté funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'SO-Lite API funcionando correctamente'
    }), 200

@app.route('/api/kernel/initialize', methods=['POST'])
def initialize_kernel():
    """Inicializa el kernel del sistema operativo"""
    global kernel
    try:
        data = request.json or {}
        memory_mode = data.get('memory_mode', 'paging')
        total_memory = data.get('total_memory', 1024)
        
        kernel = Kernel()
        kernel.memory_manager.mode = memory_mode
        kernel.memory_manager.total_memory = total_memory
        kernel.initialize()
        
        return jsonify({
            'status': 'success',
            'message': 'Kernel inicializado correctamente',
            'config': {
                'memory_mode': memory_mode,
                'total_memory': total_memory
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/processes/create', methods=['POST'])
def create_process():
    """Crea un nuevo proceso"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        name = data.get('name', 'Process')
        priority = data.get('priority', 5)
        burst_time = data.get('burst_time', 10)
        memory_required = data.get('memory_required', 100)
        
        pid = kernel.create_process(name, priority, burst_time, memory_required)
        
        if pid:
            return jsonify({
                'status': 'success',
                'message': f'Proceso {name} creado',
                'pid': pid
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'No se pudo crear el proceso (sin memoria suficiente)'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/processes', methods=['GET'])
def get_processes():
    """Obtiene todos los procesos"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        processes = kernel.process_manager.get_all_processes_info()
        return jsonify({
            'status': 'success',
            'data': processes
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/cpu/schedule', methods=['POST'])
def schedule_cpu():
    """Ejecuta un paso del planificador de CPU"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        algorithm = data.get('algorithm', 'FCFS')
        time_quantum = data.get('time_quantum', 4)
        
        # Ejecutar un paso del scheduler
        kernel.cpu_scheduler.schedule(algorithm, time_quantum)
        
        # Obtener estado del CPU
        cpu_state = kernel.cpu_scheduler.get_cpu_state()
        
        return jsonify({
            'status': 'success',
            'data': cpu_state
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/cpu/metrics', methods=['GET'])
def get_cpu_metrics():
    """Obtiene las métricas del CPU"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        metrics = kernel.cpu_scheduler.calculate_metrics()
        return jsonify({
            'status': 'success',
            'data': metrics
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/memory/state', methods=['GET'])
def get_memory_state():
    """Obtiene el estado de la memoria"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        memory_state = kernel.memory_manager.get_memory_state()
        return jsonify({
            'status': 'success',
            'data': memory_state
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/memory/allocate', methods=['POST'])
def allocate_memory():
    """Asigna memoria a un proceso"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        pid = data.get('pid')
        size = data.get('size')
        algorithm = data.get('algorithm', 'first_fit')
        
        success = kernel.memory_manager.allocate(pid, size, algorithm)
        
        return jsonify({
            'status': 'success' if success else 'error',
            'message': 'Memoria asignada' if success else 'No hay memoria disponible'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/devices', methods=['GET'])
def get_io_devices():
    """Obtiene el estado de los dispositivos de E/S"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        devices = kernel.io_manager.get_devices_state()
        return jsonify({
            'status': 'success',
            'data': devices
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/request', methods=['POST'])
def request_io():
    """Crea una solicitud de E/S"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        process_id = data.get('process_id')
        device_name = data.get('device_name')
        operation = data.get('operation', 'read')
        data_size = data.get('data_size', 1024)
        priority = data.get('priority', 5)
        
        request_id = kernel.io_manager.request_io(
            process_id, device_name, operation, data_size, priority
        )
        
        return jsonify({
            'status': 'success',
            'request_id': request_id
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/process', methods=['POST'])
def process_io():
    """Procesa las colas de E/S"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        scheduler = data.get('scheduler', 'FCFS')
        
        kernel.io_manager.process_io_queues(time.time(), scheduler)
        
        return jsonify({
            'status': 'success',
            'message': 'Colas de E/S procesadas'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/statistics', methods=['GET'])
def get_io_statistics():
    """Obtiene estadísticas de E/S"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        stats = kernel.io_manager.get_statistics()
        return jsonify({
            'status': 'success',
            'data': stats
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/create-semaphore', methods=['POST'])
def create_semaphore():
    """Crea un semáforo"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        name = data.get('name')
        initial_value = data.get('initial_value', 1)
        max_value = data.get('max_value')
        
        kernel.concurrency_manager.create_semaphore(name, initial_value, max_value)
        
        return jsonify({
            'status': 'success',
            'message': f'Semáforo {name} creado'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/state', methods=['GET'])
def get_concurrency_state():
    """Obtiene el estado de sincronización"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        state = kernel.concurrency_manager.get_concurrency_state()
        return jsonify({
            'status': 'success',
            'data': state
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/system/state', methods=['GET'])
def get_system_state():
    """Obtiene el estado completo del sistema"""
    global kernel
    if not kernel:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        state = kernel.get_system_state()
        return jsonify({
            'status': 'success',
            'data': state
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')