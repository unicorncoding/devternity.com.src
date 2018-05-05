/*
	Interphase by TEMPLATED
	templated.co @templatedco
	Released for free under the Creative Commons Attribution 3.0 license (templated.co/license)
*/
(function($) {

	skel.init({
		reset: 'full',
		breakpoints: {
			global: {
				href: 'css/style.css',
				containers: 1400,
				grid: { gutters: ['2em', 0] }
			},
			xlarge: {
				media: '(max-width: 1680px)',
				href: 'css/style-xlarge.css',
				containers: 1200
			},
			large: {
				media: '(max-width: 1280px)',
				href: 'css/style-large.css',
				containers: 960,
				grid: { gutters: ['1.5em', 0] },
				viewport: { scalable: false }
			},
			medium: {
				media: '(max-width: 980px)',
				href: 'css/style-medium.css',
				containers: '90%'
			},
			small: {
				media: '(max-width: 736px)',
				href: 'css/style-small.css',
				containers: '90%',
				grid: { gutters: ['1.25em', 0] }
			},
			xsmall: {
				media: '(max-width: 480px)',
				href: 'css/style-xsmall.css',
			}
		},
		plugins: {
			layers: {
				config: {
					transform: false
				},
				navPanel: {
					animation: 'pushX',
					breakpoints: 'medium',
					clickToHide: true,
					height: '100%',
					hidden: true,
					html: '<div data-action="moveElement" data-args="nav"></div>',
					orientation: 'vertical',
					position: 'top-left',
					side: 'left',
					width: 250
				},
				navButton: {
					breakpoints: 'medium',
					height: '4em',
					html: '<span class="toggle" data-action="toggleLayer" data-args="navPanel"></span>',
					position: 'top-left',
					side: 'top',
					width: '6em'
				}
			}
		}
	});
})(jQuery);


$(document).on('opened', '.remodal', function () {
	$("#navButton").hide();

});
$(document).on('closed', '.remodal', function () {
	$("#navButton").show();
});

var devternity = angular.module('devternity', ['timer']);

devternity.filter("trust", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);

devternity.filter("noOverdue", [function() {
  return function(date){
    return moment(date).isAfter(new Date());
  }
}]);

devternity.filter("humane", [function() {
  return function(date){
    return moment(date).format("dddd, MMMM Do");
  }
}]);

devternity.filter("packages", [function() {
  return function(objects){
      if (!(objects instanceof Object)) return objects;
      var keys = Object.keys(objects);
      var array = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = objects[k];
        v["name"] = k;
        array.push(v);
      }
      return array;
  }
}]);

devternity.controller("ExitOfferController", function($scope, $http) {
	bioEp.init({
		cookieExp: 30
	});

	bioEp.show = function() {
		$scope.inst = $("#exitOffer").remodal();
	    $scope.inst.open();
	};


	$scope.onDiscount = function() {
		$http
  			.post('https://us-central1-devternity-22e74.cloudfunctions.net/api/send-discount', { email: $scope.email })
  			.then(function() {
  				$scope.inst.close();
		})
	}

  $scope.email = "your@email.address";

});

devternity.controller('LandingPageController', function ($window, $http, $scope, $q) {
	$scope.timerRunning = true;

    $scope.startTimer = function (){
        $scope.$broadcast('timer-start');
        $scope.timerRunning = true;
    };

    $scope.stopTimer = function (){
        $scope.$broadcast('timer-stop');
        $scope.timerRunning = false;
    };

    $scope.$on('timer-stopped', function (event, data){
        console.log('Timer Stopped - data = ', data);
    });

  $scope.popupSpeech = function(uid) {
    var inst = $('[data-remodal-id=' + uid + ']').remodal();
    inst.open();
  }

  $scope.watchPromo = function() {
    var inst = $("[data-remodal-id='trailer-vimeo']").remodal();
    inst.open();	
  }

  $scope.seeVenue = function() {
    var inst = $("[data-remodal-id='venue-location']").remodal();
    inst.open();	
  }


  $scope.shorten = function(text) {
    if (text.length <= 50) {
      return text;
    } else {
      return text.substring(0, 47) + "...";
    }
  }

  $scope.onSubscribe = function() {
  	$http.post('https://newsletter.glitch.me/subscribe', { email: $scope.subscriber })
  	.then(
  		function() {
  			$scope.subscribeMessage = "Well done!"
  		},
  		function() {
			$scope.subscribeMessage = "Sorry, something went wrong. Just follow us on socials."
  		}
  	)
  }

  $scope.buy = function(moveTo) {
    $window.location.href = moveTo;
  }


  $scope.slideTo = function(to) {
        $('html, body').animate({ scrollTop: $(to).position().top }, 2000);
  }

  $scope.bookWorkshop = function(workshop) {
    $scope.workshop = workshop;
    $scope.slideTo('#tickets-container');
  }

  $http.get('js/event.js?purge')
       .then(function(response){
          var body = response.data[0];
		      $scope.event = body;
          $('#devternity-loading').fadeOut('slow',function(){
            $('#devternity-loading').remove();
        });
    });

});
