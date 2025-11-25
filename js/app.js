// Configuração da API - Alterar para URL do seu backend em produção
const API_URL = 'https://baixarqualidadeimagem-backend.onrender.com/api';

// Estado da aplicação
let uploadedFile = null;
let processedImageId = null;
let currentSettings = {
    mode: 'media',
    pixelization: 4,
    quality: 50,
    noise: 30,
    format: 'jpeg'
};

// Elementos DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const errorMessage = document.getElementById('errorMessage');
const previewSection = document.getElementById('previewSection');
const controlsSection = document.getElementById('controlsSection');
const originalPreview = document.getElementById('originalPreview');
const processedPreview = document.getElementById('processedPreview');
const originalInfo = document.getElementById('originalInfo');
const processedInfo = document.getElementById('processedInfo');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// Sliders
const pixelSlider = document.getElementById('pixelSlider');
const qualitySlider = document.getElementById('qualitySlider');
const noiseSlider = document.getElementById('noiseSlider');
const pixelValue = document.getElementById('pixelValue');
const qualityValue = document.getElementById('qualityValue');
const noiseValue = document.getElementById('noiseValue');

// Modos pré-definidos
const presetModes = {
    baixa: { pixelization: 2, quality: 75, noise: 10 },
    media: { pixelization: 4, quality: 50, noise: 30 },
    extrema: { pixelization: 12, quality: 20, noise: 70 }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Upload events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleModeChange(e.target.dataset.mode));
    });

    // Format buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleFormatChange(e.target.dataset.format));
    });

    // Sliders
    pixelSlider.addEventListener('input', (e) => {
        currentSettings.pixelization = parseInt(e.target.value);
        pixelValue.textContent = e.target.value;
    });

    qualitySlider.addEventListener('input', (e) => {
        currentSettings.quality = parseInt(e.target.value);
        qualityValue.textContent = e.target.value;
    });

    noiseSlider.addEventListener('input', (e) => {
        currentSettings.noise = parseInt(e.target.value);
        noiseValue.textContent = e.target.value;
    });

    // Action buttons
    processBtn.addEventListener('click', processImage);
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetApp);
}

// Drag and Drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Validação e preview do arquivo
function handleFile(file) {
    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showError('Formato inválido. Use PNG, JPG ou JPEG.');
        return;
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
    }

    uploadedFile = file;
    hideError();
    showPreview(file);
}

function showPreview(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        originalPreview.src = e.target.result;

        // Calcular dimensões
        const img = new Image();
        img.onload = () => {
            const sizeKB = (file.size / 1024).toFixed(2);
            originalInfo.textContent = `${img.width}x${img.height} • ${sizeKB} KB`;
        };
        img.src = e.target.result;

        previewSection.style.display = 'block';
        controlsSection.style.display = 'block';

        // Reset processed preview
        processedPreview.innerHTML = '<p>Aguardando processamento...</p>';
        processedInfo.textContent = '';
        downloadBtn.style.display = 'none';
    };

    reader.readAsDataURL(file);
}

// Mudança de modo
function handleModeChange(mode) {
    currentSettings.mode = mode;

    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });

    // Apply preset
    const preset = presetModes[mode];
    currentSettings.pixelization = preset.pixelization;
    currentSettings.quality = preset.quality;
    currentSettings.noise = preset.noise;

    // Update sliders
    pixelSlider.value = preset.pixelization;
    qualitySlider.value = preset.quality;
    noiseSlider.value = preset.noise;
    pixelValue.textContent = preset.pixelization;
    qualityValue.textContent = preset.quality;
    noiseValue.textContent = preset.noise;
}

// Mudança de formato
function handleFormatChange(format) {
    currentSettings.format = format;

    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.format === format) {
            btn.classList.add('active');
        }
    });
}

// Processar imagem
async function processImage() {
    if (!uploadedFile) {
        showError('Nenhuma imagem selecionada.');
        return;
    }

    processBtn.disabled = true;
    processBtn.textContent = 'Processando...';

    try {
        // Upload da imagem
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Erro no upload da imagem');
        }

        const uploadData = await uploadResponse.json();
        const fileId = uploadData.fileId;

        // Processar imagem
        const processResponse = await fetch(`${API_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileId: fileId,
                pixelization: currentSettings.pixelization,
                quality: currentSettings.quality,
                noise: currentSettings.noise,
                outputFormat: currentSettings.format
            })
        });

        if (!processResponse.ok) {
            throw new Error('Erro ao processar a imagem');
        }

        const processData = await processResponse.json();
        processedImageId = processData.processedFileId;

        // Exibir preview
        const previewUrl = `${API_URL}/download/${processedImageId}`;
        processedPreview.innerHTML = `<img src="${previewUrl}" alt="Imagem processada">`;

        // Informações do processamento
        const info = processData.info;
        processedInfo.textContent = `${info.width}x${info.height} • ${info.sizeKB} KB`;

        downloadBtn.style.display = 'block';
        hideError();

    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao processar a imagem. Tente novamente.');
    } finally {
        processBtn.disabled = false;
        processBtn.textContent = 'Processar Imagem';
    }
}

// Download da imagem
function downloadImage() {
    if (!processedImageId) {
        showError('Nenhuma imagem processada para download.');
        return;
    }

    const timestamp = new Date().getTime();
    const extension = currentSettings.format === 'jpeg' ? 'jpg' : 'png';
    const filename = `imagem_zoada_${timestamp}.${extension}`;

    const downloadUrl = `${API_URL}/download/${processedImageId}`;

    // Criar link temporário para download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Reset da aplicação
function resetApp() {
    uploadedFile = null;
    processedImageId = null;
    fileInput.value = '';

    previewSection.style.display = 'none';
    controlsSection.style.display = 'none';
    downloadBtn.style.display = 'none';

    hideError();

    // Reset to default mode
    handleModeChange('media');
}

// Funções auxiliares
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

// Log para debug (remover em produção)
console.log('BaixarQualidadeImagem App Initialized');