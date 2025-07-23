class GreenhouseController:
    def __init__(self):
        self.consecutive_alerts = 0
        self.critical_flag = False
        self.history = []
    
    def control_watering(self, soil_moisture, humidity, temperature):
        if soil_moisture > 70:
            return "skip"
        elif soil_moisture < 35 and (humidity < 40 or temperature > 30):
            return "full"
        elif 35 <= soil_moisture <= 50 and temperature > 35:
            return "light"
        else:
            return "skip"
    
    def control_shading(self, light_intensity):
        if light_intensity < 300:
            return "open"
        elif 300 <= light_intensity < 800:
            return "none"
        elif 800 <= light_intensity < 1000:
            return "partial"
        else:
            return "full"
    
    def check_alerts(self, sensor_data):
        conditions = [
            sensor_data['temperature'] > 36,
            sensor_data['humidity'] < 25,
            sensor_data['co2'] > 1200,
            sensor_data['soil_moisture'] < 30,
            sensor_data['light_intensity'] > 1100
        ]
        
        alert_count = sum(conditions)
        alert_triggered = alert_count >= 3
        
        if alert_triggered:
            self.consecutive_alerts += 1
            if self.consecutive_alerts > 2:
                self.critical_flag = True
        else:
            self.consecutive_alerts = 0
            self.critical_flag = False
            
        return {
            'alert_triggered': alert_triggered,
            'alert_count': alert_count,
            'critical_flag': self.critical_flag
        }
    
    def make_decisions(self, sensor_data):
        watering = self.control_watering(
            sensor_data['soil_moisture'],
            sensor_data['humidity'],
            sensor_data['temperature']
        )
        
        shading = self.control_shading(sensor_data['light_intensity'])
        
        alerts = self.check_alerts(sensor_data)
        
        decision = {
            'watering': watering,
            'shading': shading,
            'alerts': alerts,
            'timestamp': sensor_data.get('timestamp')
        }
        
        self.history.append({
            'sensor_data': sensor_data,
            'decision': decision
        })
        
        return decision
    
    def get_watering_trend(self):
        if len(self.history) < 3:
            return None
            
        # Calculate moving average of soil moisture
        last_readings = [x['sensor_data']['soil_moisture'] for x in self.history[-3:]]
        avg_moisture = sum(last_readings) / len(last_readings)
        
        if avg_moisture < 35:
            return "Increase watering frequency"
        elif avg_moisture > 60:
            return "Decrease watering frequency"
        else:
            return "Maintain current watering schedule"