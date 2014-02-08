/* Controllers */

var ToDoListControllers = angular.module('ToDoListControllers', []);
 
ToDoListControllers.controller('ToDoListCtrl', ['$scope', '$http', '$location',
  function ($scope, $http, $location) {
  
    // The default filter prop is ALL
    $scope.filterStatusValues = [0, 1];
    $scope.todos = {};
    
    // Get the current todos from the server
    $scope.getList = function () {
        $http.get('/item').
            success(function (data) {
                $scope.todos = data;
            }).
            error(function (data) {
                $location.path("/login").replace();
                alert(data.error);
            });
    };
 
    // Functions manipulating the todo list
    $scope.markTask = function (id) {
        if (!(id in $scope.todos)) {
            console.log("Error: Marking task that doesn't exist");
            // Error
            return;
        }
        
        $scope.todos[id].status = 1 - $scope.todos[id].status;
        $scope.updateTask(id);
    };
    
    $scope.dropTask = function (idToDelete) {        
        console.log(idToDelete);
        $.ajax({
            url: '/item',
            data: {"id": idToDelete},
            type: 'DELETE',
            dataType:'json',
            success: function(data){
                if (data.status === 0) {
                    delete $scope.todos[idToDelete];
                    // For letting angular know something has changed:
                    // http://stackoverflow.com/questions/19516098/angular-js-doesnt-refresh-the-repeater-after-scope-var-changes-but-only-after
                    $scope.$apply();
                } else {
                    console.log('Error: dropTask failed');
                }
            }
        });
    };
    
    $scope.updateTask = function (id) {        
        $.ajax({
		    url: '/item',
		    data: $scope.todos[id],
		    type: 'PUT',
		    dataType:'json',
		    success: function(data){
                if (data.status !== 0) {
                    console.log('Error: update task failed');
                }
	    	}
		});
    }
    
    $scope.addTask = function () {
        var newTask = {
            "id": Math.random(),
            "value": $("#newTaskDesc").val(),
            "status": 0
        };
        
        if (newTask.value === '') {
            return;
        }
        
        // Empty the new task value
        $('#newTaskDesc').val('');
        
        $.ajax({
		    url: '/item',
		    data: newTask,
		    type: 'POST',
		    dataType:'json',
		    success: function (data){
                if (data.status === 0) {
                    $scope.todos[newTask.id] = newTask;
                } else {
                    console.log('Error: addTask failed');
                }
                
                // For letting angular know something has changed:
                // http://stackoverflow.com/questions/19516098/angular-js-doesnt-refresh-the-repeater-after-scope-var-changes-but-only-after
                $scope.$apply();
	    	},
            error: function (XMLHttpRequest, textStatus, errorThrown) { 
                alert("Status: " + textStatus);
                alert("Error: " + errorThrown); 
            } 
		});
    };
    
    $scope.markAll = function () {
        var i;
        var allCompleted = true;
        for (id in $scope.todos) {
            if ($scope.todos[id].status === 0) {
                allCompleted = false;
                break;
            }
        }

        // If all tasks are marked then all tasks should be unmarked, otherwise all should be marked
        var statusValForAll = allCompleted? 0 : 1;
        
        for (id in $scope.todos) {
            if ($scope.todos[id].status != statusValForAll) {
                $scope.markTask(id);
            }
        }
    };
    
    $scope.clearCompleted = function () {
        
        $.ajax({
            url: '/item',
            data: {"id": -1},
            type: 'DELETE',
            dataType:'json',
            success: function(data){
                if (data.status === 0) {
                    for (var id in $scope.todos) {
                        if ($scope.todos[id].status === 1) {
                            delete $scope.todos[id];
                        }
                    }
                    // For letting angular know something has changed:
                    // http://stackoverflow.com/questions/19516098/angular-js-doesnt-refresh-the-repeater-after-scope-var-changes-but-only-after
                    $scope.$apply();
                } else {
                    console.log('Error: clearCompleted failed');
                }
            }
        });
    };
    
    $scope.getNumberOfActiveTasks = function () {
        var count = 0;
        for (var id in $scope.todos) {
            if ($scope.todos[id].status === 0) {
                count++;
            }
        }
        return count;
    };
    
    $scope.getFilteredTodos = function () {
        var filteredTodos = {};
        
        for (var todoId in $scope.todos) {
            // Check if the current value of the todo's status attribute is in the filter
            if ($scope.filterStatusValues.indexOf($scope.todos[todoId].status) !== -1) {
                filteredTodos[todoId] = $scope.todos[todoId];
            }
        }
        
        console.log(filteredTodos);
        return filteredTodos;
    };
    
    $scope.reportTaskEdit = function (todoId) {
        var taskDivDescriptor = '#taskValue' + todoId;
        var newValue = $(taskDivDescriptor)[0].textContent;
        
        // If the new value isn't emtry, update the todo, otherwise delete it
        if (newValue !== '') {
            $scope.todos[todoId].value = newValue;
            $scope.updateTask(todoId);
        } else {
            $scope.dropTask(todoId);
        }
    };
    
    $scope.watchTaskEdit = function (todoId) {
        var taskDivDescriptor = '#taskValue' + todoId;
        
        console.log($(taskDivDescriptor));
        // Blur on line break
        $(taskDivDescriptor).keypress(function (e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                $(taskDivDescriptor).blur();
            }
        });
    };
    
    $scope.watchNewTaskEntries = function () {
        $('#newTaskDesc').keypress(function (e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                $('#addTaskButton').click();
                $('#newTaskDesc').focus();
            }
        });
    };
    
    // Update the list on startup
    $scope.getList();
  }]);
  
ToDoListControllers.controller('LoginCtrl', ['$scope', '$http', '$window',
  function ($scope, $http, $window) {
    $scope.login = function () {
        var loginDetails = {
            username: $('#login_username').val(),
            password: $('#login_password').val()
        };
        
        // TODO: validation of input?
        $.ajax({
		    url: '/login',
		    data: loginDetails,
		    type: 'GET',
		    dataType:'json',
		    success: function (data) {
                console.log(data);
                if (data.status === 0) {
                    $window.location.href = '/index.html#/todoList'
                    $scope.$apply();
                } else {
                    alert('Wrong login details! Please try again');
                }
	    	},
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert('Wrong details! Please try again');
            } 
		});
    };
    
    $scope.register = function () {
        var registerationDetails = {
            username: $('#register_username').val(),
            fullname: $('#register_fullname').val(),
            password: $('#register_password').val()
        };
        
        // Verify password
        if (registerationDetails.password !== $('#register_passwordVerification').val()) {
            alert('Password verification failed');
            return;
        }
        
        $.ajax({
		    url: '/register',
		    data: registerationDetails,
		    type: 'POST',
		    dataType:'json',
		    success: function (data) {
                $window.location.href = '/index.html#/todoList'
                $scope.$apply();
	    	},
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert('User name is already taken! Please choose a different one');
            } 
		});
    };
  }]);