function getWeekDates(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00');
  const day = dt.getDay();
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    dates.push(x.toISOString().split('T')[0]);
  }
  return dates;
}

function getMonthDates(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00');
  const y = dt.getFullYear(), m = dt.getMonth();
  const dates = [];
  const cur = new Date(y, m, 1);
  while (cur.getMonth() === m) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const PARAMS = [
  {
    cat: "Ishlab chiqarish",
    subcats: [
      {
        name: "Umumiy",
        items: [
          "Umumiy ishlab chiqarish plani soni",
          "Trelloda umumiy zakaz soni",
          "PU zakaz soni"
        ]
      },
      {
        name: "PU bo'lim",
        items: [
          "Pu bo'lim plan bajarilish ko'rsatkichi",
          "PU ishlab chiqarilgan mahsulot soni",
          "Pu bo'lim hodimlar soni",
          "PU bo'lim hodim samaradorligi",
          "PU jami ish vaqti",
          "PU bo'lim ish vaqti",
          "PU bo'lim ishlab chiqarish tezligi",
          "PU bo'lim to'xtalishlar vaqti (soat hisobida)",
          "PU ishlatilgan xomashyo miqdori",
          "PU atxo't miqdori",
          "PU xomashyo qoldiq miqdori",
          "Pu ikkilamchi xomashyo miqdori"
        ]
      },
      {
        name: "TEP bo'lim",
        items: [
          "TEP zakaz soni",
          "TEP bo'lim plan bajarilish ko'rsatkichi",
          "TEP ishlab chiqarilgan mahsulot soni",
          "TEP bo'lim hodimlar soni",
          "TEP bo'lim hodim samaradorligi",
          "TEP jami ish vaqti",
          "TEP bo'lim ish vaqti",
          "TEP bo'lim ishlab chiqarish tezligi (soat hisobida)",
          "TEP bo'lim to'xtalishlar vaqti",
          "TEP ishlatilgan xomashyo miqdori",
          "TEP atxo't miqdori",
          "TEP xomashyo qoldiq miqdori"
        ]
      }
    ]
  }
];

module.exports = { getWeekDates, getMonthDates, PARAMS };
