// Configuração da API - Alterar para URL do seu backend em produção
const API_URL = 'https://baixarqualidadeimagem-backend.onrender.com/api';

// Estado da aplicação
let uploadedFile = null;
let uploadedFileId = null;
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
    console.log('App inicializado');
});

function setupEventListeners() {
    // Upload events
    uploadArea.addEventListener('click', () => {
        console.log('Upload area clicada');
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', (e) => {
        console.log('File input change detectado');
        handleFileSelect(e);
    });

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
    console.log('handleFileSelect chamado');
    
    if (!e.target.files || e.target.files.length === 0) {
        console.log('Nenhum arquivo selecionado');
        return;
    }
    
    const file = e.target.files[0];
    console.log('Arquivo selecionado:', file.name, file.type, file.size);
    
    if (file) {
        handleFile(file);
    }
}

// Validação e preview do arquivo
function handleFile(file) {
    console.log('Processando arquivo:', file.name);
    
    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const fileType = file.type.toLowerCase();
    
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!validTypes.includes(fileType) && !hasValidExtension) {
        console.log('Tipo inválido:', fileType);
        showError('Formato inválido. Use PNG, WEBP, JPG ou JPEG.');
        return;
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        console.log('Arquivo muito grande:', file.size);
        showError('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
    }
    
    if (file.size < 100) {
        console.log('Arquivo muito pequeno:', file.size);
        showError('Arquivo parece estar corrompido ou vazio.');
        return;
    }

    console.log('Arquivo válido, fazendo upload');
    uploadedFile = file;
    hideError();
    
    // SOLUÇÃO: Upload direto para o servidor ao invés de preview local
    uploadAndShowPreview(file);
}

// Upload e preview via servidor (solução para mobile)
async function uploadAndShowPreview(file) {
    console.log('Fazendo upload para servidor:', file.name);
    
    // Mostrar loading
    Swal.fire({
        title: 'Carregando imagem...',
        html: 'Fazendo upload...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Upload da imagem para o servidor
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Erro no upload:', errorText);
            throw new Error('Erro no upload da imagem');
        }

        const uploadData = await uploadResponse.json();
        uploadedFileId = uploadData.fileId;
        
        console.log('Upload concluído, fileId:', uploadedFileId);

        // Usar a URL do servidor para o preview (resolve problema mobile)
        const previewUrl = `${API_URL}/download/${uploadedFileId}`;
        
        // Carregar imagem do servidor
        const img = new Image();
        
        img.onload = () => {
            console.log('Preview carregado do servidor:', img.width, 'x', img.height);
            
            // Exibir preview
            originalPreview.src = previewUrl;
            
            const sizeKB = (file.size / 1024).toFixed(2);
            originalInfo.textContent = `${img.width}x${img.height} • ${sizeKB} KB`;

            previewSection.style.display = 'block';
            controlsSection.style.display = 'block';

            // Reset processed preview
            processedPreview.innerHTML = '<p>Aguardando processamento...</p>';
            processedInfo.textContent = '';
            downloadBtn.style.display = 'none';

            // Fechar loading
            Swal.close();

            // Scroll suave até a seção de controles
            setTimeout(() => {
                controlsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        };
        
        img.onerror = () => {
            console.error('Erro ao carregar preview do servidor');
            throw new Error('Erro ao carregar preview');
        };
        
        img.src = previewUrl;

    } catch (error) {
        console.error('Erro no upload:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar',
            text: 'Não foi possível fazer upload da imagem. Verifique sua conexão e tente novamente.',
            confirmButtonColor: '#0B5FFF'
        });
    }
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
    if (!uploadedFileId) {
        showError('Nenhuma imagem selecionada.');
        return;
    }

    processBtn.disabled = true;
    processBtn.textContent = 'Processando...';

    try {
        // Processar imagem (arquivo já está no servidor)
        const processResponse = await fetch(`${API_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileId: uploadedFileId,
                pixelization: currentSettings.pixelization,
                quality: currentSettings.quality,
                noise: currentSettings.noise,
                outputFormat: currentSettings.format
            })
        });

        if (!processResponse.ok) {
            const errorText = await processResponse.text();
            console.error('Erro no processamento:', errorText);
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

        // Scroll suave até a seção de preview após processar
        setTimeout(() => {
            previewSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 300);

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
    
    // Mostrar popup de doação após download
    setTimeout(() => {
        showDonationPopup();
    }, 1000);
}

// Popup de doação
function showDonationPopup() {
    Swal.fire({
        title: 'Apoie o projeto 💙',
        html: `
            <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                Essa ferramenta é <strong>gratuita</strong> e mantida de forma independente. 
                Se ela te ajudou, qualquer apoio via PIX já faz diferença.
            </p>
            <div style="margin: 20px 0;">
                <img src="assets/qrcode-pix.png" alt="QR Code PIX" style="max-width: 200px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            </div>
            <p style="font-size: 14px; color: #718096; margin-top: 15px;">
                Obrigado por usar o BaixarQualidadeImagem! ❤️
            </p>
        `,
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#0B5FFF',
        showCancelButton: true,
        cancelButtonText: 'Copiar chave PIX',
        cancelButtonColor: '#48bb78',
        width: '450px',
        padding: '2em',
        backdrop: true,
        allowOutsideClick: true
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            // Copiar chave PIX (substitua pela sua chave)
            const chavePix = '00020126580014BR.GOV.BCB.PIX0136166ab3a1-e2d5-412c-aa27-ca1377ca8ddb5204000053039865802BR5918FERNANDO GIGLIOTTI6014RIBEIRAO PRETO622605224NMtygEOqa0nphi3aRgIm66304386A';
            navigator.clipboard.writeText(chavePix).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Chave copiada!',
                    text: 'A chave PIX foi copiada para a área de transferência.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }).catch(() => {
                Swal.fire({
                    icon: 'info',
                    title: 'Chave PIX',
                    text: chavePix,
                    confirmButtonColor: '#0B5FFF'
                });
            });
        }
    });
}

// Reset da aplicação
function resetApp() {
    uploadedFile = null;
    uploadedFileId = null;
    processedImageId = null;
    fileInput.value = '';

    previewSection.style.display = 'none';
    controlsSection.style.display = 'none';
    downloadBtn.style.display = 'none';

    hideError();

    // Reset to default mode
    handleModeChange('media');

    // Scroll de volta para o topo ao resetar
    window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
    });
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