// Car Ownership Analytics Dashboard
class CarOwnershipAnalytics {
    constructor() {
        this.baseURL = '/api';
        this.chart = null;
        this.currentData = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // No filters needed - Melbourne data only
        console.log('Melbourne Car Ownership Analytics initialized');
    }

    async loadInitialData() {
        await this.updateChart();
    }

    async fetchData() {
        // Always fetch Melbourne (VIC) data - no filters needed
        const endpoint = '/ownership/VIC';
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            this.showLoading(true);
            console.log('Fetching data from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showError('Failed to load data. Please try again.');
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    async updateChart() {
        const data = await this.fetchData();
        
        if (!data) {
            return;
        }

        this.currentData = data;
        this.renderChart(data);
        this.updateAnalysis(data);
    }

    renderChart(data) {
        const ctx = document.getElementById('ownershipChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Process data for chart
        const chartData = this.processDataForChart(data);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Melbourne Car Ownership',
                    data: chartData.values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Ownership: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Vehicles',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    processDataForChart(data) {
        // Handle your API response format
        if (!Array.isArray(data)) {
            console.error('Expected array data, received:', data);
            return { labels: [], values: [] };
        }

        // Sort by Year and extract labels and values
        const processedData = [...data].sort((a, b) => {
            const yearA = parseInt(a.Year || 0);
            const yearB = parseInt(b.Year || 0);
            return yearA - yearB;
        });

        const labels = processedData.map(item => item.Year.toString());
        
        const values = processedData.map(item => parseInt(item.Total_cars || 0));

        return { labels, values };
    }

    updateAnalysis(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Sort data by year for proper analysis
        const sortedData = [...data].sort((a, b) => a.Year - b.Year);
        const values = sortedData.map(item => parseInt(item.Total_cars || 0));
        const labels = sortedData.map(item => item.Year.toString());

        if (values.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Calculate statistics
        const totalRecords = values.length;
        const avgOwnership = Math.round(values.reduce((sum, val) => sum + val, 0) / totalRecords);
        const maxValue = Math.max(...values);
        const maxIndex = values.indexOf(maxValue);
        const peakYear = labels[maxIndex];

        // Calculate growth rate
        let growthRate = 0;
        if (values.length > 1) {
            const firstValue = values[0];
            const lastValue = values[values.length - 1];
            growthRate = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
        }

        // Update statistics display
        document.getElementById('totalRecords').textContent = totalRecords.toLocaleString();
        document.getElementById('avgGrowth').textContent = avgOwnership.toLocaleString() + ' cars';
        document.getElementById('peakYear').textContent = peakYear;
        document.getElementById('growthRate').textContent = `${growthRate}%`;

        // Generate insights
        this.generateInsights(values, labels, growthRate);

        // Update trend analysis
        this.updateTrendAnalysis(values, labels, growthRate);
    }

    generateInsights(values, labels, growthRate) {
        const insights = [];
        
        if (parseFloat(growthRate) > 0) {
            insights.push(`Car ownership shows positive growth of ${growthRate}% from ${labels[0]} to ${labels[labels.length - 1]}`);
        } else if (parseFloat(growthRate) < 0) {
            insights.push(`Car ownership shows a decline of ${Math.abs(growthRate)}% over the analyzed period`);
        } else {
            insights.push('Car ownership remains relatively stable over the analyzed period');
        }

        if (values.length > 2) {
            const recentTrend = values.slice(-Math.min(3, values.length));
            const isIncreasing = recentTrend.every((val, i) => i === 0 || val >= recentTrend[i - 1]);
            const isDecreasing = recentTrend.every((val, i) => i === 0 || val <= recentTrend[i - 1]);
            
            if (isIncreasing) {
                insights.push('Recent trend shows consistent growth in car ownership');
            } else if (isDecreasing) {
                insights.push('Recent trend shows declining car ownership');
            } else {
                insights.push('Recent trend shows fluctuating car ownership patterns');
            }
        }



        // Update insights list
        const insightsList = document.getElementById('insightsList');
        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateTrendAnalysis(values, labels, growthRate) {
        let analysis = 'Melbourne Car Ownership Analysis: ';

        if (values.length > 1) {
            const trend = parseFloat(growthRate) > 5 ? 'strong upward' : 
                         parseFloat(growthRate) > 0 ? 'moderate upward' :
                         parseFloat(growthRate) < -5 ? 'strong downward' : 
                         parseFloat(growthRate) < 0 ? 'moderate downward' : 'stable';
            
            analysis += `The data reveals a ${trend} trend in car ownership. `;
            
            const totalCars = values[values.length - 1];
            const yearRange = `${labels[0]}-${labels[labels.length - 1]}`;
            
            if (parseFloat(growthRate) > 0) {
                analysis += `Total cars reached ${totalCars.toLocaleString()} by ${labels[labels.length - 1]}, indicating increasing vehicle demand and economic growth over the ${yearRange} period.`;
            } else if (parseFloat(growthRate) < 0) {
                analysis += `The decline to ${totalCars.toLocaleString()} cars may indicate changing transportation preferences, economic factors, or policy changes affecting vehicle ownership.`;
            } else {
                analysis += `The stable ownership around ${totalCars.toLocaleString()} cars suggests a mature market with consistent demand patterns over the ${yearRange} period.`;
            }
        } else {
            analysis += 'Limited data available for comprehensive trend analysis.';
        }

        document.getElementById('trendAnalysis').textContent = analysis;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const analysisContent = document.getElementById('analysisContent');
        analysisContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    showNoDataMessage() {
        const analysisContent = document.getElementById('analysisContent');
        analysisContent.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-chart-line"></i>
                <p>No data available for the selected parameters.</p>
                <p>Please try different state or year selections.</p>
            </div>
        `;
    }
}

// Mobile Navigation
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Initialize the analytics dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CarOwnershipAnalytics();
});