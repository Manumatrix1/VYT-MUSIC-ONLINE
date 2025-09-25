import { provinceMapping } from './provinces.js';

export function initializeModal() {
    const otraProvinciaBtn = document.getElementById('otra-provincia-btn');
    const welcomeModal = document.getElementById('welcome-modal');
    const modalProvinciaSelect = document.getElementById('modal-provincia-select');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalExploreBtn = document.getElementById('modal-explore-btn');

    // Populate province select
    for (const code in provinceMapping) {
        if (provinceMapping.hasOwnProperty(code)) {
            const provinceName = provinceMapping[code];
            const option = document.createElement('option');
            option.value = provinceName.replace(/\s/g, '');
            option.textContent = provinceName;
            modalProvinciaSelect.appendChild(option);
        }
    }

    // Event Listeners
    otraProvinciaBtn.addEventListener('click', (event) => {
        event.preventDefault();
        welcomeModal.classList.add('visible');
    });

    modalConfirmBtn.addEventListener('click', () => {
        const selectedProvince = modalProvinciaSelect.value;
        if (selectedProvince) {
            window.location.href = `inscripcion_unificada.html?prov=${encodeURIComponent(selectedProvince)}`; 
        } else {
            alert('Por favor, selecciona una provincia.');
        }
    });

    modalExploreBtn.addEventListener('click', () => {
        window.location.href = `principal.html`;
    });
}