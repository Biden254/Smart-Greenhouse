// Global variables
let sensorChart = null;
const API_BASE_URL = 'https://smart-greenhouse.onrender.com';
const API_ENDPOINTS = {
  current: `${API_BASE_URL}/api/current`,
  simulate: `${API_BASE_URL}/api/simulate`
};

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sensorReadingsEl = document.getElementById('sensor-readings');
    const systemDecisionsEl = document.getElementById('system-decisions');
    const trendRecommendationEl = document.getElementById('trend-recommendation');
    const historyContentEl = document.getElementById('history-content');
    const lastUpdatedEl = document.getElementById('last-updated');
    const simulateBtn = document.getElementById('simulate-btn');
    const chartCanvas = document.getElementById('sensorChart');
    const alertPanelEl = document.getElementById('alert-panel');
    
    // Initialize Chart
    initChart();
    
    // Format value with unit
    function formatValue(value, unit) {
        return `<span class="sensor-value">${value.toFixed(1)}</span><span class="sensor-unit">${unit}</span>`;
    }
    
    // Initialize empty chart
    function initChart() {
        const ctx = chartCanvas.getContext('2d');
        sensorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Humidity (%)',
                        data: [],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Soil Moisture (%)',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }
    
    // Update chart with new data
    function updateChart(history) {
        const labels = history.map(item => 
            new Date(item.sensor_data.timestamp).toLocaleTimeString());
        
        sensorChart.data.labels = labels;
        sensorChart.data.datasets[0].data = history.map(item => item.sensor_data.temperature);
        sensorChart.data.datasets[1].data = history.map(item => item.sensor_data.humidity);
        sensorChart.data.datasets[2].data = history.map(item => item.sensor_data.soil_moisture);
        
        sensorChart.update();
    }
    
    // Show browser notification
    function showNotification(title, message) {
        if (!("Notification" in window)) {
            console.log("This browser doesn't support notifications");
            return;
        }
        
        if (Notification.permission === "granted") {
            new Notification(title, { body: message });
        } 
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body: message });
                }
            });
        }
    }
    
    // Update sensor readings display
    function updateSensorReadings(data) {
        sensorReadingsEl.innerHTML = `
            <div class="sensor-card">
                <div class="sensor-title">Temperature</div>
                <div>${formatValue(data.temperature, '°C')}</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-title">Humidity</div>
                <div>${formatValue(data.humidity, '%')}</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-title">Light Intensity</div>
                <div>${formatValue(data.light_intensity, 'lux')}</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-title">Soil Moisture</div>
                <div>${formatValue(data.soil_moisture, '%')}</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-title">CO₂ Level</div>
                <div>${formatValue(data.co2, 'ppm')}</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-title">Timestamp</div>
                <div>${new Date(data.timestamp).toLocaleTimeString()}</div>
            </div>
        `;
    }
    
    // Update system decisions display
    function updateSystemDecisions(decision) {
        systemDecisionsEl.innerHTML = `
            <div class="decision-card">
                <div class="decision-title">Watering</div>
                <div class="decision-value watering-${decision.watering}">
                    ${decision.watering === 'full' ? 'Full Watering' : 
                      decision.watering === 'light' ? 'Light Watering' : 'No Watering'}
                </div>
            </div>
            <div class="decision-card">
                <div class="decision-title">Shading</div>
                <div class="decision-value shading-${decision.shading}">
                    ${decision.shading === 'open' ? 'Shades Open' : 
                      decision.shading === 'partial' ? 'Partially Closed' : 
                      decision.shading === 'full' ? 'Fully Closed' : 'No Action'}
                </div>
            </div>
        `;
    }
    
    // Update alerts display
    function updateAlerts(alerts) {
        let alertElement = document.getElementById('alert-content');
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.id = 'alert-content';
            document.querySelector('.alert-panel').appendChild(alertElement);
        }
        
        if (alerts.critical_flag) {
            alertElement.innerHTML = `
                <div class="alert-critical">
                    <i class="fas fa-exclamation-circle"></i> CRITICAL ALERT! Multiple dangerous conditions detected.
                </div>
            `;
            alertElement.className = 'alert-content alert-critical';
            showNotification("CRITICAL ALERT", "Dangerous greenhouse conditions detected!");
        } 
        else if (alerts.alert_triggered) {
            alertElement.innerHTML = `
                <div class="alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> Warning! ${alerts.alert_count} critical conditions detected.
                </div>
            `;
            alertElement.className = 'alert-content alert-warning';
            showNotification("Warning", `${alerts.alert_count} critical conditions detected`);
        } 
        else {
            alertElement.innerHTML = `
                <div class="alert-normal">
                    <i class="fas fa-check-circle"></i> All systems normal.
                </div>
            `;
            alertElement.className = 'alert-content alert-normal';
        }
    }
    
    // Update history display
    function updateHistory(history) {
        const recentHistory = history.slice(-5).reverse();
        
        historyContentEl.innerHTML = recentHistory.map(item => {
            const time = new Date(item.sensor_data.timestamp).toLocaleTimeString();
            const watering = item.decision.watering === 'full' ? 'Full' : 
                           item.decision.watering === 'light' ? 'Light' : 'None';
            const shading = item.decision.shading.charAt(0).toUpperCase() + 
                          item.decision.shading.slice(1);
            
            return `
                <div class="history-item">
                    <span>${time}</span>
                    <span>Water: ${watering}, Shade: ${shading}</span>
                </div>
            `;
        }).join('');
    }
    
    // Update last updated time
    function updateLastUpdated() {
        lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
    
    // Update trend recommendation
    function updateTrendRecommendation(recommendation) {
        trendRecommendationEl.innerHTML = `
            <p>${recommendation || 'Collecting more data for recommendations...'}</p>
        `;
    }
    
    // Fetch current data from Render backend
    function fetchCurrentData() {
        fetch(API_ENDPOINTS.current)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                updateSensorReadings(data.sensor_data);
                updateSystemDecisions(data.decision);
                updateAlerts(data.decision.alerts);
                updateTrendRecommendation(data.trend_recommendation);
                updateLastUpdated();
                
                if (data.history) {
                    updateChart(data.history);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                useMockData();
            });
    }

    // Run simulation via Render backend
    simulateBtn.addEventListener('click', function() {
        simulateBtn.disabled = true;
        simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';
        
        fetch(API_ENDPOINTS.simulate)
            .then(response => {
                if (!response.ok) throw new Error('Simulation failed');
                return response.json();
            })
            .then(data => {
                if (data.data && data.data.length > 0) {
                    const lastReading = data.data[data.data.length - 1];
                    updateSensorReadings(lastReading.sensor_data);
                    updateSystemDecisions(lastReading.decision);
                    updateAlerts(lastReading.decision.alerts);
                    updateHistory(data.data);
                    updateTrendRecommendation(data.trend_recommendation);
                    updateLastUpdated();
                    updateChart(data.data);
                }
            })
            .catch(error => {
                console.error('Error running simulation:', error);
                runMockSimulation();
            })
            .finally(() => {
                simulateBtn.disabled = false;
                simulateBtn.innerHTML = '<i class="fas fa-play"></i> Run 10-Hour Simulation';
            });
    });

    // Mock data fallback functions
    function useMockData() {
        const mockData = {
            sensor_data: {
                temperature: 25.5,
                humidity: 65,
                light_intensity: 750,
                soil_moisture: 45,
                co2: 800,
                timestamp: new Date().toISOString()
            },
            decision: {
                watering: 'light',
                shading: 'partial',
                alerts: {
                    alert_triggered: false,
                    critical_flag: false
                }
            },
            trend_recommendation: 'Maintain current watering schedule'
        };
        
        updateSensorReadings(mockData.sensor_data);
        updateSystemDecisions(mockData.decision);
        updateAlerts(mockData.decision.alerts);
        updateTrendRecommendation(mockData.trend_recommendation);
        updateLastUpdated();
    }

    function runMockSimulation() {
        const mockHistory = Array.from({length: 10}, (_, i) => ({
            sensor_data: {
                temperature: 25 + Math.sin(i) * 5,
                humidity: 60 + Math.cos(i) * 10,
                light_intensity: 800 + Math.random() * 400,
                soil_moisture: 40 + Math.random() * 20,
                co2: 800 + Math.random() * 400,
                timestamp: new Date(Date.now() - (i * 3600000)).toISOString()
            },
            decision: {
                watering: ['full', 'light', 'skip'][Math.floor(Math.random() * 3)],
                shading: ['open', 'partial', 'full'][Math.floor(Math.random() * 3)],
                alerts: {
                    alert_triggered: Math.random() > 0.8,
                    alert_count: Math.floor(Math.random() * 5),
                    critical_flag: Math.random() > 0.9
                }
            }
        }));
        
        updateHistory(mockHistory);
        updateChart(mockHistory);
        alert('Simulation service unavailable. Showing demo data.');
    }

    // Initial load
    fetchCurrentData();
    
    // Refresh data every 30 seconds
    setInterval(fetchCurrentData, 30000);
});