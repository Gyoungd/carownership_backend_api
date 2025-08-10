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

        // Real-time updates on selection change
        areaSelect.addEventListener('change', () => this.updateChart());
        startYearSelect.addEventListener('change', () => this.validateYearRange());
        endYearSelect.addEventListener('change', () => this.validateYearRange());
    }

    validateYearRange() {
        const startYear = parseInt(document.getElementById('startYearSelect').value);
        const endYear = parseInt(document.getElementById('endYearSelect').value);
        
        if (startYear > endYear) {
            // Auto-adjust end year if start year is greater
            document.getElementById('endYearSelect').value = document.getElementById('startYearSelect').value;
        }
        
        this.updateChart();
    }

    async loadInitialData() {
        await this.updateChart();
    }

    async fetchData() {
        const area = document.getElementById('areaSelect').value;
        const startYear = parseInt(document.getElementById('startYearSelect').value);
        const endYear = parseInt(document.getElementById('endYearSelect').value);
        
        let endpoint = '/population';
        
        // For now, we'll use a mock endpoint structure
        // This will need to be adjusted based on actual API implementation
        if (area) {
            endpoint = `/population/${area}`;
        }

        const url = `${this.baseURL}${endpoint}`;
        
        try {
            this.showLoading(true);
            console.log('Fetching population data from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
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
        // Mock data for demonstration - replace with real API call
        const areas = {
            '': 'CBD Total',
            'east': 'CBD East',
            'west': 'CBD West', 
            'north': 'CBD North'
        };
        
        const areaName = areas[area] || 'CBD Total';
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
            
            mockData.push({
                region_name: areaName,
                year: year,
                population: population,
                growth_rate: ((population / basePopulation - 1) * 100).toFixed(1)
            });
        }
        
        return mockData;
    }

    filterByYearRange(data, startYear, endYear) {
        return data.filter(item => {
            const year = parseInt(item.year); // lowercase 'year' field
            return year >= startYear && year <= endYear;
        });
    }

    async updateChart() {
        const data = await this.fetchData();
        
        console.log('Data received in updateChart:', data); // Debug log
        
        if (!data || data.length === 0) {
            console.error('No data available for chart update');
            this.showNoDataMessage();
            return;
        }

        this.currentData = data;
        this.renderChart(data);
        this.updateAnalysis(data);
        this.updateTitle();
    }

    renderChart(data) {
        const ctx = document.getElementById('populationChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Process data for chart
        const chartData = this.processDataForChart(data);
        
        // Determine appropriate label based on area selection
        const area = document.getElementById('areaSelect').value;
        const areaName = area ? document.getElementById('areaSelect').selectedOptions[0].text : 'CBD Total';
        const datasetLabel = `${areaName} Population`;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: datasetLabel,
                    data: chartData.values,
                    borderColor: '#34699A',
                    backgroundColor: 'rgba(52, 105, 154, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#34699A',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 16,
                                weight: '600'
                            },
                            padding: 20,
                            color: '#113F67'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 63, 103, 0.95)',
                        titleColor: '#FDF5AA',
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyColor: '#ffffff',
                        bodyFont: {
                            size: 13
                        },
                        borderColor: '#34699A',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Population: ${context.parsed.y.toLocaleString()}`;
                            },
                            afterLabel: function(context) {
                                // Show percentage change if possible
                                return '';
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
                                size: 16,
                                weight: '700'
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
                                weight: '700'
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
                        },
                        // Add some padding to prevent chart from being too tall
                        suggestedMin: 0,
                        beginAtZero: true
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
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Expected array data, received:', data);
            return { labels: [], values: [] };
        }

        // Handle aggregated data for CBD Total
        const area = document.getElementById('areaSelect').value;
        if (!area) {
            // Aggregate all areas by year
            return this.aggregatePopulationData(data);
        }

        // Sort by year and extract labels and values for specific area
        const processedData = [...data].sort((a, b) => {
            const yearA = parseInt(a.year || 0);
            const yearB = parseInt(b.year || 0);
            return yearA - yearB;
        });

        const labels = processedData.map(item => item.year.toString());
        const values = processedData.map(item => parseInt(item.population || 0));

        return { labels, values };
    }

    aggregatePopulationData(data) {
        // Group by year and sum all areas' populations
        const yearTotals = {};
        
        data.forEach(item => {
            const year = item.year.toString();
            const population = parseInt(item.population || 0);
            
            if (!yearTotals[year]) {
                yearTotals[year] = 0;
            }
            yearTotals[year] += population;
        });

        // Sort years and create arrays
        const sortedYears = Object.keys(yearTotals).sort((a, b) => parseInt(a) - parseInt(b));
        const labels = sortedYears;
        const values = sortedYears.map(year => yearTotals[year]);

        return { labels, values };
    }

    updateAnalysis(data) {
        console.log('updateAnalysis called with data:', data); // Debug log
        
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Invalid data for analysis:', data);
            this.showNoDataMessage();
            return;
        }

        const area = document.getElementById('areaSelect').value;
        let values, labels;
        
        console.log('Selected area:', area); // Debug log
        
        // If no area selected (CBD Total), use aggregated data
        if (!area) {
            console.log('Using aggregated data for CBD Total');
            const aggregatedData = this.aggregatePopulationData(data);
            values = aggregatedData.values;
            labels = aggregatedData.labels;
        } else {
            console.log('Using filtered data for specific area');
            // Sort data by year for proper analysis
            const sortedData = [...data].sort((a, b) => a.year - b.year);
            values = sortedData.map(item => parseInt(item.population || 0));
            labels = sortedData.map(item => item.year.toString());
        }
        
        console.log('Processed values:', values);
        console.log('Processed labels:', labels);

        if (values.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Calculate statistics
        const totalRecords = values.length;
        const currentPopulation = values[values.length - 1];
        const avgPopulation = Math.round(values.reduce((sum, val) => sum + val, 0) / totalRecords);
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

        // Update statistics display with error checking
        try {
            const totalPopEl = document.getElementById('totalPopulation');
            const avgPopEl = document.getElementById('avgPopulationGrowth'); 
            const peakYearEl = document.getElementById('populationPeakYear');
            const growthRateEl = document.getElementById('populationGrowthRate');
            
            if (totalPopEl) totalPopEl.textContent = currentPopulation.toLocaleString();
            if (avgPopEl) avgPopEl.textContent = avgPopulation.toLocaleString();
            if (peakYearEl) peakYearEl.textContent = peakYear;
            if (growthRateEl) growthRateEl.textContent = `${growthRate}%`;
            
            console.log('Updated statistics:', {
                currentPopulation: currentPopulation.toLocaleString(),
                avgPopulation: avgPopulation.toLocaleString(),
                peakYear,
                growthRate: `${growthRate}%`
            });
        } catch (error) {
            console.error('Error updating statistics display:', error);
        }

        // Generate insights
        this.generateInsights(values, labels, growthRate);

        // Update trend analysis
        this.updateTrendAnalysis(values, labels, growthRate);
    }

    generateInsights(values, labels, growthRate) {
        const insights = [];
        
        if (parseFloat(growthRate) > 0) {
            insights.push(`Population shows positive growth of ${growthRate}% from ${labels[0]} to ${labels[labels.length - 1]}`);
        } else if (parseFloat(growthRate) < 0) {
            insights.push(`Population shows a decline of ${Math.abs(growthRate)}% over the analyzed period`);
        } else {
            insights.push('Population remains relatively stable over the analyzed period');
        }

        if (values.length > 2) {
            const recentTrend = values.slice(-Math.min(3, values.length));
            const isIncreasing = recentTrend.every((val, i) => i === 0 || val >= recentTrend[i - 1]);
            const isDecreasing = recentTrend.every((val, i) => i === 0 || val <= recentTrend[i - 1]);
            
            if (isIncreasing) {
                insights.push('Recent trend shows consistent population growth in CBD area');
            } else if (isDecreasing) {
                insights.push('Recent trend shows declining population in CBD area');
            } else {
                insights.push('Recent trend shows fluctuating population patterns');
            }
        }

        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const variation = minValue > 0 ? ((maxValue - minValue) / minValue * 100).toFixed(1) : '0';
        
        insights.push(`Peak population was ${maxValue.toLocaleString()} in ${labels[values.indexOf(maxValue)]}`);
        insights.push(`Lowest population was ${minValue.toLocaleString()} in ${labels[values.indexOf(minValue)]}`);
        insights.push(`Data shows ${variation}% variation between highest and lowest population levels`);

        // Update insights list
        const insightsList = document.getElementById('populationInsightsList');
        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateTrendAnalysis(values, labels, growthRate) {
        let analysis = '';
        
        const area = document.getElementById('areaSelect').value;
        const areaName = area ? document.getElementById('areaSelect').selectedOptions[0].text : 'CBD Total';
        const startYear = document.getElementById('startYearSelect').value;
        const endYear = document.getElementById('endYearSelect').value;
        
        analysis = `Analysis for ${areaName} (${startYear}-${endYear}): `;

        if (values.length > 1) {
            const trend = parseFloat(growthRate) > 5 ? 'strong upward' : 
                         parseFloat(growthRate) > 0 ? 'moderate upward' :
                         parseFloat(growthRate) < -5 ? 'strong downward' : 
                         parseFloat(growthRate) < 0 ? 'moderate downward' : 'stable';
            
            analysis += `The data reveals a ${trend} trend in population. `;
            
            const currentPopulation = values[values.length - 1];
            const yearRange = `${labels[0]}-${labels[labels.length - 1]}`;
            
            if (parseFloat(growthRate) > 0) {
                analysis += `Current population reached ${currentPopulation.toLocaleString()} by ${labels[labels.length - 1]}, indicating urban densification and economic growth in Melbourne CBD over the ${yearRange} period.`;
            } else if (parseFloat(growthRate) < 0) {
                analysis += `The decline to ${currentPopulation.toLocaleString()} residents may indicate changing urban patterns, housing affordability issues, or shift to suburban living preferences.`;
            } else {
                analysis += `The stable population around ${currentPopulation.toLocaleString()} residents suggests a mature CBD district with consistent residential demand over the ${yearRange} period.`;
            }
        } else {
            analysis += 'Limited data available for comprehensive trend analysis.';
        }

        document.getElementById('populationTrendAnalysis').textContent = analysis;
    }

    updateTitle() {
        const area = document.getElementById('areaSelect').value;
        const areaName = area ? document.getElementById('areaSelect').selectedOptions[0].text : 'CBD Total';
        
        const title = `Melbourne ${areaName} Population Trends`;
        document.getElementById('populationChartTitle').textContent = title;
    }

    showLoading(show) {
        const spinner = document.getElementById('populationLoadingSpinner');
        spinner.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const analysisContent = document.getElementById('populationAnalysisContent');
        analysisContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    showNoDataMessage() {
        const analysisContent = document.getElementById('populationAnalysisContent');
        analysisContent.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-users"></i>
                <p>No population data available for the selected parameters.</p>
                <p>Please try different area or year selections.</p>
            </div>
        `;
    }
}

// Mobile Navigation (shared functionality)
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

// Initialize the population analytics dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PopulationAnalytics();
});
