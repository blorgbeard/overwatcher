const express = require('express');
const app = express();
const port = 4000;

const charts = require('./charts');

app.get('/api/chart-data', (req, res) => {
  res.send(charts.getChartData());
});

app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});