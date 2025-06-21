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
        loadDashboardData('dados_dashboard.json');
    } else if (instituto === 'IFRJ') {
        loadDashboardData('dados_ifrj.json');
    } else if (instituto === 'IFSP') {
        loadDashboardData('dados_ifsp.json');
    } else if (instituto === 'IFRS') {
        loadDashboardData('dados_ifrs.json');
    } else if (instituto === 'IFPE') {
        loadDashboardData('dados_ifpe.json');
    } else if (instituto === 'IFMG') {
        loadDashboardData('dados_ifmg.json');
    } else if (instituto === 'IFF') {
        loadDashboardData('dados_dashboard.json');
    } else {
        hideLoading();
        console.warn('Instituto não reconhecido:', instituto);
        alert('Instituto não reconhecido. Usando dados padrão.');
        loadDashboardData('dados_dashboard.json');
    }
    
    setupNavigationEvents();
});

function loadDashboardData(dataFile) {
    fetch(dataFile)
        .then(response => {
            if (!response.ok) { throw new Error('Não foi possível encontrar o arquivo: ' + dataFile); }
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

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function initializeDashboard() {
    // Preencher informações básicas
    document.getElementById('coordinator-name').textContent = dashboardData.campus.coordenador;
    document.getElementById('campus-name').textContent = dashboardData.campus.nome;
    
    const totalCourses = dashboardData.cursos.length;
    const totalStudents = dashboardData.alunos.length;
    
    document.getElementById('total-courses').textContent = totalCourses;
    document.getElementById('total-students').textContent = totalStudents;
    
    const totalInvestment = dashboardData.financeiro['Investimento total'];
    const materialsBudget = dashboardData.financeiro['Material de Consumo'] || dashboardData.financeiro['Orçamento materiais'] || 0;
    
    document.getElementById('total-investment').textContent = `R$ ${(totalInvestment / 1000000).toFixed(1)}M`;
    document.getElementById('materials-budget').textContent = `R$ ${(materialsBudget / 1000).toFixed(0)}K`;
    
    // Criar gráficos e preencher seções
    createStudentsByCourseChart();
    createFinancialChart();
    populateCourseDetails();
    populateFinancialDetails();
    populateStudentsTable();
    populateUpcomingCourses(dashboardData.cursos); // Nova função
}

function setupNavigationEvents() {
    document.getElementById('students-card').addEventListener('click', () => showDrillDown('students-drill-down'));
    document.getElementById('back-from-students').addEventListener('click', () => hideDrillDown('students-drill-down'));
    document.getElementById('back-from-course').addEventListener('click', () => hideDrillDown('course-drill-down'));
}

function showDrillDown(containerId) {
    document.getElementById('main-dashboard').style.display = 'none';
    document.getElementById(containerId).style.display = 'block';
    window.scrollTo(0, 0);
}

function hideDrillDown(containerId) {
    document.getElementById(containerId).style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    window.scrollTo(0, 0);
}

// NOVA FUNÇÃO PARA POPULAR OS PRÓXIMOS CURSOS
function populateUpcomingCourses(courses) {
    const container = document.getElementById('upcoming-courses-container');
    container.innerHTML = ''; // Limpa o container

    const today = new Date('2025-06-21T19:30:55'); // Usando a data atual para filtrar
    today.setHours(0, 0, 0, 0);

    const upcoming = courses
        .filter(course => new Date(course.inicio) >= today)
        .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum curso programado para iniciar neste instituto.</p>';
        return;
    }

    upcoming.forEach(course => {
        const courseDate = new Date(course.inicio);
        const formattedDate = courseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const courseElement = document.createElement('div');
        courseElement.className = 'list-group-item d-flex justify-content-between align-items-center';
        courseElement.innerHTML = `
            <div>
                <h6 class="mb-1">${course.nome}</h6>
                <small class="text-muted">Duração: ${course.duracao}</small>
            </div>
            <span class="badge bg-primary rounded-pill">${formattedDate}</span>
        `;
        container.appendChild(courseElement);
    });
}


function createStudentsByCourseChart() {
    const ctx = document.getElementById('studentsByCourseChart').getContext('2d');
    
    const courseNames = dashboardData.cursos.map(course => course.nome);
    const studentCounts = dashboardData.cursos.map(course => course.vagas);
    
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
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    showCourseDetails(dashboardData.cursos[index]);
                }
            }
        }
    });
}

