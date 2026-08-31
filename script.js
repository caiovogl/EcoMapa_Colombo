// 1. Dados dos Ecopontos de Colombo (Coordenadas de Exemplo em Colombo-PR)
const ecopontos = [
    {
        id: 1,
        nome: "Ecoponto Roça Grande",
        endereco: "Rua Rio Japurá, Colombo - PR",
        lat: -25.348416,
        lng: -49.204032,
        tipos: ["eletronicos", "reciclaveis"],
        status: "Aberto",
        telefone: "(41) 98872-9734"
    },
    {
        id: 2,
        nome: "Ecoponto Ana Terra",
        endereco: "Rua Antônio Francisco Scrok, Colombo - PR",
        lat: -25.3485802,
        lng: -49.1886199,
        tipos: ["eletronicos", "reciclaveis"],
        status: "Aberto",
        telefone: "(41) 98872-9734"
    },
    {
        id: 3,
        nome: "Ecoponto Maracanã",
        endereco: "Rua dos Eucaliptos, Colombo - PR",
        lat: -25.3675306,
        lng: -49.1820672,
        tipos: ["eletronicos", "reciclaveis"],
        status: "Aberto",
        telefone: "(41) 98872-9734"
    },
    {
        id: 4,
        nome: "Ecoponto Santa Terezinha",
        endereco: "Rua Maria Francelina da Silva, Colombo - PR",
        lat: -25.3555186,
        lng: -49.1753908,
        tipos: ["eletronicos", "reciclaveis"],
        status: "Aberto",
        telefone: "(41) 98872-9734"
    },
    {
        id: 5,
        nome: "Ecoponto Centro de Colombo",
        endereco: "Rua Zacaria de Paula Xavier, Colombo - PR",
        lat: -25.2918394,
        lng: -49.2293218,
        tipos: ["eletronicos", "reciclaveis"],
        status: "Aberto",
        telefone: "(41) 98872-9734"
    },
    {
        id: 6,
        nome: "Central Papa-Treco (Volumosos)",
        endereco: "Atendimento Municipal Domiciliar",
        lat: -25.2925,
        lng: -49.2240,
        tipos: ["volumosos", "entulho"],
        status: "Agendamento",
        telefone: "(41) 98872-9734"
    }
];

//Menu Hamburguer
// Toggle do Menu Mobile
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
        mainNav.classList.toggle('open');
    });
}

// 2. Inicialização do Mapa Leaflet focado em Colombo
const map = L.map('map').setView([-25.2925, -49.2240], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marcadores = [];
let localizacaoUsuario = null;

// 3. Função para Renderizar Marcadores e Cards
function renderizarPontos(lista) {
    // Limpar marcadores anteriores
    marcadores.forEach(marker => map.removeLayer(marker));
    marcadores = [];

    const containerLista = document.getElementById('places-list');
    containerLista.innerHTML = '';

    if (lista.length === 0) {
        containerLista.innerHTML = '<p class="place-address">Nenhum ponto encontrado para esta categoria.</p>';
        return;
    }

    lista.forEach(ponto => {
        // Criar Card na Barra Lateral
        const card = document.createElement('article');
        card.className = 'place-card';

        const isPapaTreco = ponto.tipos.includes('volumosos') || ponto.nome.includes('Papa-Treco');

        const botaoAcao = isPapaTreco
            ? `<a href="paginas/papatreco.html" class="btn-route" style="background-color: #2980b9; text-align: center; text-decoration: none; display: block;">🛋️ Ver Como Solicitar</a>`
            : `<button class="btn-route" onclick="abrirRota(${ponto.lat}, ${ponto.lng})">🗺️ Como Chegar (GPS)</button>`;
        
        const distTexto = ponto.distancia !== undefined ? ` • <strong>${ponto.distancia.toFixed(2)} km</strong>` : '';

        card.innerHTML = `
            <div class="place-header">
                <h3>${ponto.nome}</h3>
                <span class="badge ${ponto.status === 'Aberto' ? 'open' : 'info'}">${ponto.status}</span>
            </div>
            <p class="place-address">📍 ${ponto.endereco}${distTexto}</p>
            <div class="tags-container">
                ${ponto.tipos.map(t => `<span class="tag">#${t}</span>`).join('')}
            </div>
            <div class="card-actions">
                ${botaoAcao}
            </div>
        `;
        containerLista.appendChild(card);

        // Criar Marcador no Mapa
        const marker = L.marker([ponto.lat, ponto.lng]).addTo(map);
        const popupConteudo = isPapaTreco
            ? `<strong>${ponto.nome}</strong><br>
            ${ponto.endereco}<br>
            <small>Serviço sob agendamento</small><br><br>
            <a href="paginas/papatreco.html" style="color: #2980b9; font-weight: bold;">Ver instruções de coleta →</a>`
            : `<strong>${ponto.nome}</strong><br>
            ${ponto.endereco}<br>
            <small>Status: ${ponto.status}</small>`;
        marker.bindPopup(popupConteudo);
        marcadores.push(marker);
    });
}

// 4. Cálculo de Distância (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 5. Encontrar o Ponto Mais Próximo pelo GPS
document.getElementById('btn-geolocalizacao').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocalização não é suportada pelo seu navegador.");
        return;
    }

    var button = document.getElementById('btn-geolocalizacao');
    button.textContent = "Procurando...";

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;
            localizacaoUsuario = { lat: userLat, lng: userLng };

            // Marca o usuário no mapa
            L.circleMarker([userLat, userLng], {
                radius: 8,
                fillColor: "#2980b9",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup("Você está aqui!").openPopup();

            map.setView([userLat, userLng], 13);

            // Calcular distância para cada ponto e ordenar
            const pontosOrdenados = ecopontos.map(p => {
                const dist = calcularDistancia(userLat, userLng, p.lat, p.lng);
                return { ...p, distancia: dist };
            }).sort((a, b) => a.distancia - b.distancia);

            renderizarPontos(pontosOrdenados);
            button.textContent = "📍 Encontrar Ecoponto Mais Próximo";
        },
        () => {
            button.textContent = "📍 Encontrar Ecoponto Mais Próximo";
            alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        }
    );
});

// 6. Filtros por Categoria
const botoesFiltro = document.querySelectorAll('.filter-chip');
botoesFiltro.forEach(btn => {
    btn.addEventListener('click', () => {
        botoesFiltro.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tipoSelecionado = btn.getAttribute('data-type');

        let listaFiltrada = ecopontos;
        if (tipoSelecionado !== 'todos') {
            listaFiltrada = ecopontos.filter(p => p.tipos.includes(tipoSelecionado));
        }

        if (localizacaoUsuario) {
            listaFiltrada = listaFiltrada.map(p => ({
                ...p,
                distancia: calcularDistancia(localizacaoUsuario.lat, localizacaoUsuario.lng, p.lat, p.lng)
            })).sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
        }

        renderizarPontos(listaFiltrada);
    });
});

// 7. Abrir rota no aplicativo padrão de mapas
function abrirRota(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Inicializar na carga da página
renderizarPontos(ecopontos);