const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const btn = document.getElementById("createBtn");
const img = document.getElementById("result");

btn.onclick = async () => {
  const description = document.getElementById("description").value;

  if (!description) {
    tg.showAlert("Напиши, кто это 🙂");
    return;
  }

  // ИСПРАВЛЕНИЕ 1: убери showPopup, используй UI индикатор
  btn.disabled = true;
  btn.textContent = "Создаю... ✨";

  try {
    const res = await fetch("/api/generate-creature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    
    // ИСПРАВЛЕНИЕ 2: проверь что image существует
    if (!data.image) {
      throw new Error("Нет изображения в ответе");
    }
    
    img.src = data.image;
    img.style.display = "block"; // покажи изображение

    tg.showAlert("Готово! Можно кормить 🥕");
  } catch (e) {
    console.error("Ошибка:", e);
    tg.showAlert("Ошибка генерации 😢");
  } finally {
    // Верни кнопку в исходное состояние
    btn.disabled = false;
    btn.textContent = "Создать существо";
  }
};