function createFinancialChart() {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    const financialData = dashboardData.financeiro;
    
    const mainItems = Object.entries(financialData)
        .filter(([key]) => key !== 'Investimento total' && key !== 'Orçamento materiais' && key !== 'Receita de Projetos')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
    
    const labels = mainItems.map(item => item[0]);
    const values = mainItems.map(item => item[1]);
    
    const backgroundColors = [colors.tertiary, colors.primary, colors.secondary, '#0dcaf0'];
    
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
                legend: { position: 'bottom' },
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

function populateCourseDetails() {
    const container = document.getElementById('courses-container');
    container.innerHTML = '';
    
    dashboardData.cursos.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'col-md-6 mb-3';
        
        const isTechnical = course.tipo === 'tecnico';
        const courseType = isTechnical ? 'technical' : 'auxiliary';
        const courseTypeLabel = course.tipo === 'tecnico' ? 'Técnico' : (course.tipo === 'FIC' ? 'FIC' : 'Auxiliar');
        const badgeClass = isTechnical ? 'bg-primary' : 'bg-warning text-dark';
        
        courseElement.innerHTML = `
            <div class="card course-card ${courseType}">
                <div class="card-body">
                    <h5 class="card-title">${course.nome}</h5>
                    <span class="badge ${badgeClass} mb-2">${courseTypeLabel}</span>
                    <p class="course-period"><i class="fas fa-calendar-alt"></i> ${formatDate(course.inicio)} - ${formatDate(course.termino)}</p>
                    <p class="course-students"><i class="fas fa-users"></i> ${course.vagas} alunos</p>
                    <p class="course-duration"><i class="fas fa-clock"></i> Duração: ${course.duracao}</p>
                </div>
            </div>
        `;
        
        courseElement.querySelector('.course-card').addEventListener('click', () => showCourseDetails(course));
        container.appendChild(courseElement);
    });
}

function populateFinancialDetails() {
    const container = document.getElementById('financial-details');
    container.innerHTML = '';
    
    const financialData = dashboardData.financeiro;
    
    Object.entries(financialData).forEach(([category, value]) => {
        const detailElement = document.createElement('div');
        detailElement.className = 'd-flex justify-content-between align-items-center mb-2';
        detailElement.innerHTML = `<span>${category}:</span><strong>R$ ${value.toLocaleString('pt-BR')}</strong>`;
        container.appendChild(detailElement);
    });
}

function populateStudentsTable() {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '';
    
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

function showCourseDetails(course) {
    currentCourse = course;
    
    document.getElementById('course-detail-title').textContent = course.nome;
    document.getElementById('course-coordinator').textContent = course.coordenador || 'Não definido';
    document.getElementById('course-campus').textContent = dashboardData.campus.nome;
    document.getElementById('course-students-count').textContent = course.vagas;
    document.getElementById('course-duration').textContent = course.duracao;
    document.getElementById('course-period').textContent = `${formatDate(course.inicio)} - ${formatDate(course.termino)}`;
    
    const courseStudents = dashboardData.alunos.filter(student => student.curso === course.nome);
    
    const tableBody = document.getElementById('course-students-table');
    tableBody.innerHTML = '';
    
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
    
    createCourseScholarshipsChart(courseStudents);
    showDrillDown('course-drill-down');
}

function createCourseScholarshipsChart(students) {
    const ctx = document.getElementById('course-scholarships-chart').getContext('2d');
    
    const scholarshipCounts = {};
    students.forEach(student => {
        if (!scholarshipCounts[student.bolsa]) { scholarshipCounts[student.bolsa] = 0; }
        scholarshipCounts[student.bolsa]++;
    });
    
    const labels = Object.keys(scholarshipCounts);
    const values = Object.values(scholarshipCounts);
    
    if (courseScholarshipsChart) { courseScholarshipsChart.destroy(); }
    
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
                legend: { position: 'bottom' },
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    // Adiciona o fuso horário para corrigir a data
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
}

window.showCourseDetails = showCourseDetails;