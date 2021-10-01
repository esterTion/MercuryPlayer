//window.addEventListener('load', function () {

let maxR

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
/**
 * 1: touch
 * 2: bonus touch
 * 3: snap inward
 * 4: snap outward
 * 5: flick left
 * 6: flick left with circle effect
 * 7: flick right
 * 8: flick right with circle effect
 * 9: hold start
 * 10: hold step
 * 11: hold end
 * 12: lane effect
 * 13: lane effect
 * 14: end of chart
 * 16: chain
 * 20: touch R
 * 21: snap inward R
 * 22: snap outward R
 * 23: flick left R
 * 24: flick right R
 * 25: hold start R
 * 26: chain R
 */
let noteList = [];
/**
 * 2: bpm
 * 3: met
 * 5: sfl
 * 6: reverse start
 * 7: reverse point
 * 8: reverse end
 * 9: sfl 0
 * 10: sfl 1
 */
let controlList = [];
let noteListForPlayback = [];
let sflTsList = []
let laneToggleList = []
let idOffsetMap = []
let prevIdMap = {}
let startedHoldList = {}
let startedHoldReverseList = {}
let chartHeader = {}
let reverseSection = []

const arrowCanvas = {
  in: document.createElement('canvas'),
  out: document.createElement('canvas'),
  left: document.createElement('canvas'),
  right: document.createElement('canvas'),
}
function createArrows() {
  arrowCanvas.in.width = maxR*2, arrowCanvas.in.height = maxR*2
  arrowCanvas.out.width = maxR*2, arrowCanvas.out.height = maxR*2
  arrowCanvas.left.width = maxR*2, arrowCanvas.left.height = maxR*2
  arrowCanvas.right.width = maxR*2, arrowCanvas.right.height = maxR*2
  const ctx = {
    in: arrowCanvas.in.getContext('2d'),
    out: arrowCanvas.out.getContext('2d'),
    left: arrowCanvas.left.getContext('2d'),
    right: arrowCanvas.right.getContext('2d'),
  }

  const borderWidth = 12 * devicePixelRatio, colorWidth = 5 * devicePixelRatio

  ctx.in.translate(maxR, maxR); ctx.in.rotate(Math.PI / 2); ctx.in.translate(-maxR, -maxR)
  for (let i = 0; i < 30; i++) {
    ctx.in.beginPath()
    ctx.in.arc(maxR, maxR, maxR * 0.95, (i+0.25) * Math.PI / 15, (i+0.25) * Math.PI / 15)
    ctx.in.arc(maxR, maxR, maxR * 0.85, (i+0.5) * Math.PI / 15, (i+0.5) * Math.PI / 15)
    ctx.in.arc(maxR, maxR, maxR * 0.95, (i+0.75) * Math.PI / 15, (i+0.75) * Math.PI / 15)
    ctx.in.strokeStyle = 'rgb(200,200,200)'; ctx.in.lineWidth = borderWidth; ctx.in.stroke()
    ctx.in.strokeStyle = 'rgb(203,29,25)'; ctx.in.lineWidth = colorWidth; ctx.in.stroke()
  }

  ctx.out.translate(maxR, maxR); ctx.out.rotate(Math.PI / 2); ctx.out.translate(-maxR, -maxR)
  for (let i = 0; i < 30; i++) {
    ctx.out.beginPath()
    ctx.out.arc(maxR, maxR, maxR * 0.85, (i+0.25) * Math.PI / 15, (i+0.25) * Math.PI / 15)
    ctx.out.arc(maxR, maxR, maxR * 0.95, (i+0.5) * Math.PI / 15, (i+0.5) * Math.PI / 15)
    ctx.out.arc(maxR, maxR, maxR * 0.85, (i+0.75) * Math.PI / 15, (i+0.75) * Math.PI / 15)
    ctx.out.strokeStyle = 'rgb(200,200,200)'; ctx.out.lineWidth = borderWidth; ctx.out.stroke()
    ctx.out.strokeStyle = 'rgb(33,180,251)'; ctx.out.lineWidth = colorWidth; ctx.out.stroke()
  }

  ctx.left.translate(maxR, maxR); ctx.left.rotate(Math.PI / 2); ctx.left.translate(-maxR, -maxR)
  for (let i = 0; i < 30; i++) {
    ctx.left.beginPath()
    ctx.left.arc(maxR, maxR, maxR * 0.85, (i+0.3) * Math.PI / 15, (i+0.3) * Math.PI / 15)
    ctx.left.arc(maxR, maxR, maxR * 0.90, (i+0.7) * Math.PI / 15, (i+0.7) * Math.PI / 15)
    ctx.left.arc(maxR, maxR, maxR * 0.95, (i+0.3) * Math.PI / 15, (i+0.3) * Math.PI / 15)
    ctx.left.strokeStyle = 'rgb(200,200,200)'; ctx.left.lineWidth = borderWidth; ctx.left.stroke()
    ctx.left.strokeStyle = 'rgb(246,159,55)'; ctx.left.lineWidth = colorWidth; ctx.left.stroke()
  }

  ctx.right.translate(maxR, maxR); ctx.right.rotate(Math.PI / 2); ctx.right.translate(-maxR, -maxR)
  for (let i = 0; i < 30; i++) {
    ctx.right.beginPath()
    ctx.right.arc(maxR, maxR, maxR * 0.85, (i+0.7) * Math.PI / 15, (i+0.7) * Math.PI / 15)
    ctx.right.arc(maxR, maxR, maxR * 0.90, (i+0.3) * Math.PI / 15, (i+0.3) * Math.PI / 15)
    ctx.right.arc(maxR, maxR, maxR * 0.95, (i+0.7) * Math.PI / 15, (i+0.7) * Math.PI / 15)
    ctx.right.strokeStyle = 'rgb(200,200,200)'; ctx.right.lineWidth = borderWidth; ctx.right.stroke()
    ctx.right.strokeStyle = 'rgb(98,251,43)'; ctx.right.lineWidth = colorWidth; ctx.right.stroke()
  }
}

