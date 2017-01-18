'use strict'

var cardTypeMap = {
  'ルリグ': 'LRIG',
  'シグニ': 'SIGNI',
  'アーツ': 'ARTS',
  'スペル': 'SPELL',
  'レゾナ': 'RESONA',
}
var colorMap = {
  '白': 'white',
  '黒': 'black',
  '赤': 'red',
  '青': 'blue',
  '緑': 'green',
  '無': 'colorless',
}

function cookInfo (rawInfo) {
  var info = {}
  for (var prop in rawInfo) {
    info[prop] = rawInfo[prop]
    if (prop === 'name') {
      info.name_zh_CN = rawInfo.name
      info.name_en = rawInfo.name
    } else if (prop === 'pid') {
      info.cid = rawInfo.pid
    }
  }
  info.cardType = map(cardTypeMap,info.cardType)
  if (!info.cardType) {
    console.warn('%s cardType: %s',rawInfo.pid,rawInfo.cardType)
    // In the official site, `cardType` and `class` might be swapped by mistake.
    info.cardType = rawInfo.class
    info.class = rawInfo.cardType
    info.cardType = map(cardTypeMap,info.cardType)
  }

  if ((info.cardType !== 'LRIG') && (info.cardType !== 'SIGNI') && (info.cardType !== 'RESONA')) {
    if (info.class !== '-') debugger
    info.classes = []
  } else {
    if (info.class === '-') debugger
    info.classes = info.class.split(/[：\/]/)
  }
  delete info.class

  info.color = map(colorMap,info.color)

  if ((info.cardType !== 'LRIG') && (info.cardType !== 'SIGNI') && (info.cardType !== 'RESONA')) {
    if (info.level !== '-') debugger
    if (info.limit !== '-') debugger
    info.level = info.limit = 0
  } else {
    if (info.level === '-') {
      info.level = 0
    } else {
      info.level = toInt(info.level)
    }
    if (info.cardType !== 'LRIG') {
      if (info.limit !== '-') debugger
      info.limit = 0
    } else if (info.limit === '∞') {
      info.limit = 1024
    } else if (info.limit === '-') {
      info.limit = 0
    } else {
      info.limit = toInt(info.limit)
    }
  }

  setCost(info)

  if ((info.cardType !== 'SIGNI') && (info.cardType !== 'RESONA')) {
    if (info.power !== '-') debugger
    info.power = 0
  } else {
    info.power = toInt(info.power)
  }

  if (/限定$/.test(info.limiting)) {
    info.limiting = info.limiting.replace(/限定$/,'')
  } else if (info.limiting === '-') {
    info.limiting = ''
  } else {
    debugger
  }

  if ((info.guard === '有') || (info.guard === 'あり')) {
    info.guardFlag = true
  } else if (info.guard === '-' || info.guard === 'なし') {
    info.guardFlag = false
  } else {
    debugger
  }
  delete info.guard

  if (info.timing === '-') {
    delete info.timing
  }

  info.cardSkills = info.cardSkill.split('\n').filter(function (skill) {
    return skill
  })
  delete info.cardSkill

  info.multiEner = info.cardSkills.some(function (skill) {
    return (skill.indexOf('【常】：【マルチエナ】') === 0) || (skill.indexOf('【常時能力】：【マルチエナ】') === 0)
  })

  if (!info.cardSkills.length) {
    delete info.cardSkills
  }

  info.cardText = ''
  info.cardText_zh_CN = ''
  info.cardText_en = ''
  info.lifeBurst = ''
  info.cardTexts.forEach(function (text,i,arr) {
    if (!text) debugger
    if (text.indexOf('【ライフバースト】：') === 0) {
      if (info.lifeBurst) debugger
      info.lifeBurst = text.replace(/^【ライフバースト】：/,'')
    } else {
      if (info.cardText) debugger
      info.cardText = text
    }
  })
  delete info.cardTexts

  if (!info.lifeBurst) {
    delete info.lifeBurst
  }

  if (!info.faqs.length) {
    delete info.faqs
  }

  return info
}

function map (m,v) {
  if (!m[v]) debugger
  return m[v]
}

function toInt (v) {
  var idx = '０１２３４５６７８９'.indexOf(v)
  if (idx != -1) {
    return idx
  }
  var i = parseInt(v)
  if (isNaN(i)) debugger
  return i
}

function setCost (info) {
  info.costWhite = 0
  info.costBlack = 0
  info.costRed = 0
  info.costBlue = 0
  info.costGreen = 0
  info.costColorless = 0
  var costStr
  if ((info.growCost === '-') && (info.cost !== '-')) {
    if (info.cardType !== 'ARTS' && info.cardType !== 'SPELL') {
      debugger
    }
    costStr = info.cost
  } else if ((info.growCost !== '-') && (info.cost === '-')){
    if (info.cardType !== 'LRIG') {
      debugger
    }
    costStr = info.growCost
  } else if ((info.growCost === '-') && (info.cost === '-')){
    if ((info.cardType !== 'SIGNI') && (info.cardType !== 'RESONA')) {
      debugger
    }
  } else {
    debugger
  }
  if (costStr) {
    var costArr = costStr.replace(/\n/g,'、').replace(/《|》|\s/g,'').split('、')
    costArr.forEach(function (colorAndCount) {
      var tmp = colorAndCount.split('×')
      if (tmp.length !== 2) {
        debugger
      }
      var colorCostMap = {
        '白': 'costWhite',
        '黒': 'costBlack',
        '赤': 'costRed',
        '青': 'costBlue',
        '緑': 'costGreen',
        '無': 'costColorless'
      }
      var colorCost = map(colorCostMap,tmp[0])
      var count = toInt(tmp[1])
      info[colorCost] = count
    })
  }
  delete info.growCost
  delete info.cost
}





var reader = new FileReader()
var i,files
function setFiles () {
  i = 0
  files = document.getElementById('input').files
}
var infoObj = {}
reader.onload = handle
function handle () {
  i++
  var rawInfo = JSON.parse(reader.result)
  infoObj[rawInfo.pid] = cookInfo(rawInfo)
  if (i >= files.length) {
    console.log('done')
    var json = JSON.stringify(infoObj,null,'\t')
      .replace(/"(name.*?)"/g,'$1')
      .replace(/"(cardText.*?)"/g,'$1')
      .replace(/"cid"/g,'cid')
      .replace(/"faqs"/g,'faqs')
      .replace(/"cardSkills"/g,'cardSkills')
    document.getElementById('textarea').value = json
    document.getElementById('textarea').select()
    return
  }
  reader.readAsText(files[i])
}

function go () {
  setFiles()
  reader.readAsText(files[0])
}

document.getElementById('input').onchange = go