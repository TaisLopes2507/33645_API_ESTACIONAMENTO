const API_BASE = 'http://cnms-parking-api.net.uztec.com.br/api/v1';

// Função genérica para requisições
async function request(path, method = 'GET', body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

// Registrar entrada
async function registerEntry() {
  const plate = document.getElementById('plateEntry').value.trim();
  const model = document.getElementById('modelEntry').value.trim();
  const msg = document.getElementById('msgEntry');
  msg.textContent = '';
  try {
    const data = await request('/entry', 'POST', { plate, model });
    msg.style.color = 'green';
    msg.textContent = data.message || 'Entrada registrada!';
  } catch (e) {
    msg.style.color = 'red';
    msg.textContent = e.message;
  }
}

async function checkVehicle() {
  const plate = document.getElementById('plateCheck').value.trim();
  const msg = document.getElementById('msgCheck');
  msg.textContent = '';
  try {
    const data = await request(`/check/${plate}`);
    if (data.error) {
      msg.style.color = 'red';
      msg.textContent = `Veículo NÃO está presente. Mensagem: ${data.error}`;
    } else {
      msg.style.color = 'green';
      msg.textContent = `Veículo está presente:\nPlaca: ${data.plate}\nEntrada: ${new Date(data.entryTime).toLocaleString()}`;
    }
  } catch (e) {
    msg.style.color = 'red';
    msg.textContent = 'Erro: ' + e.message;
  }
}

// Registrar saída
async function registerExit() {
  const plate = document.getElementById('plateExit').value.trim();
  const msg = document.getElementById('msgExit');
  msg.textContent = '';
  try {
    const data = await request(`/exit/${plate}`, 'PATCH');
    msg.style.color = 'green';
    msg.textContent = data.message || 'Saída registrada!';
  } catch (e) {
    msg.style.color = 'red';
    msg.textContent = e.message;
  }
}

    async function atualizarVeiculo() {
      const oldPlate = document.getElementById('updatePlaca').value;
      const newPlate = document.getElementById('novaPlaca').value;
      const res = await fetch(`${API}/update/${oldPlate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: newPlate })
      });
      const data = await res.json();
      document.getElementById('update').textContent = JSON.stringify(data, null, 2);
    }

// Cancelar registro
async function cancelRegistration() {
  const plate = document.getElementById('plateCancel').value.trim();
  const msg = document.getElementById('msgCancel');
  msg.textContent = '';
  try {
    const data = await request(`/cancel/${plate}`, 'DELETE');
    msg.style.color = 'green';
    msg.textContent = data.message || 'Registro cancelado!';
  } catch (e) {
    msg.style.color = 'red';
    msg.textContent = e.message;
  }
}

async function getReport() {
  const pre = document.getElementById('reportResult');
  pre.textContent = 'Carregando...';
  try {
    const data = await request('/report');
    // Monta o texto com os dados do relatório diário
    let text = `Relatório do dia: ${data.date}\n`;
    text += `Total de Entradas: ${data.totalEntries}\n`;
    text += `Total de Saídas: ${data.totalExits}\n`;
    text += `Veículos Atuais: ${data.currentVehicles}\n`;
    text += `Receita Total: ${data.totalRevenue}\n`;
    pre.textContent = text;
  } catch (e) {
    pre.textContent = 'Erro ao carregar relatório: ' + e.message;
  }
}

// Vagas disponíveis - agora calcula ocupadas com base em veículos ativos
async function getSlots() {
  const div = document.getElementById('slotsResult');
  div.textContent = 'Carregando...';

  try {
    // Pega o total de vagas do backend
    const slotsData = await request('/slots');

    // Pega os veículos ativos
    const activeVehicles = await request('/active');

    const totalSlots = slotsData.totalSlots !== undefined ? slotsData.totalSlots : 'N/A';
    const occupied = Array.isArray(activeVehicles) ? activeVehicles.length : 'N/A';
    const free = (totalSlots !== 'N/A' && occupied !== 'N/A') ? totalSlots - occupied : 'N/A';

    div.textContent = `Vagas totais: ${totalSlots}, Ocupadas: ${occupied}, Livres: ${free}`;
  } catch (e) {
    div.textContent = 'Erro: ' + e.message;
  }
}

// Tempo de permanência
async function getTime() {
  const plate = document.getElementById('plateTime').value.trim();
  const div = document.getElementById('timeResult');
  div.textContent = 'Carregando...';
  try {
    const data = await request(`/time/${plate}`);
    if (data.error) {
      div.textContent = `Erro: ${data.error}`;
      return;
    }
    const parkedMinutes = data.parkedTime;
    if (parkedMinutes === undefined) {
      div.textContent = 'Dados não encontrados para esse veículo.';
      return;
    }
    const hours = Math.floor(parkedMinutes / 60);
    const minutes = Math.floor(parkedMinutes % 60);

    div.textContent = `Tempo estacionado: ${hours}h ${minutes}min`;
  } catch (e) {
    div.textContent = 'Erro: ' + e.message;
  }
}

// Veículos ativos - texto simples formatado
async function getActiveVehicles() {
  const div = document.getElementById('activeVehicles');
  div.textContent = 'Carregando...';
  try {
    const data = await request('/active');
    // Se seu backend retorna só array, use data diretamente.
    const vehicles = data.vehicles || data;
    if (!vehicles || vehicles.length === 0) {
      div.textContent = 'Nenhum veículo ativo encontrado.';
      return;
    }
    let text = 'Veículos ativos:\n\n';
    vehicles.forEach(v => {
      text += `Placa: ${v.plate}\nModelo: ${v.model}\nEntrada: ${new Date(v.entryTime).toLocaleString()}\n\n`;
    });
    div.textContent = text;
  } catch (e) {
    div.textContent = 'Erro: ' + e.message;
  }
}