const enableBga = false

const TICK_PER_GAME_SECTION = 1920;
const TICK_PER_BEAT = TICK_PER_GAME_SECTION / 3.8;
let RENDER_DISTANCE = 750

//parseNotesFromFile('MusicData/S00-003/S00-003_02.mer'); setBgm('0.wav')
//parseNotesFromFile('MusicData/S02-085/S02-085_02.mer')
//parseNotesFromFile('MusicData/S02-225/S02-225_02.mer')
//parseNotesFromFile('MusicData/S02-218/S02-218_02.mer'); setBgm('music001282.wav')
//parseNotesFromFile('MusicData/S00-004/S00-004_02.mer'); setBgm('4.wav')
//parseNotesFromFile('MusicData/S01-055/S01-055_02 (2).mer')
//const playbackId = 'S01-093'
//parseNotesFromFile(`MusicData/${playbackId}/${playbackId}_02.mer`); setBgm('Sound/Bgm/output/MER_BGM_'+playbackId.replace('-', '_')+'.m4a')
let musicTable
function cutText(s) {
  const charRenderSize = s.split('').map(c=> c.match(/[a-zA-Z0-9 ]/)?1:2)
  const renderLengthTotal = charRenderSize.reduce((s,v) => s+v, 0)
  if (renderLengthTotal < 30) return s
  let renderLength = 0
  for (let i=0; i<charRenderSize.length; i++) {
    renderLength += charRenderSize[i]
    if (renderLength > 25) return s.substr(0, i) + '...'
  }
}
fetch('Table/music_info.json').then(r=>r.json()).then(r => {
  musicTable = {}
  music_select.parentNode.style.display = ''
  music_file.parentNode.style.display = 'none'
  const keys = Object.keys(r)
  keys.sort((a,b) => a>b?1:-1)
  keys.forEach(open => {
    const option = music_select.appendChild(document.createElement('option'))
    option.setAttribute('disabled', '')
    option.textContent = open
    r[open].sort((a,b) => a.id-b.id)
    r[open].forEach(music => {
      musicTable[music.id] = music;
      const option = music_select.appendChild(document.createElement('option'))
      option.value = music.id
      diffi = [music.DifficultyNormalLv, music.DifficultyHardLv, music.DifficultyExtremeLv]
      if (music.DifficultyInfernoLv != '0') diffi.push(music.DifficultyInfernoLv)
      let title = cutText(music.title), artist = cutText(music.artist)
      option.textContent = `${music.AssetDirectory} (${diffi.join('/')}) ${title} - ${artist}`
    })
  })
  music_select.value = music_select.children[1].value
}).catch(e => {
  console.error('failed loading music table', e)
})
function loadUsingSelect() {
  const id = music_select.value | 0
  const diffi = diffi_select.value | 0
  if (!musicTable[id]) return alert('no such music id')
  if (diffi < 0 || diffi > 3 || (diffi == 3 && musicTable[id].DifficultyInfernoLv == '0')) return alert('no such difficulty level')
  stop()
  const strId = musicTable[id].AssetDirectory
  parseNotesFromFile(`MusicData/${strId}/${strId}_0${diffi}.mer`)
  setBgm('Sound/Bgm/output/MER_BGM_'+strId.replace('-', '_')+'.m4a')
}
function loadUsingFile() {
  if (music_file.files.length && bgm_file.files.length) {
    const reader = new FileReader()
    reader.readAsText(music_file.files[0], 'UTF-8')
    reader.onload = e => parseNotesFromText(reader.result)
    bgm.src = URL.createObjectURL(bgm_file.files[0])
  } else {
    alert('choose file')
  }
}
music_select.addEventListener('change', e => {
  if (!musicTable[music_select.value]) return
  const music = musicTable[music_select.value]
  diffi_select.children[0].textContent = `Normal (${music.DifficultyNormalLv}) - ${music.NotesDesignerNormal}`
  diffi_select.children[1].textContent = `Hard (${music.DifficultyHardLv}) - ${music.NotesDesignerHard}`
  diffi_select.children[2].textContent = `Expert (${music.DifficultyExtremeLv}) - ${music.NotesDesignerExpert}`
  if (music.DifficultyInfernoLv == "0") {
    diffi_select.children[3].setAttribute('disabled', '')
    diffi_select.children[3].textContent = 'Inferno'
    if (diffi_select.value === '3') diffi_select.value = '2'
  } else {
    diffi_select.children[3].removeAttribute('disabled')
    diffi_select.children[3].textContent = `Inferno (${music.DifficultyInfernoLv}) - ${music.NotesDesignerInferno}`
  }
})

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
  reverseSection = []
  const controlDupFix = {}

  const lines = text.trim().replace(/ +/g, '\t').split('\n');
  let lastEventTick = 0;
  let nextHoldMap = {}
  const holdFillTickGap = 3
  const tickNoteCount = {}
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
      if (['10','11','12','13','16','26'].indexOf(note.noteType) === -1) {
        if (!tickNoteCount[note.tickTotal]) tickNoteCount[note.tickTotal] = 0
        tickNoteCount[note.tickTotal]++
      }
      note.hasSameTime = false
      noteList.push(note)
      lastEventTick = Math.max(lastEventTick, note.tickTotal)
      if (note.noteType == '9' || note.noteType == '10' || note.noteType == '25') {
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
      const controlId = line[0]+'_'+line[1]+'_'+line[2]
      control.tickTotal = tickFromSectionAndTick(control.section, control.tick);
      if (controlDupFix[controlId]) {
        controlList[controlDupFix[controlId]] = control
      } else {
        controlDupFix[controlId] = controlList.length
        controlList.push(control)
      }
      if (control.cmdType == '9') {
        control.cmdType = '5'
        control.value1 = 0
      }
      if (control.cmdType == '10') {
        control.cmdType = '5'
        control.value1 = 1
      }
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
      if (currentNote.noteType === '14') chartLength = currentNote.timestamp
      if (tickNoteCount[currentNote.tickTotal] > 1 && ['sectionSep', '10', '11', '12', '13', '16', '26'].indexOf(currentNote.noteType) === -1) currentNote.hasSameTime = true
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
    if (i.noteType === '9' || i.noteType === '25') {
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

  // reverse section
  const reverseStartList = controlList.filter(i => i.cmdType === '6')
  const reversePointList = controlList.filter(i => i.cmdType === '7')
  const reverseEndList = controlList.filter(i => i.cmdType === '8')
  for (let i=0; i<reverseStartList.length; i++) {
    reverseSection.push([
      reverseStartList[i].timestamp,
      reversePointList[i].timestamp,
      reverseEndList[i].timestamp,
    ])
  }

  laneToggleList = noteList.filter(i => (i.noteType === '12' || i.noteType === '13'))

  console.log('parsed notes')

  window.noteTypes = {}
  noteListForPlayback.forEach(i => {
    if (!window.noteTypes[i.noteType]) window.noteTypes[i.noteType] = []
    window.noteTypes[i.noteType].push(i)
  })
}

const drawCount = {
  frame: 0,
  actualFrame: 0,
}
let currentSectionDiv = stats.parentNode.insertBefore(document.createElement('div'), stats)
setInterval(() => {
  stats.textContent = [
    `frame draw: ${drawCount.frame}`,
    `frame actual draw: ${drawCount.actualFrame}`,
  ].join('\n')
  drawCount.frame = 0
  drawCount.actualFrame = 0
}, 1e3)

let startTs = 0
let startNextFrame = false
let currentTs = 0
let currentDistance = 0;
let currentSection = 0;
let playing = false;
let sfl = 1
let sflOffset = 0
let drawForNextFrame = false
let NOTE_APPEAR_DISTANCE = 1
let NOTE_SPEED_POWER = 1.95
let chartLength = 0
const laneEffectMul = 1
const laneOnState = new Uint8Array(60 * laneEffectMul)
function render(now) {
  requestAnimationFrame(render)
  drawCount.frame++

  if (!playing) {
    if (!drawForNextFrame) {
      return
    }
    drawForNextFrame = false
  }

  drawCount.actualFrame++
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const centerX = canvas.width / 2, centerY = canvas.height / 2

  // outer ring
  ctx.lineWidth = 3
  ctx.strokeStyle = '#000000'
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxR, 0, Math.PI * 2)
  ctx.stroke()
  if (enableBga) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fill()
  } else {
    ctx.fillStyle = 'rgba(32,32,32,0.8)'
    ctx.fill()
  }

  // lanes
  const laneGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxR)
  laneGradient.addColorStop(0, 'rgba(128,128,128,0)');
  laneGradient.addColorStop(0.1, 'rgba(128,128,128,0)');
  laneGradient.addColorStop(0.2, 'rgba(128,128,128,0.3)');
  laneGradient.addColorStop(1, 'rgba(128,128,128,0.8)');
  ctx.lineWidth = 1 * devicePixelRatio
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

  let drawDistance = RENDER_DISTANCE
  let previousTs = currentTs
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
      updateLaneOnState(-1, currentTs)
    }
    if (!(currentTs > sflTsList[sflOffset].timestamp && (sflOffset === sflTsList.length - 1 || currentTs <= sflTsList[sflOffset + 1].timestamp))) {
      for (sflOffset = 0; sflOffset < sflTsList.length - 1; sflOffset++) {
        if (currentTs > sflTsList[sflOffset].timestamp && currentTs <= sflTsList[sflOffset + 1].timestamp) {
          break;
        }
      }
      sfl = sflTsList[sflOffset].sfl
    }
    currentTs = now - startTs
    let calcBaseTs = currentTs
    for (let i=0; i<reverseSection.length; i++) {
      if (calcBaseTs > reverseSection[i][0] && calcBaseTs < reverseSection[i][1]) {
        calcBaseTs = reverseSection[i][1] + (reverseSection[i][1] - calcBaseTs) * (reverseSection[i][2] - reverseSection[i][1]) / (reverseSection[i][1] - reverseSection[i][0])
        drawDistance = Math.min(drawDistance, reverseSection[i][2] - calcBaseTs)
        break
      }
    }
    currentDistance = (calcBaseTs - sflTsList[sflOffset].timestamp) * sfl + sflTsList[sflOffset].distance
  }

  if (noteListForPlayback.length) {
    currentSection = noteListForPlayback.filter(i => i.noteType === 'sectionSep' && i.timestamp <= currentTs).pop().section
  }
  currentSectionDiv.textContent = `current section: ${currentSection}`

  updateLaneOnState(previousTs, currentTs)
  // black out "off" lanes
  const laneBgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxR)
  laneBgGradient.addColorStop(0, 'rgba(255,255,255,0)');
  laneBgGradient.addColorStop(0.2, 'rgba(255,255,255,0.1)');
  laneBgGradient.addColorStop(1, enableBga ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)');
  ctx.fillStyle = laneBgGradient
  ctx.beginPath()
  for (let i = 0; i < 60 * laneEffectMul; i++) {
    if (laneOnState[i] == 0) continue
    const start = 60 * laneEffectMul - i - 1, end = 60 * laneEffectMul - i
    ctx.moveTo(centerX, centerY)
    ctx.arc(
      centerX, centerY,
      maxR,
      Math.PI * (start / 30 / laneEffectMul), Math.PI * (end / 30 / laneEffectMul)
    )
    ctx.lineTo(centerX, centerY)
  }
  ctx.fill()
  const notesToRenderArr = getNotesForDraw(currentDistance, drawDistance).filter(i => i.timestamp >= currentTs)
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
    arrow: [],
    R: [],
    laneEffect: [],
    sameTime: [],
    unknown: []
  }
  notesToRenderArr.forEach(i => {
    switch (i.noteType) {
      case 'sectionSep': {notesToRender.sectionSep.push(i); break;}
      case '1': // touch
      case '2': // bonus touch
      case '20': {notesToRender.touch.push(i); break;} // touch R
      case '3': case '21': {notesToRender.arrow.push(i); notesToRender.snapIn.push(i); break;}
      case '4': case '22': {notesToRender.arrow.push(i); notesToRender.snapOut.push(i); break;}
      case '5': // flick L
      case '6': // flick L with effect
      case '23': {notesToRender.arrow.push(i); notesToRender.flickL.push(i); break;} // flick Left R
      case '7': // flick R
      case '8': // flick R with effect
      case '24': {notesToRender.arrow.push(i); notesToRender.flickR.push(i); break;} // flick Right R
      case '9': // hold start
      case '25': // hold start R
      case '11-': {notesToRender.hold.push(i);} // hold end
      case '10': {notesToRender.holdBody.push(i); break;} // hold body
      case '12':
      case '13': {notesToRender.laneEffect.push(i); break;}
      case '16': case '26': {notesToRender.chain.push(i); break;}
    }
    if (i.noteType >= '20' && i.noteType <= '26') {
      notesToRender.R.push(i);
    }
    if (i.hasSameTime) {
      notesToRender.sameTime.push(i)
    }
  })

  if (notesToRender.sectionSep.length) {
    const thicc = 0.5 * devicePixelRatio
    ctx.strokeStyle = '#BBB'
    notesToRender.sectionSep.forEach(i => {
      const r = distanceToRenderRadius(maxR, (i.distance - currentDistance) / RENDER_DISTANCE)
      ctx.lineWidth = (r * 6 / maxR + 0.5) * thicc
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
      const r = distanceToRenderRadius(maxR, Math.max(actualStartDistance - currentDistance, 0) / RENDER_DISTANCE)
      const start = 60 - actualStartOffset - actualStartWidth, end = 60 - actualStartOffset
      ctx.beginPath()
      ctx.arc(
        centerX, centerY,
        r,
        Math.PI * (start / 30), Math.PI * (end / 30)
      )
      const r2 = distanceToRenderRadius(maxR, Math.min(actualEndDistance - currentDistance, RENDER_DISTANCE) / RENDER_DISTANCE)
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
      if (i.noteType == '9' || i.noteType == '25') {
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

  // blue extend for same time notes
  {
    const key = 'sameTime', color = 'rgb(80,255,250)'
    const thicc = 4 * devicePixelRatio
    if (notesToRender[key].length) {
      ctx.strokeStyle = color
      notesToRender[key].forEach(i => {
        const r = distanceToRenderRadius(maxR, (i.distance - currentDistance) / RENDER_DISTANCE)
        ctx.lineWidth = (r * 6 / maxR + 0.5) * thicc
        const start = 60 - i.laneOffset - i.noteWidth, end = 60 - i.laneOffset
        ctx.beginPath()
        ctx.arc(
          centerX, centerY,
          r,
          Math.PI * (start / 30), Math.PI * (end / 30)
        )
        ctx.stroke()
      })
    }
  }

  // white border for R notes
  {
    const key = 'R', color = 'rgb(255,255,255)'
    const thicc = 5 * devicePixelRatio
    if (notesToRender[key].length) {
      ctx.strokeStyle = color
      notesToRender[key].forEach(i => {
        const r = distanceToRenderRadius(maxR, (i.distance - currentDistance) / RENDER_DISTANCE)
        ctx.lineWidth = (r * 6 / maxR + 0.5) * thicc
        const start = 60 - i.laneOffset - i.noteWidth, end = 60 - i.laneOffset
        const cutOut = i.noteWidth < 60 ? 0.01 : 0
        ctx.beginPath()
        ctx.arc(
          centerX, centerY,
          r,
          Math.PI * (start / 30) + cutOut, Math.PI * (end / 30) - cutOut
        )
        ctx.stroke()
      })
    }
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
    const thicc = (['flickL','flickR','snapIn','snapOut'].indexOf(key) === -1 ? 2.25 : 3) * devicePixelRatio
    if (notesToRender[key].length) {
      ctx.strokeStyle = color
      notesToRender[key].forEach(i => {
        const r = distanceToRenderRadius(maxR, (i.distance - currentDistance) / RENDER_DISTANCE)
        ctx.lineWidth = (r * 6 / maxR + 0.5) * thicc
        const start = 60 - i.laneOffset - i.noteWidth, end = 60 - i.laneOffset
        const cutOut = i.noteWidth < 60 ? 0.03 : 0
        ctx.beginPath()
        ctx.arc(
          centerX, centerY,
          r,
          Math.PI * (start / 30) + cutOut, Math.PI * (end / 30) - cutOut
        )
        ctx.stroke()
      })
    }
  })

  if (notesToRender.arrow.length) {
    for (let i=notesToRender.arrow.length-1; i>=0; i--) {
      const a = notesToRender.arrow[i]
      const r = distanceToRenderRadius(maxR*0.95, (a.distance - currentDistance) / RENDER_DISTANCE)
      const start = 60 - a.laneOffset - a.noteWidth, end = 60 - a.laneOffset
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(
        centerX, centerY,
        r,
        Math.PI * (start / 30), Math.PI * (end / 30)
      )
      ctx.moveTo(centerX, centerY)
      ctx.clip()
      switch (a.noteType) {
        case '3': case '21': {
          ctx.drawImage(arrowCanvas.in, centerX-r, centerY-r, r*2, r*2)
          break
        }
        case '4': case '22': {
          ctx.drawImage(arrowCanvas.out, centerX-r, centerY-r, r*2, r*2)
          break
        }
        case '5': case '6': case '23': {
          ctx.drawImage(arrowCanvas.left, centerX-r, centerY-r, r*2, r*2)
          break
        }
        case '7': case '8': case '24': {
          ctx.drawImage(arrowCanvas.right, centerX-r, centerY-r, r*2, r*2)
          break
        }
      }
      ctx.restore()
    }
  }

  {
    let chartRemaining = 1
    if (chartLength) {
      chartRemaining = Math.max(0, 1 - currentTs / chartLength)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    const r = maxR * 0.98
    ctx.lineWidth = (r * 5 / maxR + 2) * devicePixelRatio
    ctx.beginPath()
    ctx.arc(
      centerX, centerY,
      r,
      Math.PI * (-0.5 - chartRemaining * 2), -Math.PI * 0.5
    )
    ctx.stroke()
  }
}
const CALC_CONE_HEIGHT = 5
const CALC_CONE_RADIUS = 2
function distanceToRenderRadius (maxR, distance) {
  let h = distance * CALC_CONE_HEIGHT
  let a = (1 - distance) * CALC_CONE_RADIUS
  let angle = Math.atan(h / a) * 2 / Math.PI
  return maxR * (1 - angle)
}
window.play = function () {
  startNextFrame = true
  bgm.play()
  if (enableBga) bga.play()
  bga.muted = true
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
  sflOffset = 0
  sfl = 1
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
    while (endOffset < noteListForPlayback.length && noteListForPlayback[endOffset].distance <= currentDistance + renderDistance) endOffset++;
  }
  return noteListForPlayback
  .slice(Math.max(0, startOffset), Math.min(noteListForPlayback.length, endOffset))
  .filter(i => i.distance > currentDistance && i.distance < currentDistance + renderDistance)
}
window.getNotesForDraw = getNotesForDraw;

const pendingLaneChange = []
const transitionLength = 80
let laneChangeIdx = 0
function updateLaneOnState(fromTs, toTs) {
  if (!laneToggleList.length) return
  if (fromTs === -1) {
    pendingLaneChange.splice(0, pendingLaneChange.length)
    for (let i=0; i<60 * laneEffectMul; i++) {
      laneOnState[i] = 0
    }
    laneChangeIdx = 0
  }
  while (laneChangeIdx < laneToggleList.length) {
    let i = laneToggleList[laneChangeIdx]
    if (i.timestamp > toTs) break
    if (i.tickTotal === 0 || toTs - i.timestamp > transitionLength) {
      const value = i.noteType === '12' ? 1 : 0
      const width = i.noteWidth * laneEffectMul
      for (let idx = 0; idx < width; idx++) {
        laneOnState[(i.laneOffset * laneEffectMul + idx) % (60 * laneEffectMul)] = value
      }
    } else if (pendingLaneChange.indexOf(i) === -1) {
      pendingLaneChange.push(i)
    }
    laneChangeIdx++
  }
  pendingLaneChange.forEach(i => {
    const value = i.noteType === '12' ? 1 : 0
    const transitionPercent = Math.min(toTs - i.timestamp, transitionLength) / transitionLength
    const width = i.noteWidth * laneEffectMul
    if (toTs - i.timestamp > transitionLength) {
      for (let idx = 0; idx < width; idx++) {
        laneOnState[(i.laneOffset * laneEffectMul + idx) % (60 * laneEffectMul)] = value
      }
      pendingLaneChange.splice(pendingLaneChange.indexOf(i), 1)
      return
    }
    for (let idx = 0; idx < width; idx++) {
      let idxCompare = idx + 0.5
      if (i.extParam2 === 0) {
        if (idxCompare > width * transitionPercent) continue
      } else if (i.extParam2 === 1) {
        if (width - idxCompare > width * transitionPercent) continue
      } else if (i.extParam2 === 2) {
        const transitionBorder = width * transitionPercent / 2
        if (value === 1) {
          if (Math.abs(width/2 - idxCompare) > transitionBorder) continue
        } else {
          if (Math.abs(width/2 - idxCompare) < (width / 2 - transitionBorder)) continue
        }
      }
      laneOnState[(i.laneOffset * laneEffectMul + idx) % (60 * laneEffectMul)] = value
    }
  })
}

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
  drawForNextFrame = true
})
function resize() {
  const w = Math.round(window.innerWidth * devicePixelRatio), h = Math.round(window.innerHeight * devicePixelRatio)
  canvas.width = w
  canvas.height = h
  maxR = Math.round(Math.min(w, h) * 0.45)
  drawForNextFrame = true

  if (enableBga) {
    const wView = window.innerWidth, hView = window.innerHeight
    const centerX = wView / 2, centerY = hView / 2
    const rView = Math.round(Math.min(wView, hView) * 0.45)
    bga.style.left = (centerX - rView) + 'px'
    bga.style.top = (centerY - rView) + 'px'
    bga.style.width = (rView * 2) + 'px'
    bga.style.height = (rView * 2) + 'px'
    bga.style.display = 'block'
  } else {
    bga.style.display = 'none'
  }

  createArrows()
}
window.addEventListener('resize', resize)
resize();

//})