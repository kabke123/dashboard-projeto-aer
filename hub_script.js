// Dashboard Principal - Script de controle
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar loading
    document.getElementById('loading').style.display = 'flex';
    
    // Carregar dados do JSON
    fetch('dados_gerais.json')
        .then(response => {
            if (!response.ok) { 
                throw new Error('Erro na rede: ' + response.statusText); 
            }
            return response.json();
        })
        .then(data => {
            // Calcular totais dinamicamente a partir dos institutos ativos
            const totals = calculateTotals(data.institutos);
            
            // Processar dados
            populateSummary(totals, data.resumoGeral.totalInstitutos);

            // Preencher Coordenação Geral
            if (data.projeto && data.projeto.coordenacaoGeral) {
                const coordinationElement = document.getElementById('general-coordination');
                if (coordinationElement) {
                    coordinationElement.textContent = data.projeto.coordenacaoGeral.join(' e ');
                }
            }
            
            populateInstitutes(data.institutos);
            createRubricasChart(data.rubricas);
            populateRubricasProgress(data.rubricas);
            
            // Esconder loading
            document.getElementById('loading').style.display = 'none';
        })
        .catch(error => {
            console.error('Falha ao carregar ou processar dados_gerais.json:', error);
            alert('Não foi possível carregar os dados do dashboard principal.');
            document.getElementById('loading').style.display = 'none';
        });
});

// Calcular totais dinamicamente a partir dos institutos ativos
function calculateTotals(institutes) {
    // Filtrar apenas institutos ativos
    const activeInstitutes = institutes.filter(inst => inst.status === 'ativo');
    
    // Calcular totais
    const totalCursos = activeInstitutes.reduce((sum, inst) => sum + inst.resumo.cursos, 0);
    const totalAlunos = activeInstitutes.reduce((sum, inst) => sum + inst.resumo.alunos, 0);
    const totalOrcamento = activeInstitutes.reduce((sum, inst) => sum + inst.resumo.orcamento, 0);
    
    return {
        totalCursos,
        totalAlunos,
        totalOrcamento
    };
}

// Preencher resumo estatístico
function populateSummary(totals, totalInstitutos) {
    document.getElementById('total-institutos').textContent = totalInstitutos;
    document.getElementById('total-cursos').textContent = totals.totalCursos;
    document.getElementById('total-alunos').textContent = totals.totalAlunos.toLocaleString('pt-BR');
    document.getElementById('orcamento-total').textContent = `R$ ${(totals.totalOrcamento / 1000000).toFixed(0)}M`;
}

// Preencher lista de institutos
function populateInstitutes(institutes) {
    const container = document.getElementById('institutes-list-container');
    container.innerHTML = ''; 

    institutes.forEach(inst => {
        const statusClass = inst.status === 'ativo' ? 'active' : 'inactive';
        const comingSoonHTML = inst.status === 'inativo' ? '<div class="coming-soon">Em breve</div>' : '';
        
        // Usar navegação direta para detalhes.html com parâmetros na URL
        const clickAction = inst.status === 'ativo' 
            ? `window.location.href='detalhes.html?instituto=${inst.id}'` 
            : 'showComingSoon()';

        const cardHTML = `
            <div class="col-md-6 mb-3">
                <div class="card if-card ${statusClass}" onclick="${clickAction}">
                    <div class="card-body">
                        <h5 class="card-title">${inst.nomeCompleto}</h5>
                        <p class="if-location"><i class="fas fa-map-marker-alt"></i> ${inst.localizacao}</p>
                        <p class="if-stats"><i class="fas fa-users"></i> ${inst.resumo.alunos} alunos</p>
                        <p class="if-stats"><i class="fas fa-book"></i> ${inst.resumo.cursos} cursos</p>
                        <p class="if-stats"><i class="fas fa-money-bill-wave"></i> R$ ${(inst.resumo.orcamento / 1000000).toFixed(1)}M</p>
                        ${comingSoonHTML}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// Criar gráfico de rubricas
function createRubricasChart(rubricas) {
    const ctx = document.getElementById('rubricasChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(rubricas.orcamento),
            datasets: [{
                data: Object.values(rubricas.orcamento),
                backgroundColor: ['#198754', '#ffc107', '#dc3545', '#0dcaf0'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `R$ ${(value / 1000000).toFixed(1)}M (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Preencher barras de progresso das rubricas
function populateRubricasProgress(rubricas) {
    const container = document.getElementById('rubricas-progress');
    container.innerHTML = '';
    
    // Para cada rubrica, calcular o percentual executado
    Object.keys(rubricas.orcamento).forEach(rubrica => {
        const orcamento = rubricas.orcamento[rubrica];
        const executado = rubricas.executado[rubrica];
        const percentual = Math.round((executado / orcamento) * 100);
        
        // Determinar a cor da barra de progresso
        let barColor = 'bg-success';
        if (percentual < 30) barColor = 'bg-info';
        else if (percentual < 60) barColor = 'bg-warning';
        else if (percentual > 75) barColor = 'bg-danger';
        
        // Criar HTML da barra de progresso
        const progressHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>${rubrica}</span>
                    <span>${percentual}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar ${barColor}" role="progressbar" 
                         style="width: ${percentual}%;" 
                         aria-valuenow="${percentual}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        R$ ${(executado / 1000000).toFixed(1)}M / R$ ${(orcamento / 1000000).toFixed(1)}M
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += progressHTML;
    });
}

// Função para mostrar mensagem "Em breve"
function showComingSoon() {
    alert('Dados deste Instituto Federal ainda não estão disponíveis. Em breve!');
}