const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;

// Carregar o modelo ao iniciar a página
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // Limpa previsões anteriores

    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
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

    document.getElementById("webcam-container").appendChild(webcam.canvas);
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
        document.getElementById("label-container").innerHTML = ""; // Limpa previsões anteriores

        // Encontra a predição com maior probabilidade
        let bestPrediction = prediction.reduce((max, p) => (p.probability > max.probability ? p : max), prediction[0]);

        // Exibe apenas a classe com maior certeza
        const resultDiv = document.createElement("h4");
        resultDiv.innerHTML = `Classe: <strong>${bestPrediction.className}</strong>`;
        document.getElementById("label-container").appendChild(resultDiv);
    } else {
        // Mantém o comportamento normal para a webcam
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }
}

document.getElementById("uploadImage").addEventListener("click", () => {
    document.getElementById("imageUpload").click();
});

// Manipula a imagem carregada
document.getElementById("imageUpload").addEventListener("change", handleImageUpload);

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!model) {
        await loadModel(); // Garante que o modelo seja carregado antes de processar a imagem
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async function () {
            // Redimensiona a imagem para corresponder ao tamanho do modelo
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const maxSize = 200; // Mantém a imagem em 200x200 pixels
            canvas.width = maxSize;
            canvas.height = maxSize;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Exibe a imagem carregada na página
            const imageContainer = document.getElementById("image-container");
            imageContainer.innerHTML = "";
            imageContainer.appendChild(canvas); // Agora exibe a versão redimensionada

            await predict(canvas, true);
        };
    };
    reader.readAsDataURL(file);
}

loadModel();
