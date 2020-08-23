$.get("api/chart-data", function( data ) {
    data.bindto = '#chart';
    c3.generate(data);
});
