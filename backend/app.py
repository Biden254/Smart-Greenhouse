from flask import Flask, render_template, jsonify
from .greenhouse import GreenhouseController
from .simulation import SensorSimulator
import json

# Initialize Flask app with correct template and static folders
app = Flask(__name__,
            template_folder='templates',  # Points to backend/templates
            static_folder='static')       # Points to backend/static

controller = GreenhouseController()
simulator = SensorSimulator()

@app.route('/')
def dashboard():
    return render_template('index.html')

@app.route('/api/simulate', methods=['GET'])
def simulate():
    # Generate 10 hours of simulated data
    sensor_data = simulator.generate_multiple_readings(10)
    decisions = []
    
    for data in sensor_data:
        decision = controller.make_decisions(data)
        decisions.append({
            'sensor_data': data,
            'decision': decision
        })
    
    return jsonify({
        'data': decisions,
        'trend_recommendation': controller.get_watering_trend()
    })

@app.route('/api/current', methods=['GET'])
def current_status():
    # Generate current reading
    data = simulator.generate_sensor_data()
    decision = controller.make_decisions(data)
    
    return jsonify({
        'sensor_data': data,
        'decision': decision,
        'trend_recommendation': controller.get_watering_trend()
    })

if __name__ == '__main__':
    app.run(debug=True)