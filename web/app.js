const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Применяем тему Telegram
document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color || '#ffffff');
document.documentElement.style.setProperty('--tg-text', tg.themeParams.text_color || '#000000');
document.documentElement.style.setProperty('--tg-hint', tg.themeParams.hint_color || '#999999');
document.documentElement.style.setProperty('--tg-button', tg.themeParams.button_color || '#3390ec');
document.documentElement.style.setProperty('--tg-secondary-bg', tg.themeParams.secondary_bg_color || '#f4f4f5');

// Elements
const descriptionInput = document.getElementById('description');
const createBtn = document.getElementById('createBtn');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const emptyState = document.getElementById('emptyState');
const resultImage = document.getElementById('result');
const feedBtn = document.getElementById('feedBtn');
const newBtn = document.getElementById('newBtn');

// State
let isGenerating = false;

// Показать loading
function showLoading() {
  loading.classList.add('active');
  emptyState.classList.add('hidden');
  resultSection.classList.remove('active');
  createBtn.disabled = true;
}

// Скрыть loading
function hideLoading() {
  loading.classList.remove('active');
  createBtn.disabled = false;
}

// Показать результат
function showResult(imageData) {
  resultImage.src = imageData;
  resultSection.classList.add('active');
  emptyState.classList.add('hidden');
  hideLoading();
}

// Показать empty state
function showEmptyState() {
  emptyState.classList.remove('hidden');
  resultSection.classList.remove('active');
  hideLoading();
}

// Сброс формы
function resetForm() {
  descriptionInput.value = '';
  showEmptyState();
  descriptionInput.focus();
}

// Генерация существа
createBtn.onclick = async () => {
  const description = descriptionInput.value.trim();

  if (!description) {
    tg.showAlert('Напиши, кто это 🙂');
    descriptionInput.focus();
    return;
  }

  if (isGenerating) return;
  isGenerating = true;

  showLoading();

  try {
    console.log('Отправляю запрос:', description);
    
    const res = await fetch('/api/generate-creature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ description })
    });

    console.log('Статус ответа:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Ошибка сервера:', errorText);
      throw new Error(`Сервер вернул ${res.status}`);
    }

    const data = await res.json();
    console.log('Получен ответ, длина image:', data.image?.length);
    
    if (!data.image || !data.image.startsWith('data:image')) {
      throw new Error('Неверный формат изображения');
    }
    
    showResult(data.image);
    tg.HapticFeedback.notificationOccurred('success');

  } catch (e) {
    console.error('Ошибка генерации:', e);
    tg.showAlert(`Ошибка: ${e.message} 😢`);
    tg.HapticFeedback.notificationOccurred('error');
    showEmptyState();
  } finally {
    isGenerating = false;
  }
};

// Кнопка "Покормить"
feedBtn.onclick = () => {
  tg.showAlert('Ням-ням! 🥕 (Функция в разработке)');
  tg.HapticFeedback.impactOccurred('light');
};

// Кнопка "Создать ещё"
newBtn.onclick = () => {
  resetForm();
  tg.HapticFeedback.impactOccurred('light');
};

// Enter для отправки
descriptionInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    createBtn.click();
  }
});
