function downsample(samples, sourceRate, targetRate = 8000) {
  if (sourceRate <= targetRate) return samples
  const ratio = sourceRate / targetRate
  const length = Math.floor(samples.length / ratio)
  const output = new Float32Array(length)
  for (let index = 0; index < length; index += 1) {
    output[index] = samples[Math.floor(index * ratio)]
  }
  return output
}

function frameFeatures(frame) {
  let energy = 0
  let zeroCrossings = 0
  for (let index = 0; index < frame.length; index += 1) {
    energy += frame[index] * frame[index]
    if (index > 0 && Math.sign(frame[index]) !== Math.sign(frame[index - 1])) zeroCrossings += 1
  }
  return [Math.sqrt(energy / frame.length), zeroCrossings / frame.length]
}

function bandEnergy(frame, bandIndex, bandCount) {
  let real = 0
  let imaginary = 0
  const frequency = (bandIndex + 1) / (bandCount + 1)
  for (let index = 0; index < frame.length; index += 1) {
    const angle = 2 * Math.PI * frequency * index
    real += frame[index] * Math.cos(angle)
    imaginary -= frame[index] * Math.sin(angle)
  }
  return Math.sqrt((real * real) + (imaginary * imaginary)) / frame.length
}

function normalize(vector) {
  const mean = vector.reduce((total, value) => total + value, 0) / vector.length
  const centered = vector.map((value) => value - mean)
  const norm = Math.sqrt(centered.reduce((total, value) => total + value * value, 0)) || 1
  return centered.map((value) => Number((value / norm).toFixed(6)))
}

export async function captureVoiceprint(durationMs = 3200) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })
  try {
    const context = new AudioContext()
    const source = context.createMediaStreamSource(stream)
    const processor = context.createScriptProcessor(4096, 1, 1)
    const chunks = []
    source.connect(processor)
    processor.connect(context.destination)
    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
    }

    await new Promise((resolve) => window.setTimeout(resolve, durationMs))
    processor.disconnect()
    source.disconnect()
    await context.close()

    const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    chunks.forEach((chunk) => {
      merged.set(chunk, offset)
      offset += chunk.length
    })

    const samples = downsample(merged, context.sampleRate)
    const frameSize = 512
    const hop = 256
    const bands = 10
    const perFrame = []
    for (let start = 0; start + frameSize <= samples.length; start += hop) {
      const frame = samples.slice(start, start + frameSize)
      const [energy, zcr] = frameFeatures(frame)
      if (energy < 0.004) continue
      const values = [energy, zcr]
      for (let band = 0; band < bands; band += 1) {
        values.push(bandEnergy(frame, band, bands))
      }
      perFrame.push(values)
    }

    if (perFrame.length < 6) {
      return { vector: [], quality: 0 }
    }

    const vector = []
    const size = perFrame[0].length
    for (let column = 0; column < size; column += 1) {
      const values = perFrame.map((frame) => frame[column])
      const mean = values.reduce((total, value) => total + value, 0) / values.length
      const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / values.length
      vector.push(mean, Math.sqrt(variance))
    }

    const quality = perFrame.reduce((total, frame) => total + frame[0], 0) / perFrame.length
    return { vector: normalize(vector), quality }
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}
