//window.addEventListener('load', function () {

let maxR

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
/**
 * 1: tap
 */
let noteList = [];
/**
 * 2: bpm
 * 3: met
 * 5: sfl
 */
let controlList = [];
let noteListForPlayback = [];
let sflTsList = []
let idOffsetMap = []
let prevIdMap = {}
let startedHoldList = {}
let startedHoldReverseList = {}
let chartHeader = {}

const enableBga = false
const TICK_PER_GAME_SECTION = 1920;
const TICK_PER_BEAT = TICK_PER_GAME_SECTION / 4;
let RENDER_DISTANCE = 750

parseNotesFromFile('MusicData/S00-003/S00-003_02.mer'); setBgm('0.wav')
//parseNotesFromFile('MusicData/S02-085/S02-085_02.mer')
//parseNotesFromFile('MusicData/S02-225/S02-225_02.mer')
parseNotesFromFile('MusicData/S02-218/S02-218_02.mer'); setBgm('music001282.wav')
//parseNotesFromFile('MusicData/S00-004/S00-004_02.mer'); setBgm('4.wav')
//parseNotesFromFile('MusicData/S01-055/S01-055_02 (2).mer')
function setBgm(path) {
  bgm.src = path
}
function parseNotesFromFile(file) {
  fetch(file).then(r=>r.text()).then(parseNotesFromText)
}
function tickFromSectionAndTick(section, tick) {
  return section * 1920 + tick;
}
function parseNotesFromText(text) {noteList = [];
  noteList = []
  controlList = []
  noteListForPlayback = []
  sflTsList = []
  idOffsetMap = []
  prevIdMap = {}
  startedHoldList = {}
  startedHoldReverseList = {}
  chartHeader = {}

  const lines = text.trim().replace(/ +/g, '\t').split('\n');
  let lastEventTick = 0;
  let nextHoldMap = {}
  const holdFillTickGap = 3
  lines.forEach(line => {
    line = line.trim().split('\t');
    // ignore headers
    if (line[0].substr(0, 1) == '#') {
      const headerName = line.shift().substr(1)
      chartHeader[headerName] = line.join(' ')
      return;
    }
    // actual note
    if (line[2] == '1') {
      const note = {
        section: parseInt(line[0]),
        tick: parseInt(line[1]),
        tickTotal: 0,
        noteType: line[3],
        id: parseInt(line[4]),
        laneOffset: parseInt(line[5]),
        noteWidth: parseInt(line[6]),
        extParam1: parseInt(line[7]),
        extParam2: line[8] != undefined ? parseInt(line[8]) : null
      }
      note.tickTotal = tickFromSectionAndTick(note.section, note.tick);
      noteList.push(note)
      lastEventTick = Math.max(lastEventTick, note.tickTotal)
      if (note.noteType == '9' || note.noteType == '10') {
        prevIdMap[note.extParam2] = note.id
      }
    } else {
      const control = {
        section: parseInt(line[0]),
        tick: parseInt(line[1]),
        tickTotal: 0,
        cmdType: line[2],
        value1: parseFloat(line[3]),
        value2: line[4] != undefined ? parseFloat(line[4]) : null,
      }
      control.tickTotal = tickFromSectionAndTick(control.section, control.tick);
      controlList.push(control)
      noteList.push(control)
      lastEventTick = Math.max(lastEventTick, control.tickTotal)
    }
  })
  lastEventTick++;

  // add section seperator
  for (let i=0; i <= lastEventTick; i+= 1920) {
    noteList.push({
      section: i / 1920,
      tick: 0,
      tickTotal: i,
      noteType: 'sectionSep',
    })
  }

  noteList = noteList.sort((a, b) => a.tickTotal - b.tickTotal)
  let noteNo = 0
  let timeStampOffset = 0;
  const bpmList = controlList.filter(i => i.cmdType === '2')
  const metList = controlList.filter(i => i.cmdType === '3')
  let metOffset = 0
  let TICK_PER_BEAT = TICK_PER_GAME_SECTION / 4
  {
    const currentMet = metList[metOffset]
    const beatPerSectionMul = currentMet.value1
    const beatPerSectionDiv = currentMet.value2 == null ? 4 : currentMet.value2
    TICK_PER_BEAT = TICK_PER_GAME_SECTION / beatPerSectionMul * beatPerSectionDiv / 4
  }
  // convert section/tick to milli second
  for (let i = 0; i < bpmList.length; i++) {
    const currentBpm = bpmList[i]
    let fromTick = currentBpm.tickTotal
    const toTick = i == bpmList.length - 1 ? lastEventTick : bpmList[i + 1].tickTotal
    const bpm = currentBpm.value1
    for (; noteNo < noteList.length; noteNo++) {
      const currentNote = noteList[noteNo]
      if (currentNote.tickTotal > toTick) break;
      if (metOffset < metList.length - 1 && currentNote.tickTotal > metList[metOffset + 1].tickTotal) {
        metOffset++
        timeStampOffset += Math.round((metList[metOffset].tickTotal - fromTick) / TICK_PER_BEAT * 60000 / bpm);
        fromTick = metList[metOffset].tickTotal
        const currentMet = metList[metOffset]
        const beatPerSectionMul = currentMet.value1
        const beatPerSectionDiv = currentMet.value2 == null ? 4 : currentMet.value2
        TICK_PER_BEAT = TICK_PER_GAME_SECTION / beatPerSectionMul * beatPerSectionDiv / 4
      }
      currentNote.timestamp = timeStampOffset + Math.round((currentNote.tickTotal - fromTick) / TICK_PER_BEAT * 60000 / bpm);
      if (currentNote.noteType !== undefined) noteListForPlayback.push(currentNote);
    }
    timeStampOffset += Math.round((toTick - fromTick) / TICK_PER_BEAT * 60000 / bpm);
  }
  
  const sflList = controlList.filter(i => i.cmdType === '5')
  noteNo = 0;
  let distanceOffset = 0;
  sflList.unshift({tickTotal:0, value1:1, timestamp:0})
  // convert milli second to distance(?) for chart speed control
  for (let i = 0; i < sflList.length; i++) {
    const currentSfl = sflList[i]
    const fromTs = currentSfl.timestamp
    const toTs = i == sflList.length - 1 ? Infinity : sflList[i + 1].timestamp
    const sfl = currentSfl.value1
    for (; noteNo < noteListForPlayback.length; noteNo++) {
      const currentNote = noteListForPlayback[noteNo]
      if (currentNote.timestamp > toTs) break;
      currentNote.distance = distanceOffset + Math.round((currentNote.timestamp - fromTs) * sfl);
    }
    sflTsList.push({
      timestamp: fromTs,
      distance: distanceOffset,
      sfl
    })
    distanceOffset += Math.round((toTs - fromTs) * sfl);
  }

  // sort by distance
  noteListForPlayback = noteListForPlayback.sort((a, b) => a.distance - b.distance)
  for (let i=0; i<noteListForPlayback.length; i++) {
    idOffsetMap[noteListForPlayback[i].id] = i
  }

  // fix hold chain
  noteListForPlayback.forEach(i => {
    if (i.noteType === '9') {
      const holdChain = [i]
      const changePoint = [0]
      let prevOffset = i.laneOffset
      let laneOffsetAdjust = 0
      while (i.noteType !== '11') {
        i = noteListForPlayback[idOffsetMap[i.extParam2]]
        if (i.extParam1 === 1) changePoint.push(holdChain.length)
        holdChain.push(i)
        if (prevOffset == 59 && i.laneOffset == 0) laneOffsetAdjust += 60
        else if (prevOffset == 0 && i.laneOffset == 59) laneOffsetAdjust -= 60
        prevOffset = i.laneOffset
        i.laneOffset += laneOffsetAdjust
      }
      //console.log(holdChain, changePoint)
      for (let j = 0; j < changePoint.length - 1; j++) {
        const startIndex = changePoint[j], endIndex = changePoint[j + 1], segments = endIndex - startIndex
        const startOffset = holdChain[startIndex].laneOffset, startWidth = holdChain[startIndex].noteWidth
        const endOffset = holdChain[endIndex].laneOffset, endWidth = holdChain[endIndex].noteWidth
        for (let k = startIndex + 1; k < endIndex; k++) {
          holdChain[k].laneOffset = (endOffset - startOffset) * (k - startIndex) / segments + startOffset
          holdChain[k].noteWidth = (endWidth - startWidth) * (k - startIndex) / segments + startWidth
        }
      }
    }
  })

  console.log('parsed notes')
}

