
const API_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackName = document.getElementById('feedback-name');
    const feedbackCategory = document.getElementById('feedback-category');
    const feedbackRating = document.getElementById('feedback-rating');
    const feedbackText = document.getElementById('feedback-text');
    const resultContainer = document.getElementById('result-container');
    const sentimentResult = document.getElementById('sentiment-result');

    const loader = document.getElementById('loader');

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const feedback = feedbackText.value;
        const name = feedbackName.value;
        const category = feedbackCategory.value;
        const rating = parseInt(feedbackRating.value);

        if (!feedback) return;

        // Show loader and hide previous results
        loader.style.display = 'block';
        resultContainer.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback, name, category, rating })
            });

            const result = await response.json();

            if (response.ok) {
                sentimentResult.innerHTML = `
                    <div style="color: #10b981; font-weight: bold; margin-bottom: 0.5rem;">Feedback submitted successfully!</div>
                    <div>Sentiment Detected: <span class="sentiment-badge sentiment-${result.sentiment}">${result.sentiment}</span></div>
                `;
                feedbackForm.reset(); // Clear the form
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            sentimentResult.textContent = `Error: ${error.message}`;
        } finally {
            // Hide loader and show results
            loader.style.display = 'none';
            resultContainer.style.display = 'block';
        }
    });
});
