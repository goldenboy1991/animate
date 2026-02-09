// Elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

// State
let isGenerating = false;

// Show loading indicator
function showLoading() {
    loading.style.display = 'block';
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
}

// Hide loading indicator
function hideLoading() {
    loading.style.display = 'none';
}

// Show result
function showResult(imageData) {
    resultImage.src = imageData;
    resultContainer.style.display = 'block';
    errorContainer.style.display = 'none';
    hideLoading();
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    hideLoading();
}

// Generate image
async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Введите промт для генерации');
        return;
    }

    if (isGenerating) return;
    isGenerating = true;

    showLoading();

    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: prompt })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Неизвестная ошибка');
        }

        if (!data.image || typeof data.image !== 'string') {
            throw new Error('Некорректный ответ сервера');
        }

        showResult(data.image);
    } catch (error) {
        console.error('Ошибка генерации:', error);
        showError(error.message);
    } finally {
        isGenerating = false;
    }
}

// Event listeners
generateBtn.addEventListener('click', generateImage);
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateImage();
    }
});