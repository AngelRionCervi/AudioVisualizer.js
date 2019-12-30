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

    getAvg(arr) {
        const total = arr.reduce((acc, c) => acc + c, 0);
        return (total / arr.length) * this.innerCircleMult;
    }

    splitUp(arr, n) {
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

    init() {

        this.audio = new Audio();
        this.context = new window.AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audio.src = this.audioSrc;
        this.source = this.context.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 2048;

        //frequencies = new Uint8Array(analyser.frequencyBinCount);
        this.fullFrequencies = new Uint8Array(this.analyser.fftSize)

        //console.log(frequenciesFull, frequencies)
        this.audio.play();
        
        this.renderCircular();
    
    }

    renderCircular() {

        this.canvas.width = 500;
        this.canvas.height = 500;

        let ctx = this.canvas.getContext("2d");

        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        let freqs = this.splitUp(this.fullFrequencies.slice(this.freqRange[0], this.freqRange[1]), this.barNbr)

        if (this.skipNull) {
            freqs = new Uint8Array(freqs.filter(el => el != 0));
        } else {
            freqs = new Uint8Array(freqs);
        }

        let radius = this.innerCircleReact ? this.radius + this.getAvg(freqs) : this.radius;
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
            ctx.fillStyle = this.getBarColor(freqs[i], ctx, barHeight);
            this.triangle(ctx, radius, -this.barWidth / 2, barHeight, this.barWidth, this.barBorderRadius, barHeight, freqs[i])

            ctx.restore();
        }
        this.radInc += this.radIncVal;
        requestAnimationFrame(() => this.renderCircular());
    }


    getBarColor(frequency, ctx, barHeight) {

        let color;

        let gradientRadius = this.gradientRadius;
        let gradColors = this.gradientColors
        let mult = this.colorFrequencyMultiplier;

        switch (this.barColorType) {
            case "frequency":
                if (this.mainColorChannel === "blue") {
                    color = "rgb(" + frequency * mult + ", " + frequency * mult + ", " + this.mainColorChannelValue + ")";
                }
                if (this.mainColorChannel === "green") {
                    color = "rgb(" + frequency * mult + ", " + this.mainColorChannelValue + ", " + frequency * mult + ")";
                }
                if (this.mainColorChannel === "red") {
                    color = "rgb(" + this.mainColorChannelValue + ", " + frequency * mult + ", " + frequency * mult + ")";
                }
                break;
            case "gradient":
                let radius = gradientRadius === "barSize" ? barHeight : gradientRadius;
                let gradient = ctx.createLinearGradient(0, 0, radius * this.gradientRadiusMultiplier, 0);
                for (let u = 0; u < gradColors.length; u++) {
                    gradient.addColorStop((u / gradColors.length), gradColors[u]);
                }
                color = gradient;
                break;
            case "fixedColor":
                color = this.mainBarColor;
                break;
        }
        return color;
    }


    roundRect(ctx, x, y, width, height, radius, barHeight) {

        if (radius <= barHeight) {
            /*
            radius = { tl: radius-(barHeight-radius), tr: radius-(barHeight-radius), br: radius-(barHeight-radius), bl: radius-(barHeight-radius) };
            */ //china temples
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else {
            radius = { tl: radius-(radius-barHeight), tr: radius-(radius-barHeight), br: radius-(radius-barHeight), bl: radius-(radius-barHeight) };
        }

        if (!this.doubleBorderRadius) {
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

    triangle(ctx, x, y, width, height, radius, barHeight) {

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

    joined(ctx, x, y, width, height, radius, barHeight, prevFreq, freq) {

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

    getAvg(arr) {
        const total = arr.reduce((acc, c) => acc + c, 0);
        return (total / arr.length) * this.innerCircleMult;
    }

    splitUp(arr, n) {
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

    init() {

        this.audio = new Audio();
        this.context = new window.AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audio.src = this.audioSrc;
        this.source = this.context.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 2048;

        //frequencies = new Uint8Array(analyser.frequencyBinCount);
        this.fullFrequencies = new Uint8Array(this.analyser.fftSize)

        //console.log(frequenciesFull, frequencies)
        this.audio.play();
        
        this.renderFlat();
    
    }

    renderFlat() {

        this.canvas.width = 500;
        this.canvas.height = 500;

        let ctx = this.canvas.getContext("2d");

        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        let freqs = this.splitUp(this.fullFrequencies.slice(this.freqRange[0], this.freqRange[1]), this.barNbr)

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
            ctx.fillStyle = this.getBarColor(freqs[i], ctx, barHeight);
            this.roundRect(ctx, 10, -this.barWidth / 2, barHeight, this.barWidth, this.barBorderRadius, barHeight, freqs[i])
            ctx.restore();
        }
        requestAnimationFrame(() => this.renderFlat());
    }


    getBarColor(frequency, ctx, barHeight) {

        let color;

        let gradientRadius = this.gradientRadius;
        let gradColors = this.gradientColors
        let mult = this.colorFrequencyMultiplier;

        switch (this.barColorType) {
            case "frequency":
                if (this.mainColorChannel === "blue") {
                    color = "rgb(" + frequency * mult + ", " + frequency * mult + ", " + this.mainColorChannelValue + ")";
                }
                if (this.mainColorChannel === "green") {
                    color = "rgb(" + frequency * mult + ", " + this.mainColorChannelValue + ", " + frequency * mult + ")";
                }
                if (this.mainColorChannel === "red") {
                    color = "rgb(" + this.mainColorChannelValue + ", " + frequency * mult + ", " + frequency * mult + ")";
                }
                break;
            case "gradient":
                let gradient;
                if (this.gradientDoubleExpand) {
                    gradient = ctx.createLinearGradient(0, 0, barHeight, 0);
                    for (let u = 1; u < gradColors.length; u++) {
                        gradient.addColorStop((u / (gradColors.length*2))+0.025, gradColors[gradColors.length-u]);
                        console.log((u / (gradColors.length*2))+0.025, gradColors[gradColors.length-u])
                    }
                    for (let u = 0; u < gradColors.length; u++) {
                        if(u === 0) {
                            gradient.addColorStop((u / (gradColors.length*2))+0.5, gradColors[0]);
                            console.log((u / (gradColors.length*2))+0.5, gradColors[0])
                        } else {
                            
                                gradient.addColorStop((u / (gradColors.length*2))+0.5, gradColors[u]);
                                console.log((u / (gradColors.length*2))+0.5, gradColors[u])
                            
                            
                        }
                        
                        
                    }
                    
                
                } else {
                    
                    gradient = ctx.createLinearGradient(0, 0, barHeight * this.gradientRadiusMultiplier, 0);
                    for (let u = 0; u < gradColors.length; u++) {
                        gradient.addColorStop((u / gradColors.length), gradColors[u]);
                    }
                    
                }
                throw new Error("Something went badly wrong!");
                color = gradient;
                break;
            case "fixedColor":
                color = this.mainBarColor;
                break;
        }
        return color;
    }


    roundRect(ctx, x, y, width, height, radius, barHeight) {

        if (radius <= barHeight) {
            /*
            radius = { tl: radius-(barHeight-radius), tr: radius-(barHeight-radius), br: radius-(barHeight-radius), bl: radius-(barHeight-radius) };
            */ //china temples
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else {
            radius = { tl: radius-(radius-barHeight), tr: radius-(radius-barHeight), br: radius-(radius-barHeight), bl: radius-(radius-barHeight) };
        }

        if (!this.doubleBorderRadius) {
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

    triangle(ctx, x, y, width, height, radius, barHeight) {

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

    joined(ctx, x, y, width, height, radius, barHeight, prevFreq, freq) {

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
}



