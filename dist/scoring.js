/* Shared by the browser, Apps Script and Node tests. */
var League = (() => {
  function score(entries, awards = [3, 2, 1]) {
    if (!Array.isArray(entries) || entries.length < 3) throw Error('Mindestens drei Teilnehmer auswählen.');
    if (new Set(entries.map(e => e.player)).size !== entries.length) throw Error('Spieler doppelt ausgewählt.');
    entries.forEach(e => { if (!Number.isInteger(e.rank) || e.rank < 1 || e.rank > entries.length) throw Error('Gültige Platzierungen eintragen.'); });
    const ranks = [...new Set(entries.map(e => e.rank))].sort((a,b) => a-b);
    let next = 1;
    const points = {};
    ranks.forEach(rank => {
      if (rank !== next) throw Error('Nach einem Gleichstand die belegten Plätze überspringen, z. B. 1, 2, 2, 4.');
      const count = entries.filter(e => e.rank === rank).length;
      points[rank] = Array.from({length: count}, (_,i) => awards[rank+i-1] || 0).reduce((a,b) => a+b,0) / count;
      next += count;
    });
    return entries.map(e => ({...e, base: points[e.rank]}));
  }
  function factor(gap, day, rules) {
    return day < rules.start ? rules.normal : gap >= rules.high ? rules.highFactor : gap >= rules.low ? rules.midFactor : rules.normal;
  }
  return {score, factor};
})();
if (typeof module !== 'undefined') module.exports = League;
