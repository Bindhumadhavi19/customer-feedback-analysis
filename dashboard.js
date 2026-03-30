
const API_URL = 'http://localhost:8000/api';

let allFeedbacks = [];
let sentimentChartInstance = null;
let categoryChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    const totalFeedbacks = document.getElementById('total-feedbacks');
    const averageRatingEl = document.getElementById('average-rating');
    const mostFrequentCategoryEl = document.getElementById('most-frequent-category');
    const sentimentChartCanvas = document.getElementById('sentiment-chart');
    const categoryRatingCanvas = document.getElementById('category-rating-chart');
    const feedbacksContainer = document.getElementById('feedbacks-container');
    
    const categoryFilter = document.getElementById('category-filter');
    const sentimentFilter = document.getElementById('sentiment-filter');

    try {
        const response = await fetch(`${API_URL}/feedbacks`);
        allFeedbacks = await response.json();

        if (response.ok) {
            updateDashboard();

            categoryFilter.addEventListener('change', updateDashboard);
            sentimentFilter.addEventListener('change', updateDashboard);

        } else {
            throw new Error(allFeedbacks.message);
        }
    } catch (error) {
        feedbacksContainer.innerHTML = `<p style="color: var(--danger-color);">Error loading data: ${error.message}</p>`;
    }

    function updateDashboard() {
        const selectedCategory = categoryFilter.value;
        const selectedSentiment = sentimentFilter.value;

        const filteredFeedbacks = allFeedbacks.filter(f => {
            const matchCategory = selectedCategory === 'all' || (f.category || 'Other') === selectedCategory;
            const matchSentiment = selectedSentiment === 'all' || (f.sentiment || 'Neutral') === selectedSentiment;
            return matchCategory && matchSentiment;
        });

        // Update Top Metrics
        totalFeedbacks.textContent = filteredFeedbacks.length;

        if (filteredFeedbacks.length > 0) {
            const avgRating = filteredFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) / filteredFeedbacks.length;
            averageRatingEl.textContent = `${avgRating.toFixed(1)} ⭐`;

            const catCounts = filteredFeedbacks.reduce((acc, f) => {
                const c = f.category || 'Other';
                acc[c] = (acc[c] || 0) + 1;
                return acc;
            }, {});
            const topCat = Object.keys(catCounts).reduce((a, b) => catCounts[a] > catCounts[b] ? a : b);
            mostFrequentCategoryEl.textContent = topCat;
        } else {
            averageRatingEl.textContent = '0.0 ⭐';
            mostFrequentCategoryEl.textContent = 'N/A';
        }

        // Update Sentiment Chart
        const sentimentCounts = filteredFeedbacks.reduce((acc, f) => {
            const s = f.sentiment || 'Neutral';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const labels = ['Positive', 'Negative', 'Neutral'];
        const data = labels.map(label => sentimentCounts[label] || 0);

        if (sentimentChartInstance) sentimentChartInstance.destroy();
        sentimentChartInstance = new Chart(sentimentChartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                cutout: '70%'
            }
        });

        // Update Category Rating Chart
        const catRatings = {};
        const catCountsForAvg = {};
        filteredFeedbacks.forEach(f => {
            const c = f.category || 'Other';
            catRatings[c] = (catRatings[c] || 0) + (f.rating || 5);
            catCountsForAvg[c] = (catCountsForAvg[c] || 0) + 1;
        });

        const catLabels = Object.keys(catRatings);
        const catData = catLabels.map(c => catRatings[c] / catCountsForAvg[c]);

        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(categoryRatingCanvas, {
            type: 'bar',
            data: {
                labels: catLabels,
                datasets: [{
                    label: 'Average Rating',
                    data: catData,
                    backgroundColor: '#4f46e5',
                    borderRadius: 4
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 5 } },
                plugins: { legend: { display: false } }
            }
        });

        // Update Feedback List
        feedbacksContainer.innerHTML = '';
        if (filteredFeedbacks.length === 0) {
            feedbacksContainer.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">No feedback matches your filters.</p>';
        }

        filteredFeedbacks.forEach(feedback => {
            const div = document.createElement('div');
            div.className = 'feedback-item';
            const stars = '⭐'.repeat(feedback.rating || 5);
            div.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 600; color: var(--primary-color);">${feedback.name || 'Anonymous'}</span>
                        <span style="font-size: 0.75rem; background: #e2e8f0; padding: 0.1rem 0.5rem; border-radius: 4px;">${feedback.category || 'Other'}</span>
                        <span style="font-size: 0.8rem;">${stars}</span>
                    </div>
                    <p style="font-weight: 500; margin-bottom: 0.25rem;">"${feedback.text || feedback.message || 'No content'}"</p>
                    <p style="font-size: 0.8rem; color: #64748b;">${new Date(feedback.timestamp).toLocaleString()}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="sentiment-badge sentiment-${feedback.sentiment || 'Neutral'}">${feedback.sentiment || 'Neutral'}</span>
                    <button class="delete-btn" data-id="${feedback._id}" style="position: static; padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
                </div>
            `;
            feedbacksContainer.appendChild(div);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!confirm('Are you sure you want to delete this feedback?')) return;
                
                const id = e.currentTarget.dataset.id;
                console.log('Attempting to delete feedback with ID:', id);
                
                try {
                    const res = await fetch(`${API_URL}/feedback/${id}`, { 
                        method: 'DELETE',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    console.log('Delete response status:', res.status);
                    
                    if (res.ok) {
                        console.log('Successfully deleted feedback');
                        // Update local data and re-render instead of full reload for better UX
                        allFeedbacks = allFeedbacks.filter(f => f._id !== id);
                        updateDashboard();
                    } else {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Delete failed');
                    }
                } catch (err) {
                    console.error('Delete error:', err);
                    alert('Error: ' + err.message);
                }
            });
        });
    }
});
