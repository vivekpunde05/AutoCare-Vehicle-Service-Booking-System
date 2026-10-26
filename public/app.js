angular.module('vehicleApp', [])
.controller('MainController', ['$http', function($http) {
  var vm = this;
  var API = '/api';
  vm.user = null; vm.token = ''; vm.page = 'dashboard'; vm.authMode = 'login';
  vm.busy = false; vm.message = ''; vm.messageType = 'success';
  vm.loginForm = {}; vm.registerForm = {}; vm.adminForm = {}; vm.vehicleForm = {}; vm.bookingForm = {};
  vm.vehicles = []; vm.services = []; vm.bookings = []; vm.mechanics = [];
  vm.stats = {total:0, pending:0, progress:0, completed:0};
  vm.statuses = ['Pending','Confirmed','In Progress','Completed','Rejected','Cancelled'];
  vm.timeSlots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00'];
  vm.minDate = new Date().toISOString().slice(0,10);
  try {
    var saved = JSON.parse(localStorage.getItem('autocareSession') || 'null');
    if (saved && saved.token && saved.user) {
      vm.token = saved.token; vm.user = saved.user;
      vm.page = (saved.user.role === 'admin') ? 'admin' : 'dashboard';
      setAuthHeader(); loadAll();
    }
  } catch (e) {}
  function setAuthHeader() { $http.defaults.headers.common.Authorization = 'Bearer ' + vm.token; }
  function notify(text, type) { vm.message = text; vm.messageType = type || 'success'; window.scrollTo(0,0); }
  function handleError(err) { notify((err.data && err.data.message) || 'Something went wrong. Please try again.', 'error'); }
  function saveSession(data) {
    vm.token = data.token; vm.user = data.user; localStorage.setItem('autocareSession', JSON.stringify(data)); setAuthHeader();
    vm.page = (data.user && data.user.role === 'admin') ? 'admin' : 'dashboard'; loadAll();
  }
  vm.login = function() {
    vm.busy = true;
    $http.post(API+'/auth/login', vm.loginForm).then(function(r){
      saveSession(r.data);
      notify('Welcome back, '+r.data.user.name+'!');
    }).catch(handleError).finally(function(){vm.busy=false;});
  };
  vm.adminLogin = function() {
    vm.busy = true;
    $http.post(API+'/auth/login', vm.adminForm).then(function(r){
      if (r.data.user.role !== 'admin') {
        notify('Access denied. This login is strictly for workshop administrators.', 'error');
        return;
      }
      saveSession(r.data);
      notify('Welcome, Workshop Administrator!');
    }).catch(handleError).finally(function(){vm.busy=false;});
  };
  vm.register = function() {
    vm.busy = true;
    $http.post(API+'/auth/register', vm.registerForm).then(function(r){saveSession(r.data); notify('Account created successfully. Add your vehicle to begin.');})
      .catch(handleError).finally(function(){vm.busy=false;});
  };
  vm.logout = function() {
    vm.user=null; vm.token=''; localStorage.removeItem('autocareSession');
    delete $http.defaults.headers.common.Authorization; vm.page='dashboard'; vm.message='';
    vm.loginForm={}; vm.registerForm={}; vm.adminForm={};
  };
  vm.go = function(page) {
    if (page==='admin' && (!vm.user || vm.user.role!=='admin')) {
      vm.page='dashboard';
      return;
    }
    vm.page=page; vm.message='';
    if (page==='vehicles') loadVehicles();
    if (page==='bookings') { loadVehicles(); loadBookings(); }
    if (page==='dashboard') loadAll();
    if (page==='admin') { loadBookings(); loadSummary(); loadMechanics(); }
  };
  function loadServices() { return $http.get(API+'/services').then(function(r){vm.services=r.data;}).catch(handleError); }
  function loadVehicles() { if (!vm.user) return; return $http.get(API+'/vehicles').then(function(r){vm.vehicles=r.data;}).catch(handleError); }
  function loadBookings() {
    if (!vm.user) return;
    return $http.get(API+'/bookings').then(function(r){
      vm.bookings=r.data;
      angular.forEach(vm.bookings,function(b){
        b.edit_status=b.status;
        b.edit_mechanic=b.mechanic_id ? parseInt(b.mechanic_id, 10) : null;
      });
    }).catch(handleError);
  }
  function loadSummary() {
    if (!vm.user || vm.user.role!=='admin') return;
    return $http.get(API+'/admin/summary').then(function(r){vm.stats=r.data;}).catch(handleError);
  }
  function loadMechanics() {
    if (!vm.user || vm.user.role!=='admin') return;
    return $http.get(API+'/mechanics').then(function(r){vm.mechanics=r.data;}).catch(handleError);
  }
  function loadAll() {
    loadServices();
    if (vm.user) {
      loadVehicles(); loadBookings();
      if (vm.user.role==='admin') {
        loadSummary();
        loadMechanics();
      } else {
        $http.get(API+'/bookings').then(function(r) {
          var b=r.data; vm.stats.total=b.length;
          vm.stats.pending=b.filter(function(x){return x.status==='Pending';}).length;
          vm.stats.progress=b.filter(function(x){return x.status==='In Progress';}).length;
          vm.stats.completed=b.filter(function(x){return x.status==='Completed';}).length;
        }).catch(handleError);
      }
    }
  }
  vm.addVehicle = function() {
    $http.post(API+'/vehicles',vm.vehicleForm).then(function(r){notify(r.data.message);vm.vehicleForm={};loadVehicles();})
      .catch(handleError);
  };
  vm.deleteVehicle = function(v) {
    if (!window.confirm('Delete '+v.make+' '+v.model+'?')) return;
    $http.delete(API+'/vehicles/'+v.id).then(function(){notify('Vehicle deleted.');loadVehicles();})
      .catch(handleError);
  };
  vm.startBooking = function(service) {
    vm.page='bookings'; vm.showBookingForm=true;
    vm.bookingForm.service_id=service.id; loadVehicles(); loadBookings();
  };
  vm.createBooking = function() {
    if (!vm.vehicles.length) { notify('Please add a vehicle before booking.','error'); vm.page='vehicles'; return; }
    var f=angular.copy(vm.bookingForm);
    if (f.booking_date instanceof Date) f.booking_date=f.booking_date.toISOString().slice(0,10);
    vm.busy=true;
    $http.post(API+'/bookings',f).then(function(r){
      notify(r.data.message);vm.bookingForm={};vm.showBookingForm=false;loadBookings();loadSummary();
    }).catch(handleError).finally(function(){vm.busy=false;});
  };
  vm.cancelBooking = function(b) {
    if (!window.confirm('Cancel booking #AC-'+b.id+'?')) return;
    $http.patch(API+'/bookings/'+b.id+'/cancel',{}).then(function(r){notify(r.data.message);loadBookings();loadSummary();})
      .catch(handleError);
  };
  vm.updateBooking = function(b) {
    $http.patch(API+'/bookings/'+b.id+'/status',{status:b.edit_status,mechanic_id:b.edit_mechanic})
      .then(function(r){notify(r.data.message);loadBookings();loadSummary();})
      .catch(handleError);
  };
  vm.statusClass = function(status) {
    return ({'Pending':'status-amber','Confirmed':'status-blue','In Progress':'status-purple','Completed':'status-green','Rejected':'status-red','Cancelled':'status-gray'})[status] || 'status-gray';
  };
  vm.serviceIcon = function(name) {
    if (/oil/i.test(name)) return '◉';
    if (/brake/i.test(name)) return '⊙';
    if (/bike/i.test(name)) return '◈';
    if (/inspection/i.test(name)) return '⌕';
    return '⚙';
  };
}]);