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
function saveClientImage(base64Data, fileName = 'image.png') {
    const byteString = atob(base64Data.split(',')[1]);
    const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = blobUrl;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}

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
    // Убираем показ индикатора, так как он мешает нативному диалогу
    // showSaveIndicator();
    
    if (isTelegramWebApp()) {
        // Для Telegram WebApp используем специальный метод
        saveImageForTelegram(imageData);
    } else {
        // Для обычных iOS браузеров
        saveImageWithNativeDialog(imageData);
    }
}

// Специальная функция для сохранения в Telegram WebApp
function saveImageForTelegram(imageData) {
    try {
        // Для Telegram WebApp используем прямой метод с созданием видимого изображения
        createVisibleImageForSave(imageData);
    } catch (error) {
        console.error('Ошибка сохранения в Telegram:', error);
        // Пытаемся использовать Telegram WebApp API как fallback
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                // Создаем ссылку на изображение
                const link = document.createElement('a');
                link.href = imageData;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                // Используем Telegram API для открытия ссылки
                window.Telegram.WebApp.openLink(link.href, {
                    try_browser: true
                });
            }
        } catch (telegramError) {
            console.error('Ошибка Telegram API:', telegramError);
            showSaveInstructionsModal(imageData);
        }
    }
}

// Универсальная функция для вызова нативного iOS диалога
function saveImageWithNativeDialog(imageData) {
    try {
        // Для iOS используем прямой метод с видимым изображением
        createVisibleImageForSave(imageData);
    } catch (error) {
        console.error('Ошибка вызова iOS диалога:', error);
        showSaveInstructionsModal(imageData);
    }
}

// Функция для создания видимого изображения и вызова iOS диалога
function createVisibleImageForSave(imageData) {
    // Создаем видимое изображение в центре экрана
    const img = document.createElement('img');
    img.src = imageData;
    img.style.position = 'fixed';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    img.style.maxWidth = '80vw';
    img.style.maxHeight = '80vh';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    img.style.zIndex = '3000';
    img.style.background = 'white';
    img.style.padding = '10px';
    
    // Добавляем подсказку
    const hint = document.createElement('div');
    hint.textContent = 'Нажмите и удерживайте изображение для сохранения';
    hint.style.position = 'fixed';
    hint.style.bottom = '20px';
    hint.style.left = '50%';
    hint.style.transform = 'translateX(-50%)';
    hint.style.background = 'rgba(0, 0, 0, 0.8)';
    hint.style.color = 'white';
    hint.style.padding = '10px 20px';
    hint.style.borderRadius = '20px';
    hint.style.zIndex = '3000';
    hint.style.fontSize = '14px';
    
    document.body.appendChild(img);
    document.body.appendChild(hint);
    
    // Обработчик для закрытия по клику вне изображения
    const closeHandler = (e) => {
        if (e.target !== img) {
            document.body.removeChild(img);
            document.body.removeChild(hint);
            document.removeEventListener('click', closeHandler);
        }
    };
    
    // Обработчик долгого нажатия
    let pressTimer;
    img.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            // Долгое нажатие - изображение уже видимо, пользователь может вызвать диалог
            hint.textContent = 'Отпустите, чтобы сохранить';
            hint.style.background = 'rgba(16, 185, 129, 0.9)';
        }, 500);
    });
    
    img.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        // Удаляем элементы через 3 секунды
        setTimeout(() => {
            if (document.body.contains(img)) {
                document.body.removeChild(img);
            }
            if (document.body.contains(hint)) {
                document.body.removeChild(hint);
            }
        }, 3000);
    });
    
    img.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });
    
    // Добавляем обработчик закрытия
    document.addEventListener('click', closeHandler);
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
            if (isIOS() || isTelegramWebApp()) {
                // Для iOS и Telegram используем blob метод
                saveClientImage(imageData, `generated-image-${Date.now()}.png`);
            } else {
                // Для desktop также используем универсальный метод
                saveClientImage(imageData, `generated-image-${Date.now()}.png`);
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