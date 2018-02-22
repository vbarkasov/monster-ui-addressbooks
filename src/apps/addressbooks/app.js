define(function(require){
	var $ = require('jquery'),
		monster = require('monster'),
		toastr = require('toastr');

	require([
		'datatables.net',
		'datatables.net-bs',
		'datatables.net-buttons',
		'datatables.net-buttons-html5',
		'datatables.net-buttons-bootstrap'
	]);

	var app = {
		name: 'addressbooks',

		css: ['app'],

		i18n: { 
			'en-US': { customCss: false }
		},

		requests: {
			'addressbooks.lists.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists'
			},
			'addressbooks.lists.create': {
				'verb': 'PUT',
				'url': 'accounts/{accountId}/lists'
			},
			'addressbooks.list.delete': {
				'verb': 'DELETE',
				'url': 'accounts/{accountId}/lists/{listId}'
			},
			'addressbooks.list.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists/{listId}'
			},
			'addressbooks.list.update': {
				'verb': 'PATCH',
				'url': 'accounts/{accountId}/lists/{listId}'
			},
			'addressbooks.list.updateWithRewrite': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/lists/{listId}'
			},
			'addressbooks.list.deleteAllEntries': {
				'verb': 'DELETE',
				'url': 'accounts/{accountId}/lists/{listId}/entries'
			},
			'addressbooks.entries.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists/{listId}/entries'
			},
			'addressbooks.entry.create': {
				'verb': 'PUT',
				'url': 'accounts/{accountId}/lists/{listId}/entries'
			},
			'addressbooks.entry.delete': {
				'verb': 'DELETE',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}'
			},
			'addressbooks.entry.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}'
			},
			'addressbooks.entry.update': {
				'verb': 'PATCH',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}'
			},
			'addressbooks.entry.replace': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}'
			},
			/*'addressbooks.entry.getPhoto': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}/photo'
			},*/
			'addressbooks.entry.addPhoto': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}/photo'
			},
			'addressbooks.entry.getVcard': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists/{listId}/entries/{entryId}/vcard'
			}
		},

		vars: {
			entryDataTable: null
		},

		validationRules: {
			'entryForm': {
				'displayname': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'firstname': {
					minlength: 1,
					maxlength: 128
				},
				'lastname': {
					minlength: 1,
					maxlength: 128
				},
				'type': {
					minlength: 1,
					maxlength: 128
				}
			},
			'listForm': {
				'name': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'description': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'org': {
					minlength: 1,
					maxlength: 128
				}
			}
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id of self app */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});

			self.initHandlebarsHelpers();
		},

		initHandlebarsHelpers: function() {
			Handlebars.registerHelper('inc', function(value, options) {
				return parseInt(value) + 1;
			});

			Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
				var operators, result;

				if (arguments.length < 3) {
					throw new Error('Handlerbars Helper \'compare\' needs 2 parameters');
				}

				if (options === undefined) {
					options = rvalue;
					rvalue = operator;
					operator = '===';
				}

				operators = {
					'==': function (l, r) { return l == r; },
					'===': function (l, r) { return l === r; },
					'!=': function (l, r) { return l != r; },
					'!==': function (l, r) { return l !== r; },
					'<': function (l, r) { return l < r; },
					'>': function (l, r) { return l > r; },
					'<=': function (l, r) { return l <= r; },
					'>=': function (l, r) { return l >= r; },
					'typeof': function (l, r) { return typeof l == r; }
				};

				if (!operators[operator]) {
					throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
				}

				result = operators[operator](lvalue, rvalue);

				if (result) {
					return options.fn(this);
				} else {
					return options.inverse(this);
				}

			});
		},

		render: function($container){
			var self = this;
			$container = $container || $('#monster_content');

			var html = $(monster.template(self, 'main', {}));
			$container.empty().append(html);

			self.getLists(function(addressBooksList) {
				self.renderSidebarMenu(addressBooksList);
			});

			self.mainContainerBindEvents($container);
		},

		mainContainerBindEvents: function ($container) {
			var self = this;

			$container.find('.js-new-list').on('click', function(e) {
				e.preventDefault();

				self.renderListItemForm(null, function() {
					var $menuListContainer = $('#addressbooks-list');
					$menuListContainer.find('li.active').removeClass('active');
					$menuListContainer.find('.js-new-list-item').remove();
					$menuListContainer.prepend('<li class="js-new-list-item active"><a>' +
						self.i18n.active().addressbooks.sidebar.menuNewListItemText +'</a></li>');
				});
			});
		},

		getLists: function(callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.lists.get',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getListItem: function(listId, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.list.get',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getEntry: function(entryId, listId, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.entry.get',
				data: {
					accountId: self.accountId,
					listId: listId,
					entryId: entryId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getVcard: function(entryId, listId, callback) {
			var self = this;

			var getRandomStr = function(){
				return Math.random().toString(36).substring(7);
			};

			var xmlhttp = new XMLHttpRequest;
			var url = self.apiUrl + 'accounts/' + self.accountId + '/lists/' + listId + '/entries/' + entryId
				+ '/vcard?auth_token=' + monster.util.getAuthToken() + '&_=' + getRandomStr();
			xmlhttp.open('GET', url, true);
			xmlhttp.onreadystatechange = function() {
				if (4 === xmlhttp.readyState) {
					if (200 === xmlhttp.status) {
						if(typeof(callback) === 'function') {
							callback(xmlhttp.responseText);
						}
					} else {
						if(typeof(callback) === 'function') {
							callback(null);
						}
					}
				}
			};
			xmlhttp.send();
		},

		/*getPhoto: function(entryId, listId, callback) {
			var self = this;

			var getRandomStr = function(){
				return Math.random().toString(36).substring(7);
			};

			var xmlhttp = new XMLHttpRequest;
			var url = self.apiUrl + 'accounts/' + self.accountId + '/lists/' + listId + '/entries/' + entryId
				+ '/photo?auth_token=' + monster.util.getAuthToken() + '&_=' + getRandomStr();
			xmlhttp.open('GET', url, true);
			xmlhttp.onreadystatechange = function() {
				if (4 === xmlhttp.readyState) {
					if (200 === xmlhttp.status) {
						if(typeof(callback) === 'function') {
							callback(xmlhttp.responseText);
						}
					} else {
						if(typeof(callback) === 'function') {
							callback(null);
						}
					}
				}
			};
			xmlhttp.send();
		},

		showPhotoPopup: function(entryId, listId, callback) {
			var self = this;
			var i18n = self.i18n.active();

			var dialogTemplate = monster.template(self, 'photo', {
				entryId: entryId,
				listId: listId
			});

			var $popup = monster.ui.dialog(dialogTemplate, {
				title: i18n.addressbooks.editPhotoDialogTitle,
				dialogClass: 'addressbooks-container addressbooks-dialog'
			});

			self.photoPopupBindEvents($popup);
		},

		photoPopupBindEvents: function($container){
			var self = this;

			$container.find('.js-upload-photo').not('.handled').on('change', function(e) {
				e.preventDefault();
				var $fileEl = $(this);

				if(!$fileEl.val()) {
					return;
				}

				var listId = $fileEl.data('list-id');
				var entryId = $fileEl.data('entry-id');

				var blobFile = $fileEl[0].files[0];
				var formData = new FormData();
				formData.append('fileToUpload', blobFile);

				self.addPhoto(formData, entryId, listId, function(data) {
					$fileEl.val('');
					toastr.success('self.i18n.active().addressbooks.changePhotoSuccessMessage');
				});
			}).addClass('handled');
		},

		addPhoto: function(photo, entryId, listId, callback) {
			var self = this;

			monster.request({
				resource : 'addressbooks.entry.addPhoto',
				data : {
					accountId : self.accountId,
					listId: listId,
					entryId: entryId,
					data : photo
				},
				success : function(data) {
					if(typeof(callback) === 'function') {
						callback(data);
					}
				}
			});
		},*/

		getEntriesOfList: function(listId, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.entries.get',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		createList: function(data, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.lists.create',
				data: {
					accountId: self.accountId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		createEntry: function(listId, data, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.entry.create',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},


		createEntries: function(entriesList, listId, callback) {
			var self = this,
				requests = {};

			entriesList.forEach(function(val, i){
				requests['entry' + i] = (function(entryData){
					return function(callback){
						monster.request({
							resource: 'addressbooks.entry.create',
							data: {
								accountId: self.accountId,
								listId: listId,
								generateError: false,
								data: entryData
							},
							success: function(data, status) {
								if(typeof(callback) === 'function') {
									callback(null, data.data);
								}
							}
						});
					}
				})(val);
			});

			monster.parallel(requests, function(err, results){
				if(typeof(callback) === 'function') {
					callback(results);
				}
			});
		},

		updateList: function(listId, data, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.list.updateWithRewrite',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		updateEntry: function(entryId, listId, data, callback){
			var self = this;

			monster.request({
				resource: 'addressbooks.entry.replace',
				data: {
					accountId: self.accountId,
					listId: listId,
					entryId: entryId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		renderSidebarMenu: function(addressBooksList, selectedId){
			var self = this;

			var $addressBooksListBox = $('#addressbooks-list-container');

			addressBooksList.sort(function(a, b) {
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});

			var html = $(monster.template(self, 'menuList', {
				activeId: selectedId || '',
				addressBooks: addressBooksList
			}));

			$addressBooksListBox.empty().append(html);

			$addressBooksListBox.find('.js-select-list').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $this = $(this);
				var id = $this.parent().data('id');

				self.renderListItemForm(id, function() {
					$('#addressbooks-list').find('li.active').removeClass('active');
					$this.parent().addClass('active');
				});
			}).addClass('handled');
		},

		renderListItemForm: function(listId, callback) {
			var self = this;
			var $container = $('#addressbooks-content');

			if(listId) {
				self.getListItem(listId, function(listItemData) {
					var html = $(monster.template(self, 'listItemContent', {
						data: listItemData
					}));
					$container.empty().append(html);

					self.getEntriesOfList(listId, function(entriesList) {
						console.log('Entries:');
						console.log(entriesList);

						self.entriesTableRender(entriesList, listId);
						self.listItemFormBindEvents($container);

						if(typeof(callback) === 'function') {
							callback(listItemData, entriesList);
						}
					});
				})
			} else {
				var html = $(monster.template(self, 'listItemContent', {
					data: {}
				}));
				$container.empty().append(html);
				self.listItemFormBindEvents($container);
				if(typeof(callback) === 'function') {
					callback();
				}
			}
		},

		listItemFormBindEvents: function($container) {
			var self = this;

			$('#addressbook-list-form').find('.js-to-serialize').not('.handled').on('change paste keyup', function(){
				$('#addressbook-list-form').find('.js-save-list').show();
			}).addClass('handled');

			$container.find('.js-create-list').not('handled').on('click', function(e) {
				e.preventDefault();

				var $listForm = $('#addressbook-list-form');
				monster.ui.validate($listForm, {
					rules: self.validationRules.listForm
				});

				if(!monster.ui.valid($listForm)) {
					return;
				}

				var formData = self.getFormData($listForm);

				self.createList(formData, function(listData) {
					self.getLists(function(lists) {
						self.renderSidebarMenu(lists, listData.id);
						self.renderListItemForm(listData.id);
						toastr.success(self.i18n.active().addressbooks.listCreatedSuccessMessage);
					});
				});
			}).addClass('handled');

			$container.find('.js-save-list').not('handled').on('click', function(e) {
				e.preventDefault();

				var listId = $(this).data('list-id');

				var $listForm = $('#addressbook-list-form');
				monster.ui.validate($listForm, {
					rules: self.validationRules.listForm
				});

				if(!monster.ui.valid($listForm)) {
					return;
				}

				var formData = self.getFormData($listForm);

				self.updateList(listId, formData, function(listData) {
					self.getLists(function(lists) {
						self.renderSidebarMenu(lists, listData.id);
						self.renderListItemForm(listData.id);
						toastr.success(self.i18n.active().addressbooks.listUpdatedSuccessMessage);
					});
				});
			}).addClass('handled');

			$container.find('.js-cancel-creating-list').not('handled').on('click', function(e) {
				e.preventDefault();
				$('#addressbooks-list').find('.js-new-list-item').remove();
				$('#addressbooks-content').empty().html('<h2>' + self.i18n.active().addressbooks.mainContentIntroMessage + '</h2>');
			}).addClass('handled');

			$container.find('.js-delete-list').not('handled').on('click', function(e) {
				e.preventDefault();
				var listId = $(this).data('list-id');

				monster.ui.confirm(self.i18n.active().addressbooks.deleteListConfirmText, function() {
					self.deleteList(listId, function(data) {
						var i18n = self.i18n.active();
						$('#addressbooks-list').find('li[data-id="' + listId + '"]').remove();
						$('#addressbooks-content').empty().html('<h2>' + i18n.addressbooks.mainContentIntroMessage + '</h2>');
					})
				});
			}).addClass('handled');

			$container.find('.js-delete-all-entries').not('handled').on('click', function(e) {
				e.preventDefault();
				var listId = $(this).data('list-id');

				monster.ui.confirm(self.i18n.active().addressbooks.deleteAllEntriesConfirmText, function() {
					self.deleteAllEntries(listId, function(data) {
						var i18n = self.i18n.active();
						self.entriesTableRender([], listId);
						toastr.success(self.i18n.active().addressbooks.allEntriesWereDeletedSuccessMessage);
					});
				});
			}).addClass('handled');
		},

		getFormData: function($formEl, selector) {
			if(typeof(selector) === 'undefined') {
				selector = '.js-to-serialize[name]';
			}

			var result = {};
			$formEl.find(selector).each(function(i, el){
				var $el = $(el);
				var name = $el.attr('name');

				if(el.tagName === 'INPUT') {
					if($el.attr('type') === 'checkbox') {
						result[name] = !!$el.is(':checked');
						return;
					}

					if(!!$el.val()) {
						result[name] = $el.val();
						return;
					}
				}

				if(el.tagName === 'SELECT' && !!$el.find('option:selected').val()) {
					result[name] = $el.find('option:selected').val();
				}
			});

			return result;
		},

		deleteList: function(listId, callback) {
			var self = this;

			monster.request({
				resource: 'addressbooks.list.delete',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		entriesTableRender: function(entries, listId, $container, callback) {
			var self = this;
			$container = $container || $('#entries-container');

			var html = $(monster.template(self, 'entries', {
				'entries': entries,
				'listId': listId,
				'entriesButtons': $(monster.template(self, 'entriesButtons', {})).html()
			}));

			$container.empty().html(html);

			var $entriesTable = $container.find('#entries-table');
			self.vars.entryDataTable = $entriesTable.DataTable({
				'bStateSave': false,
				'lengthMenu': [[5, 25, 50, -1], [5, 25, 50, 'All']],
				'columnDefs': [{
					'targets': 'no-sort',
					'orderable': false
				}],
				dom: 'lfrtipB',
				buttons: [
					{
						extend: 'csvHtml5',
						text: 'Export CSV',
						exportOptions: {
							columns: [1,2,3,4,5,6]
						}
					}
				]
			});

			self.vars.entryDataTable.on('draw', function(e, settings) {
				self.entriesTableBindEvents($(this));
			} );

			self.entriesTableBindEvents($container);
		},

		entriesTableBindEvents: function($container){
			var self = this;

			$container.find('.js-create-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var listId = $(this).data('list-id');
				self.showPopupCreateEntry(listId);
			}).addClass('handled');

			$container.find('.js-import-csv').not('.handled').on('change', function(e) {
				e.preventDefault();
				var $fileEl = $(this);

				if(!$fileEl.val()) {
					return;
				}

				var listId = $fileEl.data('list-id');
				self.importEntriesFromCSV(e.target.files, listId, function() {
					$fileEl.val('');
					toastr.success(self.i18n.active().addressbooks.entriesImportSuccessMessage);
				});
			}).addClass('handled');

			$container.find('.js-edit-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');
				self.showPopupEditEntry(entryId, listId);
			}).addClass('handled');

			$container.find('.js-remove-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');

				monster.ui.confirm(self.i18n.active().addressbooks.deleteEntryConfirmText, function() {
					self.deleteEntry(entryId, listId, function(){
						self.vars.entryDataTable
							.row($tr)
							.remove()
							.draw();
					});
				});
			}).addClass('handled');

			$container.find('.js-get-vcard').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');
				var fileName = 'vCard_' + ($tr.find('td:nth-child(2)').text()).replace(/\s/g, '-') + '.vcf';

				self.getVcard(entryId, listId, function(vcardData){
					self.downloadFile(fileName, vcardData)
				});
			}).addClass('handled');

			/*$container.find('.js-edit-photo').not('.handled').on('click', function(e) {
				e.preventDefault();

				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');
				self.getPhoto(entryId, listId, function(photo) {
					self.showPhotoPopup(entryId, listId, function() {
					});
				})
			}).addClass('handled');*/


		},

		importEntriesFromCSV: function(files, listId, callback) {
			var self = this;
			if(files.length === 0) {
				return;
			}

			var reader = new FileReader();

			reader.onload = function(e) {
				console.log(e.target.result);
				var entriesArr = self.parseEntriesCSV(e.target.result);

				self.createEntries(entriesArr, listId, function(results) {
					var entriesArr = [];

					for(var i in results) if(results.hasOwnProperty(i)) {
						entriesArr.push(results[i]);
					}

					self.addRowsToEntriesDatatable(entriesArr, listId, function(){
						if(typeof(callback) === 'function') {
							callback();
						}
					});
				});
			};

			reader.readAsText(files[0]);
		},

		downloadFile: function(fileName, text) {
			var element = document.createElement('a');
			element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
			element.download = fileName;
			element.style.display = 'none';
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		},

		parseEntriesCSV: function(csv) {
			var lines=csv.split("\n"),
				result = [],
				lineValues,
				entry,
				self = this;

			var removeStartAndEndQuotes = function(text) {
				text = $.trim(text);

				if(text.charAt(0) === '"') {
					text = text.substr(1);
				}

				if(text.charAt(text.length-1) === '"') {
					text = text.slice(0, -1);
				}
				return text;
			};

			// miss headers
			for(var i=1, len=lines.length; i<len; i++) {
				lineValues=lines[i].split(',');
				entry = {
					'displayname': removeStartAndEndQuotes(lineValues[0]) || '',
					'firstname': removeStartAndEndQuotes(lineValues[1]) || '',
					'lastname': removeStartAndEndQuotes(lineValues[2]) || '',
					'number': removeStartAndEndQuotes(lineValues[3]) || '',
					'pattern': removeStartAndEndQuotes(lineValues[4]) || '',
					'type': removeStartAndEndQuotes(lineValues[5]) || ''
				};

				result.push(self.removeEmptyEntryProperties(entry));
			}
			return result;
		},

		deleteEntry: function(entryId, listId, callback) {
			var self = this;

			monster.request({
				resource: 'addressbooks.entry.delete',
				data: {
					accountId: self.accountId,
					listId: listId,
					entryId: entryId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		deleteAllEntries: function(listId, callback) {
			var self = this;

			monster.request({
				resource: 'addressbooks.list.deleteAllEntries',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		showPopupCreateEntry: function(listId, callback){
			var self = this;
			var i18n = self.i18n.active();

			var dialogTemplate = monster.template(self, 'entryForm', {
				entryData: {},
				listId: listId
			});

			var $popup = monster.ui.dialog(dialogTemplate, {
				title: i18n.addressbooks.createEntryDialogTitle,
				dialogClass: 'addressbooks-container addressbooks-dialog'
			});

			self.entryPopupBindEvents($popup, {}, null, listId);
		},

		showPopupEditEntry: function(entryId, listId, callback){
			var self = this;
			var i18n = self.i18n.active();

			self.getEntry(entryId, listId, function(entryData) {
				var dialogTemplate = monster.template(self, 'entryForm', {
					entryData: entryData,
					listId: listId
				});

				var $popup = monster.ui.dialog(dialogTemplate, {
					title: i18n.addressbooks.editEntryDialogTitle.replace('${name}', entryData.displayname),
					dialogClass: 'addressbooks-container addressbooks-dialog'
				});

				if(entryData.number) {
					$('.js-number-switcher[value="number"]').prop('checked', true);
					$('.js-entry-number-box').show();
					$('.js-entry-pattern-box').hide();
				} else if(entryData.pattern) {
					$('.js-number-switcher[value="pattern"]').prop('checked', true);
					$('.js-entry-number-box').hide();
					$('.js-entry-pattern-box').show();
				}

				self.entryPopupBindEvents($popup, entryData, entryId, listId);
			});
		},

		entryPopupBindEvents: function($popup, entryData, entryId, listId) {
			var self = this;

			$('.js-number-switcher', $popup).on('change', function(e) {
				e.preventDefault();
				var val = $(this).val();

				$('.js-entry-number-box,.js-entry-pattern-box').hide();
				$('.js-entry-' + val + '-box').show();
			});

			$('.js-cancel', $popup).on('click', function(e) {
				e.preventDefault();
				$popup.dialog('close');
			});

			$('.js-save-entry', $popup).on('click', function(e) {
				e.preventDefault();

				self.saveEntryHandler($popup, entryData, entryId, listId);
			});
		},

		removeEmptyEntryProperties: function(data) {
			var propertiesList = [
				'displayname',
				'firstname',
				'lastname',
				'number',
				'pattern',
				'type'
			];
			for(var i=0, len=propertiesList.length; i<len; i++) {
				if(!data[propertiesList[i]]) {
					delete data[propertiesList[i]];
				}
			}
			return data;
		},

		saveEntryHandler: function($popup, entryData, entryId, listId){
			var self = this;
			var $entryForm = $popup.find('form');
			var newEntryData = {};

			monster.ui.validate($entryForm, {
				rules: self.validationRules.entryForm
			});

			if(!monster.ui.valid($entryForm)) {
				return;
			}

			var formData = monster.ui.getFormData($entryForm[0]);

			var numberOrPattern = $('.js-number-switcher:checked').val();
			if(numberOrPattern === 'number') {
				formData['pattern'] = '';
			} else {
				formData['number'] = '';
			}

			if(entryId) {
				newEntryData = self.removeEmptyEntryProperties($.extend(true, entryData, formData));
				self.updateEntry(entryId, listId, newEntryData, function(updatedEntryData){
					self.updateEntryDatatableRow(entryId, updatedEntryData);
					$popup.dialog('close');
				});
			} else {
				newEntryData = self.removeEmptyEntryProperties(formData);
				self.createEntry(listId, newEntryData, function(entryData){
					self.addRowsToEntriesDatatable([entryData], listId);
					$popup.dialog('close');
				});
			}
		},
		addRowsToEntriesDatatable: function(entriesDataArr, listId, callback) {
			var self = this;
			var buttonsHtml = $(monster.template(self, 'entriesButtons', {})).html();
			var $entriesTable = $('#entries-table');

			entriesDataArr.forEach(function(val, i){
				(function(entryData){
					var rowNode = self.vars.entryDataTable.row.add([
						'',
						entryData['displayname'] || '',
						entryData['firstname'] || '',
						entryData['lastname'] || '',
						entryData['number'] || '',
						entryData['pattern'] || '',
						entryData['type'] || '',
						buttonsHtml
					] ).draw(false).node();

					$(rowNode).attr('id', entryData.id)
						.data('entry-id', entryData.id)
						.data('list-id', listId)
						.addClass('js-item');
				})(val);
			});

			if(typeof(callback) === 'function') {
				callback();
			}
		},
		updateEntryDatatableRow: function(entryId, entryData){
			var self = this;
			var $row = $('#entries-table').find('tr#' + entryId);
			var dataTablesRow = self.vars.entryDataTable.row($row);

			var rowData = dataTablesRow.data();
			rowData[1] = entryData['displayname'] || '';
			rowData[2] = entryData['firstname'] || '';
			rowData[3] = entryData['lastname'] || '';
			rowData[4] =entryData['number'] || '';
			rowData[5] = entryData['pattern'] || '';
			rowData[6] = entryData['type'] || '';
			dataTablesRow.data(rowData);
			self.vars.entryDataTable.draw(false);
		}
	};

	return app;
});
