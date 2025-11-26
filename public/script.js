document.getElementById("go").onclick = async () => {
  const input = document.getElementById("input").value;

  const res = await fetch("/analyze", {
    method: "POST",
    body: JSON.stringify({ input })
  });

  const data = await res.json();

  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
};
