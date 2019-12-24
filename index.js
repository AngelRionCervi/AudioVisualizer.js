let fullFrequencies;
let cfg = {};
let canvas;

function nearestPow2(nbr) {
    if (nbr <= 32) {
        return 32;
    } else {
        return Math.pow(2, Math.round(Math.log(nbr) / Math.log(2))); 
    }
}

function splitUp(arr, n) {
    let rest = arr.length % n // how much to divide
    let restUsed = rest // to keep track of the division over the elements
    let partLength = Math.floor(arr.length / n)
    let result = [];

    for (let i = 0; i < arr.length; i += partLength) {
        let end = partLength + i
        let add = false;

        if (rest !== 0 && restUsed) { // should add one element for the division
            end++;
            restUsed--; // we've used one division element now
            add = true;
        }

        let middle = Math.floor(end-(partLength/2))-1;
        result.push(arr[middle]); // part of the array

        if (add) {
            i++; // also increment i in the case we added an extra element for division
        }
    }

    return result;
}

function initVisualizer(c, s, f) {
    cfg = f;
    canvas = c;
    audio = new Audio();
    context = new window.AudioContext();
    analyser = context.createAnalyser();
    audio.src = s; // the source path
    source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 4096;
  
    //frequencies = new Uint8Array(analyser.frequencyBinCount);
    fullFrequencies = new Uint8Array(analyser.fftSize)
    
    //console.log(frequenciesFull, frequencies)
    audio.play();

    switch (cfg.type) {
        case 'circular':
            renderCircular();
            break;
    }
}

function renderCircular() {
    
    canvas.width = cfg.width;
    canvas.height = cfg.height;
    let ctx = canvas.getContext("2d");
    
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let radius = cfg.circularType.radius;

    ctx.fillStyle = cfg.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
   
    ctx.beginPath();
    ctx.arc(centerX, centerY, cfg.circularType.radius, 0, 2 * Math.PI);
    ctx.stroke();

    analyser.getByteFrequencyData(fullFrequencies);

    let freqs;
    freqs = splitUp(fullFrequencies.slice(cfg.freqRange[0], cfg.freqRange[1]), cfg.barNbr)

    if (cfg.circularType.skipNull) {
        freqs = new Uint8Array(freqs.filter(el => el != 0));
    } else {
        freqs = new Uint8Array(freqs);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    for (let i = 0; i < freqs.length; i++) {
        
        let barHeight = freqs[i] * cfg.barHeightMult + cfg.minBarHeight;
        if (cfg.maxBarHeight && barHeight > cfg.maxBarHeight) {
            barHeight = cfg.maxBarHeight;
        }

        ctx.save();
        ctx.rotate(i * Math.PI / (freqs.length*0.5));
        ctx.fillStyle = getBarColor(freqs[i], ctx, barHeight);
        roundRect(ctx, radius, -cfg.barWidth / 2, barHeight, cfg.barWidth, cfg.barBorderRadius, barHeight)
   
        ctx.restore();
    }
    requestAnimationFrame(renderCircular);
}


function getBarColor(frequency, ctx, barHeight) {

    let color;

    let gradientRadius = cfg.gradientRadius;
    let gradColors = cfg.gradientColors
    let mult = cfg.colorFrequencyMultiplier;

    switch (cfg.barColorType) {
        case "frequency":
            if (cfg.mainColorChannel === "blue") {
                color = "rgb(" + frequency * mult + ", " + frequency * mult + ", " + cfg.mainColorChannelValue + ")";
            }
            if (cfg.mainColorChannel === "green") {
                color = "rgb(" + frequency * mult + ", " + cfg.mainColorChannelValue + ", " + frequency * mult + ")";
            }
            if (cfg.mainColorChannel === "red") {
                color = "rgb(" + cfg.mainColorChannelValue + ", " + frequency * mult + ", " + frequency * mult + ")";
            }
            break;
        case "gradient":
            let radius = gradientRadius === "barSize" ? barHeight : gradientRadius;
            let gradient = ctx.createLinearGradient(0, 0, radius*cfg.gradientRadiusMultiplier, 0);
            for (let u = 0; u < gradColors.length; u++) {
                gradient.addColorStop((u/gradColors.length), gradColors[u]);
            }  
            color = gradient;
            break;
        case "fixedColor":
            color = cfg.mainBarColor;
            break;
    }
    return color;
}


function roundRect(ctx, x, y, width, height, radius, barHeight) {
    
    if (radius <= barHeight) {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        radius = {tl: 0, tr: 0, br: 0, bl: 0};
    }

    if (!cfg.doubleBorderRadius) {
        radius.bl = 0;
        radius.tl = 0;
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    
    ctx.fill();
  
}


