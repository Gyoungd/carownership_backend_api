// Melbourne CBD Population Analytics Dashboard
class PopulationAnalytics {
    constructor() {
        this.baseURL = 'https://carownershipbackendapi-production.up.railway.app';
        this.chart = null;
        this.currentData = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        const areaSelect = document.getElementById('areaSelect');
        const startYearSelect = document.getElementById('startYearSelect');
        const endYearSelect = document.getElementById('endYearSelect');

        // Auto-update on filter change
        areaSelect.addEventListener('change', () => this.updateChart());
        startYearSelect.addEventListener('change', () => this.updateChart());
        endYearSelect.addEventListener('change', () => this.updateChart());
    }

    async loadInitialData() {
        await this.updateChart();
    }

    async updateChart() {
        const data = await this.fetchData();
        if (data && data.length > 0) {
            this.currentData = data;
            this.renderChart(data);
            this.updateAnalysis(data);
        }
    }

    async fetchData() {
        const area = document.getElementById('areaSelect').value;
        const startYear = parseInt(document.getElementById('startYearSelect').value);
        const endYear = parseInt(document.getElementById('endYearSelect').value);
        
        try {
            this.showLoading(true);
            let data = [];
            
            if (area) {
                // Fetch specific area data
                const url = `${this.baseURL}/population/${area}`;
                console.log('Fetching population data from:', url);
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                data = await response.json();
            } else {
                // Fetch CBD Total data using /population/total endpoint
                console.log('Fetching CBD Total data from /population/total');
                const url = `${this.baseURL}/population/total`;
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                data = await response.json();
            }
            
            console.log('Received population data:', data);
            
            // Filter by year range
            const filteredData = this.filterByYearRange(data, startYear, endYear);
            return filteredData;
        } catch (error) {
            console.error('Error fetching population data:', error);
            console.log('Falling back to mock data');
            this.showError('API unavailable. Using demonstration data. Please ensure backend is running.');
            const mockData = this.generateMockData(area, startYear, endYear);
            console.log('Generated mock data:', mockData);
            return mockData;
        } finally {
            this.showLoading(false);
        }
    }

    generateMockData(area, startYear, endYear) {
        // Mock data for demonstration
        const areas = {
            'east': 'Melbourne CBD - East',
            'west': 'Melbourne CBD - West', 
            'north': 'Melbourne CBD - North'
        };
        
        const areaName = areas[area] || 'Melbourne CBD - Total';
        const mockData = [];
        
        for (let year = startYear; year <= endYear; year++) {
            let basePopulation;
            switch (area) {
                case 'east': basePopulation = 4000; break;   // 2001년 실제 수준
                case 'west': basePopulation = 2000; break;   // 2001년 실제 수준  
                case 'north': basePopulation = 1700; break;  // 2001년 실제 수준
                default: basePopulation = 7700; // 전체 합계
            }
            
            // Simulate growth trend (fixed to use 2001 as base year)
            const baseYear = 2001; // Always use 2001 as base year
            const growthRate = 0.08 + (Math.random() * 0.04); // 8-12% annual growth (more realistic for Melbourne CBD)
            const yearGrowth = Math.pow(1 + growthRate, year - baseYear);
            const population = Math.round(basePopulation * yearGrowth);
            
            // Create display_name for consistency with real API
            const displayName = areaName.replace('Melbourne CBD - ', '');
            
            mockData.push({
                region_name: areaName,
                year: year,
                population: population,
                growth_rate: ((population / basePopulation - 1) * 100).toFixed(1),
                display_name: displayName
            });
        }
        
        return mockData;
    }

    filterByYearRange(data, startYear, endYear) {
        return data.filter(item => {
            const year = parseInt(item.year);
            return year >= startYear && year <= endYear;
        });
    }

