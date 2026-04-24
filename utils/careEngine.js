'use strict';

/**
 * careEngine.js — Rule-Based Plant Care Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure logic. No AI. No ML. No external calls.
 * Inputs : plant object (from plants.json) + current day number
 * Output : structured Hindi care advice
 */

// ── Stage boundaries ──────────────────────────────────────────────────────────
const STAGES = {
  SEED:    { from: 0,  to: 5  },
  GROWTH:  { from: 6,  to: 20 },
  MATURE:  { from: 21, to: 40 },
  HARVEST: { from: 41, to: Infinity }
};

function getStage(day) {
  if (day <= STAGES.SEED.to)   return 'seed';
  if (day <= STAGES.GROWTH.to) return 'growth';
  if (day <= STAGES.MATURE.to) return 'mature';
  return 'harvest';
}

// ── Watering advice ───────────────────────────────────────────────────────────
const WATERING_ADVICE = {
  seed: {
    high:   'मिट्टी हमेशा हल्की नम रखें — ऊपर से धीरे पानी दें',
    medium: 'मिट्टी हल्की नम रखें — ज़्यादा पानी न दें',
    low:    'बहुत कम पानी दें, मिट्टी की ऊपरी परत सूखने पर ही पानी दें'
  },
  growth: {
    high:   'रोज़ पानी दें — सुबह या शाम को',
    medium: 'हर 2 दिन में एक बार पानी दें',
    low:    'हर 3–4 दिन में एक बार पानी दें'
  },
  mature: {
    high:   'रोज़ पानी दें, मिट्टी नम रखें',
    medium: 'हर 2 दिन में पानी दें — मिट्टी जाँचते रहें',
    low:    'हर 3 दिन में पानी दें — जड़ों तक पानी पहुँचाएं'
  },
  harvest: {
    high:   'नियमित पानी जारी रखें',
    medium: 'पानी बंद न करें — हर 2 दिन में दें',
    low:    'हफ्ते में 2 बार पानी दें'
  }
};

// ── Sunlight advice ───────────────────────────────────────────────────────────
const SUNLIGHT_ADVICE = {
  seed: {
    full:    'फ़िलहाल छाया में रखें — अंकुर आने पर धूप में लाएं',
    partial: 'हल्की छाया में रखें',
    shade:   'छाया में रखें'
  },
  growth: {
    full:    '4–6 घंटे की सीधी धूप दें',
    partial: '3–4 घंटे की हल्की धूप दें',
    shade:   'छाया में रखें, सीधी धूप से बचाएं'
  },
  mature: {
    full:    '6–8 घंटे की सीधी धूप ज़रूरी है',
    partial: '4–5 घंटे की धूप दें',
    shade:   'छाया में रखें'
  },
  harvest: {
    full:    'पूरी धूप जारी रखें',
    partial: 'नियमित हल्की धूप दें',
    shade:   'छाया वाली जगह बनाए रखें'
  }
};

// ── Fertilizer advice ─────────────────────────────────────────────────────────
function getFertilizerAdvice(day, fertStartDay, stage, category) {
  if (day < fertStartDay || stage === 'seed') {
    return 'अभी खाद न डालें — जड़ें पक्की होने दें';
  }
  if (stage === 'growth') {
    return 'हल्की liquid खाद (जीवामृत या पतला गोबर खाद) 2 हफ्ते में एक बार दें';
  }
  if (stage === 'mature') {
    if (category === 'fruits') return 'फल आने पर खाद बंद करें — सिर्फ पानी दें';
    if (category === 'flowers') return 'फूलों के लिए phosphorus युक्त खाद महीने में एक बार दें';
    return 'महीने में एक बार वर्मी कम्पोस्ट या गोबर खाद डालें';
  }
  if (stage === 'harvest') {
    return 'कटाई के बाद नई खाद डालें — अगली फसल के लिए मिट्टी तैयार करें';
  }
  return 'महीने में एक बार जैविक खाद डालें';
}

