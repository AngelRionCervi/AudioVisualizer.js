function getAvg(arr, innerCircleMult) {
    const total = arr.reduce((acc, c) => acc + c, 0);
    return (total / arr.length) * innerCircleMult;
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

        let middle = Math.floor(end - (partLength / 2)) - 1;
        result.push(arr[middle]); // part of the array

        if (add) {
            i++; // also increment i in the case we added an extra element for division
        }
    }

    return result;
}

function getFreqs (freqRange, fullFrequencies, barNbr) {

    if (freqRange.length & 1) throw new Error("The frequency ranges must be even !");

    let freqs = [];

    if (freqRange.length === 2) {
        freqs = splitUp(fullFrequencies.slice(freqRange[0], freqRange[1]), barNbr);
    } else {
        for (let u = 1; u < freqRange.length; u += 2) {
            let sample = splitUp(fullFrequencies.slice(freqRange[u - 1], freqRange[u]), barNbr/(freqRange.length/2));
            freqs.push(...sample)
        }
    }

    return freqs;
}


function getBarColor(frequency, ctx, barHeight, gradientRadius, gradientColors, colorFrequencyMultiplier, barColorType, mainColorChannel, gradientDoubleExpand, gradientLengthMultiplier, mainBarColor) {

    let color;

    let mult = colorFrequencyMultiplier;

    switch (barColorType) {
        case "frequency":
            if (mainColorChannel === "blue") {
                color = "rgb(" + frequency * mult + ", " + frequency * mult + ", " + mainColorChannelValue + ")";
            }
            if (mainColorChannel === "green") {
                color = "rgb(" + frequency * mult + ", " + mainColorChannelValue + ", " + frequency * mult + ")";
            }
            if (mainColorChannel === "red") {
                color = "rgb(" + mainColorChannelValue + ", " + frequency * mult + ", " + frequency * mult + ")";
            }
            break;
        case "gradient":
            let gradient;
            if (gradientDoubleExpand) {
                gradient = ctx.createLinearGradient(0, 0, barHeight+20, 0);
                for (let u = 1; u < gradientColors.length; u++) {
                    gradient.addColorStop((u / (gradientColors.length*2)), gradientColors[gradientColors.length-u]);
                }
                for (let u = 0; u < gradientColors.length; u++) {
                    if(u === 0) {
                        gradient.addColorStop((u / (gradientColors.length*2))+0.5, gradientColors[0]);
                    } else {
                        gradient.addColorStop((u / (gradientColors.length*2))+0.5, gradientColors[u]);
                    }
                }
            } else {
                gradient = ctx.createLinearGradient(0, 0, barHeight * gradientLengthMultiplier, 0);
                for (let u = 0; u < gradientColors.length; u++) {
                    gradient.addColorStop((u / gradientColors.length), gradientColors[u]);
                }
            }
            color = gradient;
            break;
        case "fixedColor":
            color = mainBarColor;
            break;
    }
    return color;
}