    renderChart(data) {
        const ctx = document.getElementById('populationChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const chartData = this.processDataForChart(data);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: this.getChartLabel(),
                    data: chartData.values,
                    borderColor: '#34699A',
                    backgroundColor: 'rgba(52, 105, 154, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#113F67',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        right: 30,
                        bottom: 20,
                        left: 30
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#113F67',
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 63, 103, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#34699A',
                        borderWidth: 1,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#113F67',
                            padding: {
                                top: 15
                            }
                        },
                        ticks: {
                            font: {
                                size: 14,
                                weight: '500'
                            },
                            color: '#34699A',
                            padding: 5
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.08)',
                            drawBorder: true,
                            borderColor: '#d1d5db',
                            borderWidth: 2
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Population (Thousands)',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#113F67',
                            padding: {
                                bottom: 15
                            }
                        },
                        ticks: {
                            font: {
                                size: 14,
                                weight: '500'
                            },
                            color: '#34699A',
                            padding: 8,
                            maxTicksLimit: 8, // Limit number of ticks for cleaner look
                            callback: function(value) {
                                // Convert to thousands for better readability
                                if (value >= 1000) {
                                    return (value / 1000).toFixed(1) + 'K';
                                }
                                return value;
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.08)',
                            drawBorder: true,
                            borderColor: '#d1d5db',
                            borderWidth: 2
                        }
                    }
                }
            }
        });
    }

    processDataForChart(data) {
        // Both individual areas and CBD Total now come as single datasets
        // No need for aggregation since /population/total provides aggregated data
        
        // Sort data by year
        const sortedData = [...data].sort((a, b) => a.year - b.year);
        const labels = sortedData.map(item => item.year.toString());
        const values = sortedData.map(item => parseInt(item.population || 0));
        
        return { labels, values };
    }



    getChartLabel() {
        const area = document.getElementById('areaSelect').value;
        
        // Use simplified names for better readability
        const areaNames = {
            'east': 'CBD East',
            'west': 'CBD West', 
            'north': 'CBD North'
        };
        
        return area ? `${areaNames[area]} Population` : 'CBD Total Population';
    }

    updateAnalysis(data) {
        console.log('updateAnalysis called with data:', data); // Debug log
        
        // ✅ 정상적인 analysis 처리
        try {
            // 데이터 유효성 검사
            if (!Array.isArray(data) || data.length === 0) {
                console.error('Invalid data for analysis:', data);
                this.showNoDataMessage();
                return;
            }

            const area = document.getElementById('areaSelect').value;
            
            console.log('Selected area:', area); // Debug log
            
            // Both CBD Total and individual areas now come as single datasets
            console.log('Processing data for analysis');
            const sortedData = [...data].sort((a, b) => a.year - b.year);
            const values = sortedData.map(item => parseInt(item.population || 0));
            const labels = sortedData.map(item => item.year.toString());

            // Calculate statistics
            const total = values.reduce((sum, val) => sum + val, 0);
            const average = (total / values.length).toFixed(0);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const firstValue = values[0];
            const lastValue = values[values.length - 1];
            const growthRate = ((lastValue - firstValue) / firstValue * 100).toFixed(1);

            // Update trend analysis
            this.updateTrendAnalysis(area, growthRate, values);

            // Update statistical summary
            this.updateStatisticalSummary(total, average, maxValue, minValue, values.length);

            // Update insights
            this.updateInsights(area, growthRate, values);

        } catch (error) {
            console.error('Analysis error:', error);
            // 에러 메시지를 분석 패널에 표시
            document.getElementById('trendAnalysis').innerHTML = '<p style="color: #e53e3e;">❌ Analysis calculation error. Data processing failed.</p>';
            document.getElementById('statisticalSummary').innerHTML = '<p style="color: #e53e3e;">❌ Statistical summary unavailable due to data processing error.</p>';
            document.getElementById('insights').innerHTML = '<p style="color: #e53e3e;">❌ Unable to generate insights. Please check data source.</p>';
        }
    }

    updateTrendAnalysis(area, growthRate, values) {
        // Use clean, user-friendly names
        const areaNames = {
            'east': 'CBD East',
            'west': 'CBD West',
            'north': 'CBD North'
        };
        const areaName = area ? areaNames[area] : 'CBD Total';
        const trend = parseFloat(growthRate) >= 0 ? 'increasing' : 'decreasing';
        const trendIcon = trend === 'increasing' ? '📈' : '📉';
        
        const element = document.getElementById('trendAnalysis');
        if (element) {
            element.innerHTML = `
                <p><strong>${trendIcon} ${areaName} Population Trend</strong></p>
                <p>Population has been ${trend} with a ${Math.abs(growthRate)}% change over the selected period.</p>
                <p>This represents a ${trend === 'increasing' ? 'positive' : 'negative'} growth trajectory for the region.</p>
            `;
        }
    }

    updateStatisticalSummary(total, average, maxValue, minValue, dataPoints) {
        const element = document.getElementById('statisticalSummary');
        if (element) {
            element.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Average:</span>
                        <span class="stat-value">${average.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Peak:</span>
                        <span class="stat-value">${maxValue.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Minimum:</span>
                        <span class="stat-value">${minValue.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Data Points:</span>
                        <span class="stat-value">${dataPoints}</span>
                    </div>
                </div>
            `;
        }
    }

    updateInsights(area, growthRate, values) {
        const element = document.getElementById('insights');
        if (element) {
            let insights = [];
            
            if (Math.abs(parseFloat(growthRate)) > 50) {
                insights.push("📊 Significant population change detected - this indicates major urban development activity.");
            }
            
            if (parseFloat(growthRate) > 0) {
                insights.push("🏙️ Positive growth suggests increased urbanization and economic activity in the CBD.");
            } else {
                insights.push("📉 Population decline may indicate changing urban preferences or economic factors.");
            }
            
            insights.push("📈 Population trends reflect Melbourne's evolution as a major urban center.");
            
            element.innerHTML = insights.map(insight => `<p>${insight}</p>`).join('');
        }
    }

    showNoDataMessage() {
        const sections = ['trendAnalysis', 'statisticalSummary', 'insights'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<p>No data available for the selected filters.</p>';
            }
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.innerHTML = `<p><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
            errorElement.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const analytics = new PopulationAnalytics();
    console.log('Population Analytics initialized');
});