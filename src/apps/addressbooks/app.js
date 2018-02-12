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
			var self = this,
				$container = $container || $('#monster_content');

			var html = $(monster.template(self, 'main', {}));
			$container.empty().append(html);

			self.getAddressBooksList(function(addressBooksList) {
				self.renderSidebarMenu($container, addressBooksList);
			});
		},

		getAddressBooksList: function(callback){
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

		getAddressBooksListItem: function(listId, callback){
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

		createAddressBooksList: function(data, callback){
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

		saveEntry: function(){

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

		renderSidebarMenu: function($container, addressBooksList, selectedId){
			var self = this;

			var $addressBooksListBox = $container.find('#addressbooks-list-container');

			addressBooksList.sort(function(a, b) {
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});

			var html = $(monster.template(self, 'menuList', {
				activeId: selectedId || '',
				addressBooks: addressBooksList
			}));

			$addressBooksListBox.empty().append(html);

			$container.find('.js-select-list').on('click', function(e) {
				e.preventDefault();
				var $this = $(this);
				var id = $this.parent().data('id');

				self.renderListItem(id, function(){
					$('#addressbooks-list').find('li.active').removeClass('active');
					$this.parent().addClass('active');
				});
			});
		},

		renderListItem: function(listId, callback) {
			var self = this;
			var $container = $('#addressbooks-content');
			//var i18n = self.i18n.active(); // TODO: remove?

			self.getAddressBooksListItem(listId, function(listItemData) {
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
		},

		listItemFormBindEvents: function($container) {
			$container.find('.js-save-list').on('click', function(e) {
				e.preventDefault();
				// TODO!
			});

			$container.find('.js-delete-list').on('click', function(e) {
				e.preventDefault();
				// TODO!
			});
		},

		entriesTableRender: function(entries, listId, $container, callback) {
			var self = this;
			$container = $container || $('#entries-container');

			var html = $(monster.template(self, 'entries', {
				'entries': entries,
				'listId': listId
			}));

			$container.empty().html(html);

			var $entriesTable = $container.find('#entries-table');
			self.vars.entryDataTable = $entriesTable.DataTable({
				'bStateSave': false,
				'lengthMenu': [[5, 25, 50, -1], [5, 25, 50, 'All']],
				'columnDefs': [
					{
						'targets': 'no-sort',
						'orderable': false
					}
				],
				dom: 'lfrtipB',
				buttons: [
					'csvHtml5'
				]
			});

			self.entriesTableBindEvents($entriesTable);
		},

		entriesTableBindEvents: function($container){
			var self = this;

			$container.find('.js-edit-entry').not('.handled').on('click', function(e){
				e.preventDefault();
				var $el = $(this);
				var entryId = $el.data('entry-id');
				var listId = $el.data('list-id');
				self.showPopupEditEntry(entryId, listId);
			}).addClass('handled');

			$container.find('.js-remove-entry').not('.handled').on('click', function(e){
				e.preventDefault();
				var $el = $(this);
				var entryId = $el.data('entry-id');
				var listId = $el.data('list-id');

				// TODO: add confirm dialog

				self.vars.entryDataTable
					.row($(this).closest('tr'))
					.remove()
					.draw();

				// TODO: delete entry via api
				/*self.deleteEntry(entryId, listId, function(){
					// update table
				});*/
			}).addClass('handled');
		},

		showPopupEditEntry: function(entryId, listId, callback){
			var self = this;

			self.getEntry(entryId, listId, function(entryData) {
				var dialogTemplate = monster.template(self, 'entryForm', {
					entryData: entryData,
					listId: listId
				});

				var $popup = monster.ui.dialog(dialogTemplate, {
					title: 'Edit Entry &laquo;' + entryData.displayname + '&raquo;', // TODO: i18n it!
					dialogClass: 'addressbooks-container addressbooks-dialog'
				});

				self.entryPopupBindEvents($popup, entryData, entryId, listId);
			});
		},

		entryPopupBindEvents: function($popup, entryData, entryId, listId) {
			var self = this;
			var removeEmptyProperties = function(data) {
				var propertiesList = [
					'displayname',
					'firstname',
					'lastname',
					'number',
					'type',
					'pattern'
				];
				for(var i=0, len=propertiesList.length; i<len; i++) {
					if(!data[propertiesList[i]]) {
						delete data[propertiesList[i]];
					}
				}
				return data;
			};

			$('.js-cancel', $popup).click(function() {
				e.preventDefault();
				$popup.dialog('close');
			});

			$('.js-save-entry', $popup).click(function(e) {
				e.preventDefault();

				var $row = $('#entries-table').find('tr#' + entryId);
				var dataTablesRow = self.vars.entryDataTable.row($row);

				var $entryForm = $popup.find('form');

				monster.ui.validate($entryForm, {
					rules: self.validationRules.entryForm
				});

				if(!monster.ui.valid($entryForm)) {
					return;
				}

				var formData = monster.ui.getFormData($entryForm[0]);
				var newEntryData = removeEmptyProperties($.extend(true, entryData, formData));

				self.updateEntry(entryId, listId, newEntryData, function(updatedEntryData){
					var rowData = dataTablesRow.data();

					rowData[1] = updatedEntryData['displayname'] || '';
					rowData[2] = updatedEntryData['firstname'] || '';
					rowData[3] = updatedEntryData['lastname'] || '';
					rowData[4] = updatedEntryData['number'] || '';
					rowData[5] = updatedEntryData['type'] || '';
					rowData[6] = updatedEntryData['pattern'] || '';

					dataTablesRow.data(rowData);
					self.vars.entryDataTable.draw(false);
					self.entriesTableBindEvents($row);

					$popup.dialog('close');
				});
			});
		}
	};

	return app;
});
