// Dashboard Interativo - Script de controle
let dashboardData = null;
let currentCourse = null;
let courseScholarshipsChart = null;

// Cores do dashboard
const colors = { 
    primary: '#198754',   // Verde
    secondary: '#dc3545', // Vermelho
    tertiary: '#ffc107'   // Amarelo
};

// Inicialização do dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar loading
    showLoading();
    
    // Obter parâmetro da URL
    const urlParams = new URLSearchParams(window.location.search);
    const instituto = urlParams.get('instituto');
    
    // Verificar se o parâmetro existe e carregar dados apropriados
    if (!instituto) {
        hideLoading();
        console.warn('Parâmetro "instituto" não encontrado na URL. Usando dados padrão.');
        // Carregar dados padrão (IFF)
        loadDashboardData('dados_dashboard.json');
    } else if (instituto === 'IFRJ') {
        // Carregar dados do IFRJ
        loadDashboardData('dados_ifrj.json');
    } else if (instituto === 'IFSP') {
        // Carregar dados do IFSP
        loadDashboardData('dados_ifsp.json');
    } else if (instituto === 'IFRS') {
        // Carregar dados do IFRS
        loadDashboardData('dados_ifrs.json');
    } else if (instituto === 'IFPE') {
        // Carregar dados do IFPE
        loadDashboardData('dados_ifpe.json');
    } else if (instituto === 'IFF') {
        // Carregar dados do IFF
        loadDashboardData('dados_dashboard.json');
    } else {
        // Caso o instituto não seja reconhecido
        hideLoading();
        console.warn('Instituto não reconhecido:', instituto);
        alert('Instituto não reconhecido. Usando dados padrão.');
        loadDashboardData('dados_dashboard.json');
    }
    
    // Configurar eventos de navegação
    setupNavigationEvents();
});

// Função para carregar dados do dashboard
function loadDashboardData(dataFile) {
    fetch(dataFile)
        .then(response => {
            if (!response.ok) { 
                throw new Error('Não foi possível encontrar o arquivo: ' + dataFile); 
            }
            return response.json();
        })
        .then(data => {
            dashboardData = data;
            initializeDashboard();
            hideLoading();
        })
        .catch(error => {
            console.error('Erro ao carregar dados:', error);
            hideLoading();
            alert('Erro ao carregar os dados do campus. Por favor, tente novamente.');
        });
}

// Função para mostrar loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Função para esconder loading
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Inicializar o dashboard com os dados carregados
function initializeDashboard() {
    // Preencher informações básicas
    document.getElementById('coordinator-name').textContent = dashboardData.campus.coordenador;
    document.getElementById('campus-name').textContent = dashboardData.campus.nome;
    
    // Calcular totais reais a partir dos dados
    const totalCourses = dashboardData.cursos.length;
    const totalStudents = dashboardData.alunos.length;
    
    document.getElementById('total-courses').textContent = totalCourses;
    document.getElementById('total-students').textContent = totalStudents;
    
    // Formatar valores financeiros
    const totalInvestment = dashboardData.financeiro['Investimento total'];
    const materialsBudget = dashboardData.financeiro['Material de consumo'] || dashboardData.financeiro['Orçamento materiais'] || 0;
    
    document.getElementById('total-investment').textContent = `R$ ${(totalInvestment / 1000000).toFixed(1)}M`;
    document.getElementById('materials-budget').textContent = `R$ ${(materialsBudget / 1000).toFixed(0)}K`;
    
    // Criar gráficos
    createStudentsByCourseChart();
    createFinancialChart();
    
    // Preencher detalhes dos cursos
    populateCourseDetails();
    
    // Preencher detalhes financeiros
    populateFinancialDetails();
    
    // Preencher tabela de alunos
    populateStudentsTable();
}

// Configurar eventos de navegação para drill-down
function setupNavigationEvents() {
    // Evento para mostrar drill-down de alunos
    document.getElementById('students-card').addEventListener('click', function() {
        showDrillDown('students-drill-down');
    });
    
    // Evento para voltar do drill-down de alunos
    document.getElementById('back-from-students').addEventListener('click', function() {
        hideDrillDown('students-drill-down');
    });
    
    // Evento para voltar do drill-down de curso
    document.getElementById('back-from-course').addEventListener('click', function() {
        hideDrillDown('course-drill-down');
    });
}

// Mostrar um container de drill-down específico
function showDrillDown(containerId) {
    // Esconder dashboard principal
    document.getElementById('main-dashboard').style.display = 'none';
    
    // Mostrar container de drill-down
    document.getElementById(containerId).style.display = 'block';
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Esconder um container de drill-down específico
function hideDrillDown(containerId) {
    // Esconder container de drill-down
    document.getElementById(containerId).style.display = 'none';
    
    // Mostrar dashboard principal
    document.getElementById('main-dashboard').style.display = 'block';
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Criar gráfico de alunos por curso
function createStudentsByCourseChart() {
    const ctx = document.getElementById('studentsByCourseChart').getContext('2d');
    
    // Preparar dados para o gráfico
    const courseNames = dashboardData.cursos.map(course => course.nome);
    const studentCounts = dashboardData.cursos.map(course => course.vagas);
    
    // Cores alternadas para os cursos
    const backgroundColors = dashboardData.cursos.map((_, index) => 
        index % 2 === 0 ? colors.secondary : colors.primary
    );
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: courseNames,
            datasets: [{
                label: 'Número de Alunos',
                data: studentCounts,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Alunos'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Cursos'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const courseIndex = context.dataIndex;
                            const course = dashboardData.cursos[courseIndex];
                            return [
                                `Duração: ${course.duracao}`,
                                `Início: ${formatDate(course.inicio)}`,
                                `Término: ${formatDate(course.termino)}`
                            ];
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    showCourseDetails(dashboardData.cursos[index]);
                }
            }
        }
    });
}

