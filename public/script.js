document.addEventListener('DOMContentLoaded', () => {
  const listingsEl = document.getElementById('listings');
  const searchForm = document.getElementById('searchForm');
  const addressInput = document.getElementById('addressInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analysisResults = document.getElementById('analysisResults');
  const compsResults = document.getElementById('compsResults');
  const repairInputs = document.querySelectorAll('#repairEstimator input.repair');

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = addressInput.value.trim();
    if (!address) return;
    listingsEl.innerHTML = '<p>Loading...</p>';
    try {
      const data = await fetchZillow(address);
      renderListings(data);
      generateComps(data);
    } catch (err) {
      listingsEl.innerHTML = '<p class="text-red-600">Failed to load listings.</p>';
      console.error(err);
    }
  });

  analyzeBtn.addEventListener('click', () => {
    const arv = parseFloat(document.getElementById('arv').value) || 0;
    let repairCost = parseFloat(document.getElementById('repairCost').value) || 0;
    repairInputs.forEach(chk => { if (chk.checked) repairCost += parseFloat(chk.value); });
    const mao = arv * 0.7 - repairCost;
    const buyerPrice = mao + 5000;
    const profit = buyerPrice - mao;
    analysisResults.innerHTML = '';
    const fields = [
      ['ARV', arv],
      ['Repair Cost', repairCost],
      ['ARV x 0.7', arv * 0.7],
      ['Maximum Allowable Offer', mao],
      ['Suggested Buyer Price', buyerPrice],
      ['Estimated Profit', profit]
    ];
    fields.forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded shadow';
      card.innerHTML = `<h3 class="font-semibold mb-1">${label}</h3><p>$${value.toFixed(2)}</p>`;
      analysisResults.appendChild(card);
    });
  });

  /* Chatbot */
  const openChat = document.getElementById('openChat');
  const closeChat = document.getElementById('closeChat');
  const chatContainer = document.getElementById('chatContainer');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  openChat.addEventListener('click', () => chatContainer.classList.remove('hidden'));
  closeChat.addEventListener('click', () => chatContainer.classList.add('hidden'));

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMessage('You', msg);
    const reply = getAIResponse(msg);
    addMessage('Bot', reply);
    chatInput.value = '';
  });

  function addMessage(author, text) {
    const div = document.createElement('div');
    div.className = 'text-sm';
    div.innerHTML = `<strong>${author}:</strong> ${text}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getAIResponse(msg) {
    msg = msg.toLowerCase();
    if (msg.includes('mao')) {
      return 'MAO (Maximum Allowable Offer) is calculated as (ARV x 0.7) minus repair costs.';
    }
    if (msg.includes('wholesaling')) {
      return 'Wholesaling involves securing a property under contract below market value and assigning that contract to an end buyer for a fee.';
    }
    if (msg.includes('tips')) {
      return 'Build rapport, be transparent about your process and always follow up with potential buyers and sellers.';
    }
    return 'I\'m here to help with deal analysis and wholesaling questions.';
  }

  function renderListings(data) {
    listingsEl.innerHTML = '';
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded shadow';
      card.innerHTML = `<h3 class="font-semibold">${item.address}</h3>
        <p>Price: $${item.price}</p>
        <p>${item.beds} beds / ${item.baths} baths - ${item.sqft} sqft</p>
        <p>Status: ${item.status}</p>`;
      listingsEl.appendChild(card);
    });
  }

  function generateComps(data) {
    compsResults.innerHTML = '';
    data.slice(0,3).forEach(item => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded shadow';
      card.innerHTML = `<h3 class="font-semibold">${item.address}</h3>
        <p>Sold: $${item.price}</p>
        <p>${item.sqft} sqft - ${item.distance} miles away</p>`;
      compsResults.appendChild(card);
    });
  }

  async function fetchZillow(address) {
    // Placeholder implementation. Replace with real API call.
    return [
      { address: address, price: 200000, beds: 3, baths: 2, sqft: 1500, status: 'for sale', distance: 0.1 },
      { address: address + ' Apt 2', price: 210000, beds: 3, baths: 2, sqft: 1520, status: 'for sale', distance: 0.2 },
      { address: address + ' Apt 3', price: 190000, beds: 3, baths: 2, sqft: 1480, status: 'for sale', distance: 0.3 }
    ];
  }

  // Document generator
  document.getElementById('generateContract').addEventListener('click', () => {
    const docText = 'Assignment Contract for property at ' + (addressInput.value || '____');
    const element = document.createElement('a');
    const blob = new Blob([docText], {type: 'application/pdf'});
    element.href = URL.createObjectURL(blob);
    element.download = 'assignment-contract.pdf';
    element.click();
  });
});
