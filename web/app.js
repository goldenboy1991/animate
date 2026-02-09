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
        // Пытаемся использовать Telegram WebApp API для открытия изображения
        if (window.Telegram && window.Telegram.WebApp) {
            // Открываем изображение в новой вкладке Telegram
            window.Telegram.WebApp.openLink(imageData, {
                try_browser: true,
                force_open: true
            });
        } else {
            // Fallback на стандартный метод
            saveImageWithNativeDialog(imageData);
        }
    } catch (error) {
        console.error('Ошибка сохранения в Telegram:', error);
        saveImageWithNativeDialog(imageData);
    }
}

// Универсальная функция для вызова нативного iOS диалога
function saveImageWithNativeDialog(imageData) {
    try {
        // Создаем изображение и добавляем его в DOM
        const img = document.createElement('img');
        img.src = imageData;
        img.style.position = 'fixed';
        img.style.top = '-9999px';
        img.style.left = '-9999px';
        img.style.opacity = '0';
        img.style.width = '1px';
        img.style.height = '1px';
        document.body.appendChild(img);
        
        // Ждем загрузки изображения
        img.onload = function() {
            // Имитируем долгое нажатие на изображение для вызова iOS диалога
            setTimeout(() => {
                // Создаем события для имитации долгого нажатия
                const touchStartEvent = new TouchEvent('touchstart', {
                    bubbles: true,
                    cancelable: true,
                    touches: [new Touch({
                        identifier: 1,
                        target: img,
                        clientX: 0,
                        clientY: 0
                    })]
                });
                
                const touchEndEvent = new TouchEvent('touchend', {
                    bubbles: true,
                    cancelable: true
                });
                
                // Добавляем изображение в видимую область на короткое время
                img.style.position = 'absolute';
                img.style.top = '0';
                img.style.left = '0';
                img.style.opacity = '1';
                img.style.width = '100px';
                img.style.height = '100px';
                
                // Имитируем долгое нажатие
                img.dispatchEvent(touchStartEvent);
                
                // Ждем немного и завершаем
                setTimeout(() => {
                    img.dispatchEvent(touchEndEvent);
                    
                    // Удаляем изображение
                    setTimeout(() => {
                        if (document.body.contains(img)) {
                            document.body.removeChild(img);
                        }
                    }, 100);
                }, 500);
            }, 100);
        };
        
        img.onerror = function() {
            console.error('Ошибка загрузки изображения');
            showSaveInstructionsModal(imageData);
            document.body.removeChild(img);
        };
        
        // Добавляем fallback на случай, если touch события не сработают
        setTimeout(() => {
            if (document.body.contains(img)) {
                // Пытаемся использовать альтернативный метод
                try {
                    const link = document.createElement('a');
                    link.href = imageData;
                    link.download = `generated-image-${Date.now()}.png`;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    
                    // Для iOS создаем всплывающее окно с изображением
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Сохранение изображения</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body { margin: 0; padding: 20px; text-align: center; }
                                    img { max-width: 100%; height: auto; border-radius: 8px; }
                                    .instructions { margin-top: 20px; color: #666; }
                                </style>
                            </head>
                            <body>
                                <img src="${imageData}" alt="Сгенерированное изображение">
                                <div class="instructions">
                                    <p>Нажмите и удерживайте изображение, затем выберите "Сохранить изображение"</p>
                                    <p><button onclick="window.close()">Закрыть</button></p>
                                </div>
                            </body>
                            </html>
                        `);
                        newWindow.document.close();
                    } else {
                        throw new Error('Не удалось открыть новое окно');
                    }
                } catch (fallbackError) {
                    console.error('Ошибка альтернативного метода:', fallbackError);
                    showSaveInstructionsModal(imageData);
                }
                
                // Удаляем скрытое изображение
                document.body.removeChild(img);
            }
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка вызова iOS диалога:', error);
        showSaveInstructionsModal(imageData);
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