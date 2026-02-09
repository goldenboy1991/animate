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

// Check if iOS device
function isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Check if iPhone 11
function isIPhone11() {
    return navigator.userAgent.includes('iPhone OS 13_') && 
           window.screen.width === 414 && 
           window.screen.height === 896;
}
// Show loading indicator
function updateButtonState(state) {
    if (state === 'loading') {
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Генерация...';
    } else {
        generateBtn.classList.remove('loading');
        generateBtn.textContent = 'Сгенерировать';
    }
}

// Show save indicator
function showSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.textContent = 'Сохранение...';
    document.body.appendChild(indicator);
    
    // Удаляем через 2 секунды
    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 2000);
}

// Save image for iPhone 11
function saveImageForIPhone11(imageData) {
    // Создаем ссылку с правильными атрибутами
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `generated-image-${Date.now()}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Добавляем обработку долгого нажатия
    link.addEventListener('touchstart', handleLongPress);
    
    // Имитируем клик
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle long press
function handleLongPress(event) {
    event.preventDefault();
    // Показываем индикатор загрузки
    showSaveIndicator();
    // Выполняем сохранение
    saveImageWithDelay(event.target.href);
}

// Save image with delay
function saveImageWithDelay(imageData) {
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `generated-image-${Date.now()}.png`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 500);
}

function showLoading() {
    updateButtonState('loading');
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
    updateButtonState('ready');
    
    // Добавляем кнопку сохранения
    if (!document.getElementById('downloadBtn')) {
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadBtn';
        downloadBtn.textContent = 'Сохранить изображение';
        downloadBtn.classList.add('download-btn');
        resultContainer.appendChild(downloadBtn);

downloadBtn.addEventListener('click', () => {
            if (isIPhone11()) {
                // Специальный метод для iPhone 11
                saveImageForIPhone11(imageData);
            } else if (isIOS()) {
                // Стандартный метод для других iOS устройств
                const link = document.createElement('a');
                link.href = imageData;
                link.download = `generated-image-${Date.now()}.png`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Desktop method
                const link = document.createElement('a');
                link.href = imageData;
                link.download = `generated-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
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
        updateButtonState('ready');
    }
}

// Event listeners
generateBtn.addEventListener('click', generateImage);
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateImage();
    }
});