function roundRect(ctx, x, y, width, height, radius, barHeight, hey, doubleBorderRadius) {

    if (radius <= barHeight) {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = { tl: radius-(radius-barHeight), tr: radius-(radius-barHeight), br: radius-(radius-barHeight), bl: radius-(radius-barHeight) };
    }

    if (!doubleBorderRadius) {
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

function triangle(ctx, x, y, width, height, radius, barHeight) {

    if (radius <= barHeight) {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = { tl: 0, tr: 0, br: 0, bl: 0 };
    }

    if (!this.doubleBorderRadius) {
        radius.bl = 0;
        radius.tl = 0;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    /*
    ctx.lineTo(x, y + width);
    ctx.lineTo(y, x - height);
    ctx.strokeStyle = "red"
    ctx.lineWidth = 1*/ //sick flower

    ctx.lineTo(x + width, y - 5);
    ctx.lineTo(x + width, y + 5);

    ctx.closePath();

    ctx.fill();
}

function joined(ctx, x, y, width, height, radius, barHeight, prevFreq, freq) {

    if (radius <= barHeight) {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = { tl: 0, tr: 0, br: 0, bl: 0 };
    }

    if (!this.doubleBorderRadius) {
        radius.bl = 0;
        radius.tl = 0;
    }

    ctx.beginPath();
    ctx.moveTo(x + width, y);
    /*
    ctx.lineTo(x, y + width);
    ctx.lineTo(y, x - height);*/ //sick flower

    /* ctx.lineTo(x-width , y-5);
    ctx.lineTo(x , y+5); */ //sharp rose
    ctx.strokeStyle = "red"
    ctx.lineWidth = 1
    /*
    ctx.lineTo(x, y);
    ctx.lineTo(y, y-1);*/ //bar with middle circle
    //ctx.lineTo(x+height , y);
    /*
    ctx.lineTo(x, y);
    ctx.lineTo(y, x+width);*/ //sick geometry

    /*ctx.lineTo(x, y);
    ctx.lineTo(y+width, y);*/ //vertical lines
    
    ctx.lineTo(x, y);
    ctx.lineTo(y + width, x);
    //ctx.closePath();

    ctx.stroke();
}

class CircularType {
    constructor(canvas, audioSrc, cfg) {

        Object.assign(this, cfg);
        
        this.fullFrequencies;
        this.amplitude;
        this.canvas = canvas;
        this.radInc = 0;
        this.radIncVal = 0;
        this.context;
        this.analyser;
        this.source;
        this.audio;
        this.audioSrc = audioSrc;
    }

    init() {
        this.audio = new Audio();
        this.context = new window.AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audio.src = this.audioSrc;
        this.source = this.context.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = this.smoothing;

        //frequencies = new Uint8Array(analyser.frequencyBinCount);
        this.fullFrequencies = new Uint8Array(this.analyser.fftSize)

        //console.log(frequenciesFull, frequencies)
        this.audio.play();
        
        this.renderCircular();
    
    }

    renderCircular() {

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        let ctx = this.canvas.getContext("2d");

        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        let freqs = getFreqs(this.freqRange, this.fullFrequencies, this.barNbr);

        if (this.skipNull) {
            freqs = new Uint8Array(freqs.filter(el => el != 0));
        } else {
            freqs = new Uint8Array(freqs);
        }

        let radius = this.innerCircleReact ? this.radius + getAvg(freqs, this.innerCircleMult) : this.radius;
        radius += this.radInc;
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        this.analyser.getByteFrequencyData(this.fullFrequencies);

        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        for (let i = 0; i < freqs.length; i++) {

            let barHeight = freqs[i] * this.barHeightMult + this.minBarHeight;
            if (this.maxBarHeight && barHeight > this.maxBarHeight) {
                barHeight = this.maxBarHeight;
            }

            ctx.save();
            ctx.rotate(i * Math.PI / (freqs.length * 0.5));
            ctx.fillStyle = getBarColor(freqs[i], ctx, barHeight, this.gradientRadius, this.gradientColors, this.colorFrequencyMultiplier, this.barColorType, this.mainColorChannel, this.gradientDoubleExpand, this.gradientLengthMultiplier, this.mainBarColor);
            roundRect(ctx, radius, -this.barWidth / 2, barHeight, this.barWidth, this.barBorderRadius, barHeight, freqs[i], this.doubleBorderRadius)

            ctx.restore();
        }
        this.radInc += this.radIncVal;
        requestAnimationFrame(() => this.renderCircular());
    }

}



class FlatType {
    constructor(canvas, audioSrc, cfg) {

        Object.assign(this, cfg);
        
        this.fullFrequencies;
        this.amplitude;
        this.canvas = canvas;
        this.context;
        this.analyser;
        this.source;
        this.audio;
        this.audioSrc = audioSrc;
    }

    init() {
        this.audio = new Audio();
        this.context = new window.AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audio.src = this.audioSrc;
        this.source = this.context.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = this.smoothing;
        //frequencies = new Uint8Array(analyser.frequencyBinCount);
        this.fullFrequencies = new Uint8Array(this.analyser.fftSize)

        //console.log(frequenciesFull, frequencies)
        this.audio.play();
        
        this.renderFlat();
    
    }

    renderFlat() {

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        let ctx = this.canvas.getContext("2d");

        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        let freqs = getFreqs(this.freqRange, this.fullFrequencies, this.barNbr);

        if (this.skipNull) {
            freqs = new Uint8Array(freqs.filter(el => el != 0));
        } else {
            freqs = new Uint8Array(freqs);
        }

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.analyser.getByteFrequencyData(this.fullFrequencies);

        //ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        let calcWidth = (this.barSpacingInc * freqs.length) + (this.barWidth * freqs.length);
        let barSpacing = -(this.barSpacingInc);

        for (let i = 0; i < freqs.length; i++) {

            let barHeight = freqs[i] * this.barHeightMult + this.minBarHeight;
            if (this.maxBarHeight && barHeight > this.maxBarHeight) {
                barHeight = this.maxBarHeight;
            }

            barSpacing += this.barSpacingInc + this.barWidth;

            let doubleExp = 0;

            if (this.doubleExpand) {
                doubleExp = barHeight;
            }

            ctx.save();
            ctx.translate((this.canvas.width-calcWidth)/2 + barSpacing, centerY+(doubleExp/2));
            ctx.rotate(-Math.PI/2);
            ctx.fillStyle = getBarColor(freqs[i], ctx, barHeight, this.gradientRadius, this.gradientColors, this.colorFrequencyMultiplier, this.barColorType, this.mainColorChannel, this.gradientDoubleExpand, this.gradientLengthMultiplier, this.mainBarColor);
            roundRect(ctx, 10, -this.barWidth / 2, barHeight, this.barWidth, this.barBorderRadius, barHeight, freqs[i], this.doubleBorderRadius)
            ctx.restore();
        }
        requestAnimationFrame(() => this.renderFlat());
    }
}





