const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;

// Carrega o modelo
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // Limpa qualquer previsão anterior

    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    // Configuração da webcam
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
    await predict(webcam.canvas);
    window.requestAnimationFrame(loop);
}

// Predição usando imagem ou webcam
async function predict(source) {
    const prediction = await model.predict(source);
    labelContainer.innerHTML = ""; // Limpa previsões anteriores

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
        const div = document.createElement("div");
        div.innerHTML = classPrediction;
        labelContainer.appendChild(div);
    }
}

// Evento para abrir seletor de arquivos
document.getElementById("uploadImage").addEventListener("click", () => {
    document.getElementById("imageUpload").click();
});

// Manipula a imagem carregada
document.getElementById("imageUpload").addEventListener("change", handleImageUpload);

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async function () {
            // Redimensiona a imagem para corresponder ao tamanho do modelo
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Exibe a imagem carregada na página
            const imageContainer = document.getElementById("image-container");
            imageContainer.innerHTML = "";
            imageContainer.appendChild(img);

            // Realiza a predição
            await predict(canvas);
        };
    };
    reader.readAsDataURL(file);
}