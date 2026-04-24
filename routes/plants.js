'use strict';

const express = require('express');
const router  = express.Router();
const plants  = require('../data/plants.json');

/**
 * GET /plants
 * Returns all 60+ crops, optionally filtered and grouped by category.
 *
 * Query params:
 *   ?category=leafy|vegetables|creepers|herbs|fruits|flowers
 *   ?grouped=true   → returns object keyed by category
 *   ?search=tomato  → case-insensitive name/hindi search
 */
router.get('/', (req, res) => {
  const { category, grouped, search } = req.query;

  let result = [...plants];

  // Filter by category
  if (category) {
    const cat = category.toLowerCase().trim();
    result = result.filter(p => p.category === cat);
  }

  // Search by name or Hindi name
  if (search) {
    const q = search.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) || p.hindi.includes(q)
    );
  }

  // Group by category
  if (grouped === 'true') {
    const groupedResult = result.reduce((acc, plant) => {
      if (!acc[plant.category]) acc[plant.category] = [];
      acc[plant.category].push(plant);
      return acc;
    }, {});

    return res.json({
      success: true,
      total: result.length,
      categories: Object.keys(groupedResult),
      data: groupedResult
    });
  }

  res.json({
    success: true,
    total: result.length,
    data: result
  });
});

/**
 * GET /plants/:name
 * Returns a single plant by English name (case-insensitive).
 */
router.get('/:name', (req, res) => {
  const name  = req.params.name.toLowerCase().trim();
  const plant = plants.find(p => p.name.toLowerCase() === name);

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: `पौधा नहीं मिला: "${req.params.name}"`,
      hint:  'GET /plants से सभी उपलब्ध पौधों की सूची देखें'
    });
  }

  res.json({ success: true, data: plant });
});

module.exports = router;
