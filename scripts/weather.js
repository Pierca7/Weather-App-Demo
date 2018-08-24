//Settings

let lang = "es";
let unit = "si";
let range = "today";

let geocoder;
let skycons;
let weatherData;
let latlng;
let date;
let city;
let tempUnit;

/* INICIO */
if (navigator.geolocation) {

	/* Pantalla de carga */
	window.loading_screen = window.pleaseWait({
		logo: "",
		backgroundColor: '#333333',
		loadingHtml: '<div class="spinner"><div class= "bounce1" ></div><div class="bounce2"></div><div class="bounce3"></div></div>'
	});

	/* Timezone.js config */
	timezoneJS.timezone.zoneFileBasePath = '/tz';
	timezoneJS.timezone.init({});

	/* Inicio del script */

	window.onload = function () {
		geocoder = new google.maps.Geocoder;
		date = new timezoneJS.Date();

		navigator.geolocation.getCurrentPosition(success, error);
		function success(position) {
			latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
			getData(latlng);
		};

		function error() {
			alert("No se pudo obtener tu localización");
		};

		$.get("today.html", function (data) {
			$("#main-panel").append(data);
		});
	};
}
else {
	alert("Geolocalizacion no disponible");
}



/* -- Metodos principales -- */

//Actuliza la hora.
function updateTime(zone) {
	date = new timezoneJS.Date();
	let formatedDate = formatDate(date.getHours(), date.getMinutes());
	let time = "Última actualización: " + formatedDate;
	$(".time").text(time);
	date.setTimezone(zone);
	formatedDate = formatDate(date.getHours(), date.getMinutes());
	let localtime = "Hora local: " + formatedDate;
	$(".localtime").text(localtime);
	console.log(time);
}

//Obtener nombre de la ubicacion.
function getData(latlng) {
	geocoder.geocode({ 'location': latlng }, function (results, status) {

		//Obtengo el nombre de la ciudad mediante las coordenadas dadas.
		if (status === 'OK') {
			//Si la ciudad existe, seteo el nombre y pido los datos.			
			if (results[0]) {
				city = results[0].address_components[2].long_name + ", " + results[0].address_components[3].long_name + ", " + results[0].address_components[4].long_name + " / ";
				requestData(latlng);
			}

			else {
				window.alert('No results found');
			}
		}

		else {
			window.alert('Geocoder failed due to: ' + status);
		}
	});
}

//Obtener datos de forma asincronica.
function requestData(latlng) {
	let request = $.getJSON("https://api.darksky.net/forecast/" + key + "/" + latlng.lat + "," + latlng.lng +
		"?exclude=[minutely,alerts,flags]&lang=" + lang + "&units=" + unit, function () {
		});

	//Cuando recibe los datos pedidos llena el documento.
	request.done(function (data) {
		skycons = new Skycons({ "color": "#eee" });
		let rawJson = JSON.stringify(data);
		weatherData = JSON.parse(rawJson);
		updateTime(weatherData.timezone);
		fillData(range);
		//Muestra la aplicacion
		window.loading_screen.finish();
	});
}

//Llena el documento con los datos.
let Days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function fillData(tipo) {
	let day = date.getDay();
	$(".city").html(city);
	if (unit == "si") {
		tempUnit = "°C";
	}
	else {
		tempUnit = "°F";
	}
	//Pronostico de hoy.
	if (tipo == "today") {
		$("#today-by-hour").children().each(function () {
			$(this).remove();
		});
		$(".weather").html(weatherData.currently.summary);

		$(".temp").html(weatherData.currently.temperature.toFixed(0) + tempUnit);
		skycons.set("weather-icon", weatherData.currently.icon);
		for (let i = 0, j = 0; i <= 24; i += 6, j++) {
			$("#today-by-hour").append('<div class="col-xs-3 mx-auto text-center p-2"><p class="by-hour">' + i + 'hs</p><canvas id="icon-' + j + '" height="80" width="80"></canvas><br /><span class="temp-sm" id="temp-' + j + '"></span></div>')
			$("#temp-" + j).html(weatherData.hourly.data[i].temperature.toFixed(0) + tempUnit);
			skycons.set("icon-" + j, weatherData.hourly.data[i].icon);
		}
	}

	//Pronostico extendido.
	if (tipo == "weekly") {
		$("#week-by-day").children().each(function () {
			$(this).remove();
		});

		for (let i = 0; i < (weatherData.daily.data).length; i++) {
			if (day == 7) { day = 0 }
			$("#week-by-day")
			$("#week-by-day").append('<div class="col-xs-auto text-center p-2"><p class="by-day">' + Days[day] + '</p><canvas id="icon-' + i + '" height="96" width="96"></canvas><br /><span class="temp-sm" id="temp-min-' + i + '"></span><span class="temp-sm" id="temp-max-' + i + '"></span></div>')
			$("#temp-min-" + i).html(weatherData.daily.data[i].temperatureLow.toFixed(0) + tempUnit + " / ");
			$("#temp-max-" + i).html(weatherData.daily.data[i].temperatureHigh.toFixed(0) + tempUnit);
			skycons.set("icon-" + i, weatherData.daily.data[i].icon);
			day++;
		}
	}

	colors();
	skycons.play();
}

//Cambia el color del texto segun la temperatura.
function colors() {
	$(".temp").each(function () {
		changeColors($(this))
	});

	$(".temp-sm").each(function () {
		changeColors($(this));
	});
};



/* -- Metodos auxiliares */

//Da formato hh:mm a la hora.
function formatDate(hours, minutes) {
	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	return hours + ":" + minutes;
}


let tempColorScale = [[10, 20, 30], [50, 68, 86]];

//Obtiene los numeros del texto de la temperatura y establece el color del mismo.
function changeColors(elem) {
	let text = $(elem).text();
	let scale;
	if(unit == "si"){scale = tempColorScale[0];}
	else{scale = tempColorScale[1]}
	let numbers = (text.match(/\d+/g).map(Number))[0];
	if (numbers <= scale[0]) {
		$(elem).css("color", "lightblue");
	}
	else if (numbers > scale[0] && numbers <= scale[1]) {
		$(elem).css("color", "dodgerblue");
	}
	else if (numbers > scale[1] && numbers <= scale[2]) {
		$(elem).css("color", "khaki");
	}
	else {
		$(elem).css("color", "crimson");
	}
}



/* -- Eventos -- */

//Acualizar.
$(".update").off().on("click touchend", function () {
	getData(latlng);
});


//Buscar al presionar Enter.
$('#locationInput').off().keyup(function (e) {
	if (e.keyCode === 13) {
		var input = $("#locationInput").val();
		geocoder.geocode({ 'address': input }, function (results, status) {
			if (status == 'OK') {
				latlng = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
				getData(latlng);
			} else {
				alert('Geocode was not successful for the following reason: ' + status);
			}
		})
	}
});

//Cambio de pestaña.
$(".menu-link").on("click touchend", function () {
	let range = $(this).attr("id");

	$(".panel").each(function () {
		if ($(this).attr("id") !== range + "-panel") {
			$(this).remove();
		}
	});
	if ($("#" + range + "-panel").length === 0) {
		$.get(range + ".html", function (data) {
			$("#main-panel").append(data);
			fillData(range);
		});
	}
});

//Mostrar menu.
let out = false;
$("#settings").off().on("click touchend", function () {
	if (!out) {
		$(".menu").css("transform", "translate(-1%,-50%)");
		out = true;
	}
	else {
		$(".menu").css("transform", "translate(-100%,-50%)");
		out = false;
	}
});

//Cambiar unidades.
$(".unit").change(function () {
	unit = $(this).val();
});








