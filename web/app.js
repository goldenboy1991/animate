const tg = window.Telegram.WebApp;
tg.expand();

document.getElementById("createBtn").onclick = () => {
  const desc = document.getElementById("description").value;
  alert("Буду оживлять: " + desc);
};
