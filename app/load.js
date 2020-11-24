const reloadChart = function() {
    let profile = $("#select-profile").val();
    let chart = $("#select-chart").val();
    if (profile && chart) {
        $.get(`api/charts/data?profile=${profile}&chart=${chart}`, function(result) {
            result.data.bindto = '#chart';
            c3.generate(result.data);
        });
    }
}

$(".reload-on-change").on("change", reloadChart);

$.get("api/profiles", function(result) {
    let options = result.profiles.map(t => `<option value="${t.id}">${t.title}</option>`).join("")
    $("#select-profile").html(options);
});

$.get("api/charts", function(result) {
    let options = result.charts.map(t => `<option value="${t.id}">${t.title}</option>`).join("")
    $("#select-chart").html(options);
});
