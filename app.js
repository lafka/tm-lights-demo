angular.module('TinyLights', ['tmCloudClient'], function($provide) {
      //$provide.value('endpoint', 'http://31.169.50.34:8080');
      $provide.value('endpoint', 'http://localhost:4000');
   })
   .controller('AuthController', function($rootScope, $scope, $localStorage, tmAuthSession, tmUser) {
      $scope.user = new tmUser();
      $scope.$auth = $localStorage;

      // Wait until session is created before populating user object
      $rootScope.$on('session:new', function(ev, auth) {
         $scope.user.$get();
         $scope.flash = "";
      });

      $rootScope.$on('session:destroy', function(ev) {
         $scope.user.$get();
         $scope.flash = "You have been logged out of your session.";
         $scope.flashClass = "info";
      });

      $scope.logout = function() {
         tmAuthSession.logout();
      };

      tmAuthSession.maybeAuthenticate();
   })
   .controller('LoginController', function($rootScope, $scope, tmUser, tmAuthSession) {
      $scope.login = function(auth) {
         tmAuthSession.login(auth.email, auth.password)
            .catch(function() {
               $scope.$parent.flashClass = "danger";
               $scope.$parent.flash = "Invalid username or password.";
            });
      };
   })
   .controller('AppController', function($scope, $location, $q, tmNet, tmMsg) {
      $scope.networks = [];
      $scope.net = undefined;

      $scope.$on('session:new', function() {
         $scope.networks = angular.copy($scope.user.networks);
      });

      $scope.setNet = function(k, nosearch) {
         nosearch || $location.search('network', k);
         tmNet.get({id: k}).$promise.then(function(net) {
            $scope.net = angular.copy(net);
         });
      };

	  $scope.pwm = {};
      $scope.incpwm = function(sel) {
         new tmMsg({"proto/tm": {
            "type": "command",
            "command": "set_pwm",
            "pwm": $scope.pwm[sel[0]] = Math.max(0, ($scope.pwm[sel[0]] || 100) - 10)
           }}).$create({network: sel[0], device: sel[1]});
      };
      $scope.decpwm = function(sel) {
         new tmMsg({"proto/tm": {
            "type": "command",
            "command": "set_pwm",
            "pwm": $scope.pwm[sel[0]] = Math.min(100, ($scope.pwm[sel[0]] || 0) + 10)
           }}).$create({network: sel[0], device: sel[1]});
      };
      $scope.switchon = function(sel) {
         new tmMsg({"proto/tm": {
            "type": "command",
            "command": "set_output",
            "gpio": {"gpio_0": true,
                     "gpio_1": true}
           }}).$create({network: sel[0], device: sel[1]});
      };
      $scope.switchoff = function(sel) {
         new tmMsg({"proto/tm": {
            "type": "command",
            "command": "set_output",
            "gpio": {"gpio_0": false}
           }}).$create({network: sel[0], device: sel[1]});
      };
      $scope.provision = function(sel) {
         var msg = new tmMsg({network: sel[0],
                              device: sel[1]});
         msg["proto/tm"] = {
            "type": "command",
            "command": "set_config",
            "config": {
               "gpio_0": {"config": 0},
               "gpio_1": {"config": 1, trigger: 2},
               "gpio_2": {"config": 1, trigger: 2},
               "gpio_3": {"config": 1, trigger: 2},
               "gpio_4": {"config": 1, trigger: 2},
               "gpio_5": {"config": 1, trigger: 2},
               "gpio_6": {"config": 1, trigger: 2},
               "gpio_7": {"config": 3}
            }
           };

           msg.$create();
      };

      var prevnet = $location.search().network;
      if (prevnet) {
         $scope.setNet(prevnet, true);
      }
   })
   .directive('modal', function () {
      return {
         template: '<div class="modal fade">' + 
            '<div class="modal-dialog">' + 
               '<div class="modal-content">' + 
                  '<div class="modal-header">' + 
//                     '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
                     '<h4 class="modal-title">{{ title }}</h4>' +
                  '</div>' +
                  '<div class="modal-body" ng-transclude></div>' +
                  '</div>' +
               '</div>' +
            '</div>',
            restrict: 'E',
            transclude: true,
            replace:true,
            scope:true,
            link: function postLink(scope, element, attrs) {
               scope.title = attrs.title;

               scope.$watch(attrs.visible, function(value) {
                  if(value == true)
                     $(element).modal('show');
                  else
                     $(element).modal('hide');
               });

               $(element).on('shown.bs.modal', function(){
                     scope.$parent[attrs.visible] = true;
               });

               $(element).on('hidden.bs.modal', function(){
                     scope.$parent[attrs.visible] = false;
               });
            }
      };
   });
