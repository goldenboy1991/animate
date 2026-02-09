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
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Check if Telegram WebApp
function isTelegramWebApp() {
    return window.Telegram && window.Telegram.WebApp;
}

// Check if Safari browser
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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

// Save image for iOS devices (including Telegram WebApp)
function saveImageForIOS(imageData) {
    showSaveIndicator();
    
    if (isTelegramWebApp()) {
        // Для Telegram WebApp используем window.open в новой вкладке
        try {
            const newWindow = window.open(imageData, '_blank');
            if (!newWindow) {
                // Если не удалось открыть новое окно, показываем модальное окно с инструкциями
                showSaveInstructionsModal(imageData);
            }
        } catch (error) {
            console.error('Ошибка открытия изображения в Telegram:', error);
            showSaveInstructionsModal(imageData);
        }
    } else if (isSafari()) {
        // Для Safari используем специальный метод
        try {
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `generated-image-${Date.now()}.png`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            // Для Safari добавляем элемент в DOM перед кликом
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Ошибка сохранения в Safari:', error);
            showSaveInstructionsModal(imageData);
        }
    } else {
        // Для других iOS браузеров
        try {
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `generated-image-${Date.now()}.png`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Ошибка сохранения на iOS:', error);
            showSaveInstructionsModal(imageData);
        }
    }
}

// Show modal with save instructions
function showSaveInstructionsModal(imageData) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'save-modal';
    modal.innerHTML = `
        <div class="save-modal-content">
            <h3>Сохранение изображения</h3>
            <img src="${imageData}" alt="Сгенерированное изображение" class="modal-image">
            <p>Нажмите и удерживайте изображение, затем выберите "Сохранить изображение"</p>
            <button class="modal-close-btn">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик закрытия модального окна
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
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
            if (isIOS()) {
                // Используем улучшенный метод для всех iOS устройств
                saveImageForIOS(imageData);
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