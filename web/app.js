const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

document.getElementById("createBtn").onclick = async () => {
  const desc = document.getElementById("description").value;

  if (!desc) {
    tg.showAlert("Напиши, кто это 🙂");
    return;
  }

  const res = await fetch("https://antonkombarov1991.duckdns.org:8080/generate-creature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: desc })
  });

  const data = await res.json();

  document.getElementById("result").innerHTML =
    `<img src="${data.image_url}" style="max-width:100%">`;
};

