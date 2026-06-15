const db = require('../config/db');
const { getWeekDates, getMonthDates, PARAMS } = require('../utils/helpers');

exports.getFacts = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });
    const { rows } = await db.query(
      'SELECT * FROM facts WHERE date = $1 ORDER BY subcategory, param_name',
      [date]
    );
    res.json({ date, facts: rows });
  } catch (err) { next(err); }
};

exports.saveFact = async (req, res, next) => {
  try {
    const { date, param_name, category, subcategory, value, unit } = req.body;
    if (!date || !param_name || value === undefined || !unit)
      return res.status(400).json({ error: 'date, param_name, value, unit required' });

    const { rows } = await db.query(
      `INSERT INTO facts (date, param_name, category, subcategory, value, unit)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (date, param_name)
       DO UPDATE SET value=$5, unit=$6, updated_at=NOW()
       RETURNING *`,
      [date, param_name, category || 'Ishlab chiqarish', subcategory || '', value, unit]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.deleteFact = async (req, res, next) => {
  try {
    await db.query('DELETE FROM facts WHERE id = $1', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (err) { next(err); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const { period, date } = req.query;
    if (!period || !date) return res.status(400).json({ error: 'period and date required' });

    let dates = [];
    if      (period === 'daily')   dates = [date];
    else if (period === 'weekly')  dates = getWeekDates(date);
    else if (period === 'monthly') dates = getMonthDates(date);
    else return res.status(400).json({ error: 'period must be: daily|weekly|monthly' });

    const { rows } = await db.query(
      'SELECT * FROM facts WHERE date = ANY($1::date[]) ORDER BY date, subcategory, param_name',
      [dates]
    );
    res.json({ period, dates, facts: rows });
  } catch (err) { next(err); }
};

exports.getParams = async (req, res, next) => {
  try {
    res.json(PARAMS);
  } catch (err) { next(err); }
};
