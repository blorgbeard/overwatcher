const express = require('express');
const app = express();
const port = 4000;

const charts = require('./charts');

app.get('/api/profiles', (req, res) => {
  let config = require('./config')();
  let profiles = config.profiles.map(t => ({ "id": t.id, "title": t.displayname }));
  res.send({"profiles": profiles});
});

app.get('/api/charts', (req, res) => {
  let config = require('./config')();
  let charts = config.charts.map(t => ({ "id": t.id, "title": t.title }));
  res.send({"charts": charts});
});

app.get('/api/charts/data', (req, res) => {
  let config = require('./config')();  
  let profile = config.profiles.find(t => t.id == req.query.profile);
  let chart = config.charts.find(t => t.id == req.query.chart);  
  res.send({ "data": charts.getChartData(chart, profile) });
});

app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});