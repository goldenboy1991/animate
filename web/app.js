const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

document.getElementById("createBtn").onclick = () => {
  const desc = document.getElementById("description").value;

  if (!desc) {
    tg.showAlert("Напиши, кто это 🙂");
    return;
  }

  tg.showAlert("Буду оживлять: " + desc);
};
