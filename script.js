let deals = JSON.parse(localStorage.getItem("rolyfeAcquisitionDeals") || "[]");

const els = {
  deals: document.getElementById("deals"),
  leadCol: document.getElementById("leadCol"),
  analysisCol: document.getElementById("analysisCol"),
  offerCol: document.getElementById("offerCol"),
  fundingCol: document.getElementById("fundingCol"),
  closedCol: document.getElementById("closedCol"),
  investorDeals: document.getElementById("investorDeals"),
  feedBox: document.getElementById("feedBox"),
  calcBox: document.getElementById("calcBox")
};

function money(x){
  return Number(x || 0).toLocaleString("en-US",{maximumFractionDigits:0});
}

function getVal(id){
  return document.getElementById(id)?.value || "";
}

function getNum(id){
  return Number(String(getVal(id)).replace(/,/g,"")) || 0;
}

function save(){
  localStorage.setItem("rolyfeAcquisitionDeals", JSON.stringify(deals));
}

function randomHouse(){
  return "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80";
}

function rand(a,b){
  return Math.floor(Math.random() * (b - a) + a);
}

function calcDeal(d){
  const totalCost = Number(d.price || 0) + Number(d.rehab || 0) + Number(d.assignment || 0);
  const mao = (Number(d.arv || 0) * 0.70) - Number(d.rehab || 0) - Number(d.assignment || 0);
  const spread = Number(d.arv || 0) - totalCost;
  const profitVsMao = mao - Number(d.price || 0);

  let status = "⚠️ Check";
  let className = "warn";

  if(profitVsMao >= 25000 && spread >= 75000){
    status = "🔥 Solid";
    className = "good";
  }

  if(profitVsMao < 0){
    status = "❌ Tight / Pass";
    className = "bad";
  }

  return {totalCost, mao, spread, profitVsMao, status, className};
}

function addDeal(){
  const d = {
    id: Date.now(),
    addr: getVal("addr"),
    price: getNum("price"),
    arv: getNum("arv"),
    rehab: getNum("rehab"),
    assignment: getNum("assignment"),
    img: getVal("img") || randomHouse(),
    stage: "lead"
  };

  if(!d.addr){
    alert("Add a property address first.");
    return;
  }

  deals.unshift(d);
  save();
  render();
  feed("🟢 Added " + d.addr);
}

function createDeal(address){
  if(!address.trim()) return;

  const price = rand(60000,180000);
  const arv = price + rand(80000,220000);
  const rehab = rand(25000,90000);
  const assignment = 15000;

  deals.unshift({
    id: Date.now() + Math.random(),
    addr: address.trim(),
    price,
    arv,
    rehab,
    assignment,
    img: randomHouse(),
    stage:"lead"
  });
}

function importLeads(){
  const lines = getVal("leadInput").split("\n");
  lines.forEach(createDeal);
  save();
  render();
  feed("🚀 Leads imported");
}

function autoGenerateLeads(){
  [
    "6838 Ogontz Ave, Philadelphia, PA",
    "1047 Cooper St, Deptford, NJ",
    "2109-11 W Nedro Ave, Philadelphia, PA",
    "5503 West Blvd, Youngstown, OH"
  ].forEach(createDeal);

  save();
  render();
  feed("⚡ Auto leads loaded");
}

function cardHTML(d,i){
  const c = calcDeal(d);

  return `
    <div class="card">
      <img src="${d.img}" onerror="this.style.display='none'">
      <b>${d.addr}</b><br>
      Buy: $${money(d.price)} | ARV: $${money(d.arv)}<br>
      Rehab: $${money(d.rehab)} | Fee: $${money(d.assignment)}<br>
      MAO: $${money(c.mao)}<br>
      Spread: $${money(c.spread)}<br>
      Profit vs MAO: $${money(c.profitVsMao)}<br>
      <b class="${c.className}">${c.status}</b>
      <button onclick="moveDeal(${i},'analysis')">Analyze</button>
      <button onclick="moveDeal(${i},'offer')">Send Offer</button>
      <button onclick="moveDeal(${i},'funding')">Send Funding</button>
      <button onclick="moveDeal(${i},'closed')">Close</button>
      <button onclick="sendInvestor(${i})">Send to Investor</button>
      <button onclick="deleteDeal(${i})">Delete</button>
    </div>
  `;
}

function render(){
  els.deals.innerHTML = "";
  els.leadCol.innerHTML = "<h4>Leads</h4>";
  els.analysisCol.innerHTML = "<h4>Analyzing</h4>";
  els.offerCol.innerHTML = "<h4>Offer</h4>";
  els.fundingCol.innerHTML = "<h4>Funding</h4>";
  els.closedCol.innerHTML = "<h4>Closed</h4>";
  els.investorDeals.innerHTML = "";

  deals.forEach((d,i)=>{
    const html = cardHTML(d,i);
    els.deals.insertAdjacentHTML("beforeend", html);

    if(d.stage === "lead") els.leadCol.insertAdjacentHTML("beforeend", html);
    if(d.stage === "analysis") els.analysisCol.insertAdjacentHTML("beforeend", html);
    if(d.stage === "offer") els.offerCol.insertAdjacentHTML("beforeend", html);
    if(d.stage === "funding") els.fundingCol.insertAdjacentHTML("beforeend", html);
    if(d.stage === "closed") els.closedCol.insertAdjacentHTML("beforeend", html);
  });

  save();
}

function moveDeal(i,stage){
  deals[i].stage = stage;
  save();
  render();
  feed("📊 " + deals[i].addr + " → " + stage);
}

function sendInvestor(i){
  const d = deals[i];
  const c = calcDeal(d);

  els.investorDeals.insertAdjacentHTML("afterbegin",`
    <div class="card">
      <b>${d.addr}</b><br>
      Buy: $${money(d.price)} → ARV: $${money(d.arv)}<br>
      Spread: $${money(c.spread)}<br>
      Status: ${c.status}
    </div>
  `);

  feed("💼 Sent to investor: " + d.addr);
}

function deleteDeal(i){
  if(!confirm("Delete this deal?")) return;
  const addr = deals[i].addr;
  deals.splice(i,1);
  save();
  render();
  feed("🗑️ Deleted " + addr);
}

function feed(msg){
  const el = document.createElement("div");
  el.innerText = msg;
  els.feedBox.prepend(el);

  while(els.feedBox.children.length > 20){
    els.feedBox.removeChild(els.feedBox.lastChild);
  }
}

function toggleCalc(){
  els.calcBox.classList.toggle("hidden");
}

setInterval(()=>{
  const m = ["🔥 High interest", "📈 Investor viewing", "⚡ Deal heating up", "🧠 Analyze before offer"];
  feed(m[Math.floor(Math.random() * m.length)]);
}, 7000);

render();
