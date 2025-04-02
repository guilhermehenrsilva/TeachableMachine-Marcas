const URL = "./my_model/";


// Redirecionamento automático para a Home
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/") {
        window.location.href = "home.html";
    }
});

let model, webcam, labelContainer, maxPredictions;

// Alternar entre seções (câmera/upload)
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active-section');
    });
    document.getElementById(sectionId).classList.add('active-section');
}

// Carregar o modelo
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
}

// Iniciar a webcam
async function init() {
    if (!model) {
        await loadModel();
    }

    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    // Criar ou redefinir container para os resultados da câmera
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; 

    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

// Loop para capturar frames da webcam
async function loop() {
    webcam.update();
    await predict(webcam.canvas, false);
    window.requestAnimationFrame(loop);
}

// Predição usando imagem ou webcam
async function predict(source, isImageUpload = false) {
    if (!model) {
        console.error("Modelo não carregado!");
        return;
    }

    const prediction = await model.predict(source);

    if (isImageUpload) {
        // Criar ou redefinir container para os resultados do upload
        let uploadLabelContainer = document.getElementById("upload-label-container");
        if (!uploadLabelContainer) {
            uploadLabelContainer = document.createElement("div");
            uploadLabelContainer.id = "upload-label-container";
            document.getElementById("uploadSection").appendChild(uploadLabelContainer);
        }
        uploadLabelContainer.innerHTML = "";

        // Encontra a predição com maior probabilidade
        let bestPrediction = prediction.reduce((max, p) => (p.probability > max.probability ? p : max), prediction[0]);

        // Exibe apenas a classe com maior certeza
        const resultDiv = document.createElement("h4");
        resultDiv.innerHTML = `Classe: <strong>${bestPrediction.className}</strong>`;
        uploadLabelContainer.appendChild(resultDiv);
    } else {
        // Mantém o comportamento normal para a webcam
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }
}

// Evento para upload de imagem
document.getElementById("uploadImage").addEventListener("click", () => {
    document.getElementById("imageUpload").click();
});

document.getElementById("imageUpload").addEventListener("change", handleImageUpload);

// Manipula a imagem carregada
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!model) {
        await loadModel();
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async function () {
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

            document.getElementById("image-container").innerHTML = "";
            document.getElementById("image-container").appendChild(canvas);

            await predict(canvas, true);
        };
    };
    reader.readAsDataURL(file);
}

// Carregar modelo ao iniciar
loadModel();
