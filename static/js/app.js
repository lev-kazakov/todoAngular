var ToDoListApp = angular.module('ToDoListApp', [
  'ngRoute',
  'ToDoListControllers'
]);
 
ToDoListApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      }).
      when('/todoList', {
        templateUrl: 'partials/todoList.html',
        controller: 'ToDoListCtrl'
      }).
      otherwise({
        redirectTo: '/login'
      });
  }]);