// Criar gráfico financeiro
function createFinancialChart() {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    // Preparar dados para o gráfico
    const financialData = dashboardData.financeiro;
    
    // Filtrar apenas os itens principais para o gráfico (máximo 4)
    const mainItems = Object.entries(financialData)
        .filter(([key]) => key !== 'Investimento total' && key !== 'Orçamento materiais')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
    
    const labels = mainItems.map(item => item[0]);
    const values = mainItems.map(item => item[1]);
    
    // Cores para o gráfico de pizza
    const backgroundColors = [
        colors.tertiary,
        colors.primary,
        colors.secondary,
        '#0dcaf0'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `R$ ${value.toLocaleString('pt-BR')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Preencher detalhes dos cursos
function populateCourseDetails() {
    const container = document.getElementById('courses-container');
    container.innerHTML = ''; // Limpar container
    
    dashboardData.cursos.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'col-md-6 mb-3';
        
        // Determinar tipo de curso (técnico ou auxiliar)
        const isTechnical = course.tipo === 'tecnico';
        const courseType = isTechnical ? 'technical' : 'auxiliary'; // Mantém o estilo visual
        const courseTypeLabel = course.tipo === 'tecnico' ? 'Técnico' : (course.tipo === 'FIC' ? 'FIC' : 'Auxiliar'); // Mostra o texto correto
        const badgeClass = isTechnical ? 'bg-primary' : 'bg-warning text-dark';
        
        courseElement.innerHTML = `
            <div class="card course-card ${courseType}">
                <div class="card-body">
                    <h5 class="card-title">${course.nome}</h5>
                    <span class="badge ${badgeClass} mb-2">${courseTypeLabel}</span>
                    <p class="course-period">
                        <i class="fas fa-calendar-alt"></i> ${formatDate(course.inicio)} - ${formatDate(course.termino)}
                    </p>
                    <p class="course-students">
                        <i class="fas fa-users"></i> ${course.vagas} alunos
                    </p>
                    <p class="course-duration">
                        <i class="fas fa-clock"></i> Duração: ${course.duracao}
                    </p>
                </div>
            </div>
        `;
        
        // Adicionar evento de clique
        courseElement.querySelector('.course-card').addEventListener('click', function() {
            showCourseDetails(course);
        });
        
        container.appendChild(courseElement);
    });
}

// Preencher detalhes financeiros
function populateFinancialDetails() {
    const container = document.getElementById('financial-details');
    container.innerHTML = ''; // Limpar container
    
    const financialData = dashboardData.financeiro;
    
    Object.entries(financialData).forEach(([category, value]) => {
        const detailElement = document.createElement('div');
        detailElement.className = 'd-flex justify-content-between align-items-center mb-2';
        
        detailElement.innerHTML = `
            <span>${category}:</span>
            <strong>R$ ${value.toLocaleString('pt-BR')}</strong>
        `;
        
        container.appendChild(detailElement);
    });
}

// Preencher tabela de alunos
function populateStudentsTable() {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = ''; // Limpar tabela
    
    dashboardData.alunos.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.nome}</td>
            <td>${student.curso}</td>
            <td>${student.bolsa}</td>
            <td>${formatDate(student.ingresso)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Mostrar detalhes de um curso específico
function showCourseDetails(course) {
    currentCourse = course;
    
    // Preencher informações do curso
    document.getElementById('course-detail-title').textContent = course.nome;
    
    // Encontrar coordenador do curso
    document.getElementById('course-coordinator').textContent = course.coordenador || 'Não definido';
    
    document.getElementById('course-campus').textContent = dashboardData.campus.nome;
    document.getElementById('course-students-count').textContent = course.vagas;
    document.getElementById('course-duration').textContent = course.duracao;
    document.getElementById('course-period').textContent = `${formatDate(course.inicio)} - ${formatDate(course.termino)}`;
    
    // Filtrar alunos do curso
    const courseStudents = dashboardData.alunos.filter(student => student.curso === course.nome);
    
    // Preencher tabela de alunos do curso
    const tableBody = document.getElementById('course-students-table');
    tableBody.innerHTML = ''; // Limpar tabela
    
    courseStudents.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.nome}</td>
            <td>${student.bolsa}</td>
            <td>${formatDate(student.ingresso)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Criar gráfico de bolsas
    createCourseScholarshipsChart(courseStudents);
    
    // Mostrar drill-down do curso
    showDrillDown('course-drill-down');
}

// Criar gráfico de distribuição de bolsas para um curso
function createCourseScholarshipsChart(students) {
    const ctx = document.getElementById('course-scholarships-chart').getContext('2d');
    
    // Contar bolsas por tipo
    const scholarshipCounts = {};
    
    students.forEach(student => {
        if (!scholarshipCounts[student.bolsa]) {
            scholarshipCounts[student.bolsa] = 0;
        }
        scholarshipCounts[student.bolsa]++;
    });
    
    // Preparar dados para o gráfico
    const labels = Object.keys(scholarshipCounts);
    const values = Object.values(scholarshipCounts);
    
    // Destruir gráfico anterior se existir
    if (courseScholarshipsChart) {
        courseScholarshipsChart.destroy();
    }
    
    // Criar novo gráfico
    courseScholarshipsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [colors.tertiary, colors.secondary],
                borderColor: [colors.tertiary, colors.secondary],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} alunos (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Função auxiliar para formatar datas
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Verificar se é uma data válida
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Formatar data
    return date.toLocaleDateString('pt-BR');
}

// Função global para ser chamada pelos elementos HTML
window.showCourseDetails = showCourseDetails;