let startTs = 0
let startNextFrame = false
let currentTs = 0
let currentDistance = 0;
let playing = false;
let sfl = 1
let sflOffset = 0
let drawForNextFrame = false
function render(now) {
  requestAnimationFrame(render)

  if (!playing) {
    if (!drawForNextFrame) {
      return
    }
    drawForNextFrame = false
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const centerX = canvas.width / 2, centerY = canvas.height / 2

  // outer ring
  ctx.lineWidth = 3
  ctx.strokeStyle = '#000000'
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'white'
  if (enableBga) ctx.drawImage(bga, centerX-maxR, centerY-maxR, maxR*2, maxR*2)
  else ctx.fill()
  ctx.fillStyle = enableBga ? 'rgba(50,50,50,0.7)' : 'rgba(50,50,50,0.5)'
  ctx.fill()

  // lanes
  const laneGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxR)
  laneGradient.addColorStop(0, 'rgba(0,0,0,0)');
  laneGradient.addColorStop(0.1, 'rgba(0,0,0,0)');
  laneGradient.addColorStop(0.2, 'rgba(0,0,0,0.3)');
  laneGradient.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.lineWidth = 1
  ctx.strokeStyle = laneGradient
  ctx.beginPath();
  for (let i=0; i<30; i++) {
    const degree = Math.PI * i / 30;
    const x1 = centerX + Math.sin(degree) * maxR, y1 = centerY + Math.cos(degree) * maxR
    const x2 = centerX - Math.sin(degree) * maxR, y2 = centerY - Math.cos(degree) * maxR
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()

  if (playing) {
    if (startNextFrame) {
      startNextFrame = false
      startTs = now - currentTs
      if (chartHeader.OFFSET) {
        const offset = parseFloat(chartHeader.OFFSET)
        if (!isNaN(offset)) {
          startTs -= offset * 1000
        }
      }
    }
    if (!(currentTs > sflTsList[sflOffset].timestamp && (sflOffset === sflTsList.length - 1 || currentTs <= sflTsList[sflOffset + 1].timestamp))) {
      for (sflOffset = 0; sflOffset < sflTsList.length - 2; sflOffset++) {
        if (currentTs > sflTsList[sflOffset].timestamp && currentTs <= sflTsList[sflOffset + 1].timestamp) {
          break;
        }
      }
      sfl = sflTsList[sflOffset].sfl
    }
    currentTs = now - startTs
    currentDistance = (currentTs - sflTsList[sflOffset].timestamp) * sfl + sflTsList[sflOffset].distance
  }
  previousTs = now
  const notesToRenderArr = getNotesForDraw(currentDistance)
  notesToRender = {
    sectionSep: [],
    touch: [],
    hold: [],
    holdBody: [],
    chain: [],
    flickL: [],
    flickR: [],
    snapIn: [],
    snapOut: [],
    laneEffect: [],
    unknown: []
  }
  notesToRenderArr.forEach(i => {
    switch (i.noteType) {
      case 'sectionSep': {notesToRender.sectionSep.push(i); break;}
      case '1': // touch
      case '2': {notesToRender.touch.push(i); break;} // bonus touch
      case '3': {notesToRender.snapIn.push(i); break;}
      case '4': {notesToRender.snapOut.push(i); break;}
      case '5': // flick L
      case '6': {notesToRender.flickL.push(i); break;} // flick L with effect
      case '7': // flick R
      case '8': {notesToRender.flickR.push(i); break;} // flick R with effect
      case '9': // hold start
      case '11': {notesToRender.hold.push(i);} // hold end
      case '10': {notesToRender.holdBody.push(i); break;} // hold body
      case '12':
      case '13': {notesToRender.laneEffect.push(i); break;}
      case '16': {notesToRender.chain.push(i); break;}
    }
  })

  if (notesToRender.sectionSep.length) {
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#555'
    notesToRender.sectionSep.forEach(i => {
      const r = maxR * Math.pow(1 - (i.distance - currentDistance) / RENDER_DISTANCE * 0.85, 1.7)
      ctx.beginPath()
      ctx.arc(
        centerX, centerY,
        r,
        0, Math.PI * 2
      )
      ctx.stroke()
    })
  }
  const startedHoldListKeys = Object.keys(startedHoldList)
  if (notesToRender.holdBody.length || startedHoldListKeys.length) {
    const drawnHold = {}
    const drawHoldForId = id => {
      if (drawnHold[id]) return
      drawnHold[id] = true
      const i = noteListForPlayback[idOffsetMap[id]]
      const nextPart = noteListForPlayback[idOffsetMap[i.extParam2]]
      if (nextPart == undefined) return
      const startDistance = i.distance, endDistance = nextPart.distance
      if (endDistance < currentDistance) return
      if (startDistance > currentDistance + RENDER_DISTANCE) return
      let startOffset = i.laneOffset, endOffset = nextPart.laneOffset
      //if (startOffset == 59 && endOffset == 0) endOffset = 60
      //else if (startOffset == 0 && endOffset == 59) startOffset = 60

      let startWidth = i.noteWidth, endWidth = nextPart.noteWidth
      let actualStartOffset = startOffset, actualStartWidth = startWidth, actualStartDistance = i.distance, actualEndOffset = endOffset, actualEndWidth = endWidth, actualEndDistance = nextPart.distance
      if (actualStartDistance < currentDistance) {
        actualStartOffset = (endOffset - startOffset) * (currentDistance - startDistance) / (endDistance - startDistance) + startOffset
        actualStartWidth = (endWidth - startWidth) * (currentDistance - startDistance) / (endDistance - startDistance) + startWidth
        actualStartDistance = currentDistance
      }
      if (actualEndDistance > currentDistance + RENDER_DISTANCE) {
        actualEndOffset = (endOffset - startOffset) * (currentDistance + RENDER_DISTANCE - startDistance) / (endDistance - startDistance) + endOffset
        actualEndWidth = (endWidth - startWidth) * (currentDistance + RENDER_DISTANCE - startDistance) / (endDistance - startDistance) + endWidth
        actualEndDistance = currentDistance + RENDER_DISTANCE
      }
      const r = maxR * Math.pow(1 - Math.max(actualStartDistance - currentDistance, 0) / RENDER_DISTANCE * 0.85, 1.7)
      const start = 60 - actualStartOffset - actualStartWidth, end = 60 - actualStartOffset
      ctx.beginPath()
      ctx.arc(
        centerX, centerY,
        r,
        Math.PI * (start / 30), Math.PI * (end / 30)
      )
      const r2 = maxR * Math.pow(1 - Math.min(actualEndDistance - currentDistance, RENDER_DISTANCE) / RENDER_DISTANCE * 0.85, 1.7)
      const start2 = 60 - actualEndOffset - actualEndWidth, end2 = 60 - actualEndOffset
      ctx.arc(
        centerX, centerY,
        r2,
        Math.PI * (end2 / 30), Math.PI * (start2 / 30),
        true
      )
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(207,162,93, 0.7)'
    notesToRender.holdBody.forEach(i => {
      if (i.noteType == '9') {
        let endId = i.id
        let hold = noteListForPlayback[idOffsetMap[endId]]
        while (hold.noteType !== '11') {
          drawHoldForId(hold.id)
          endId = hold.extParam2
          hold = noteListForPlayback[idOffsetMap[endId]]
        }
        startedHoldList[i.id] = endId
        startedHoldReverseList[endId] = i.id
      } else {
        drawHoldForId(prevIdMap[i.id])
        drawHoldForId(i.id)
      }
    })
    startedHoldListKeys.forEach(id => {
      let hold = noteListForPlayback[idOffsetMap[id]]
      while (hold.noteType !== '11') {
        if (hold.distance > currentDistance + RENDER_DISTANCE) return
        drawHoldForId(hold.id)
        id = hold.extParam2
        hold = noteListForPlayback[idOffsetMap[id]]
      }
      if (hold.distance < currentDistance) {
        const startId = startedHoldReverseList[id]
        delete startedHoldList[startId]
        delete startedHoldReverseList[id]
      }
    })
  }
  const colorMap = [
    ['hold', 'rgb(88,75,47)'],
    ['touch', 'rgb(216,45,184)'],
    ['chain', 'rgb(157,122,40)'],
    ['flickL', 'rgb(246,159,55)'],
    ['flickR', 'rgb(98,251,43)'],
    ['snapIn', 'rgb(203,29,25)'],
    ['snapOut', 'rgb(33,180,251)'],
  ]
  colorMap.forEach(noteType => {
    const key = noteType[0], color = noteType[1]
    const thicc = ['flickL','flickR','snapIn','snapOut'].indexOf(key) === -1 ? 1.5 : 2
    if (notesToRender[key].length) {
      ctx.strokeStyle = color
      notesToRender[key].forEach(i => {
        const r = maxR * Math.pow(1 - (i.distance - currentDistance) / RENDER_DISTANCE * 0.85, 1.7)
        ctx.lineWidth = (r * 5 / maxR + 2) * thicc
        const start = 60 - i.laneOffset - i.noteWidth, end = 60 - i.laneOffset
        ctx.beginPath()
        ctx.arc(
          centerX, centerY,
          r,
          Math.PI * (start / 30) + 0.03, Math.PI * (end / 30) - 0.03
        )
        ctx.stroke()
      })
    }
  })
}
window.play = function () {
  startNextFrame = true
  bgm.play()
  if (enableBga) bga.play()
  currentTs = Math.round(bgm.currentTime * 1000)
  playing = true
}
window.pause = function () {
  bgm.pause()
  if (enableBga) bga.pause()
  playing = false
}
window.stop = function () {
  pause()
  currentDistance = 0
  currentTs = 0
  bgm.currentTime = 0
  if (enableBga) bga.currentTime = 0
  startedHoldList = {}
  startedHoldReverseList = {}
  drawForNextFrame = true
}
window.setPlaybackTime = function (time = 0) {
  currentTs = Math.round(time * 1000)
  bgm.currentTime = time
}
requestAnimationFrame(render)
function getNotesForDraw(currentDistance, renderDistance = RENDER_DISTANCE) {
  if (!noteListForPlayback.length) return []
  if (currentDistance > noteListForPlayback[noteListForPlayback.length - 1].distance) return []
  //return []
  // search sub array start
  let startOffset, endOffset
  {
    let head = 0, tail = noteListForPlayback.length - 1
    let mid
    while (head <= tail) {
      mid = Math.floor((head + tail) / 2)
      const result = currentDistance - noteListForPlayback[mid].distance
      if (result === 0) break;
      if (result < 0) tail = mid - 1;
      if (result > 0) head = mid + 1;
    }
    startOffset = mid
    while (startOffset > 0 && noteListForPlayback[startOffset].distance >= currentDistance) startOffset--;
  }
  // search sub array end
  {
    let head = 0, tail = noteListForPlayback.length - 1
    let mid
    while (head <= tail) {
      mid = Math.floor((head + tail) / 2)
      const result = (currentDistance + renderDistance) - noteListForPlayback[mid].distance
      if (result === 0) break;
      if (result < 0) tail = mid - 1;
      if (result > 0) head = mid + 1;
    }
    endOffset = mid
    while (endOffset < noteListForPlayback.length - 1 && noteListForPlayback[endOffset].distance <= currentDistance + renderDistance) endOffset++;
  }
  return noteListForPlayback
  .slice(Math.max(0, startOffset), Math.min(noteListForPlayback.length - 1, endOffset))
  .filter(i => i.distance >= currentDistance && i.distance <= currentDistance + renderDistance)
}
window.getNotesForDraw = getNotesForDraw;

bgm.addEventListener('seeked', function (e) {
  currentTs = Math.round(this.currentTime * 1000)
  if (enableBga) bga.currentTime = this.currentTime
  startNextFrame = true
  startedHoldList = {}
  startedHoldReverseList = {}
})
bgm.addEventListener('pause', pause)
bgm.addEventListener('play', play)
speed_input.addEventListener('change', e => {
  const speed = speed_input.value / 10
  speed_val.textContent = speed
  RENDER_DISTANCE = 3000 / speed
})
function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  maxR = Math.round(Math.min(canvas.width, canvas.height) * 0.45)
  drawForNextFrame = true
}
window.addEventListener('resize', resize)
resize();

//})