import random
from datetime import datetime, timedelta

class SensorSimulator:
    def __init__(self):
        self.current_time = datetime.now()
    
    def generate_sensor_data(self):
        # Simulate realistic sensor values with some randomness
        data = {
            'temperature': random.uniform(25, 40),
            'humidity': random.uniform(20, 80),
            'light_intensity': random.uniform(200, 1200),
            'soil_moisture': random.uniform(20, 80),
            'co2': random.uniform(300, 1500),
            'timestamp': self.current_time.isoformat()
        }
        
        # Advance time by 1 hour
        self.current_time += timedelta(hours=1)
        
        return data
    
    def generate_multiple_readings(self, count=10):
        return [self.generate_sensor_data() for _ in range(count)]