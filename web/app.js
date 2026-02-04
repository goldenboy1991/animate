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

  tg.showPopup({
    title: "Создаю...",
    message: "Подожди немного ✨"
  });

  try {
    const res = await fetch("/api/generate-creature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description })
    });

    const data = await res.json();
    img.src = data.image;

    tg.showAlert("Готово! Можно кормить 🥕");
  } catch (e) {
    tg.showAlert("Ошибка генерации 😢");
  }
};
