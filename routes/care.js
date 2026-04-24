'use strict';

const express      = require('express');
const router       = express.Router();
const plants       = require('../data/plants.json');
const { generateCare } = require('../utils/careEngine');

/**
 * GET /care
 * Returns rule-based care advice for a plant on a given day.
 *
 * Required query params:
 *   ?plant=Cucumber   (English name, case-insensitive)
 *   ?day=5            (integer, day since planting)
 *
 * Optional:
 *   ?season=summer|rainy|winter  → adds season-specific advice
 *   ?space=balcony|terrace|indoor
 */
router.get('/', (req, res) => {
  const { plant: plantQuery, day: dayQuery, season, space } = req.query;

  // ── Validate plant ─────────────────────────────────────────────────────────
  if (!plantQuery) {
    return res.status(400).json({
      success: false,
      error:  'plant parameter ज़रूरी है',
      example: '/care?plant=Cucumber&day=5'
    });
  }

  const plant = plants.find(p =>
    p.name.toLowerCase() === plantQuery.toLowerCase().trim()
  );

  if (!plant) {
    const suggestions = plants
      .filter(p => p.name.toLowerCase().startsWith(plantQuery[0].toLowerCase()))
      .slice(0, 3)
      .map(p => p.name);

    return res.status(404).json({
      success: false,
      error:   `"${plantQuery}" नहीं मिला`,
      hint:    'GET /plants से सही नाम देखें',
      suggestions: suggestions.length ? suggestions : undefined
    });
  }

  // ── Validate day ───────────────────────────────────────────────────────────
  const day = parseInt(dayQuery, 10);

  if (!dayQuery || isNaN(day) || day < 0) {
    return res.status(400).json({
      success: false,
      error:  'day parameter ज़रूरी है (0 से शुरू करें)',
      example: `/care?plant=${plant.name}&day=0`
    });
  }

  // ── Generate care advice ───────────────────────────────────────────────────
  const care = generateCare(plant, day);

  // ── Add season-specific overlay ────────────────────────────────────────────
  if (season) {
    care.season_advice = getSeasonAdvice(season.toLowerCase(), plant, care);
  }

  // ── Add space-specific overlay ─────────────────────────────────────────────
  if (space) {
    care.space_advice = getSpaceAdvice(space.toLowerCase(), plant);
  }

  // ── Days remaining ─────────────────────────────────────────────────────────
  const daysLeft = Math.max(0, plant.days - day);
  care.days_remaining = daysLeft > 0
    ? `${daysLeft} दिन में ${plant.hindi} तैयार होगा`
    : `${plant.hindi} कटाई के लिए तैयार है 🎉`;

  res.json({ success: true, data: care });
});

/**
 * GET /care/multi
 * Returns care for multiple plants on the same day.
 *
 * Query: ?plants=Cucumber,Tomato,Mint&day=15
 */
router.get('/multi', (req, res) => {
  const { plants: plantsQuery, day: dayQuery, season } = req.query;

  if (!plantsQuery || !dayQuery) {
    return res.status(400).json({
      success: false,
      error:   'plants और day दोनों ज़रूरी हैं',
      example: '/care/multi?plants=Cucumber,Tomato&day=15'
    });
  }

  const day       = parseInt(dayQuery, 10);
  const names     = plantsQuery.split(',').map(n => n.trim());
  const results   = [];
  const notFound  = [];

  for (const name of names) {
    const plant = plants.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!plant) {
      notFound.push(name);
      continue;
    }
    const care = generateCare(plant, day);
    if (season) care.season_advice = getSeasonAdvice(season.toLowerCase(), plant, care);
    care.days_remaining = Math.max(0, plant.days - day);
    results.push(care);
  }

  res.json({
    success: true,
    day,
    total:    results.length,
    not_found: notFound.length ? notFound : undefined,
    data:     results
  });
});

// ── Season overlay rules ───────────────────────────────────────────────────────
function getSeasonAdvice(season, plant, care) {
  const advice = {
    summer: {
      watering:  'गर्मियों में रोज़ सुबह और शाम पानी दें — दोपहर में न दें',
      sunlight:  'दोपहर 12–3 बजे छाया दें — पत्तियाँ जल सकती हैं',
      extra:     'गमले के नीचे पानी की ट्रे रखें — नमी बनी रहेगी'
    },
    rainy: {
      watering:  'बारिश के दिन पानी न दें — मिट्टी पहले से नम है',
      sunlight:  'बारिश रुकने पर धूप में रखें',
      extra:     'जल-भराव से बचें — गमले में drainage holes ज़रूरी हैं'
    },
    winter: {
      watering:  'सर्दियों में पानी कम करें — हर 3–4 दिन में एक बार काफी है',
      sunlight:  'सुबह 9 बजे के बाद धूप में रखें — सुबह की ठंड से बचाएं',
      extra:     'ठंडी रात में पौधे अंदर ले आएं या plastic cover से ढकें'
    }
  };

  return advice[season] || null;
}

// ── Space overlay rules ───────────────────────────────────────────────────────
function getSpaceAdvice(space, plant) {
  const advice = {
    balcony: {
      tip:      'बालकनी में हवा ज़्यादा होती है — मिट्टी जल्दी सूखती है, पानी पर ध्यान दें',
      pot:      plant.category === 'creepers'
                  ? 'जाली या रस्सी बालकनी की रेलिंग से बाँधें'
                  : '10–15 लीटर का गमला इस पौधे के लिए अच्छा है',
      sunlight: 'बालकनी की दिशा देखें — दक्षिण / पश्चिम मुखी सबसे अच्छी है'
    },
    terrace: {
      tip:      'छत पर गर्मी ज़्यादा होती है — गमलों को सफेद कपड़े से ढकें',
      pot:      'बड़े grow bags (20–30 लीटर) छत पर अच्छे रहते हैं',
      sunlight: 'छत पर सबसे ज़्यादा धूप मिलती है — गर्मियों में shade net लगाएं'
    },
    indoor: {
      tip:      `${plant.hindi} indoor के लिए ${plant.sunlight === 'shade' ? 'उपयुक्त है' : 'ज़्यादा अच्छा नहीं है — खिड़की के पास रखें'}`,
      pot:      '5–8 लीटर का गमला indoor के लिए ठीक है',
      sunlight: 'खिड़की के पास रखें जहाँ सुबह की धूप आती हो'
    }
  };

  return advice[space] || null;
}

module.exports = router;
