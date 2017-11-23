var devternity = angular.module('devternity', ['firebase']);

devternity.controller('LandingPageController', function ($http, $scope, $firebase, $firebaseArray) {

  $scope.popupSpeech = function(uid) {
    var inst = $('[data-remodal-id=' + uid + ']').remodal();
    inst.open();
  }

  $http.get('js/event.js')
       .then(function(response){

          var schedule = _.map(response.data[0].schedule, function(scheduled) {
            return _.extend(scheduled, {uid: _.uniqueId()})    
          });

          var speakers = _.chain(schedule)
            .filter(function(scheduled) { return scheduled.type === "speech"; } )
            .map(function(num, key, list) { return [num, num.partner] })
            .flatten()
            .compact()
            .value();

          var speakersInRows = _.groupBy(speakers, function(speaker, index) {
            return Math.floor(index/4);
          });


          var program = _.groupBy(schedule, 'time');
          var programTimes = _.keys(program);

          $scope.speakersInRows = speakersInRows;
          $scope.program = program;
          $scope.programTimes = programTimes;
    }); 

  var ref = new Firebase("https://devternity.firebaseio.com/registrations");

	$scope.earlyOverall = 70	
	$scope.regularOverall = 140
	$scope.lateOverall = 90

	$scope.earlyTicketsLeft = $scope.earlyOverall
	$scope.regularTicketsLeft = $scope.regularOverall
	$scope.lateTicketsLeft = $scope.lateOverall


	$scope.earlyDisabled = true
	$scope.regularDisabled = true
	$scope.lateDisabled = true

  	var list = $firebaseArray(ref);
  	list.$loaded().then(function() {
  		var ticketsSold = list.length + 163;

     	$scope.earlyTicketsLeft = Math.max($scope.earlyOverall - ticketsSold, 0)
     	if ($scope.earlyTicketsLeft == 0) {
     		$scope.regularTicketsLeft = Math.max(($scope.regularOverall + $scope.earlyOverall) - ticketsSold, 0)	
     	}

     	if ($scope.regularTicketsLeft == 0) {
     		$scope.lateTicketsLeft = Math.max(($scope.regularOverall + $scope.earlyOverall + $scope.lateOverall) - ticketsSold, 0)		
     	}

 		$scope.earlyDisabled = $scope.earlyTicketsLeft == 0
		$scope.regularDisabled = $scope.regularTicketsLeft == 0 || $scope.earlyTicketsLeft > 0
		$scope.lateDisabled = $scope.lateTicketsLeft == 0 || $scope.regularTicketsLeft > 0

  	});

  	
  
});