// ── Do / Don't rules ──────────────────────────────────────────────────────────
function getDoList(stage, category, day, fertStartDay) {
  const common = {
    seed: [
      'बीज बोने के बाद मिट्टी से हल्के से ढकें',
      'गमले को गर्म और सुरक्षित जगह रखें',
      'अंकुरण के लिए 5–7 दिन धैर्य रखें'
    ],
    growth: [
      'पत्तियाँ साफ और धूल-मुक्त रखें',
      'पौधे की बढ़त रोज़ देखें',
      'ज़रूरत हो तो सहारा (stick) लगाएं'
    ],
    mature: [
      'कीड़े और बीमारी के लिए हर हफ्ते जाँचें',
      'मुरझाई पत्तियाँ तुरंत हटाएं',
      'गमले की मिट्टी ऊपर से ढीली करते रहें'
    ],
    harvest: [
      'तैयार फल / सब्ज़ी समय पर तोड़ें',
      'तोड़ाई के बाद पानी और खाद जारी रखें',
      'अगली बुआई की तैयारी शुरू करें'
    ]
  };

  const categoryExtras = {
    creepers: ['जाली या रस्सी का सहारा दें', 'बेल को ऊपर की तरफ गाइड करें'],
    leafy:    ['बाहरी पत्तियाँ काटते रहें — नई पत्तियाँ आएंगी', 'ज़्यादा पत्ते एक साथ न काटें'],
    herbs:    ['फूल आने से पहले ऊपर से काटें — पौधा घना होगा', 'सुबह काटें — सबसे ज़्यादा खुशबू होती है'],
    fruits:   ['फल आने पर गमला धूप में रखें', 'भारी फलों के लिए सहारा लगाएं'],
    flowers:  ['मुरझाए फूल (deadhead) हटाते रहें', 'फूल आने पर nitrogen खाद बंद करें'],
    vegetables: ['फल या सब्ज़ी समय पर तोड़ें — पौधा और देगा']
  };

  const list = [...(common[stage] || [])];
  if (categoryExtras[category]) {
    list.push(...categoryExtras[category]);
  }
  if (day >= fertStartDay && stage !== 'seed') {
    list.push('हर 15 दिन में जीवामृत या वर्मी कम्पोस्ट डालें');
  }
  return list;
}

function getDontList(stage, category) {
  const common = {
    seed: [
      'तेज़ धूप में सीधे न रखें',
      'खाद या chemical अभी न डालें',
      'बीज वाली मिट्टी न हिलाएं'
    ],
    growth: [
      'ज़रूरत से ज़्यादा पानी न दें — जड़ें सड़ सकती हैं',
      'chemical fertilizer की अधिक मात्रा न डालें',
      'पौधे को बार-बार जगह न बदलें'
    ],
    mature: [
      'पानी अचानक बंद न करें',
      'तेज़ धूप में repot न करें',
      'एक साथ बहुत सारी पत्तियाँ न काटें'
    ],
    harvest: [
      'फल बहुत ज़्यादा पके न छोड़ें — पौधा कमज़ोर होगा',
      'कटाई के तुरंत बाद खाद न डालें — 2 दिन रुकें',
      'जड़ों को नुकसान न पहुँचाएं'
    ]
  };

  const categoryExtras = {
    creepers: ['बेल को बिना सहारे के लटकने न दें'],
    leafy:    ['पूरा पौधा एक बार में न काटें'],
    herbs:    ['फूल आने दें — खुशबू और पोषण कम होगा'],
    fruits:   ['फल आने पर nitrogen खाद न डालें'],
    flowers:  ['पत्तियों पर पानी न डालें — fungus हो सकता है'],
    vegetables: ['कच्चे फल-सब्ज़ी जल्दी न तोड़ें']
  };

  const list = [...(common[stage] || [])];
  if (categoryExtras[category]) {
    list.push(...categoryExtras[category]);
  }
  return list;
}

// ── Stage label in Hindi ──────────────────────────────────────────────────────
const STAGE_LABELS = {
  seed:    '🌱 बीज अवस्था',
  growth:  '🌿 विकास अवस्था',
  mature:  '🌳 परिपक्व अवस्था',
  harvest: '🌾 कटाई का समय'
};

// ── Main engine function ──────────────────────────────────────────────────────
function generateCare(plant, day) {
  const stage      = getStage(day);
  const waterLevel = plant.watering;   // high / medium / low
  const sunLevel   = plant.sunlight;   // full / partial / shade

  return {
    plant:      plant.hindi,
    plant_en:   plant.name,
    category:   plant.category,
    day,
    stage:      STAGE_LABELS[stage],
    watering:   WATERING_ADVICE[stage][waterLevel],
    sunlight:   SUNLIGHT_ADVICE[stage][sunLevel],
    fertilizer: getFertilizerAdvice(day, plant.fertilizer_start_day, stage, plant.category),
    do:         getDoList(stage, plant.category, day, plant.fertilizer_start_day),
    dont:       getDontList(stage, plant.category),
    tip:        getDailyTip(plant, day, stage)
  };
}

// ── Daily motivational tip ────────────────────────────────────────────────────
function getDailyTip(plant, day, stage) {
  if (stage === 'seed')    return `${plant.hindi} का बीज अंकुरित होने में 5–10 दिन लग सकते हैं — धैर्य रखें 🌱`;
  if (stage === 'growth')  return `${plant.hindi} तेज़ी से बढ़ रहा है — रोज़ थोड़ा समय दें 🌿`;
  if (stage === 'mature')  return `${plant.hindi} लगभग तैयार है — ध्यान से देखभाल जारी रखें 💪`;
  if (day >= plant.days)   return `${plant.hindi} की कटाई का समय आ गया है — बधाई हो! 🎉`;
  return `${plant.hindi} कुछ ही दिनों में तैयार होगा — बस थोड़ा और इंतज़ार करें 🌾`;
}

module.exports = { generateCare, getStage };
